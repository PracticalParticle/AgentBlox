import 'dotenv/config';
import type { Address } from 'viem';

export const SERVER_PORT = Number(process.env.PORT || 3001);

export const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL ||
  process.env.VITE_SEPOLIA_RPC_URL ||
  'https://rpc.sepolia.org';

export const TREASURY_ADDRESS = (process.env.TREASURY_ADDRESS ||
  process.env.VITE_TREASURY_ADDRESS ||
  '') as Address;

export const ENS_NAME = process.env.ENS_NAME || process.env.VITE_ENS_NAME || '';

export const LIFI_INTEGRATOR = process.env.LIFI_INTEGRATOR || 'AgentBlox';

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

export const AGENT_POLICY = {
  rebalanceUsdcThreshold: 1_000_000n, // 1 USDC (6 decimals) — demo threshold
  allowedFlowIds: ['rebalance-sepolia-v1'],
} as const;

export function isTreasuryConfigured(): boolean {
  return TREASURY_ADDRESS.startsWith('0x') && TREASURY_ADDRESS.length === 42;
}

export function isLlmEnabled(): boolean {
  return OPENAI_API_KEY.length > 0;
}
