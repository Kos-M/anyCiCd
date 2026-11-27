# anyCiCd

[![CI](https://github.com/Kos-M/anyCiCd/actions/workflows/ci.yml/badge.svg)](https://github.com/Kos-M/anyCiCd/actions/workflows/ci.yml)

`anyCiCd` is a lightweight and flexible CI/CD webhook handler designed to integrate with various Git platforms (e.g., GitHub, GitLab, Bitbucket) and trigger custom scripts based on repository events. It allows you to automate tasks like deployments, testing, and notifications by executing shell scripts in response to specific webhook payloads.

## Features

- **Webhook Listener:** Listens for incoming webhook events from Git platforms.
- **Event-driven Script Execution:** Triggers predefined shell scripts based on the type of repository event (e.g., push, pull request, issue). 
- **Signature Verification:** (To be implemented/verified) Ensures the authenticity of incoming webhooks.
- **Customizable Actions:** Easily configure which scripts to run for different events.

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or Yarn

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Kos-M/anyCiCd.git
   cd anyCiCd
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Environment Variables:**

   Create a `.env` file in the root directory by copying `sample.env` and fill in the necessary values.

   ```bash
   cp sample.env .env
   ```

   Edit `.env`:

   ```
   PORT=3000
   GITHUB_WEBHOOK_SECRET=your_github_webhook_secret
   # Add other secrets/configurations as needed
   ```

   **Repository Event Script Configuration:**
   For each repository event, you can define an environment variable pointing to a shell script that will be executed when the corresponding webhook is received. The full JSON payload of the webhook is saved to a temporary file, whose path is in the `ANYCICD_PAYLOAD_FILE` environment variable. The name of the event, such as `repo_push`, is in `ANYCICD_EVENT`.

   Example:
   ```
   repo_push=./exec/on_repo_push.sh
   repo_create=./exec/on_repo_create.sh
   # ... and so on for other repository events
   ```

   **Issue Event Script Configuration:**
   Similar to repository events, you can define environment variables for issue events. The `action` field in the webhook payload determines which script is executed.

   Example:
   ```
   issues_open=./exec/on_issue_open.sh
   issues_comment_create=./exec/on_issue_comment_create.sh
   # ... and so on for other issue events
   ```

   **Pull Request Event Script Configuration:**
   Currently, there is a single endpoint for all pull request events. You can define an environment variable to execute a script for any pull request webhook. The `action` field in the webhook payload will indicate the specific pull request event.

   Example:
   ```
   pull_request_event=./exec/on_pull_request.sh
   ```

   **Script requirements:**
   Each script is run directly, never through a shell string. It gets no stdin. The webhook payload is saved to a temporary file (mode 0600, in a private folder) and its path is in `ANYCICD_PAYLOAD_FILE`. `ANYCICD_EVENT` holds the event name. The payload contains text that anyone can write, such as commit messages and issue bodies. A script must treat it as untrusted data.

   The file is UTF-8 without a BOM. It is deleted when the script exits. A background job that needs it later must copy it first. Its output goes to the server console.

   Reading the payload:

   ```bash
   jq -r '.ref' "$ANYCICD_PAYLOAD_FILE"
   ```

   ```powershell
   $payload = Get-Content -Raw -Encoding UTF8 $env:ANYCICD_PAYLOAD_FILE | ConvertFrom-Json
   ```

   Windows PowerShell 5.1 reads files as ANSI by default. Keep `-Encoding UTF8`.

   On POSIX the payload is also passed as the first argument (`$1`) for now. That is deprecated and is left out when the payload is larger than 100 KB. The argument list can be read by other local users (for example in `/proc/<pid>/cmdline`), which is one more reason to move to the file. On POSIX the script must be executable (for example `chmod +x exec/on_repo_push.sh`) and start with a shebang line such as `#!/bin/bash`.

   On Windows the script can be `.exe`, `.com`, `.bat`, `.cmd` or `.ps1`. Other types are refused. `cmd.exe` is taken from the `ComSpec` variable, falling back to `%SystemRoot%\System32\cmd.exe`. `powershell.exe` is started by its full path under `%SystemRoot%\System32\WindowsPowerShell\v1.0`. Paths of `.bat` and `.cmd` scripts must not contain any of `" % ^ & | < > !`. `.ps1` scripts run with `-NoProfile -NonInteractive -File`. The machine execution policy has to allow local scripts.

   **Batch hooks must not expand the payload.** The natural way to read the file in batch, `set /p P=<"%ANYCICD_PAYLOAD_FILE%"` and then `%P%`, lets the payload run commands. `cmd.exe` reads the `\"` that JSON uses as an ordinary quote. A value like `x" & calc & rem` breaks out of the quotes and runs `calc`. Call PowerShell or another program to parse the file instead.

4. **Build the TypeScript files:**

   ```bash
   npm run build
   # or
   yarn build
   ```

5. **Run the application:**

   ```bash
   npm start
   # or
   yarn start
   ```

   The server will start on the configured `PORT` (default: 3000).

## API Reference

All API endpoints expect `POST` requests with a JSON payload and require signature verification using the `X-Hub-Signature` header. The `X-GitHub-Event` header (or equivalent for other Git platforms) is used to identify the event type.

#### Repository Events

These endpoints handle various repository-related events. The full webhook payload is sent to the configured script, see "Script requirements" above.

```http
  POST /api/repo/{event_type}
```

##### Endpoints:

- `/api/repo/push`
  - **Description:** Triggered when a push is made to the repository.
  - **Environment Variable:** `repo_push`
  - **Payload:** [GitHub Push Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#push)

- `/api/repo/create`
  - **Description:** Triggered when a repository, branch, or tag is created.
  - **Environment Variable:** `repo_create`
  - **Payload:** [GitHub Create Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#create)

- `/api/repo/delete`
  - **Description:** Triggered when a repository, branch, or tag is deleted.
  - **Environment Variable:** `repo_delete`
  - **Payload:** [GitHub Delete Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#delete)

- `/api/repo/branch/create`
  - **Description:** Triggered when a branch is created.
  - **Environment Variable:** `repo_branch_create`
  - **Payload:** Similar to GitHub Create Event, but specifically for branches.

- `/api/repo/branch/delete`
  - **Description:** Triggered when a branch is deleted.
  - **Environment Variable:** `repo_branch_delete`
  - **Payload:** Similar to GitHub Delete Event, but specifically for branches.

- `/api/repo/tag/create`
  - **Description:** Triggered when a tag is created.
  - **Environment Variable:** `repo_tag_create`
  - **Payload:** Similar to GitHub Create Event, but specifically for tags.

- `/api/repo/tag/delete`
  - **Description:** Triggered when a tag is deleted.
  - **Environment Variable:** `repo_tag_delete`
  - **Payload:** Similar to GitHub Delete Event, but specifically for tags.

- `/api/repo/fork`
  - **Description:** Triggered when a repository is forked.
  - **Environment Variable:** `repo_fork`
  - **Payload:** [GitHub Fork Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#fork)

- `/api/repo/release/publish`
  - **Description:** Triggered when a release is published.
  - **Environment Variable:** `repo_release_publish`
  - **Payload:** [GitHub Release Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#release)

- `/api/repo/release/update`
  - **Description:** Triggered when a release is updated.
  - **Environment Variable:** `repo_release_update`
  - **Payload:** [GitHub Release Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#release)

- `/api/repo/release/delete`
  - **Description:** Triggered when a release is deleted.
  - **Environment Variable:** `repo_release_delete`
  - **Payload:** [GitHub Release Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#release)

#### Issue Events

These endpoints handle various issue-related events. The `X-GitHub-Event` header should be `issues`, and the `action` field in the JSON payload determines the specific event.

```http
  POST /api/issues/{event_type}
```

##### Endpoints:

- `/api/issues/open`
  - **Description:** Triggered when an issue is opened.
  - **Expected `action`:** `opened`
  - **Environment Variable:** `issues_open`
  - **Payload:** [GitHub Issues Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#issues)

- `/api/issues/close`
  - **Description:** Triggered when an issue is closed.
  - **Expected `action`:** `closed`
  - **Environment Variable:** `issues_close`
  - **Payload:** [GitHub Issues Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#issues)

- `/api/issues/reopen`
  - **Description:** Triggered when an issue is reopened.
  - **Expected `action`:** `reopened`
  - **Environment Variable:** `issues_reopen`
  - **Payload:** [GitHub Issues Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#issues)

- `/api/issues/update`
  - **Description:** Triggered when an issue is edited.
  - **Expected `action`:** `edited`
  - **Environment Variable:** `issues_update`
  - **Payload:** [GitHub Issues Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#issues)

- `/api/issues/label/clear`
  - **Description:** Triggered when all labels are removed from an issue.
  - **Expected `action`:** `unlabeled` (when all labels are removed)
  - **Environment Variable:** `issues_label_clear`
  - **Payload:** [GitHub Issues Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#issues)

- `/api/issues/label/update`
  - **Description:** Triggered when a label is added or removed from an issue.
  - **Expected `action`:** `labeled` or `unlabeled` (when a single label is added/removed)
  - **Environment Variable:** `issues_label_update`
  - **Payload:** [GitHub Issues Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#issues)

- `/api/issues/comment/create`
  - **Description:** Triggered when a comment is created on an issue.
  - **Expected `action`:** `created` (within the `comment` object of the payload)
  - **Environment Variable:** `issues_comment_create`
  - **Payload:** [GitHub Issue Comment Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#issue_comment)

- `/api/issues/comment/update`
  - **Description:** Triggered when a comment on an issue is edited.
  - **Expected `action`:** `edited` (within the `comment` object of the payload)
  - **Environment Variable:** `issues_comment_update`
  - **Payload:** [GitHub Issue Comment Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#issue_comment)

- `/api/issues/comment/delete`
  - **Description:** Triggered when a comment on an issue is deleted.
  - **Expected `action`:** `deleted` (within the `comment` object of the payload)
  - **Environment Variable:** `issues_comment_delete`
  - **Payload:** [GitHub Issue Comment Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#issue_comment)

- `/api/issues/assign`
  - **Description:** Triggered when an issue is assigned.
  - **Expected `action`:** `assigned`
  - **Environment Variable:** `issues_assign`
  - **Payload:** [GitHub Issues Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#issues)

- `/api/issues/unassign`
  - **Description:** Triggered when an issue is unassigned.
  - **Expected `action`:** `unassigned`
  - **Environment Variable:** `issues_unassign`
  - **Payload:** [GitHub Issues Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#issues)

- `/api/issues/milestone`
  - **Description:** Triggered when an issue is added to a milestone.
  - **Expected `action`:** `milestoned`
  - **Environment Variable:** `issues_milestone`
  - **Payload:** [GitHub Issues Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#issues)

- `/api/issues/demilestone`
  - **Description:** Triggered when an issue is removed from a milestone.
  - **Expected `action`:** `demilestoned`
  - **Environment Variable:** `issues_demilestone`
  - **Payload:** [GitHub Issues Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#issues)

#### Pull Request Events

These endpoints handle various pull request-related events. The `X-GitHub-Event` header should be `pull_request` (or `pull_request_review`, `pull_request_review_comment`), and the `action` field in the JSON payload determines the specific event. Currently, all pull request events are routed through a single endpoint.

```http
  POST /api/pull
```

##### Endpoints:

- `/api/pull`
  - **Description:** Handles all pull request related events (e.g., open, close, review, comment).
  - **Environment Variable:** `pull_request_event`
  - **Payload:** [GitHub Pull Request Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request), [GitHub Pull Request Review Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request_review), [GitHub Pull Request Review Comment Event](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request_review_comment)

## Code Overview

This section provides a brief overview of key internal files and functions for developers looking to contribute or understand the codebase more deeply.

### `app.ts`
- `rawBodySaver(req: Request, res: Response, buf: Buffer, encoding: BufferEncoding)`: A middleware function used to save the raw body of incoming requests. This is crucial for signature verification, as the signature is calculated based on the raw payload.

### `bin/www.ts`
- `normalizePort(val: string): number | string | boolean`: Parses a port value into a number, string, or boolean.
- `onError(error: NodeJS.ErrnoException): void`: Event listener for HTTP server "error" event. Provides user-friendly error messages.
- `onListening(): void`: Event listener for HTTP server "listening" event. Logs that the server is running and on which port.

### `routes/signatureVerify.ts`
- `VerifySignature(req: Request, res: Response, next: NextFunction): void`: Middleware function to verify the `X-Hub-Signature` header of incoming webhooks. This ensures that the webhook payload genuinely originated from the configured Git platform and has not been tampered with.

## Development Status
- ⌛ Pending: Feature is planned or under development.
- ☑️ Done: Feature is implemented and tested.

## Contributing

Contributions are always welcome! To contribute, please follow these steps:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix (e.g., `feature/my-new-feature` or `bugfix/fix-issue-123`).
3.  **Make your changes**, ensuring they adhere to the existing coding style and conventions.
4.  **Write clear and concise commit messages.**
5.  **Test your changes thoroughly.** Before opening a pull request, run the same checks CI runs:
    ```bash
    yarn format:check   # or `yarn format` to fix
    yarn lint
    yarn typecheck
    yarn test
    ```
    Every pull request runs these on Linux, Windows and macOS with Node 22, 24 and 26, plus a build and smoke test of the packaged binary.
6.  **Update documentation** as necessary to reflect your changes.
7.  **Open a pull request** to the `master` branch, providing a detailed description of your changes.

## Authors

- [@Kos-M](https://www.github.com/Kos-M)

## License

[MIT](https://choosealicense.com/licenses/mit/)
