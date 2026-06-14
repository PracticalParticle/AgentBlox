import { createPublicClient, http, type PublicClient } from 'viem';
import { mainnet } from 'viem/chains';

const DEFAULT_MAINNET_RPC = 'https://ethereum-rpc.publicnode.com';

export function createMainnetPublicClient(rpcUrl?: string): PublicClient {
  return createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl || DEFAULT_MAINNET_RPC),
  });
}

export const mainnetPublicClient = createMainnetPublicClient();
