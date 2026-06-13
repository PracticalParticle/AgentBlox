import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { SEPOLIA_RPC_URL } from './config.js';

export const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL),
});

/** ENS resolution for .eth names uses mainnet resolver. */
export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.MAINNET_RPC_URL || 'https://ethereum-rpc.publicnode.com'),
});
