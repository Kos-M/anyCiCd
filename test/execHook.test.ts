import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { runHook } from '../routes/execHook';

// These tests run real hook scripts the way a configured hook runs in
// production. They are POSIX only, like the shipped hooks under exec/*.sh.
const posixOnly = { skip: process.platform === 'win32' ? 'POSIX-only: runs a shebang script' : false };

// The hook scripts are written here at run time instead of being committed, so
// their executable bit does not depend on how the repo was checked out or
// whether the tests run from the source tree or from the compiled output.
function withTempDir(fn: (dir: string) => void): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anycicd-'));
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function makeHook(dir: string, body: string): string {
  const file = path.join(dir, 'hook.sh');
  fs.writeFileSync(file, `#!/bin/sh\n${body}\n`);
  fs.chmodSync(file, 0o755);
  return file;
}

// A hook that records its first argument next to itself.
const recordArgument = `printf '%s' "$1" > "$(dirname "$0")/received"`;

test('runHook does not let the payload run as shell syntax', posixOnly, () => {
  withTempDir((dir) => {
    const marker = path.join(dir, 'INJECTED_PROOF');
    const hook = makeHook(dir, recordArgument);
    // This single quote used to let the payload break out of the shell
    // command runHook's predecessor built by hand.
    const payload = { message: `a'; touch ${marker}; echo '` };
    assert.strictEqual(runHook(hook, payload), 0);
    assert.strictEqual(fs.existsSync(marker), false, 'the injected command must not run');
  });
});

test('runHook delivers the exact payload as one argument', posixOnly, () => {
  withTempDir((dir) => {
    const hook = makeHook(dir, recordArgument);
    const payload = {
      ref: 'refs/heads/main',
      a: "it's a $(touch nope) `touch nope` ; | & test",
      b: 'line one\nline two',
      pusher: { name: 'octocat' },
    };
    assert.strictEqual(runHook(hook, payload), 0);
    assert.strictEqual(fs.readFileSync(path.join(dir, 'received'), 'utf8'), JSON.stringify(payload));
    assert.strictEqual(fs.existsSync(path.join(dir, 'nope')), false);
  });
});

test('runHook leaves hook output on the console and does not cap it', posixOnly, () => {
  withTempDir((dir) => {
    // 2 MB is past spawnSync's default 1 MB buffer, which kills a piped hook
    // with ENOBUFS. The call runs in a child process so its console output can
    // be read back here.
    const hook = makeHook(dir, 'echo start-marker\nyes x | head -c 2097152\necho end-marker');
    const script =
      `const { runHook } = require(${JSON.stringify(require.resolve('../routes/execHook'))});` +
      `process.exitCode = runHook(${JSON.stringify(hook)}, { a: 1 });`;
    const child = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    assert.strictEqual(child.status, 0);
    assert.ok(child.stdout.startsWith('start-marker'), 'hook output must reach the console');
    assert.ok(child.stdout.includes('end-marker'), 'a chatty hook must not be cut off');
    assert.ok(child.stdout.length > 2 * 1024 * 1024);
  });
});

test('runHook returns a non-zero code when the script path does not exist', () => {
  const result = runHook(path.join(os.tmpdir(), 'anycicd-does-not-exist.sh'), { a: 1 });
  assert.notStrictEqual(result, 0);
});
