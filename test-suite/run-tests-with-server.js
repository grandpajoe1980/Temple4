#!/usr/bin/env node
/* Cross-platform test runner that starts the dev server if needed */
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

const PORT = parseInt(process.env.PORT || '3000', 10);
const ROOT_DIR = path.resolve(__dirname, '..');
const TEST_DIR = path.resolve(__dirname);
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection(port, '127.0.0.1');
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

async function waitForServer(port, timeoutMs = 60000, intervalMs = 2000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortOpen(port)) return true;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}

async function main() {
  const serverAlreadyRunning = await isPortOpen(PORT);
  let devServer;

  if (!serverAlreadyRunning) {
    console.log(`[INFO] Starting dev server on port ${PORT}...`);
    devServer = spawn(npmCmd, ['run', 'dev'], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    const ready = await waitForServer(PORT);
    if (!ready) {
      console.error(`[ERROR] Dev server failed to start on port ${PORT} within timeout.`);
      devServer.kill('SIGTERM');
      process.exit(1);
    }
    console.log('[OK] Dev server is running.');
  } else {
    console.log(`[OK] Server already running on port ${PORT}.`);
  }

  const testProcess = spawn(npmCmd, ['run', 'test:suite'], {
    cwd: TEST_DIR,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  const exitCode = await new Promise((resolve) => {
    testProcess.on('close', (code) => resolve(code ?? 1));
  });

  if (devServer && !serverAlreadyRunning) {
    console.log('[INFO] Stopping dev server...');
    devServer.kill('SIGTERM');
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Unexpected error while running tests:', err);
  process.exit(1);
});
