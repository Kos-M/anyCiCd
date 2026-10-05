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
 */
export function runHook(execPath: string, payload: unknown): number {
  const result = spawnSync(execPath, [JSON.stringify(payload)]);
  if (result.error) {
    return 127;
  }
  return result.status ?? 1;
}
