import os from 'os';
import { execFileSync, spawn } from 'child_process';

const qrcode = (await import('qrcode-terminal')).default;
const port = process.env.PORT || '3000';

function isWsl() {
  return process.platform === 'linux' && os.release().toLowerCase().includes('microsoft');
}

function getFirstExternalIpv4() {
  const nets = os.networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }

  return '127.0.0.1';
}

function runPowerShell(script) {
  return execFileSync(
    'powershell.exe',
    ['-NoProfile', '-Command', script],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  ).replace(/\r/g, '').trim();
}

function getWindowsIpv4Candidates() {
  try {
    const json = runPowerShell(`
$items = Get-NetIPConfiguration | Where-Object { $_.IPv4Address -ne $null } | ForEach-Object {
  [PSCustomObject]@{
    InterfaceAlias = $_.InterfaceAlias
    InterfaceDescription = $_.InterfaceDescription
    IPv4 = $_.IPv4Address.IPAddress
    Gateway = if ($_.IPv4DefaultGateway) { $_.IPv4DefaultGateway.NextHop } else { $null }
    Profile = if ($_.NetProfile) { $_.NetProfile.Name } else { $null }
  }
}
$items | ConvertTo-Json -Compress
`);

    if (!json) {
      return [];
    }

    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function isPrivateIpv4(ip) {
  return /^10\./.test(ip)
    || /^192\.168\./.test(ip)
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);
}

function scoreWindowsCandidate(candidate) {
  const alias = String(candidate.InterfaceAlias || '').toLowerCase();
  const description = String(candidate.InterfaceDescription || '').toLowerCase();
  const profile = String(candidate.Profile || '').toLowerCase();
  const ip = String(candidate.IPv4 || '');
  const gateway = String(candidate.Gateway || '');

  if (!ip || /^127\./.test(ip) || /^169\.254\./.test(ip)) {
    return -1;
  }

  if (!isPrivateIpv4(ip)) {
    return -1;
  }

  if (alias.includes('vethernet') || alias.includes('wsl') || description.includes('hyper-v')) {
    return -1;
  }

  let score = 0;

  if (/^192\.168\.137\./.test(ip)) {
    score += 100;
  }

  if (alias.includes('hotspot') || description.includes('hotspot') || profile.includes('hotspot')) {
    score += 80;
  }

  if (alias.includes('wi-fi direct') || description.includes('wi-fi direct')) {
    score += 70;
  }

  if (alias.startsWith('wi-fi') && !gateway) {
    score += 50;
  }

  if (!gateway) {
    score += 30;
  }

  if (gateway) {
    score += 20;
  }

  return score;
}

function getWindowsNetworkTargets() {
  const candidates = getWindowsIpv4Candidates()
    .map((candidate) => ({ ...candidate, score: scoreWindowsCandidate(candidate) }))
    .filter((candidate) => candidate.score >= 0)
    .sort((left, right) => right.score - left.score);

  const preferred = candidates[0] || null;
  const gatewayBacked = candidates.find((candidate) => candidate.Gateway) || null;

  return {
    preferredIp: preferred?.IPv4 || null,
    preferredAlias: preferred?.InterfaceAlias || null,
    candidates,
    gatewayIp: gatewayBacked?.IPv4 || null,
    gatewayAlias: gatewayBacked?.InterfaceAlias || null,
  };
}

function escapePowerShellSingleQuoted(value) {
  return value.replace(/'/g, "''");
}

function hasWindowsForwarding(wslIp) {
  try {
    const portProxy = runPowerShell('netsh interface portproxy show v4tov4');
    const firewallRule = runPowerShell(
      `if (Get-NetFirewallRule -DisplayName 'WSL Next.js LAN ${port}' -ErrorAction SilentlyContinue) { 'present' }`
    );

    return portProxy.includes('0.0.0.0')
      && portProxy.includes(String(port))
      && portProxy.includes(wslIp)
      && firewallRule === 'present';
  } catch {
    return false;
  }
}

function ensureWindowsForwarding(wslIp) {
  const script = [
    '$ErrorActionPreference = "Stop"',
    `$port = ${port}`,
    `$wslIp = '${escapePowerShellSingleQuoted(wslIp)}'`,
    "$ruleName = \"WSL Next.js LAN $port\"",
    '$existing = netsh interface portproxy show v4tov4 | Out-String',
    'if ($existing -notmatch ("0.0.0.0\\s+" + $port)) {',
    '  netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 | Out-Null',
    '  netsh interface portproxy add v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$wslIp | Out-Null',
    '} else {',
    '  netsh interface portproxy set v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$wslIp | Out-Null',
    '}',
    'if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {',
    '  New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $port | Out-Null',
    '}',
  ].join('; ');

  const encoded = Buffer.from(script, 'utf16le').toString('base64');

  try {
    runPowerShell(
      `Start-Process powershell.exe -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile -EncodedCommand ${encoded}'`
    );
    return true;
  } catch {
    return false;
  }
}

const wsl = isWsl();
const linuxIp = getFirstExternalIpv4();
const windowsNetwork = wsl ? getWindowsNetworkTargets() : null;
const windowsLanIp = windowsNetwork?.preferredIp || null;
const publicIp = windowsLanIp || linuxIp;
const url = `http://${publicIp}:${port}/doublesQueue`;

let forwardingReady = !wsl;
if (wsl) {
  forwardingReady = hasWindowsForwarding(linuxIp) || ensureWindowsForwarding(linuxIp);
}

console.log('');
console.log('========================================');
console.log('LAN development server');
console.log('========================================');
console.log(`WSL/Linux IP: ${linuxIp}`);
if (windowsLanIp) {
  const label = windowsNetwork?.preferredAlias ? ` (${windowsNetwork.preferredAlias})` : '';
  console.log(`Preferred Windows IP${label}: ${windowsLanIp}`);
}
if (windowsNetwork?.gatewayIp && windowsNetwork.gatewayIp !== windowsLanIp) {
  const label = windowsNetwork.gatewayAlias ? ` (${windowsNetwork.gatewayAlias})` : '';
  console.log(`Fallback Windows IP${label}: ${windowsNetwork.gatewayIp}`);
}
console.log(`QR target: ${url}`);
if (wsl && !forwardingReady) {
  console.log('');
  console.log('Windows port forwarding was not configured automatically.');
  console.log('Approve the Windows UAC prompt if it appeared, or run this once in an elevated PowerShell window:');
  console.log(`netsh interface portproxy add v4tov4 listenport=${port} listenaddress=0.0.0.0 connectport=${port} connectaddress=${linuxIp}`);
  console.log(`New-NetFirewallRule -DisplayName "WSL Next.js LAN ${port}" -Direction Inbound -Action Allow -Protocol TCP -LocalPort ${port}`);
}
console.log('');
console.log('Scan this QR code to open the app:');
qrcode.generate(url, { small: true });
console.log('========================================');
console.log('');

const devProcess = spawn('next', ['dev', '-H', '0.0.0.0', '-p', String(port)], {
  stdio: 'inherit',
  shell: true,
});

devProcess.on('error', (error) => {
  console.error('Failed to start Next.js dev server:', error);
  process.exit(1);
});

devProcess.on('exit', (code) => {
  process.exit(code ?? 0);
});
