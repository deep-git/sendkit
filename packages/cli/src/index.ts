import { Command } from "commander";
import { sendSlackMessage } from "sendkit-core";

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

    try {
      const result = await sendSlackMessage({
        botToken: token,
        channelId,
        message,
      });

      console.log(`Sent Slack message to channel ${result.channelId}.`);
      console.log(`Slack message ID: ${result.messageId}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error(`Slack API request failed: ${detail}`);
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
