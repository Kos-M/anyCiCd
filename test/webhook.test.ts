import { test, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

// End-to-end tests for the HTTP layer: signature verification for every
// supported provider, routing, and hook execution through a real server.
//
// The routes read their configuration from process.env when they are first
// loaded, so the environment is set up here before the app is imported.

const isWindows = process.platform === 'win32';
const posixOnly = { skip: isWindows ? 'POSIX-only: runs a shebang script' : false };

const SECRET = 'test-secret';
const hookDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anycicd-webhook-'));
const received = path.join(hookDir, 'received');
const runs = path.join(hookDir, 'runs');
const marker = path.join(hookDir, 'INJECTED_PROOF');

function makeHook(name: string, body: string): string {
  const file = path.join(hookDir, name);
  fs.writeFileSync(file, `#!/bin/sh\n${body}\n`);
  fs.chmodSync(file, 0o755);
  return file;
}

process.env.SECRET = SECRET;
if (!isWindows) {
  process.env.repo_push = makeHook('record.sh', `printf '%s' "$1" > "${received}"; printf x >> "${runs}"`);
  process.env.repo_create = makeHook('fail.sh', 'exit 3');
  process.env.issues_open = makeHook('issue.sh', `printf '%s' "$1" > "${received}"`);
}
delete process.env.repo_delete;

let server: Server;
let baseUrl: string;

before(async () => {
  const { default: app } = await import('../app');
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(() => {
  server?.close();
  fs.rmSync(hookDir, { recursive: true, force: true });
});

function hmac(body: string, secret = SECRET): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

type Provider = 'github' | 'gitea' | 'gitlab' | 'none';

async function post(route: string, payload: unknown, provider: Provider = 'github', secret = SECRET) {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (provider === 'github') headers['x-hub-signature-256'] = `sha256=${hmac(body, secret)}`;
  if (provider === 'gitea') headers['x-gitea-signature'] = hmac(body, secret);
  if (provider === 'gitlab') headers['x-gitlab-token'] = secret;
  const res = await fetch(`${baseUrl}${route}`, { method: 'POST', headers, body });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

test('rejects a request without a signature', async () => {
  const res = await post('/api/repo/push', { a: 1 }, 'none');
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error, 'Data validation failed');
});

for (const provider of ['github', 'gitea', 'gitlab'] as const) {
  test(`rejects a ${provider} request signed with the wrong secret`, async () => {
    const res = await post('/api/repo/delete', { a: 1 }, provider, 'wrong-secret');
    assert.strictEqual(res.status, 400);
  });

  // repo_delete has no hook configured, so a request that passes signature
  // verification reaches the route and gets the "not defined" answer.
  test(`accepts a ${provider} request with a valid signature`, async () => {
    const res = await post('/api/repo/delete', { a: 1 }, provider);
    assert.strictEqual(res.status, 500);
    assert.strictEqual(res.body.reason, 'Not defined executable script for this event');
  });
}

test('rejects a GitHub signature computed over a different body', async () => {
  const signature = `sha256=${hmac(JSON.stringify({ a: 1 }))}`;
  const res = await fetch(`${baseUrl}/api/repo/push`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature },
    body: JSON.stringify({ a: 2 }),
  });
  assert.strictEqual(res.status, 400);
});

test('answers 404 for an unknown route', async () => {
  const res = await fetch(`${baseUrl}/does-not-exist`);
  assert.strictEqual(res.status, 404);
});

test('runs the configured hook with the exact payload', posixOnly, async () => {
  fs.rmSync(received, { force: true });
  const payload = { ref: 'refs/heads/main', head_commit: { message: 'multi\nline "quoted" $HOME' } };
  const res = await post('/api/repo/push', payload);
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { status: 'Completed' });
  assert.strictEqual(fs.readFileSync(received, 'utf8'), JSON.stringify(payload));
});

test('a webhook payload cannot inject shell commands', posixOnly, async () => {
  fs.rmSync(marker, { force: true });
  const res = await post('/api/repo/push', { head_commit: { message: `x'; touch ${marker}; echo '` } });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(fs.existsSync(marker), false, 'the injected command must not run');
});

test('reports a failing hook as 500 with its exit code', posixOnly, async () => {
  const res = await post('/api/repo/create', { a: 1 });
  assert.strictEqual(res.status, 500);
  assert.strictEqual(res.body.reason, 'Executable exit with status code 3');
});

test('a form-encoded webhook is passed to the hook as JSON', posixOnly, async () => {
  fs.rmSync(received, { force: true });
  const payload = { ref: 'refs/heads/main', head_commit: { message: 'from a form' } };
  const body = `payload=${encodeURIComponent(JSON.stringify(payload))}`;
  const res = await fetch(`${baseUrl}/api/repo/push`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'x-gitea-event': 'push',
      'x-gitea-signature': hmac(body),
    },
    body,
  });
  const text = await res.text();
  assert.strictEqual(res.status, 200, text);
  assert.strictEqual(fs.readFileSync(received, 'utf8'), JSON.stringify(payload));
});

test('a signed push is not accepted on the delete route', posixOnly, async () => {
  fs.rmSync(received, { force: true });
  fs.rmSync(runs, { force: true });
  const payload = { ref: 'refs/heads/main' };
  const body = JSON.stringify(payload);
  const res = await fetch(`${baseUrl}/api/repo/delete`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'push',
      'x-hub-signature-256': `sha256=${hmac(body)}`,
    },
    body,
  });
  const text = await res.text();
  assert.strictEqual(res.status, 400, text);
  assert.strictEqual(fs.existsSync(runs), false);
});

test('a push event header still runs the push hook once', posixOnly, async () => {
  fs.rmSync(received, { force: true });
  fs.rmSync(runs, { force: true });
  const payload = { ref: 'refs/heads/main' };
  const body = JSON.stringify(payload);
  const signature = hmac(body);
  const res = await fetch(`${baseUrl}/api/repo/push`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-event': 'push',
      'x-hub-signature-256': `sha256=${signature}`,
      'x-gitea-signature': signature,
    },
    body,
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(fs.readFileSync(received, 'utf8'), JSON.stringify(payload));
  assert.strictEqual(fs.readFileSync(runs, 'utf8'), 'x');
});

test('issue routes only run the hook for the matching action', posixOnly, async () => {
  fs.rmSync(received, { force: true });
  const ignored = await post('/api/issues/open', { action: 'closed' });
  assert.strictEqual(ignored.status, 200);
  assert.strictEqual(fs.existsSync(received), false, 'hook must not run for another action');

  const handled = await post('/api/issues/open', { action: 'opened', issue: { title: "it's broken" } });
  assert.strictEqual(handled.status, 200);
  assert.deepStrictEqual(handled.body, { status: 'Completed' });
  assert.strictEqual(fs.readFileSync(received, 'utf8'), JSON.stringify({ action: 'opened', issue: { title: "it's broken" } }));
});
