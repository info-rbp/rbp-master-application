import { NextRequest, NextResponse } from 'next/server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { firestore } from '@/firebase/server';

// Ensure the code behaves as dynamic route handler
export const dynamic = 'force-dynamic';

// 1. Initialize the MCP Server (Shared instance)
const server = new Server(
  {
    name: 'rbp-master-application-mcp-baseline',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 2. Define tools (As provided)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'health_check',
        description: 'Confirms the MCP server is reachable and functioning.',
        inputSchema: { type: 'object', properties: {}, required: [] },
      },
      {
        name: 'read_mcp_test_record',
        description: 'Proves read capability from a safe test location.',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'The key of the test record to read.' },
          },
          required: ['key'],
        },
      },
      {
        name: 'write_mcp_test_record',
        description: 'Proves write capability to a safe test location.',
        inputSchema: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'The key of the test record to write.' },
            value: { type: 'string', description: 'The value to store in the test record.' },
          },
          required: ['key', 'value'],
        },
      },
    ],
  };
});

// 3. Handle tool calls (As provided)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    if (name === 'health_check') {
      return {
        content: [{ type: 'text', text: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString(), message: 'MCP baseline server is reachable.' }) }],
      };
    }
    if (name === 'read_mcp_test_record') {
      const key = args?.key;
      if (!key || typeof key !== 'string' || key.trim() === '') {
        return { content: [{ type: 'text', text: 'Error: key is required and must be a non-empty string.' }], isError: true };
      }
      const docRef = firestore.collection('mcp_test_records').doc(key as string);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return { content: [{ type: 'text', text: JSON.stringify({ exists: false, message: `Record with key '${key}' not found.` }) }] };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ exists: true, data: docSnap.data() }) }],
      };
    }
    if (name === 'write_mcp_test_record') {
      const key = args?.key;
      const value = args?.value;
      if (!key || typeof key !== 'string' || key.trim() === '') {
        return { content: [{ type: 'text', text: 'Error: key is required and must be a non-empty string.' }], isError: true };
      }
      if (value === undefined || typeof value !== 'string') {
        return { content: [{ type: 'text', text: 'Error: value is required and must be a string.' }], isError: true };
      }
      const docRef = firestore.collection('mcp_test_records').doc(key as string);
      const payload = { value, updatedAt: new Date().toISOString(), source: 'mcp' };
      await docRef.set(payload, { merge: true });
      return {
        content: [{ type: 'text', text: JSON.stringify({ status: 'success', key, summary: payload }) }],
      };
    }
    return {
      content: [{ type: 'text', text: `Error: Tool not found: ${name}` }],
      isError: true,
    };
  } catch (error) {
    console.error(`MCP Tool Error (${name}):`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [{ type: 'text', text: `Error executing ${name}: ${errorMessage}` }],
      isError: true,
    };
  }
});

// 4. Initialize Transport with Session ID Generator for stateless requests
const transport = new WebStandardStreamableHTTPServerTransport({
  sessionIdGenerator: () => crypto.randomUUID(),
});
server.connect(transport).catch(console.error);

// 5. Authentication (As provided)
function isAuthenticated(req: NextRequest) {
  const secret = process.env.MCP_API_KEY;
  if (!secret) return false;
  const authHeader = req.headers.get('Authorization');
  if (authHeader === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  if (url.searchParams.get('key') === secret) return true;
  return false;
}

// (Helper) CORS Origin validation
function getValidOrigin(req: NextRequest): string | null {
    const origin = req.headers.get('origin');
    if (!origin) return '*';
    const allowedOriginsStr = process.env.MCP_ALLOWED_ORIGINS || 'https://chatgpt.com,https://chat.openai.com';
    const allowedOrigins = allowedOriginsStr.split(',').map((o) => o.trim());
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        if (origin.startsWith('http://localhost:') || origin === 'http://localhost') {
          return origin;
        }
    }
    if (allowedOrigins.includes(origin)) {
        return origin;
    }
    return null;
}

const getCorsHeaders = (validOrigin: string) => ({
    'Access-Control-Allow-Origin': validOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version',
    'Access-Control-Expose-Headers': 'Mcp-Protocol-Version',
});


// 6. Route Handlers for Next.js App Router

export async function GET(req: NextRequest) {
  const accept = req.headers.get('accept');
  // Handle ChatGPT's SSE connection probe
  if (accept === 'text/event-stream') {
    const validOrigin = getValidOrigin(req);
    if (validOrigin === null) {
        return new NextResponse('Forbidden: Origin not allowed', { status: 403 });
    }
    if (!isAuthenticated(req)) {
      return new NextResponse('Unauthorized', { status: 401, headers: getCorsHeaders(validOrigin) });
    }
    // Pass to transport to handle the SSE handshake
    const response = await transport.handleRequest(req);
    const headers = new Headers(response.headers);
    Object.entries(getCorsHeaders(validOrigin)).forEach(([key, value]) => {
        if (!headers.has(key)) {
            headers.set(key, value);
        }
    });
    return new NextResponse(response.body, { status: response.status, statusText: response.statusText, headers });
  }

  // Handle simple health check for browsers/other probes
  return new NextResponse(JSON.stringify({ status: "ready" }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
    const validOrigin = getValidOrigin(req);
    if (validOrigin === null) {
        return new NextResponse('Forbidden: Origin not allowed', { status: 403 });
    }
    const corsHeaders = getCorsHeaders(validOrigin);

    if (!isAuthenticated(req)) {
        return new NextResponse('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Delegate to transport, which uses sessionIdGenerator if the header is missing.
    const response = await transport.handleRequest(req);

    // Apply CORS headers to the transport's response
    const headers = new Headers(response.headers);
     Object.entries(corsHeaders).forEach(([key, value]) => {
        if (!headers.has(key)) {
            headers.set(key, value);
        }
    });

    return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

export async function OPTIONS(req: NextRequest) {
  const validOrigin = getValidOrigin(req);
  if (validOrigin === null) {
    return new NextResponse('Forbidden: Origin not allowed', { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(validOrigin) });
}
