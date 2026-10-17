// Talks to the floating Pixel-Laurin overlay: one JSON object per line on its stdin.
// win32: spawns scripts/overlay-windows.ps1 (WinForms), waits for {"ok":true,"cmd":...} acks.
// fake:  appends the lines to BUDDY_FAKE_LOG (tests).
import { spawn } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { join } from 'node:path';

// The first command waits for PowerShell to compile the C# overlay (Add-Type), which can be slow.
const FIRST_ACK_TIMEOUT_MS = 30000;
const ACK_TIMEOUT_MS = 6000;
const QUIT_GRACE_MS = 1000;

// Pure ASCII line: non-ASCII chars become \uXXXX so no console code page can garble them.
export function encodeCommand(cmd) {
  return JSON.stringify(cmd).replace(
    /[\u007f-￿]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}

function createFakeOverlay({ fakeLog, log }) {
  return {
    supported: true,
    async send(cmd) {
      const line = encodeCommand(cmd);
      if (fakeLog) appendFileSync(fakeLog, `${line}\n`);
      else log(`[overlay:fake] ${line}`);
    },
    isRunning: () => true,
    stop() {},
  };
}

function spawnPowerShellOverlay({ scriptsDir, spritePath, log }) {
  const script = join(scriptsDir, 'overlay-windows.ps1');
  log(`[overlay] starting ${script}`);
  // windowsHide: piped stdio + no console window flashing up on Saskia's screen.
  return spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, '-Sprite', spritePath],
    { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true },
  );
}

// Exported for tests: `spawnProcess` returns a child process speaking the overlay protocol.
export function createProcessOverlay({
  spawnProcess,
  log,
  firstAckTimeoutMs = FIRST_ACK_TIMEOUT_MS,
  ackTimeoutMs = ACK_TIMEOUT_MS,
}) {
  let child = null;
  let pending = [];
  let acked = false;
  let stopping = null;

  function failAll(error) {
    const waiting = pending;
    pending = [];
    for (const p of waiting) {
      clearTimeout(p.timer);
      p.reject(error);
    }
  }

  function handleLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return;
    log(`[overlay] ${trimmed}`);
    let msg;
    try {
      msg = JSON.parse(trimmed);
    } catch {
      return; // not an ack, already logged
    }
    if (msg.cmd === 'ready') return;
    const p = pending.shift();
    if (!p) return;
    clearTimeout(p.timer);
    acked = true;
    if (msg.ok) {
      p.resolve(msg);
      return;
    }
    const error = new Error(msg.error || `overlay could not handle ${msg.cmd}`);
    error.answered = true; // the overlay is alive, it just refused this command
    p.reject(error);
  }

  // Events of an old, replaced process must never touch the current one's queue.
  function start() {
    acked = false;
    let buffer = '';
    const proc = spawnProcess();
    child = proc;
    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      if (child === proc) lines.forEach(handleLine);
      else lines.forEach((line) => log(`[overlay:old] ${line}`));
    });
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (chunk) => log(`[overlay:stderr] ${chunk.trimEnd()}`));
    proc.stdin.on('error', (error) => log(`[overlay] stdin error: ${error.message}`));
    proc.on('error', (error) => {
      log(`[overlay] process error: ${error.message}`);
      if (child !== proc) return;
      child = null;
      failAll(error);
    });
    proc.on('exit', (code, signal) => {
      log(`[overlay] exited (code ${code}, signal ${signal})`);
      if (child !== proc) return;
      child = null;
      failAll(new Error(`overlay exited (code ${code})`));
    });
  }

  function kill() {
    if (!child) return;
    const proc = child;
    child = null;
    try {
      proc.kill();
    } catch (error) {
      log(`[overlay] kill failed: ${error.message}`);
    }
  }

  function write(cmd) {
    return new Promise((resolve, reject) => {
      if (!child) {
        reject(new Error('overlay is not running'));
        return;
      }
      const timeoutMs = acked ? ackTimeoutMs : firstAckTimeoutMs;
      const entry = { resolve, reject, timer: null };
      entry.timer = setTimeout(() => {
        log(`[overlay] no ack for ${cmd.cmd} after ${timeoutMs} ms`);
        kill();
        failAll(new Error(`overlay did not answer ${cmd.cmd}`));
      }, timeoutMs);
      pending.push(entry);
      child.stdin.write(`${encodeCommand(cmd)}\n`);
    });
  }

  return {
    supported: true,
    isRunning: () => child !== null,
    // Restarts the overlay once if it died (or dies while handling this command).
    async send(cmd) {
      if (!child && cmd.cmd !== 'point') return; // nothing on screen to hide
      try {
        if (!child) start();
        return await write(cmd);
      } catch (error) {
        if (error.answered) throw error;
        log(`[overlay] ${error.message}; restarting once`);
        kill();
        start();
        return write(cmd);
      }
    },
    // Polite quit; the overlay also exits by itself when its stdin closes.
    stop() {
      if (!child) return;
      const proc = child;
      child = null;
      stopping = proc;
      failAll(new Error('overlay stopped'));
      try {
        proc.stdin.write(`${encodeCommand({ cmd: 'quit' })}\n`);
        proc.stdin.end();
      } catch {
        // already gone
      }
      setTimeout(() => proc.kill(), QUIT_GRACE_MS).unref();
    },
    // Last resort on process exit: no overlay may outlive the server.
    killNow() {
      kill();
      if (stopping && stopping.exitCode === null) stopping.kill();
    },
  };
}

function createUnsupportedOverlay() {
  return { supported: false, isRunning: () => false, async send() {}, stop() {} };
}

export function createOverlay({ platform, scriptsDir, spritePath, fakeLog, log }) {
  if (platform === 'fake') return createFakeOverlay({ fakeLog, log });
  if (platform === 'win32') {
    return createProcessOverlay({ spawnProcess: () => spawnPowerShellOverlay({ scriptsDir, spritePath, log }), log });
  }
  return createUnsupportedOverlay();
}
