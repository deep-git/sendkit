import { Command } from "commander";

type SlackResponse = {
  ok: boolean;
  result?: {
    message_id?: number;
  };
  description?: string;
};

const program = new Command();

program
  .name("sendkit")
  .description("SendKit tutorial CLI")
  .command("slack")
  .description("Send a Slack message")
  .argument("<channelId>", "Slack channel ID")
  .argument("<message>", "Message text to send")
  .action(async (channelId: string, message: string) => {
    const token = process.env.SLACK_BOT_TOKEN;

    if (!token) {
      console.error("Missing SLACK_BOT_TOKEN environment variable");
      process.exit(1);
    }

    if (!channelId) {
      console.error("Missing Slack channel ID.");
      process.exit(1);
    }

    if (!message) {
      console.error("Missing Slack message text.");
      process.exit(1);
    }

    const response = await fetch(`https://slack.com/api/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        channel: channelId,
        text: message,
      }),
    });

    const data = (await response.json()) as SlackResponse;

    if (!response.ok || !data.ok) {
      const detail = data.description ?? response.statusText;
      console.error(`Slack API request failed: ${detail}`);
      process.exit(1);
    }

    const messageId = data.result?.message_id;

    console.log(`Sent Slack message to channel ${channelId}.`);

    if (messageId !== undefined) {
      console.log(`Slack message ID: ${messageId}`);
    }
  });

program.parseAsync(process.argv);
