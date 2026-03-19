import 'server-only';

import { flow } from 'genkit';
import { ai } from './genkit';

export const docShareFlow = flow({ name: 'docShareFlow' }, async (query: string) => {
  const llmResponse = await ai.generate({
    prompt: `You are an expert assistant for a company called Remote Business Partner. Your purpose is to help users find the right documents, templates, and guides from a library called DocShare. A user has asked the following question: "${query}". Based on this, provide a helpful and concise response. Guide them on what they might be able to find in the library. Keep your answer to 2-3 sentences.`,
    model: ai.model,
    temperature: 0.7,
  });

  return llmResponse.text();
});
