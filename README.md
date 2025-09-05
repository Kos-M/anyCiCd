# anyCiCd

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
   For each repository event, you can define an environment variable pointing to a shell script that will be executed when the corresponding webhook is received. The full JSON payload of the webhook will be passed as the first argument to your script.

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

These endpoints handle various repository-related events. The full webhook payload is passed as an argument to the configured script.

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


## Development Status
- ⌛ Pending: Feature is planned or under development.
- ☑️ Done: Feature is implemented and tested.










## Authors

- [@Kos-M](https://www.github.com/Kos-M)


## License

[MIT](https://choosealicense.com/licenses/mit/)


## Contributing

Contributions are always welcome!




