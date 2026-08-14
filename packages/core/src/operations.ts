import {
  slackMessageOutputSchema,
  slackMessageOptionsSchema,
  slackSendMessageRequestSchema,
  slackSendMessageResponseSchema,
  type SlackMessageOptions,
  type SlackMessageOutput,
} from "./schemas";

export async function sendSlackMessage(input: SlackMessageOptions): Promise<SlackMessageOutput> {
  const parsedInput = slackMessageOptionsSchema.parse(input);

  const requestBody = slackSendMessageRequestSchema.parse({
    channel: parsedInput.channelId,
    text: parsedInput.message,
  });

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${parsedInput.botToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(requestBody),
  });

  const data = slackSendMessageResponseSchema.parse(await response.json());

  if (!data.ok || !data.ts) {
    throw new Error(data.error ? `Slack message request failed: ${data.error}` : "Slack message request failed");
  }

  return slackMessageOutputSchema.parse({
    ok: true,
    channelId: data.channel ?? parsedInput.channelId,
    messageId: data.ts,
  });
}
