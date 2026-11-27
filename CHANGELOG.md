# Changelog

## Unreleased

### Changed: event header must match the route

- A request whose `X-GitHub-Event` or `X-Gitea-Event` header does not match the route it was sent to now gets `400` and the hook does not run. For example a `delete` event sent to `/api/repo/push`. **If you pointed a "send me everything" webhook at one route such as `/api/repo/push`, the other events will start showing as failed deliveries.** Select only the matching event in the webhook settings, or add one webhook per route.
- This only catches a webhook pointed at the wrong URL. The event header is not covered by the signature, so it is not replay protection.
- A `ping` event returns `200` and does not run the hook, so a newly created GitHub webhook shows as delivered.
- A request without an event header still runs the route as before. GitLab requests are not checked by event name.

### Fixed

- Form-encoded webhooks (`application/x-www-form-urlencoded`, `payload=<json>`) now reach the hook as JSON instead of raw bytes. GitHub signs the form body and Gitea signs the JSON payload inside it. Both are accepted. A Gitea form payload is passed to the hook exactly as it was signed.

## 2.1.0

### Security

- **Fixed command injection in webhook hook execution** (#5). Hooks were run through a shell with the JSON payload wrapped in single quotes. A `'` in any payload field (commit message, branch name, issue title, comment, label) broke out of the quotes and ran as shell commands. Anyone able to push a commit or open an issue on the watched repository could run arbitrary commands on the server. Hooks now run directly, without a shell, and get the payload as a single argument. Thanks to @aroh3006 for reporting and fixing this. **All users should upgrade.**
- Updated dependencies to clear every production advisory reported by `yarn audit`, including a critical IP spoofing issue in `proxy-addr` and denial-of-service issues in `path-to-regexp`, `body-parser`, `compression` and `qs` (#9, #13, #14).

### Changed: hook requirements

- Each hook is run directly, not through a shell. On Linux/macOS it must be **executable** (`chmod +x exec/your_hook.sh`) and start with a **shebang** line such as `#!/bin/bash`. This was already required before, but is now documented.
- The payload is still passed as the first argument (`$1`).
- Hook output still goes to the server console.
- **Windows:** hooks currently need to be `.exe`. Node.js refuses to run `.bat`/`.cmd` files without a shell. Safe batch and PowerShell support is planned in #6.
- `exec/example_deploy.sh` is now committed as executable.

### CI and releases

- Every pull request runs format, lint and typecheck checks, the test suite on Linux, Windows and macOS with Node 22/24/26, a build and smoke test of the packaged binary, dependency review and CodeQL (#7).
- New end-to-end webhook tests cover signature verification for GitHub, Gitea and GitLab, routing, and hook execution (#7).
- Releases are built and tested by CI, and published with a `SHA256SUMS` file and a build provenance attestation. Verify a download with `gh attestation verify <zip> --repo Kos-M/anyCiCd`.
