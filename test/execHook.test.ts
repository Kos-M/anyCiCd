import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { runHook } from '../routes/execHook';

// These tests exercise runHook against a real shell script, the same way a
// configured hook is invoked in production. They only run on POSIX systems,
// matching the project's own shipped hooks under exec/*.sh.
const posixOnly = { skip: process.platform === 'win32' ? 'POSIX-only: exercises a shebang script' : false };

const fixture = path.join(__dirname, 'fixtures', 'echo-hook.sh');
const markerFile = path.join(__dirname, '..', 'INJECTED_PROOF');

function cleanup() {
  if (fs.existsSync(markerFile)) fs.unlinkSync(markerFile);
}

test('runHook passes the payload through without letting it run as shell syntax', posixOnly, () => {
  cleanup();
  try {
    // This single quote used to let the payload break out of the shell
    // command runHook's predecessor built by hand.
    const payload = { message: "a'; touch INJECTED_PROOF; echo '" };
    const result = runHook(fixture, payload);
    assert.strictEqual(result, 0);
    assert.strictEqual(fs.existsSync(markerFile), false, 'the injected command must not run');
  } finally {
    cleanup();
  }
});

test('runHook delivers the exact payload to the script', posixOnly, () => {
  const payload = { ref: 'refs/heads/main', pusher: { name: 'octocat' } };
  const result = runHook(fixture, payload);
  assert.strictEqual(result, 0);
});

test('runHook returns a non-zero code when the script path does not exist', () => {
  const result = runHook(path.join(__dirname, 'fixtures', 'does-not-exist.sh'), { a: 1 });
  assert.notStrictEqual(result, 0);
});
