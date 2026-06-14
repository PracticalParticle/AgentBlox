import { createServer } from 'node:http';
import {
  isDynamicBroadcasterConfigured,
  isDynamicEnvironmentConfigured,
  isAgentPolicySigningConfigured,
  isAnalystConfigured,
  isApproverConfigured,
  analystWalletAddressMatches,
  ANALYST_WALLET_ADDRESS,
  getAnalystWalletAddressFromKey,
  isEnsConfigured,
  isLifiApiKeyConfigured,
  isLifiComposeConfigured,
  isLlmEnabled,
  isTreasuryConfigured,
  SERVER_PORT,
} from './config.js';
import { handleChatRequest } from './chat/handler.js';
import {
  getBroadcasterStatus,
  listBroadcasterWallets,
  verifyBroadcasterConnection,
} from './dynamic/broadcaster.js';
import { submitSignedRebalanceMetaTransaction } from './signing/meta-tx.js';
import {
  approveTimelockPaymentOnChain,
  executeInstantPaymentWithBroadcaster,
} from './execution/payment-approve.js';
import {
  getTreasuryStatus,
  getWhitelistedTargets,
  listPendingApprovals,
  resolveEnsTreasury,
} from './tools/read.js';
import type { SerializedMetaTransaction } from './signing/serialize.js';

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
    const broadcaster = await getBroadcasterStatus();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'agentblox-server',
        llmEnabled: isLlmEnabled(),
        treasuryConfigured: isTreasuryConfigured(),
        dynamicEnvironmentConfigured: isDynamicEnvironmentConfigured(),
        dynamicBroadcasterConfigured: isDynamicBroadcasterConfigured(),
        agentPolicySigningConfigured: isAgentPolicySigningConfigured(),
        analystConfigured: isAnalystConfigured(),
        analystWalletAddress: getAnalystWalletAddressFromKey(),
        analystWalletAddressExpected: ANALYST_WALLET_ADDRESS,
        analystWalletAddressMatches: analystWalletAddressMatches(),
        approverConfigured: isApproverConfigured(),
        ensConfigured: isEnsConfigured(),
        lifiComposeConfigured: isLifiComposeConfigured(),
        lifiApiKeyConfigured: isLifiApiKeyConfigured(),
        broadcaster,
        mode: isLlmEnabled() ? 'copilot-llm' : 'copilot-fallback',
      }),
    );
    return;
  }

  if (req.method === 'GET') {
    try {
      if (url.pathname === '/api/treasury/status') {
        const data = await getTreasuryStatus();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
      }
      if (url.pathname === '/api/treasury/pending') {
        const data = await listPendingApprovals();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
      }
      if (url.pathname === '/api/treasury/whitelist') {
        const data = await getWhitelistedTargets();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
      }
      if (url.pathname === '/api/treasury/ens') {
        const name = url.searchParams.get('name') || undefined;
        const data = await resolveEnsTreasury(name);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
      }
      if (url.pathname === '/api/broadcaster/verify') {
        const status = await getBroadcasterStatus();
        const connection = await verifyBroadcasterConnection();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: connection.ok && status.configured && status.matchesOnChainBroadcaster !== false,
            walletAddress: connection.ok ? connection.walletAddress : status.walletAddress,
            error: connection.error,
            status,
          }),
        );
        return;
      }
      if (url.pathname === '/api/broadcaster/wallets') {
        try {
          const wallets = await listBroadcasterWallets();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, wallets }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              ok: false,
              wallets: [],
              error: error instanceof Error ? error.message : 'Could not list wallets',
            }),
          );
        }
        return;
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Treasury read failed' }));
      return;
    }
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

  if (url.pathname === '/api/execute/rebalance' && req.method === 'POST') {
    try {
      const body = await readJsonBody<{ signedMetaTx: SerializedMetaTransaction }>(req);
      if (!body.signedMetaTx) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, reason: 'signedMetaTx is required' }));
        return;
      }

      const result = await submitSignedRebalanceMetaTransaction(body.signedMetaTx);
      res.writeHead(result.ok ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          reason: error instanceof Error ? error.message : 'Execute rebalance failed',
        }),
      );
    }
    return;
  }

  if (url.pathname === '/api/execute/payment' && req.method === 'POST') {
    try {
      const body = await readJsonBody<{ signedMetaTx: SerializedMetaTransaction }>(req);
      if (!body.signedMetaTx) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, reason: 'signedMetaTx is required' }));
        return;
      }

      const result = await executeInstantPaymentWithBroadcaster(body.signedMetaTx);
      res.writeHead(result.ok ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          reason: error instanceof Error ? error.message : 'Execute payment failed',
        }),
      );
    }
    return;
  }

  if (url.pathname === '/api/execute/payment-approve' && req.method === 'POST') {
    try {
      const body = await readJsonBody<{ txId: string }>(req);
      if (!body.txId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, reason: 'txId is required' }));
        return;
      }

      const result = await approveTimelockPaymentOnChain({ txId: BigInt(body.txId) });
      res.writeHead(result.ok ? 200 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: false,
          reason: error instanceof Error ? error.message : 'Payment approve failed',
        }),
      );
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
