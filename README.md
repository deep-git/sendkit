# SendKit

Send Slack messages from AI agents, scripts, and CI — through MCP or a CLI.

[![npm](https://img.shields.io/npm/v/@deeplab/sendkit.svg)](https://www.npmjs.com/package/@deeplab/sendkit)
[![mcp](https://img.shields.io/npm/v/@deeplab/sendkit-mcp.svg?label=mcp)](https://www.npmjs.com/package/@deeplab/sendkit-mcp)
[![core](https://img.shields.io/npm/v/@deeplab/sendkit-core.svg?label=core)](https://www.npmjs.com/package/@deeplab/sendkit-core)

SendKit is a small TypeScript toolkit for posting to Slack. Agents and scripts call a `slack` tool with a channel ID and a message; the **bot token stays in config**, not in the prompt. CLI, local MCP, and remote MCP all share one core that wraps Slack's [`chat.postMessage`](https://api.slack.com/methods/chat.postMessage) API.

## Features

- **CLI** — `sendkit init` once, then `sendkit slack` from a terminal or CI
- **Local MCP** — stdio server for Cursor, Claude Desktop, and other MCP clients
- **Remote MCP** — HTTP server with Clerk OAuth, so the token never lives in the client
- **Shared core** — one `sendSlackMessage` implementation behind every surface
- **Agent skill** — teaches coding agents to prefer SendKit over raw Slack APIs
- **Channel IDs only** — `C…` / `D…` / `G…`, so agents don't guess `#channel` names

## Installation

**CLI**

```bash
npm install -g @deeplab/sendkit
```

Or run without installing:

```bash
npx @deeplab/sendkit --help
```

**Local MCP**

```bash
npm install -g @deeplab/sendkit-mcp
```

Most MCP clients can launch it with `npx` or `bunx` instead of a global install (see [Local MCP](#local-mcp)).

**Library**

```bash
npm install @deeplab/sendkit-core
```

Requires Node.js 20+ (or [Bun](https://bun.sh) 1.3+).

## Slack bot setup

SendKit needs a Slack bot token (`xoxb-…`).

1. Create an app at [api.slack.com/apps](https://api.slack.com/apps).
2. Under **OAuth & Permissions**, add the bot scope `chat:write`. Add `chat:write.public` if you want to post to public channels without joining them.
3. Install the app to your workspace and copy the **Bot User OAuth Token**.
4. Invite the bot into any private channel it should post to (`/invite @YourBot`).
5. Copy the **channel ID** (channel details → copy ID). Hash names like `#general` are not valid.

Keep the token out of git, chat, and tool arguments.

## Quick start

```bash
sendkit init --slack-bot-token xoxb-your-bot-token
sendkit slack C0123456789 "Hello from SendKit"
```

On success the CLI prints JSON:

```json
{ "ok": true, "channelId": "C0123456789", "messageId": "1712345678.123456" }
```

## CLI

The CLI stores the token in `~/.config/sendkit/config.json` (file mode `0600`). It does not read `SLACK_BOT_TOKEN` from the environment.

```bash
sendkit init --slack-bot-token <botToken>
sendkit slack <channelId> "<message>"
```

| Command | Description |
| --- | --- |
| `sendkit init --slack-bot-token <token>` | Write the local config file |
| `sendkit slack <channelId> <message>` | Post a message and print `{ ok, channelId, messageId }` |

Quote the message so spaces stay intact. If the config file is missing, the CLI exits with `Slack bot token is required. Run sendkit init.`

## MCP

Prefer MCP in agent sessions: the client only passes `channelId` and `message`. A successful send looks like:

```
Sent Slack message 1712345678.123456 to channel C0123456789
```

### Local MCP

[`@deeplab/sendkit-mcp`](https://www.npmjs.com/package/@deeplab/sendkit-mcp) is a stdio MCP server named `sendkit-local`. It reads `SLACK_BOT_TOKEN` from the MCP client environment.

**Cursor** (`.cursor/mcp.json` or the user MCP config):

```json
{
  "mcpServers": {
    "sendkit": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@deeplab/sendkit-mcp"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-bot-token"
      }
    }
  }
}
```

With Bun, use `"command": "bunx"` and the same args. Restart the MCP client after changing the config.

The registered tool is `slack`:

| Argument | Type | Description |
| --- | --- | --- |
| `channelId` | string | Slack channel, DM, or group ID (`C…`, `D…`, `G…`) |
| `message` | string | Text to post |

Do not pass a bot token to the tool.

### Remote MCP

`apps/remote-mcp` is an HTTP MCP server (`sendkit-remote`) for hosted setups. The Slack bot token is part of the URL, not a tool argument. Clients authenticate with **Clerk OAuth**.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/:botToken/mcp` | Streamable HTTP MCP endpoint |
| `GET` | `/.well-known/oauth-protected-resource/:botToken/mcp` | OAuth protected-resource metadata |

Unauthenticated requests receive `401` with a `WWW-Authenticate` header pointing at that metadata URL.

**Environment**

| Variable | Required | Description |
| --- | --- | --- |
| `CLERK_PUBLISHABLE_KEY` | yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | yes | Clerk secret key |
| `PORT` | no | Listen port (default `3000`) |

Copy `.env.example` and fill in the Clerk keys. Serve this over HTTPS; the bot token is in the path.

**Run locally**

```bash
bun install
bun run dev:remote-mcp
```

Then point an MCP client at `http://localhost:3000/<url-encoded-bot-token>/mcp`.

**Deploy**

The app ships a `Dockerfile` and `railway.toml` under `apps/remote-mcp`. Set `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in the host environment. Build context is that directory:

```bash
docker build -t sendkit-remote-mcp ./apps/remote-mcp
```

## Agent skill

[`skills/sendkit`](./skills/sendkit/SKILL.md) tells coding agents to send Slack messages through SendKit (MCP first, CLI as fallback) instead of Slack's HTTP API, incoming webhooks, or other Slack libraries.

Copy it into your agent's skills directory:

```bash
cp -r skills/sendkit ~/.agents/skills/sendkit
```

Agents should ask for a channel ID when the user did not provide one, and should never put secrets in the message body.

## Library

```ts
import { sendSlackMessage } from "@deeplab/sendkit-core";

const result = await sendSlackMessage({
  botToken: process.env.SLACK_BOT_TOKEN!,
  channelId: "C0123456789",
  message: "Hello from SendKit",
});

// { ok: true, channelId: "C0123456789", messageId: "1712345678.123456" }
```

Invalid input fails Zod validation. Slack API failures throw `Slack message request failed: <error>`.

## Packages

```
sendkit/
├── apps/remote-mcp/      # HTTP MCP server (private, Clerk OAuth)
├── packages/cli/         # @deeplab/sendkit
├── packages/core/        # @deeplab/sendkit-core
├── packages/local-mcp/   # @deeplab/sendkit-mcp
└── skills/sendkit/       # agent skill
```

```mermaid
flowchart LR
  CLI["CLI<br/>@deeplab/sendkit"] --> Core["sendkit-core"]
  Local["Local MCP<br/>@deeplab/sendkit-mcp"] --> Core
  Remote["Remote MCP<br/>sendkit-remote"] --> Core
  Core --> Slack["Slack chat.postMessage"]
```

| Package | npm | Role |
| --- | --- | --- |
| [`@deeplab/sendkit-core`](https://www.npmjs.com/package/@deeplab/sendkit-core) | public | Shared send + schemas |
| [`@deeplab/sendkit`](https://www.npmjs.com/package/@deeplab/sendkit) | public | CLI |
| [`@deeplab/sendkit-mcp`](https://www.npmjs.com/package/@deeplab/sendkit-mcp) | public | Local stdio MCP server |
| `sendkit-remote-mcp` | private | Remote HTTP MCP server |

## Development

This is a [Bun](https://bun.sh) workspace. Package manager is pinned in `package.json` (`bun@1.3.14`).

```bash
bun install
```

| Script | Description |
| --- | --- |
| `bun run dev:cli` | Run the CLI from source |
| `bun run dev:local-mcp` | Run the local MCP server from source |
| `bun run dev:remote-mcp` | Run the remote MCP server from source |
| `bun run build:core` | Build `@deeplab/sendkit-core` |
| `bun run build:cli` | Build `@deeplab/sendkit` |
| `bun run build:local-mcp` | Build `@deeplab/sendkit-mcp` |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | Oxlint (warnings denied) |
| `bun run format` | Format with Oxfmt |

Pass CLI args after `--`:

```bash
bun run dev:cli -- slack C0123456789 "Hello from source"
```

## Troubleshooting

**`Slack bot token is required. Run sendkit init.`**  
Run `sendkit init --slack-bot-token <token>` before `sendkit slack`. The CLI does not use `SLACK_BOT_TOKEN`.

**Local MCP errors about `SLACK_BOT_TOKEN`**  
Set the variable on the MCP server entry in your client config, then restart the client. It is not read from the CLI config file.

**`channel_not_found` / `not_in_channel`**  
Use a channel ID (`C…`), not `#name`. Invite the bot into private channels.

**MCP `slack` tool is missing**  
Confirm the server is connected in the client. If MCP is unavailable, use the CLI. Don't fall back to Slack's HTTP API or other libraries.

## License

This repository does not include a license file yet.
