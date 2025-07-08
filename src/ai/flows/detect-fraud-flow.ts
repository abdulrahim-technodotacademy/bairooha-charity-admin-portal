'use server';
/**
 * @fileOverview An AI flow for detecting suspicious donation patterns.
 *
 * - detectFraud - A function that analyzes a donor's transactions for fraud.
 * - DetectFraudInput - The input type for the detectFraud function.
 * - DetectFraudOutput - The return type for the detectFraud function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const TransactionSchema = z.object({
  amount: z.number(),
  date: z.string(),
  mode: z.string(),
});

const DetectFraudInputSchema = z.object({
  donorName: z.string().describe("The name of the donor being analyzed."),
  transactions: z.array(TransactionSchema).describe("A list of transactions for the donor."),
});
export type DetectFraudInput = z.infer<typeof DetectFraudInputSchema>;

const DetectFraudOutputSchema = z.object({
  isSuspicious: z.boolean().describe('Whether the activity is suspicious.'),
  reason: z.string().describe('A brief explanation for why the activity is or is not considered suspicious.'),
});
export type DetectFraudOutput = z.infer<typeof DetectFraudOutputSchema>;

export async function detectFraud(input: DetectFraudInput): Promise<DetectFraudOutput> {
  return detectFraudFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectFraudPrompt',
  input: {schema: DetectFraudInputSchema},
  output: {schema: DetectFraudOutputSchema},
  prompt: `You are an AI fraud detection expert for a charity platform called Bairooha Foundation.
Your task is to analyze a donor's transaction history for suspicious patterns.

Consider the following as potential red flags:
- Multiple small, rapid-fire donations in a short period (e.g., testing stolen credit cards).
- An unusually large donation that is significantly different from their past behavior.
- Donations made with a 'Refund' mode immediately following other transactions.
- Any other patterns that seem anomalous or designed to test financial systems.

Donor Name: {{{donorName}}}

Transaction History:
{{#each transactions}}
- Date: {{date}}, Amount: ₹{{amount}}, Mode: {{mode}}
{{/each}}

Based on your analysis, determine if the activity is suspicious.
- If it is suspicious, set isSuspicious to true and provide a clear, concise reason.
- If it is not suspicious, set isSuspicious to false and state "No suspicious activity detected."
`,
});

const detectFraudFlow = ai.defineFlow(
  {
    name: 'detectFraudFlow',
    inputSchema: DetectFraudInputSchema,
    outputSchema: DetectFraudOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);

    if (!output) {
      throw new Error("The AI model failed to generate a valid fraud analysis.");
    }

    return output;
  }
);
