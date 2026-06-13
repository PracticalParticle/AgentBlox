/**
 * Agent Bridge API client.
 * Calls the local server (server/index.ts) which holds AGENT_POLICY signing keys.
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
