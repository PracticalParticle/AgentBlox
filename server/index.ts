import { createServer } from 'node:http';
import { isLlmEnabled, isTreasuryConfigured, SERVER_PORT } from './config.js';
import { handleChatRequest } from './chat/handler.js';

async function readJsonBody<T>(req: import('node:http').IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {} as T;
  return JSON.parse(raw) as T;
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${SERVER_PORT}`);

  if (url.pathname === '/api/health' || url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'agentblox-server',
        llmEnabled: isLlmEnabled(),
        treasuryConfigured: isTreasuryConfigured(),
        mode: isLlmEnabled() ? 'copilot-llm' : 'copilot-fallback',
      }),
    );
    return;
  }

  if (url.pathname === '/api/chat' && req.method === 'POST') {
    try {
      const body = await readJsonBody<{ messages: Parameters<typeof handleChatRequest>[0]['messages'] }>(
        req,
      );
      const response = await handleChatRequest(body);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      const buffer = Buffer.from(await response.arrayBuffer());
      res.end(buffer);
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Chat failed' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(SERVER_PORT, () => {
  console.log(`AgentBlox server listening on http://localhost:${SERVER_PORT}`);
  console.log(`  Mode: ${isLlmEnabled() ? 'LLM copilot' : 'Fallback slash-command copilot'}`);
  console.log(`  Treasury: ${isTreasuryConfigured() ? 'configured' : 'not configured'}`);
});
