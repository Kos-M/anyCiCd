import { spawnSync } from 'child_process';

/**
 * Run a configured webhook hook script with the event payload as its only
 * argument, and return its exit code.
 *
 * Uses spawnSync, which does not go through a shell, instead of shelljs's
 * exec, which always does. The previous code built a shell command string
 * by wrapping JSON.stringify(payload) in single quotes. JSON does not
 * escape a literal "'" inside a string value, so a webhook field holding
 * one (a commit message, branch name, issue title, label, and so on) broke
 * out of the quoting and let its content run as shell syntax. With
 * spawnSync and no shell, the payload is passed as a single argv entry
 * regardless of what characters it contains.
 *
 * The script is run directly, so it must be executable and carry a shebang,
 * the same as when it went through a shell. Its output stays on the server
 * console (stdio 'inherit'): the default piped stdio would throw it away and
 * kill a hook that writes more than about 1 MB with ENOBUFS.
 *
 * exactPayload is the payload text as the sender signed it (a Gitea form
 * webhook). When given, the hook gets that text unchanged instead of a
 * re-serialized copy of payload.
 */
export function runHook(execPath: string, payload: unknown, exactPayload?: string): number {
  const result = spawnSync(execPath, [exactPayload ?? JSON.stringify(payload)], { stdio: 'inherit' });
  if (result.error) {
    console.error(`hook ${execPath} failed to start: ${result.error.message}`);
    return 127;
  }
  return result.status ?? 1;
}
