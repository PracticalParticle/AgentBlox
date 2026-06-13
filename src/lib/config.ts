import { createPublicClient, http, type Address, type Chain } from 'viem';
import { sepolia } from 'viem/chains';

export const SEPOLIA_CHAIN: Chain = sepolia;

const DEFAULT_SEPOLIA_RPC = 'https://rpc.sepolia.org';

export function createSepoliaClient(rpcUrl?: string) {
  return createPublicClient({
    chain: SEPOLIA_CHAIN,
    transport: http(rpcUrl || DEFAULT_SEPOLIA_RPC),
  });
}

export const BLOXCHAIN_SEPOLIA = {
  engineBlox: '0x726d78c9683a96d66196d2b8350923e8ca0d8597' as Address,
  accountBloxTemplate: '0x783eb64d7d5de55f6913f9cb42ef5a4c402884c0' as Address,
  copyBlox: '0x928a2bd6c13e4f48a0850d2171a8d79b29959fc7' as Address,
} as const;

export const ENS_TEXT_KEYS = {
  policyVersion: 'bloxchain.policyVersion',
  allowedFlows: 'bloxchain.allowedFlows',
  app: 'bloxchain.app',
} as const;
