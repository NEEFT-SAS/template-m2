import { spawnSync } from 'node:child_process';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { Socket } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(backendRoot, '..');

const protocol = String(process.env.TYPESENSE_PROTOCOL ?? 'http').trim().toLowerCase();
const host = String(process.env.TYPESENSE_HOST ?? 'localhost').trim();
const port = Number(process.env.TYPESENSE_PORT ?? 8108);

const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
const shouldAutostart = isLocalHost;

const log = (message) => {
  process.stdout.write(`${message}\n`);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isPortOpen = () => {
  return new Promise((resolve) => {
    const socket = new Socket();
    let settled = false;

    const finalize = (value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(1000);
    socket.once('connect', () => finalize(true));
    socket.once('timeout', () => finalize(false));
    socket.once('error', () => finalize(false));
    socket.connect(port, host);
  });
};

const checkHealth = () => {
  return new Promise((resolve) => {
    const requestFn = protocol === 'https' ? httpsRequest : httpRequest;
    const req = requestFn(
      {
        protocol: `${protocol}:`,
        hostname: host,
        port,
        path: '/health',
        method: 'GET',
        timeout: 2000
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
          return;
        }

        resolve(false);
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.end();
  });
};

const runDockerComposeUp = () => {
  const command = process.platform === 'win32' ? 'docker.exe' : 'docker';

  const info = spawnSync(command, ['info'], {
    cwd: workspaceRoot,
    stdio: 'pipe',
    encoding: 'utf8'
  });

  if (info.error) {
    throw new Error(
      'Docker CLI not found. Install Docker Desktop (or Docker Engine) before starting the backend in local mode.'
    );
  }

  if (typeof info.status === 'number' && info.status !== 0) {
    throw new Error(
      'Docker daemon is not running. Start Docker Desktop, then retry `npm run start:dev`.'
    );
  }

  const result = spawnSync(command, ['compose', 'up', '-d', 'typesense'], {
    cwd: workspaceRoot,
    stdio: 'inherit'
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    throw new Error(`docker compose exited with code ${result.status}`);
  }
};

const waitUntilReady = async () => {
  const maxAttempts = 30;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const portOpen = await isPortOpen();
    if (portOpen) {
      const healthy = await checkHealth();
      if (healthy) {
        return;
      }
    }

    await sleep(1000);
  }

  throw new Error(
    `Typesense is not ready on ${protocol}://${host}:${port} after 30 seconds`
  );
};

const main = async () => {
  if (!shouldAutostart) {
    log(
      `[typesense] skip auto-start for remote host "${host}" (expected local host)`
    );
    return;
  }

  const alreadyOpen = await isPortOpen();
  if (alreadyOpen) {
    const healthy = await checkHealth();
    if (healthy) {
      log(`[typesense] ready on ${protocol}://${host}:${port}`);
      return;
    }
  }

  log('[typesense] starting local dependency via docker compose...');
  runDockerComposeUp();
  await waitUntilReady();
  log(`[typesense] ready on ${protocol}://${host}:${port}`);
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[typesense] startup failed: ${message}\n`);
  process.exit(1);
});
