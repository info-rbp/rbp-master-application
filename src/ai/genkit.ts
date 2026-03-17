import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI()
  ],
  model: process.env.GENKIT_MODEL_NAME || 'googleai/gemini-1.5-flash',
});
