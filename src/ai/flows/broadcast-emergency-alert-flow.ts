'use server';
/**
 * @fileOverview A flow for broadcasting emergency campaign alerts.
 *
 * - broadcastEmergencyAlert - Generates content for emergency notifications.
 * - BroadcastEmergencyAlertInput - The input type for the function.
 * - BroadcastEmergencyAlertOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const BroadcastEmergencyAlertInputSchema = z.object({
  campaignName: z.string().describe('The name of the emergency campaign.'),
  description: z.string().describe('A brief description of the emergency and the campaign goal.'),
  goal: z.number().describe('The fundraising goal for the campaign.'),
  message: z.string().describe('A custom message from the admin to include in the alerts.'),
});
export type BroadcastEmergencyAlertInput = z.infer<typeof BroadcastEmergencyAlertInputSchema>;

const BroadcastEmergencyAlertOutputSchema = z.object({
  pushNotification: z.string().describe('A very short, urgent push notification message (max 150 characters).'),
  emailSubject: z.string().describe('A compelling subject line for the emergency email alert.'),
  emailBody: z.string().describe('A detailed but concise email body. It should explain the situation, mention the goal, include the admin\'s message, and have a clear call to action. Use plain text.'),
  smsMessage: z.string().describe('A short SMS message (max 160 characters) with a call to action.'),
});
export type BroadcastEmergencyAlertOutput = z.infer<typeof BroadcastEmergencyAlertOutputSchema>;

export async function broadcastEmergencyAlert(input: BroadcastEmergencyAlertInput): Promise<BroadcastEmergencyAlertOutput> {
  return broadcastEmergencyAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'broadcastEmergencyAlertPrompt',
  input: {schema: BroadcastEmergencyAlertInputSchema},
  output: {schema: BroadcastEmergencyAlertOutputSchema},
  prompt: `You are an emergency response coordinator for a charity, Bairooha Foundation.
Your task is to generate urgent and effective alert messages for a new emergency donation campaign.

The campaign details are as follows:
- Campaign Name: {{{campaignName}}}
- Description: {{{description}}}
- Fundraising Goal: ₹{{{goal}}}
- Custom Message from Admin: {{{message}}}

Based on this information, generate the following content:
1.  **Push Notification:** A very short, attention-grabbing message for a mobile push notification. Max 150 characters.
2.  **Email Subject:** An urgent and compelling email subject line.
3.  **Email Body:** A clear and persuasive email body. It must include the admin's custom message. The tone should be serious and empathetic. Explain the need and the goal. Sign off as "The Bairooha Foundation Team".
4.  **SMS Message:** A concise SMS message for a text alert. Max 160 characters. It must contain a call to action.

Your entire response must be a single, valid JSON object that conforms to the output schema.
`,
});

const broadcastEmergencyAlertFlow = ai.defineFlow(
  {
    name: 'broadcastEmergencyAlertFlow',
    inputSchema: BroadcastEmergencyAlertInputSchema,
    outputSchema: BroadcastEmergencyAlertOutputSchema,
  },
  async (input) => {
    // In a real-world scenario, this flow would trigger services
    // for sending emails, push notifications, and SMS messages.
    // For this prototype, we just generate the content.
    const {output} = await prompt(input);

    if (!output) {
      throw new Error("The AI model failed to generate a valid alert broadcast.");
    }
    
    return output;
  }
);
