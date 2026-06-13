/**
 * @deprecated Copilot pivot — use Copilot tools via /api/chat instead of REST Agent Bridge.
 * See docs/agent-bridge.md and docs/on-chain-execution-flow.md.
 * Remove or rewrite when Phase 3 signing lands in server/tools/propose.ts.
 */
const API_BASE = '/api';

export type RebalanceProposal = {
  flowId: string;
  target: string;
  calldata: string;
  signedMetaTx?: unknown;
};

export async function proposeRebalance(treasuryAddress: string): Promise<RebalanceProposal> {
  const res = await fetch(`${API_BASE}/agent/rebalance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ treasuryAddress }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function simulateAttack(treasuryAddress: string) {
  const res = await fetch(`${API_BASE}/agent/simulate-attack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ treasuryAddress }),
  });
  return res.json();
}

export async function getAgentBridgeHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
