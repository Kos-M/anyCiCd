import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { MAX_ARG_PAYLOAD_BYTES, planLaunch, runHook } from '../routes/execHook';

const windowsOnly = { skip: process.platform === 'win32' ? false : 'Windows-only: starts a Windows hook type' };
const posixOnly = { skip: process.platform === 'win32' ? 'POSIX-only: runs a shebang script' : false };

function withTempDir(fn: (dir: string) => void): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anycicd-launch-'));
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function write(dir: string, name: string, body: string, mode?: number): string {
  const file = path.join(dir, name);
  fs.writeFileSync(file, body);
  if (mode) fs.chmodSync(file, mode);
  return file;
}

// Run runHook in a child process, so a hook that writes to the console can be read back.
function runInChild(hook: string, payload: unknown, event?: string): { status: number | null; stdout: string; stderr: string } {
  const script =
    `const { runHook } = require(${JSON.stringify(require.resolve('../routes/execHook'))});` +
    `process.exitCode = runHook(${JSON.stringify(hook)}, ${JSON.stringify(payload)}, ${JSON.stringify(event)});`;
  const child = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { status: child.status, stdout: child.stdout, stderr: child.stderr };
}

function read(dir: string, name: string): string {
  return fs.readFileSync(path.join(dir, name), 'utf8').replace(/\r?\n$/, '');
}

// PowerShell hooks only run when the machine policy allows local scripts.
function powershellCanRunScripts(): boolean {
  if (process.platform !== 'win32') return false;
  const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Get-ExecutionPolicy'], { encoding: 'utf8' });
  const policy = (r.stdout || '').trim();
  return r.status === 0 && policy !== '' && policy !== 'Restricted' && policy !== 'AllSigned';
}
const powershellOnly = {
  skip: powershellCanRunScripts() ? false : 'needs Windows PowerShell with an execution policy that allows local scripts',
};

// A hook that records stdin, the payload file, the event and the payload file path next to itself.
const winRecorder = [
  '@echo off',
  'findstr "^" > "%~dp0stdin.txt"',
  'copy /y "%ANYCICD_PAYLOAD_FILE%" "%~dp0file.txt" >nul',
  'echo.%ANYCICD_EVENT%> "%~dp0event.txt"',
  'echo %ANYCICD_PAYLOAD_FILE%> "%~dp0path.txt"',
  '',
].join('\r\n');

const posixRecorder = [
  '#!/bin/sh',
  'D="$(dirname "$0")"',
  'cat > "$D/stdin.txt"',
  'cp "$ANYCICD_PAYLOAD_FILE" "$D/file.txt"',
  'printf "%s" "$ANYCICD_EVENT" > "$D/event.txt"',
  'printf "%s" "$ANYCICD_PAYLOAD_FILE" > "$D/path.txt"',
  '{ ls -ld "$ANYCICD_PAYLOAD_FILE"; ls -ld "$(dirname "$ANYCICD_PAYLOAD_FILE")"; } > "$D/modes.txt"',
  '',
].join('\n');

function makeRecorder(dir: string): string {
  return process.platform === 'win32' ? write(dir, 'hook.cmd', winRecorder) : write(dir, 'hook.sh', posixRecorder, 0o755);
}

// ---- planLaunch: pure, so every platform is checked on every machine ----

test('planLaunch on POSIX runs the file itself', () => {
  const plan = planLaunch('/opt/hooks/push.sh', 'linux');
  assert.strictEqual(plan.command, '/opt/hooks/push.sh');
  assert.deepStrictEqual(plan.args, []);
  assert.strictEqual(plan.payloadAsArg, true);
  assert.strictEqual(planLaunch('/opt/hooks/push', 'darwin').command, '/opt/hooks/push');
});

test('planLaunch on Windows starts .exe and .com directly, whatever the case', () => {
  for (const name of ['C:\\hooks\\a.exe', 'C:\\hooks\\a.EXE', 'C:\\hooks\\a.com', 'C:\\hooks\\a.Com']) {
    const plan = planLaunch(name, 'win32');
    assert.strictEqual(plan.command, name);
    assert.deepStrictEqual(plan.args, []);
    assert.strictEqual(plan.payloadAsArg, false);
  }
});

test('planLaunch on Windows starts .bat and .cmd through cmd.exe without a shell string', () => {
  for (const name of ['C:\\hooks\\a.bat', 'C:\\hooks\\a.CMD']) {
    const plan = planLaunch(name, 'win32');
    assert.strictEqual(plan.command, 'cmd.exe');
    assert.deepStrictEqual(plan.args.slice(0, 3), ['/d', '/s', '/c']);
    assert.strictEqual(plan.args.length, 4);
    assert.strictEqual(plan.args[3], `""${name}""`);
    assert.strictEqual(plan.windowsVerbatimArguments, true);
    assert.strictEqual(plan.payloadAsArg, false);
  }
});

test('planLaunch keeps a batch path with spaces inside one pair of quotes', () => {
  const plan = planLaunch('C:\\my hooks\\push hook.cmd', 'win32');
  assert.strictEqual(plan.args[3], '""C:\\my hooks\\push hook.cmd""');
});

test('planLaunch refuses batch paths that cmd.exe would read as syntax', () => {
  for (const bad of ['a"b', 'a%PATH%b', 'a^b', 'a&b', 'a|b', 'a<b', 'a>b', 'a!b', 'a\nb', 'a\rb']) {
    assert.throws(() => planLaunch(`C:\\hooks\\${bad}.cmd`, 'win32'), /cmd\.exe cannot take/, JSON.stringify(bad));
  }
});

test('planLaunch on Windows starts .ps1 through powershell.exe with -File', () => {
  const plan = planLaunch('C:\\hooks\\a.ps1', 'win32');
  assert.strictEqual(plan.command, 'powershell.exe');
  assert.deepStrictEqual(plan.args, ['-NoProfile', '-NonInteractive', '-File', 'C:\\hooks\\a.ps1']);
  assert.strictEqual(plan.payloadAsArg, false);
});

test('planLaunch on Windows refuses every other file type', () => {
  for (const name of [
    'C:\\hooks\\a.sh',
    'C:\\hooks\\a.js',
    'C:\\hooks\\a.vbs',
    'C:\\hooks\\a.lnk',
    'C:\\hooks\\a',
    'C:\\hooks\\a.exe.txt',
  ]) {
    assert.throws(() => planLaunch(name, 'win32'), /unsupported hook type/, name);
  }
});

// ---- real runs on Windows ----

test('a .cmd hook gets the payload on stdin, in the file and the event name', windowsOnly, () => {
  withTempDir((dir) => {
    const hook = makeRecorder(dir);
    const payload = { ref: 'refs/heads/main', n: 1 };
    assert.strictEqual(runHook(hook, payload, 'repo_push'), 0);
    assert.strictEqual(read(dir, 'stdin.txt'), JSON.stringify(payload));
    assert.strictEqual(read(dir, 'file.txt'), JSON.stringify(payload));
    assert.strictEqual(read(dir, 'event.txt'), 'repo_push');
  });
});

test('a .bat hook works the same way', windowsOnly, () => {
  withTempDir((dir) => {
    const hook = write(dir, 'hook.bat', winRecorder);
    assert.strictEqual(runHook(hook, { a: 1 }, 'issues_open'), 0);
    assert.strictEqual(read(dir, 'stdin.txt'), '{"a":1}');
    assert.strictEqual(read(dir, 'event.txt'), 'issues_open');
  });
});

test('a batch hook in a folder with spaces still runs', windowsOnly, () => {
  withTempDir((dir) => {
    const spaced = path.join(dir, 'my hooks');
    fs.mkdirSync(spaced);
    const hook = write(spaced, 'push hook.cmd', winRecorder);
    assert.strictEqual(runHook(hook, { a: 1 }, 'repo_push'), 0);
    assert.strictEqual(read(spaced, 'stdin.txt'), '{"a":1}');
  });
});

test('cmd.exe metacharacters in the payload never run', windowsOnly, () => {
  withTempDir((dir) => {
    const marker = path.join(dir, 'INJECTED_PROOF');
    const hook = makeRecorder(dir);
    const payload = { title: `"& echo x> "${marker}" & %COMSPEC% ^ | < > !PATH!` };
    assert.strictEqual(runHook(hook, payload, 'issues_open'), 0);
    assert.strictEqual(fs.existsSync(marker), false, 'the injected command must not run');
    assert.strictEqual(fs.readFileSync(path.join(dir, 'file.txt'), 'utf8'), JSON.stringify(payload));
  });
});

test('a batch hook exit code comes back, and the temporary files are still removed', windowsOnly, () => {
  withTempDir((dir) => {
    const hook = write(dir, 'hook.cmd', '@echo off\r\necho %ANYCICD_PAYLOAD_FILE%> "%~dp0path.txt"\r\nexit /b 3\r\n');
    assert.strictEqual(runHook(hook, { a: 1 }, 'repo_push'), 3);
    const payloadFile = read(dir, 'path.txt').trim();
    assert.ok(payloadFile.length > 0);
    assert.strictEqual(fs.existsSync(payloadFile), false, 'payload file must be deleted');
    assert.strictEqual(fs.existsSync(path.dirname(payloadFile)), false, 'its folder must be deleted');
  });
});

test('a 300 KB payload reaches a batch hook through the file', windowsOnly, () => {
  withTempDir((dir) => {
    const hook = write(dir, 'hook.cmd', '@echo off\r\ncopy /y "%ANYCICD_PAYLOAD_FILE%" "%~dp0file.txt" >nul\r\n');
    const payload = { body: 'x'.repeat(300_000) };
    assert.strictEqual(runHook(hook, payload, 'issues_open'), 0);
    assert.strictEqual(fs.readFileSync(path.join(dir, 'file.txt'), 'utf8'), JSON.stringify(payload));
  });
});

test('a hook that never reads a large stdin payload is not reported as failed', windowsOnly, () => {
  withTempDir((dir) => {
    const hook = write(dir, 'hook.cmd', '@echo off\r\nexit /b 0\r\n');
    assert.strictEqual(runHook(hook, { body: 'x'.repeat(5_000_000) }, 'issues_open'), 0);
  });
});

test('a .ps1 hook gets stdin, the file and the event, even for a 300 KB payload', { ...windowsOnly, ...powershellOnly }, () => {
  withTempDir((dir) => {
    const hook = write(
      dir,
      'hook.ps1',
      [
        '$in = [Console]::In.ReadToEnd()',
        '[IO.File]::WriteAllText("$PSScriptRoot\\stdin.txt", $in)',
        '[IO.File]::WriteAllText("$PSScriptRoot\\file.txt", [IO.File]::ReadAllText($env:ANYCICD_PAYLOAD_FILE))',
        '[IO.File]::WriteAllText("$PSScriptRoot\\event.txt", $env:ANYCICD_EVENT)',
        '',
      ].join('\r\n'),
    );
    const payload = { title: `it's "quoted" & $(nope) \`tick\``, body: 'x'.repeat(300_000) };
    assert.strictEqual(runHook(hook, payload, 'issues_comment_create'), 0);
    assert.strictEqual(fs.readFileSync(path.join(dir, 'stdin.txt'), 'utf8'), JSON.stringify(payload));
    assert.strictEqual(fs.readFileSync(path.join(dir, 'file.txt'), 'utf8'), JSON.stringify(payload));
    assert.strictEqual(fs.readFileSync(path.join(dir, 'event.txt'), 'utf8'), 'issues_comment_create');
  });
});

test('a .ps1 hook exit code comes back', { ...windowsOnly, ...powershellOnly }, () => {
  withTempDir((dir) => {
    const hook = write(dir, 'hook.ps1', 'exit 4\r\n');
    assert.strictEqual(runHook(hook, { a: 1 }, 'repo_push'), 4);
  });
});

test('a .exe hook is started directly and reads stdin', windowsOnly, () => {
  const sort = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'sort.exe');
  const result = runInChild(sort, { a: 1, b: 'two' }, 'repo_push');
  assert.strictEqual(result.status, 0);
  assert.ok(result.stdout.includes('{"a":1,"b":"two"}'), result.stdout);
});

test('a .com hook is started directly and reads stdin', windowsOnly, () => {
  const more = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'more.com');
  const result = runInChild(more, { a: 1, b: 'two' }, 'repo_push');
  assert.strictEqual(result.status, 0);
  assert.ok(result.stdout.includes('{"a":1,"b":"two"}'), result.stdout);
});

test('runHook on Windows refuses a .sh hook with 127 and says why', windowsOnly, () => {
  const result = runInChild('C:\\hooks\\push.sh', { a: 1 });
  assert.strictEqual(result.status, 127);
  assert.ok(result.stderr.includes('unsupported hook type'), result.stderr);
});

// ---- real runs on POSIX (CI runs these on Linux and macOS) ----

test('a POSIX hook gets stdin, the file and the event name', posixOnly, () => {
  withTempDir((dir) => {
    const hook = makeRecorder(dir);
    const payload = { ref: 'refs/heads/main', note: "it's `x` $(y)" };
    assert.strictEqual(runHook(hook, payload, 'repo_push'), 0);
    assert.strictEqual(read(dir, 'stdin.txt'), JSON.stringify(payload));
    assert.strictEqual(read(dir, 'file.txt'), JSON.stringify(payload));
    assert.strictEqual(read(dir, 'event.txt'), 'repo_push');
  });
});

test('the payload file is private and is removed after the hook', posixOnly, () => {
  withTempDir((dir) => {
    const hook = makeRecorder(dir);
    assert.strictEqual(runHook(hook, { a: 1 }, 'repo_push'), 0);
    const [fileLine, dirLine] = read(dir, 'modes.txt').split('\n');
    assert.ok(fileLine.startsWith('-rw-------'), fileLine);
    assert.ok(dirLine.startsWith('drwx------'), dirLine);
    const payloadFile = read(dir, 'path.txt');
    assert.strictEqual(fs.existsSync(payloadFile), false);
    assert.strictEqual(fs.existsSync(path.dirname(payloadFile)), false);
  });
});

test('the temporary files are removed when the hook fails', posixOnly, () => {
  withTempDir((dir) => {
    const hook = write(dir, 'hook.sh', '#!/bin/sh\nprintf "%s" "$ANYCICD_PAYLOAD_FILE" > "$(dirname "$0")/path.txt"\nexit 5\n', 0o755);
    assert.strictEqual(runHook(hook, { a: 1 }, 'repo_push'), 5);
    assert.strictEqual(fs.existsSync(path.dirname(read(dir, 'path.txt'))), false);
  });
});

test('a hook that never reads a large stdin payload is not reported as failed', posixOnly, () => {
  withTempDir((dir) => {
    const hook = write(dir, 'hook.sh', '#!/bin/sh\nexit 0\n', 0o755);
    assert.strictEqual(runHook(hook, { body: 'x'.repeat(5_000_000) }, 'issues_open'), 0);
  });
});

test('a large payload skips $1 but still reaches stdin and the file', posixOnly, () => {
  withTempDir((dir) => {
    const hook = write(
      dir,
      'hook.sh',
      '#!/bin/sh\nD="$(dirname "$0")"\nprintf "%s" "$1" > "$D/arg.txt"\ncat > "$D/stdin.txt"\ncp "$ANYCICD_PAYLOAD_FILE" "$D/file.txt"\n',
      0o755,
    );
    const payload = { body: 'x'.repeat(MAX_ARG_PAYLOAD_BYTES + 1000) };
    assert.strictEqual(runHook(hook, payload, 'issues_open'), 0);
    assert.strictEqual(read(dir, 'arg.txt'), '');
    assert.strictEqual(read(dir, 'stdin.txt'), JSON.stringify(payload));
    assert.strictEqual(read(dir, 'file.txt'), JSON.stringify(payload));
  });
});

test('a small payload still arrives as $1 on POSIX, with a one time warning', posixOnly, () => {
  withTempDir((dir) => {
    const hook = write(dir, 'hook.sh', '#!/bin/sh\nprintf "%s" "$1" > "$(dirname "$0")/arg.txt"\n', 0o755);
    const script =
      `const { runHook } = require(${JSON.stringify(require.resolve('../routes/execHook'))});` +
      `runHook(${JSON.stringify(hook)}, { a: 1 }, 'x'); runHook(${JSON.stringify(hook)}, { a: 2 }, 'x');`;
    const child = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });
    assert.strictEqual(read(dir, 'arg.txt'), '{"a":2}');
    assert.strictEqual(child.stderr.split('deprecated').length - 1, 1, 'the warning must print once');
  });
});

test('ANYCICD_EVENT is not inherited from the server environment', () => {
  withTempDir((dir) => {
    const hook = makeRecorder(dir);
    const before = process.env.ANYCICD_EVENT;
    process.env.ANYCICD_EVENT = 'stale';
    try {
      assert.strictEqual(runHook(hook, { a: 1 }), 0);
    } finally {
      if (before === undefined) delete process.env.ANYCICD_EVENT;
      else process.env.ANYCICD_EVENT = before;
    }
    assert.strictEqual(read(dir, 'event.txt'), '');
  });
});

// ---- route wiring ----

test('every route passes the key of its own hook as the event name', () => {
  const root = path.resolve(__dirname, '..', '..');
  for (const file of ['issue.ts', 'repository.ts']) {
    const source = fs.readFileSync(path.join(root, 'routes', file), 'utf8');
    const keys = new Map<string, string>();
    for (const m of source.matchAll(/const (\w+Exec): string \| null = process\.env\.(\w+)/g)) keys.set(m[1], m[2]);
    const calls = [...source.matchAll(/runHook\((\w+), req\.body(?:, '(\w+)')?\)/g)];
    assert.ok(calls.length > 0, `${file} has no runHook calls`);
    for (const call of calls) {
      assert.strictEqual(call[2], keys.get(call[1]), `${file}: ${call[1]} must pass '${keys.get(call[1])}'`);
    }
    assert.strictEqual(calls.length, keys.size, `${file}: every hook must be called once`);
  }
});
