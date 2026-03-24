import 'server-only';

import { genkit, type Genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

let aiInstance: Genkit | null = null;

export function getAi(): Genkit {
  if (aiInstance) {
    return aiInstance;
  }

  const apiKey = process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is required to use Genkit flows.');
  }

  aiInstance = genkit({
    plugins: [googleAI({ apiKey })],
    model: process.env.GENKIT_MODEL_NAME || 'googleai/gemini-1.5-flash',
  });

  return aiInstance;
}
