#!/usr/bin/env node
/**
 * Dev launcher: 启动 vite dev server，把 stdout/stderr 加时间戳前缀
 * 写到 logs/<name>.std.log + 当前 stdout；负责子进程组管理与端口孤儿清理。
 * 修复Windows EINVAL、ENOENT，不调用npx/npx.cmd
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);

const LOG_DIR = process.env.LOG_DIR || 'logs';
const CLIENT_DEV_PORT = process.env.CLIENT_DEV_PORT || '18001';
const isWin = process.platform === 'win32';

fs.mkdirSync(LOG_DIR, { recursive: true });

function timestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  );
}

function log(msg) {
  const line = `[${timestamp()}] [dev] ${msg}\n`;
  try { process.stdout.write(line); } catch {}
}

function killOrphansByPort(port) {
  if(isWin){
    log(`Windows平台跳过lsof端口清理（无lsof命令）`);
    return [];
  }
  try {
    const out = execSync(`lsof -ti:${port}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (!out) return [];
    const pids = out.split('\n').filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), 'SIGKILL');
        log(`killed orphan pid=${pid} on :${port}`);
      } catch {}
    }
    return pids;
  } catch {
    return [];
  }
}

const managed = [];

function startProcess({ name, command, args, logFileName }) {
  const logFd = logFileName
    ? fs.openSync(path.join(LOG_DIR, logFileName), 'a')
    : null;

  // Windows下detached必须false，否则极易EINVAL
  const child = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    cwd: ROOT,
    env: process.env,
    detached: false,
  });

  const pipeLines = (stream) => {
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    rl.on('line', (line) => {
      const msg = `[${timestamp()}] [${name}] ${line}\n`;
      try { process.stdout.write(msg); } catch {}
      if (logFd != null) {
        try { fs.writeSync(logFd, msg); } catch {}
      }
    });
  };

  pipeLines(child.stdout);
  pipeLines(child.stderr);
  managed.push({ name, child });
  return child;
}

killOrphansByPort(CLIENT_DEV_PORT);

// ========== 关键改动 ==========
// 不使用 npx/npx.cmd；直接找到vite bin入口，用当前node运行
const viteEntry = path.resolve(ROOT, 'node_modules/vite/bin/vite.js');
startProcess({
  name: 'client',
  command: process.execPath, // 当前node可执行文件
  args: [ viteEntry, '--port', CLIENT_DEV_PORT, '--host', '0.0.0.0' ],
  logFileName: 'client.std.log',
});

let stopping = false;
function cleanup(signal) {
  if (stopping) return;
  stopping = true;
  log(`cleanup triggered by ${signal}`);

  for (const { child } of managed) {
    if (!child.pid) continue;
    try {
      // Windows不支持负pid进程组，直接杀pid
      process.kill(child.pid, signal || 'SIGTERM');
    } catch (e) {
      log(`kill pid ${child.pid} failed: ${e.message}`);
    }
  }

  setTimeout(() => {
    for (const { child } of managed) {
      if (!child.pid) continue;
      try {
        process.kill(child.pid, 'SIGKILL');
      } catch {}
    }
    killOrphansByPort(CLIENT_DEV_PORT);
    process.exit(0);
  }, 2000);
}

process.on('SIGINT', () => cleanup('SIGTERM'));
process.on('SIGTERM', () => cleanup('SIGTERM'));
process.on('SIGHUP', () => cleanup('SIGTERM'));

Promise.race(
  managed.map(({ child }) => new Promise((r) => child.on('exit', r))),
).then(() => cleanup('SIGTERM'));
