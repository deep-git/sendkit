import { Command } from "commander";
import { z } from "zod";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { sendSlackMessage } from "@deeplab/sendkit-core";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

// Doesn't depend on anyone having an environment variable set for this, instead uses a
// local config file to read the token that was initialized from the
// initial 'sendkit init --slack-bot-token <botToken>' command
const program = new Command();

const configPath = join(homedir(), ".config", "sendkit", "config.json");
const cliConfigSchema = z.object({
  slackBotToken: z.string().min(1).optional(),
});

function writeSlackBotToken(token: string) {
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, `${JSON.stringify({ slackBotToken: token }, null, 2)}\n`, {
    mode: 0o600,
  });
}

function getSlackBotToken() {
  if (!existsSync(configPath)) {
    throw new Error("Slack bot token is required. Run `sendkit init`.");
  }

  const config = cliConfigSchema.parse(JSON.parse(readFileSync(configPath, "utf8")));
  const token = config.slackBotToken;

  if (!token) {
    throw new Error("Slack bot token is required. Run `sendkit init`.");
  }

  return token;
}

program.name("sendkit").description("SendKit CLI backed by sendkit-core");

program
  .command("init")
  .description("Configure SendKit CLI local settings")
  .requiredOption("--slack-bot-token <botToken>", "Slack bot token")
  .action(async (options: { slackBotToken: string }) => {
    writeSlackBotToken(options.slackBotToken);
    console.log(`Saved SendKit CLI config to ${configPath}`);
  });

program
  .command("slack")
  .description("Send a Slack message")
  .argument("<channelId>", "Slack channel ID")
  .argument("<message>", "Message text to send")
  .action(async (channelId: string, message: string) => {
    //argument already validates, so no need to check with "if (!channelId || !message)"

    const result = await sendSlackMessage({
      botToken: getSlackBotToken(),
      channelId,
      message,
    });

    console.log(JSON.stringify(result));
  });

// Proper way of handling commander catching errors instead of try catch block inside of the program action
await program.parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
