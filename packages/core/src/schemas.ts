import { z } from "zod";

export const slackMessageInputSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
  message: z.string().min(1, "Message is required"),
});

export const slackMessageOptionsSchema = slackMessageInputSchema.extend({
  botToken: z.string().min(1, "Slack bot token is required"),
});

export const slackSendMessageRequestSchema = z.object({
  channel: z.string().min(1),
  text: z.string().min(1),
});

export const slackSendMessageResponseSchema = z.object({
  ok: z.boolean(),
  result: z
    .object({
      message_id: z.number().optional(),
    })
    .optional(),
  description: z.string().optional(),
});

export const slackMessageOutputSchema = z.object({
  ok: z.literal(true),
  channelId: z.string(),
  messageId: z.number(),
});

export type SlackMessageInput = z.infer<typeof slackMessageInputSchema>;
export type SlackMessageOptions = z.infer<typeof slackMessageOptionsSchema>;
export type SlackMessageOutput = z.infer<typeof slackMessageOutputSchema>;
