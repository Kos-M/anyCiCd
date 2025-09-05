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

All API endpoints expect `POST` requests with a JSON payload and require signature verification using the `X-Hub-Signature` header.

#### Repository Events

```http
  POST /api/repo
```

##### Repository ☑️
- `/api/repo/push`
- `/api/repo/create`
- `/api/repo/delete`

##### Repository Branch/Tag ☑️
- `/api/repo/branch/create`
- `/api/repo/branch/delete`
- `/api/repo/tag/create`
- `/api/repo/tag/delete`

##### Repository Fork  ☑️
- `/api/repo/fork`
##### Repository Release  ☑️
- `/api/repo/release/publish`
- `/api/repo/release/update`
- `/api/repo/release/delete`

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
- ⌛ Pending
- ☑️ Done










## Authors

- [@Kos-M](https://www.github.com/Kos-M)


## License

[MIT](https://choosealicense.com/licenses/mit/)


## Contributing

Contributions are always welcome!




