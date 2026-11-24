import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

/** How to start a hook: the program, its fixed arguments and how Node should pass them. */
export interface LaunchPlan {
  command: string;
  args: string[];
  /** Also pass the payload as the first argument ($1). POSIX only, kept for one release. */
  payloadAsArg: boolean;
  /** Hand the arguments to Windows exactly as written. Needed for cmd.exe, which does its own quote handling. */
  windowsVerbatimArguments: boolean;
}

const WINDOWS_DIRECT = new Set(['.exe', '.com']);
const WINDOWS_BATCH = new Set(['.bat', '.cmd']);

// cmd.exe still reads these as syntax inside quotes: a quote ends the quoting, % expands a variable, ^ escapes
// and the rest chain or redirect commands. A line break ends the command. None can appear in a hook path.
const CMD_UNSAFE = /["%^&|<>!\r\n]/;

// Linux caps one argument at 128 KiB. Staying under it means $1 can never make the launch fail.
export const MAX_ARG_PAYLOAD_BYTES = 100_000;

/**
 * Pick how to start a hook from its file type. Never goes through a shell.
 *
 * POSIX runs the file itself, so it needs the executable bit and a shebang. Windows only starts the types
 * below. Anything else is refused instead of being handed to a shell to guess.
 */
export function planLaunch(execPath: string, platform: NodeJS.Platform = process.platform): LaunchPlan {
  if (platform !== 'win32') {
    return { command: execPath, args: [], payloadAsArg: true, windowsVerbatimArguments: false };
  }

  const ext = path.win32.extname(execPath).toLowerCase();

  if (WINDOWS_DIRECT.has(ext)) {
    return { command: execPath, args: [], payloadAsArg: false, windowsVerbatimArguments: false };
  }

  if (WINDOWS_BATCH.has(ext)) {
    if (CMD_UNSAFE.test(execPath)) {
      throw new Error(`the path contains a character that cmd.exe cannot take safely: ${execPath}`);
    }
    // /s strips the outer pair of quotes. The path keeps its own pair, so it still works with spaces.
    const quoted = `""${path.win32.normalize(execPath)}""`;
    return { command: 'cmd.exe', args: ['/d', '/s', '/c', quoted], payloadAsArg: false, windowsVerbatimArguments: true };
  }

  if (ext === '.ps1') {
    return {
      command: 'powershell.exe',
      args: ['-NoProfile', '-NonInteractive', '-File', execPath],
      payloadAsArg: false,
      windowsVerbatimArguments: false,
    };
  }

  throw new Error(`unsupported hook type ${ext ? `"${ext}"` : '(no extension)'} on Windows, use .exe, .com, .bat, .cmd or .ps1`);
}

let warnedAboutArgPayload = false;

function warnAboutArgPayload(): void {
  if (warnedAboutArgPayload) return;
  warnedAboutArgPayload = true;
  console.warn(
    'hooks: passing the payload as the first argument ($1) is deprecated and will be removed. ' +
      'Read it from stdin or from the file named in ANYCICD_PAYLOAD_FILE instead.',
  );
}

/**
 * Run a configured webhook hook and return its exit code.
 *
 * The payload is JSON and never part of a command line the hook is started from, so its content cannot
 * be read as shell syntax. It goes to the hook on stdin and in a temporary file whose path is in
 * ANYCICD_PAYLOAD_FILE (mode 0600 in a private folder, deleted when the hook ends). The configured event
 * name, such as repo_push, is in ANYCICD_EVENT. POSIX hooks also get the payload as $1 for now when it is
 * small enough to fit.
 *
 * The hook's own output stays on the server console (stdio 'inherit'): piped stdio would throw it away and
 * kill a hook that writes more than about 1 MB with ENOBUFS.
 */
export function runHook(execPath: string, payload: unknown, event?: string): number {
  const json = JSON.stringify(payload ?? null);

  let plan: LaunchPlan;
  try {
    plan = planLaunch(execPath);
  } catch (err) {
    console.error(`hook ${execPath} cannot run: ${(err as Error).message}`);
    return 127;
  }

  const args = [...plan.args];
  if (plan.payloadAsArg) {
    if (Buffer.byteLength(json) <= MAX_ARG_PAYLOAD_BYTES) {
      warnAboutArgPayload();
      args.push(json);
    } else {
      console.warn(`hook ${execPath}: the payload is too large for $1. Read it from stdin or ANYCICD_PAYLOAD_FILE.`);
    }
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anycicd-hook-'));
  try {
    const payloadFile = path.join(dir, 'payload.json');
    fs.writeFileSync(payloadFile, json, { mode: 0o600 });

    const env: NodeJS.ProcessEnv = { ...process.env, ANYCICD_PAYLOAD_FILE: payloadFile };
    if (event) {
      env.ANYCICD_EVENT = event;
    } else {
      delete env.ANYCICD_EVENT;
    }

    const result = spawnSync(plan.command, args, {
      input: json,
      stdio: ['pipe', 'inherit', 'inherit'],
      env,
      windowsVerbatimArguments: plan.windowsVerbatimArguments,
    });

    // A hook that exits without reading stdin makes the write fail (EPIPE, or EOF on Windows). The hook itself did not fail.
    const error = result.error as NodeJS.ErrnoException | undefined;
    const stdinClosedEarly = error?.code === 'EPIPE' || error?.code === 'EOF';
    if (error && !(stdinClosedEarly && result.status !== null)) {
      console.error(`hook ${execPath} failed to start: ${error.message}`);
      return 127;
    }
    return result.status ?? 1;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
