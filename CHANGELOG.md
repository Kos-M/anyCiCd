# Changelog

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
