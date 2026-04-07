#!/usr/bin/env node

import { execSync } from 'node:child_process';
import process from 'node:process';

const TARGET_BRANCH_REF = 'refs/heads/main';

let shouldRunBuild = false;

process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const parts = line.split(/\s+/);
    const remoteRef = parts[2];

    if (remoteRef === TARGET_BRANCH_REF) {
      shouldRunBuild = true;
    }
  }
});

process.stdin.on('end', () => {
  if (!shouldRunBuild) {
    console.log('Pre-push check: no updates to main, skipping build.');
    process.exit(0);
  }

  console.log('Pre-push check: push targets main, running build...');
  const buildCommand = 'NEXT_DISABLE_SWC_WORKER=1 npm run build';

  try {
    execSync(buildCommand, { stdio: 'inherit' });
    console.log('Pre-push check: build succeeded. Continuing push.');
    process.exit(0);
  } catch {
    console.warn('Pre-push check: build failed. Retrying once after clearing .next cache...');

    try {
      execSync('rm -rf .next', { stdio: 'inherit' });
      execSync(buildCommand, { stdio: 'inherit' });
      console.log('Pre-push check: build succeeded on retry. Continuing push.');
      process.exit(0);
    } catch {
      console.error('Pre-push check: build failed. Push blocked.');
      process.exit(1);
    }
  }
});

process.stdin.resume();
