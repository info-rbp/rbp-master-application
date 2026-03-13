import { NextRequest, NextResponse } from 'next/server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { generateDocumentDescription } from '@/ai/flows/generate-document-description.ts';

// 1. Initialize the MCP Server
const server = new Server(
  {
    name: 'rbp-master-application-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 2. Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate_document_description',
        description: 'Generates a description for a document based on its title and content snippet.',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'The title of the document' },
            snippet: { type: 'string', description: 'A snippet of the document content' },
          },
          required: ['title'],
        },
      },
    ],
  };
});

// 3. Handle tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'generate_document_description') {
    const { title, snippet } = request.params.arguments as any;
    try {
      const result = await generateDocumentDescription({ title, snippet });
      return {
        content: [{ type: 'text', text: result || 'Failed to generate description.' }],
      };
    } catch (error) {
       return {
        content: [{ type: 'text', text: `Error generating description: ${error}` }],
        isError: true
      };
    }
  }
  throw new Error(`Tool not found: ${request.params.name}`);
});

let transport: SSEServerTransport | null = null;

// Helper to check for a custom secret header instead of OAuth Authorization
function isAuthenticated(req: NextRequest) {
  // We use a custom header X-API-Key to avoid ChatGPT's OAuth checks
  const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('key');
  return apiKey === process.env.MCP_API_KEY;
}

export async function GET(req: NextRequest) {
  // If no API key is set in the environment, we assume it's public for now to test the connection.
  if (process.env.MCP_API_KEY && !isAuthenticated(req)) {
     return new NextResponse('Unauthorized: Missing or invalid X-API-Key header or ?key parameter', { status: 401 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const mockRes = {
    write: (chunk: string) => { writer.write(new TextEncoder().encode(chunk)); },
    end: () => { writer.close(); },
    setHeader: () => {},
    on: () => {},
  } as any;

  transport = new SSEServerTransport('/api/mcp', mockRes);
  await server.connect(transport);

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(req: NextRequest) {
  if (process.env.MCP_API_KEY && !isAuthenticated(req)) {
     return new NextResponse('Unauthorized: Missing or invalid X-API-Key header or ?key parameter', { status: 401 });
  }

  if (!transport) {
    return new NextResponse('SSE transport not initialized. Connect to GET /api/mcp first.', { status: 400 });
  }

  const body = await req.json();
  const mockReq = { body } as any;

  let statusCode = 200;
  const mockRes = {
    status: (code: number) => { statusCode = code; return mockRes; },
    send: () => {},
    end: () => {},
  } as any;

  await transport.handlePostMessage(mockReq, mockRes);

  return new NextResponse('Accepted', { status: statusCode });
}
