'use server';
/**
 * @fileOverview A flow for handling user chat interactions.
 *
 * - chat - A function that generates a response to a user's message.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema),
  message: z.string().describe('The latest message from the user.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the user.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {schema: ChatInputSchema},
  output: {schema: ChatOutputSchema},
  prompt: `You are a helpful admin assistant for a charity platform called Bairooha Foundation.
Your goal is to assist users with their questions about the platform, donations, projects, or any other issues they might be facing.
Be friendly, helpful, and concise in your responses.

Here is the conversation history:
{{#each history}}
- {{role}}: {{content}}
{{/each}}

Here is the new message from the user:
- user: {{{message}}}

Generate a helpful response as the model.`,
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);

    if (!output) {
      throw new Error("The AI model failed to generate a valid response.");
    }
    
    return output;
  }
);
