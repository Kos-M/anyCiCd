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

```http
  POST /api/issues
```
##### Issues  ☑️
- `/api/issues/open`
- `/api/issues/close`
- `/api/issues/reopen`
- `/api/issues/update`
##### Issue Labeled ☑️
- `/api/issues/label/clear`
- `/api/issues/label/update`
##### Issue Comment ☑️
- `/api/issues/comment/create`
- `/api/issues/comment/update`
- `/api/issues/comment/delete`
##### Issue Assigned ☑️
- `/api/issues/assign`
- `/api/issues/unassign`
##### Issue Milistoned ☑️
- `/api/issues/milistone`
- `/api/issues/demilistone`


```http
  POST /api/pull
```
##### Pull Request ⌛
- `/api/pull/open`
- `/api/pull/close`
- `/api/pull/reopen`
- `/api/pull/update`
##### Pull Request Labeled ⌛
- `/api/pull/label/update`
- `/api/pull/label/clear`
##### Pull Request Comment ⌛
- `/api/pull/comment/create`
- `/api/pull/comment/delete`
- `/api/pull/comment/update`
##### Pull Request Synchronized ⌛
- `/api/pull/synced`
##### Pull Request Assigned ⌛
- `/api/pull/assign`
- `/api/pull/unassign`
##### Pull Request Milistoned ⌛
- `/api/pull/milistone`
- `/api/pull/demilistone`
##### Pull Request Reviewed ⌛
- `/api/pull/request/approve`
- `/api/pull/request/reject`
- `/api/pull/request/comment`





## Development Status
- ⌛ Pending: Feature is planned or under development.
- ☑️ Done: Feature is implemented and tested.










## Authors

- [@Kos-M](https://www.github.com/Kos-M)


## License

[MIT](https://choosealicense.com/licenses/mit/)


## Contributing

Contributions are always welcome!




