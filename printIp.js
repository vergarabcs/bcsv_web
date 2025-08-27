// printIp.js
import os from 'os';
const qrcode = (await import('qrcode-terminal')).default;

function getLocalIp() {
  const nets = os.networkInterfaces();
  let ip = 'localhost';
  if (nets['en0']) {
    const found = nets['en0'].find(i => i.family === 'IPv4');
    if (found) ip = found.address;
  } else {
    outer: for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          ip = net.address;
          break outer;
        }
      }
    }
  }
  return ip;
}

const ip = getLocalIp();
const url = `https://${ip}:3000`;
console.log('Local IP:', ip);
console.log('Scan this QR code to open: ' + url);
qrcode.generate(url, {small:true});
