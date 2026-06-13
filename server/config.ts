import 'dotenv/config';
import type { Address, Hex } from 'viem';

export const SERVER_PORT = Number(process.env.PORT || 3001);

export const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';

export const TREASURY_ADDRESS = (process.env.TREASURY_ADDRESS || '') as Address;

export const ENS_NAME = process.env.ENS_NAME || '';

/** Sepolia testnet chain id. */
export const SEPOLIA_CHAIN_ID = 11_155_111;

/** Circle USDC on Sepolia — override via SEPOLIA_USDC in .env. */
export const SEPOLIA_USDC = (process.env.SEPOLIA_USDC ||
  '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238') as Address;

/** Uniswap WETH on Sepolia — override via SEPOLIA_WETH in .env. */
export const SEPOLIA_WETH = (process.env.SEPOLIA_WETH ||
  '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14') as Address;

/** LI.FI Composer API key — required for compose (portal.li.fi). */
export const LIFI_API_KEY = process.env.LIFI_API_KEY || '';

/** Composer base URL — hackathon default; production: https://composer.li.quest */
export const LIFI_COMPOSER_BASE_URL =
  process.env.LIFI_COMPOSER_BASE_URL || 'https://ethglobal-composer.li.quest';

/** Default slippage for rebalance compose (3%). */
export const LIFI_REBALANCE_SLIPPAGE = Number(process.env.LIFI_REBALANCE_SLIPPAGE || '0.03');

export function isLifiComposeConfigured(): boolean {
  return LIFI_API_KEY.length > 0;
}

export const LIFI_INTEGRATOR = process.env.LIFI_INTEGRATOR || 'AgentBlox';

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

export const AGENT_POLICY = {
  rebalanceUsdcThreshold: 1_000_000n, // 1 USDC (6 decimals) — demo threshold
  allowedFlowIds: ['rebalance-sepolia-v1'],
} as const;

/** ERC-20 transfer(address,uint256) — used for timelock vendor payments. */
export const ERC20_TRANSFER_SELECTOR = '0xa9059cbb' as Hex;

/** Optional LI.FI Composer execute selector — set after provisioning. */
export const LIFI_EXECUTION_SELECTOR = (process.env.LIFI_EXECUTION_SELECTOR || '') as Hex;

/** Selectors polled by get_whitelisted_targets. */
export function getWhitelistSelectors(): { selector: Hex; label: string }[] {
  const selectors: { selector: Hex; label: string }[] = [
    { selector: ERC20_TRANSFER_SELECTOR, label: 'ERC-20 transfer (vendor payments)' },
  ];
  if (LIFI_EXECUTION_SELECTOR.startsWith('0x') && LIFI_EXECUTION_SELECTOR.length === 10) {
    selectors.unshift({
      selector: LIFI_EXECUTION_SELECTOR,
      label: 'LI.FI Composer execution',
    });
  }
  return selectors;
}

export function isTreasuryConfigured(): boolean {
  return TREASURY_ADDRESS.startsWith('0x') && TREASURY_ADDRESS.length === 42;
}

export function isLlmEnabled(): boolean {
  return OPENAI_API_KEY.length > 0;
}

/** Same env id as the browser widget — available to server via dotenv. */
export const DYNAMIC_ENVIRONMENT_ID = process.env.VITE_DYNAMIC_ENVIRONMENT_ID || '';

export const DYNAMIC_API_TOKEN = process.env.DYNAMIC_API_TOKEN || '';

/** On-chain Broadcaster address (Dynamic server wallet) — must match AccountBlox at provisioning. */
export const BROADCASTER_WALLET_ADDRESS = (process.env.BROADCASTER_WALLET_ADDRESS || '') as Address;

export function isDynamicEnvironmentConfigured(): boolean {
  return DYNAMIC_ENVIRONMENT_ID.length > 0;
}

export function isDynamicBroadcasterConfigured(): boolean {
  return (
    DYNAMIC_API_TOKEN.length > 0 &&
    isDynamicEnvironmentConfigured() &&
    BROADCASTER_WALLET_ADDRESS.startsWith('0x') &&
    BROADCASTER_WALLET_ADDRESS.length === 42
  );
}

/** AGENT_POLICY server signing key — never expose to client. */
export const AGENT_POLICY_PRIVATE_KEY = (process.env.AGENT_POLICY_PRIVATE_KEY || '') as Hex;

export function isAgentPolicySigningConfigured(): boolean {
  return AGENT_POLICY_PRIVATE_KEY.startsWith('0x') && AGENT_POLICY_PRIVATE_KEY.length >= 66;
}

/** External call target for rebalance meta-tx (e.g. LI.FI userProxy). Phase 4 fills via compose. */
export const REBALANCE_EXECUTION_TARGET = (process.env.REBALANCE_EXECUTION_TARGET || '') as Address;

/** Optional override; defaults to keccak256(flowId). */
export const REBALANCE_OPERATION_TYPE = process.env.REBALANCE_OPERATION_TYPE || '';

/** ABI-encoded calldata for external execution (Phase 4: LI.FI compose output). */
export const REBALANCE_EXECUTION_PARAMS = (process.env.REBALANCE_EXECUTION_PARAMS ||
  '0x') as Hex;
