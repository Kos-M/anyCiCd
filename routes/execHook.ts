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

// Start the Windows interpreters by full path. With a bare name Node looks in the server's working directory
// before PATH. A cmd.exe or powershell.exe placed there would run for every hook.
function systemRoot(env: NodeJS.ProcessEnv): string {
  return env.SystemRoot || env.windir || 'C:\\Windows';
}

function cmdExePath(env: NodeJS.ProcessEnv): string {
  return env.ComSpec || path.win32.join(systemRoot(env), 'System32', 'cmd.exe');
}

function powershellExePath(env: NodeJS.ProcessEnv): string {
  return path.win32.join(systemRoot(env), 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
}

// Linux caps one argument at 128 KiB. Staying under it means $1 can never make the launch fail.
export const MAX_ARG_PAYLOAD_BYTES = 100_000;

/**
 * Pick how to start a hook from its file type. Never goes through a shell.
 *
 * POSIX runs the file itself, so it needs the executable bit and a shebang. Windows only starts the types
 * below. Anything else is refused instead of being handed to a shell to guess.
 */
export function planLaunch(
  execPath: string,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): LaunchPlan {
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
    return { command: cmdExePath(env), args: ['/d', '/s', '/c', quoted], payloadAsArg: false, windowsVerbatimArguments: true };
  }

  if (ext === '.ps1') {
    return {
      command: powershellExePath(env),
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
      'Read it from the file named in ANYCICD_PAYLOAD_FILE instead.',
  );
}

/**
 * Run a configured webhook hook and return its exit code.
 *
 * The payload is JSON and never part of a command line the hook is started from, so its content cannot
 * be read as shell syntax. It is written to a temporary file whose path is in ANYCICD_PAYLOAD_FILE (mode 0600
 * in a private folder, deleted when the hook ends). The hook gets no stdin: the payload holds text that anyone
 * can write (commit messages, issue bodies). On stdin it would also reach every program the hook starts
 * without redirecting its own input. The configured event name, such as repo_push, is in ANYCICD_EVENT.
 * POSIX hooks also get the payload as $1 for now when it is small enough to fit.
 *
 * The hook's own output stays on the server console (stdio 'inherit'): piped stdio would throw it away and
 * kill a hook that writes more than about 1 MB with ENOBUFS.
 *
 * Nothing here throws. A problem with the temporary files is logged and returns 1. The route then answers
 * normally and never shows an error page with a stack trace.
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
      console.warn(`hook ${execPath}: the payload is too large for $1. Read it from ANYCICD_PAYLOAD_FILE.`);
    }
  }

  let dir: string | undefined;
  try {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anycicd-hook-'));
    const payloadFile = path.join(dir, 'payload.json');
    fs.writeFileSync(payloadFile, json, { mode: 0o600 });

    const env: NodeJS.ProcessEnv = { ...process.env, ANYCICD_PAYLOAD_FILE: payloadFile };
    if (event) {
      env.ANYCICD_EVENT = event;
    } else {
      delete env.ANYCICD_EVENT;
    }

    const result = spawnSync(plan.command, args, {
      stdio: ['ignore', 'inherit', 'inherit'],
      env,
      windowsVerbatimArguments: plan.windowsVerbatimArguments,
    });

    if (result.error) {
      console.error(`hook ${execPath} failed to start: ${result.error.message}`);
      return 127;
    }
    return result.status ?? 1;
  } catch (err) {
    console.error(`hook ${execPath} not run, could not prepare the payload file: ${(err as Error).message}`);
    return 1;
  } finally {
    if (dir) {
      try {
        fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
      } catch (err) {
        // On Windows this fails while a process the hook left behind still holds the file open.
        console.warn(`hook ${execPath}: could not remove ${dir}: ${(err as Error).message}`);
      }
    }
  }
}
