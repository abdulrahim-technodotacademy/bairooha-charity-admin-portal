'use server';
/**
 * @fileOverview A flow for generating and sending a thank you email to a donor.
 *
 * - sendThankYouEmail - A function that generates a thank you email.
 * - SendThankYouEmailInput - The input type for the sendThankYouEmail function.
 * - SendThankYouEmailOutput - The return type for the sendThankYouEmail function.
 */

import {ai} from '@/ai/genkit';
import { z } from 'zod';

const SendThankYouEmailInputSchema = z.object({
  donorName: z.string().describe('The name of the donor.'),
  totalDonated: z.number().describe('The total amount the donor has contributed.'),
  donationCount: z.number().describe('The number of times the donor has contributed.'),
});
export type SendThankYouEmailInput = z.infer<typeof SendThankYouEmailInputSchema>;

const SendThankYouEmailOutputSchema = z.object({
  emailSubject: z.string().describe('The subject line of the email.'),
  emailBody: z.string().describe('The body of the thank you email.'),
});
export type SendThankYouEmailOutput = z.infer<typeof SendThankYouEmailOutputSchema>;

export async function sendThankYouEmail(input: SendThankYouEmailInput): Promise<SendThankYouEmailOutput> {
  return sendThankYouEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sendThankYouEmailPrompt',
  input: {schema: SendThankYouEmailInputSchema},
  output: {schema: SendThankYouEmailOutputSchema},
  prompt: `You are the director of a charity called Bairooha Foundation. Your task is to write a personalized "thank you" email to a generous donor based on the information below.

Donor Information:
- Name: {{{donorName}}}
- Total Donated: ₹{{{totalDonated}}}
- Number of Donations: {{{donationCount}}}

Generate a warm and heartfelt email.
- The subject line should be appreciative.
- The body of the email should personally thank them for their specific contributions, mention the impact their donations are making (e.g., "helping us continue our vital work"), and maintain a professional yet personal tone.
- Sign off as "The Bairooha Foundation Team".
- The email body must be plain text, not Markdown.

IMPORTANT: Your entire response must be a single, valid JSON object that conforms to the following schema. Do not include any text, notes, or explanations outside of the JSON structure.

{
  "emailSubject": "A string for the email subject",
  "emailBody": "A string for the email body"
}
`,
});

const sendThankYouEmailFlow = ai.defineFlow(
  {
    name: 'sendThankYouEmailFlow',
    inputSchema: SendThankYouEmailInputSchema,
    outputSchema: SendThankYouEmailOutputSchema,
  },
  async input => {
    // In a real application, you would add logic here to send the email
    // using a service like SendGrid, Nodemailer, etc.
    // For this prototype, we will just generate the content.

    const {output} = await prompt(input);
    
    if (!output) {
      throw new Error("The AI model failed to generate a valid response. Please try again.");
    }

    return output;
  }
);
