import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import mcp from '@genkit-ai/mcp';

export const ai = genkit({
  plugins: [
    googleAI(),
    // This connects Genkit to a local MCP server
    mcp.client({
      name: 'my-mcp-server',
      client: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-everything'],
      },
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
