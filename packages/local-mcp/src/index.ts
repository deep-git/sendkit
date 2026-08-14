import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { sendSlackMessage, slackMessageInputSchema } from "sendkit-core";

const server = new McpServer({
  name: "sendkit-local",
  version: "0.0.0",
});

function getSlackBotToken() {
  const token = process.env.SLACK_BOT_TOKEN;

  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is required. Configue it in your MCP client environment.");
  }

  return token;
}

server.registerTool(
  "slack",
  {
    title: "Slack",
    description: "Send a Slack message.",
    inputSchema: slackMessageInputSchema.shape,
  },
  async (input) => {
    const result = await sendSlackMessage({
      ...input,
      botToken: getSlackBotToken(),
    });

    return {
      content: [
        {
          type: "text",
          text: `Sent Slack message ${result.messageId} to channel ${result.channelId}`,
        },
      ],
      structureContent: result,
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
