'use server';
/**
 * @fileOverview A Genkit flow for generating concise and informative descriptions for documents.
 *
 * - generateDocumentDescription - A function that handles the document description generation process.
 * - GenerateDocumentDescriptionInput - The input type for the generateDocumentDescription function.
 * - GenerateDocumentDescriptionOutput - The return type for the generateDocumentDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const GenerateDocumentDescriptionInputSchema = z.object({
  documentTitle: z.string().optional().describe('The title of the document, if available.'),
  documentDataUri: z.string().describe("The document content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type GenerateDocumentDescriptionInput = z.infer<typeof GenerateDocumentDescriptionInputSchema>;

// Output Schema
const GenerateDocumentDescriptionOutputSchema = z.string().describe('A concise and informative description of the document.');
export type GenerateDocumentDescriptionOutput = z.infer<typeof GenerateDocumentDescriptionOutputSchema>;

// Wrapper function to call the flow
export async function generateDocumentDescription(input: GenerateDocumentDescriptionInput): Promise<GenerateDocumentDescriptionOutput> {
  return generateDocumentDescriptionFlow(input);
}

// Define the prompt
const generateDocumentDescriptionPrompt = ai.definePrompt({
  name: 'generateDocumentDescriptionPrompt',
  input: {schema: GenerateDocumentDescriptionInputSchema},
  output: {schema: GenerateDocumentDescriptionOutputSchema},
  prompt: `You are an AI assistant specialized in summarizing documents concisely and informatively. Your goal is to provide a brief overview that helps users understand the document's content and purpose without reading the full document.

Generate a concise and informative description for the following document.
{{#if documentTitle}}
The document is titled: '{{{documentTitle}}}'.
{{/if}}
Document content: {{media url=documentDataUri}}

Provide only the description, without any conversational filler or extra formatting. The description should be suitable for display in a list of documents.`,
});

// Define the flow
const generateDocumentDescriptionFlow = ai.defineFlow(
  {
    name: 'generateDocumentDescriptionFlow',
    inputSchema: GenerateDocumentDescriptionInputSchema,
    outputSchema: GenerateDocumentDescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await generateDocumentDescriptionPrompt(input);
    return output!;
  }
);
