import { NextRequest, NextResponse } from 'next/server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { firestore } from '@/firebase/server';

// Ensure the code behaves as dynamic route handler
export const dynamic = 'force-dynamic';

// 1. Initialize the MCP Server (Shared instance, no state issues)
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

// 2. Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'health_check',
        description: 'Confirms the MCP server is reachable and functioning.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
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

// 3. Handle tools
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
      const payload = {
        value,
        updatedAt: new Date().toISOString(),
        source: 'mcp',
      };

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

// Helper: Check authentication (Bearer token)
function isAuthenticated(req: NextRequest) {
  if (!process.env.MCP_API_KEY) {
    return false; // Fail securely if not configured
  }
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  return token === process.env.MCP_API_KEY;
}

// Helper: Validate Origin
function getValidOrigin(req: NextRequest): string | null {
  const origin = req.headers.get('origin');
  if (!origin) {
    // Some server-to-server calls might not have an origin.
    // Allow if missing, but we rely on Auth to secure it.
    return '*'; 
  }

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

// For stateful multi-request sessions using WebStandardStreamableHTTPServerTransport:
// We need to generate a session ID and reuse a transport per session.
const transport = new WebStandardStreamableHTTPServerTransport({
  sessionIdGenerator: () => crypto.randomUUID(),
});

// Connect the server to the transport once
server.connect(transport).catch(console.error);

// Reusable handler for all supported HTTP methods
async function handleMcpRequest(req: NextRequest) {
  const validOrigin = getValidOrigin(req);

  // 1. Validate Origin
  if (validOrigin === null) {
    return new NextResponse('Forbidden: Origin not allowed', { status: 403 });
  }

  // Helper for CORS Headers (only reflecting valid origin)
  const getCorsHeaders = () => ({
    'Access-Control-Allow-Origin': validOrigin === '*' ? '*' : validOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version',
    'Access-Control-Expose-Headers': 'MCP-Protocol-Version',
  });

  // 2. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: getCorsHeaders() });
  }

  // 3. Authenticate
  if (!isAuthenticated(req)) {
    return new NextResponse('Unauthorized: Invalid or missing Bearer token', { status: 401, headers: getCorsHeaders() });
  }

  // 4. Delegate request handling to the Web Standard Transport
  // The SDK expects a standard Web Request object which NextRequest extends natively.
  // It handles both GET (SSE initialization) and POST (JSON-RPC messages)
  const response = await transport.handleRequest(req);

  // Apply CORS headers to the response
  const headers = new Headers(response.headers);
  const corsHeaders = getCorsHeaders();
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

// Route handlers for the Next.js App Router
export async function GET(req: NextRequest) {
  return handleMcpRequest(req);
}

export async function POST(req: NextRequest) {
  return handleMcpRequest(req);
}

export async function OPTIONS(req: NextRequest) {
  return handleMcpRequest(req);
}
