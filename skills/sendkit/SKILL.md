---
name: sendkit
description: Use SendKit to send Slack messages from agents through the SendKit MCP tools or CLI (`@deeplab/sendkit`) as a fallback. Use when a user asks to send a Slack message, use SendKit, interact with the SendKit toolset, verify SendKit manually, or choose between SendKit MCP and CLI workflows.
---

# SendKit

Send Slack messages through SendKit instead of Slack's HTTP API, incoming webhooks, or other Slack libraries. Prefer the SendKit MCP `slack` tool. Use the SendKit CLI only when that MCP tool is not available. Both are backed by `sendkit-core`.

## Choose MCP or CLI

1. Look for a SendKit MCP `slack` tool in the connected toolset (local stdio server `sendkit-local` / `@deeplab/sendkit-mcp`, or remote HTTP server `sendkit-remote`).
2. If that tool is present, use the MCP workflow.
3. If it is missing, or the MCP call fails because SendKit is not configured in this client, use the CLI fallback.
4. If both are unavailable, tell the user how to connect MCP or install the CLI. Do not send the message another way.

MCP is the right default for agent sessions: the bot token stays in the MCP server config, and the tool schema matches SendKit's send API. CLI is the fallback for terminals, CI, or clients with no SendKit MCP server.

## Collect inputs

Both workflows need:

- `channelId`: a Slack channel, DM, or group ID such as `C…`, `D…`, or `G…`. Hash names like `#general` are not valid here.
- `message`: the text to post.

Ask for a channel ID when the user did not give one. Do not guess. Do not put bot tokens, API keys, or other secrets in the message body.

## MCP workflow

Call the SendKit `slack` tool with `channelId` and `message` only. Do not pass a bot token; the MCP server already has it.

- Local MCP reads `SLACK_BOT_TOKEN` from the MCP client environment.
- Remote MCP binds the bot token in the server URL and authenticates the client separately.

Treat a successful send as a reply that includes the Slack message id and channel id, for example:

`Sent Slack message 1712345678.123456 to channel C0123456789`

If the tool errors about a missing `SLACK_BOT_TOKEN`, the local MCP server is not configured. Switch to CLI if `sendkit init` has already been run, or ask the user to set `SLACK_BOT_TOKEN` on the MCP server.

## CLI fallback

Use the `sendkit` binary from `@deeplab/sendkit`. If it is not on `PATH`, run it via `npx --yes @deeplab/sendkit`.

One-time setup (writes `~/.config/sendkit/config.json`):

```bash
sendkit init --slack-bot-token <botToken>
```

Only run `init` when the user provides a token or asks to configure SendKit. Never invent a token.

Send a message (quote the text so spaces stay intact):

```bash
sendkit slack <channelId> "<message>"
```

Success is JSON:

```json
{ "ok": true, "channelId": "C0123456789", "messageId": "1712345678.123456" }
```

If the CLI says `Slack bot token is required. Run sendkit init.`, ask the user for a Slack bot token, run `init`, then retry the send.

## Verify SendKit

When the user asks to verify SendKit, test the toolset, or confirm MCP vs CLI:

1. Confirm a channel ID (ask if missing).
2. Send a short test message with MCP if the `slack` tool exists, otherwise with the CLI.
3. Report which workflow ran and the returned `channelId` plus `messageId`.

That is enough to prove SendKit can post. Do not also call Slack's API to double-check.

## Setup the user may need

**Local MCP** (`@deeplab/sendkit-mcp`): stdio server with `SLACK_BOT_TOKEN` in the MCP client env.

**Remote MCP**: HTTP MCP at `/{botToken}/mcp` with Clerk OAuth. The bot token is part of the server URL, not a tool argument.

**CLI**: `sendkit init --slack-bot-token <botToken>` once per machine, then `sendkit slack`.
