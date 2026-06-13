import { DynamicEvmWalletClient } from '@dynamic-labs-wallet/node-evm';
import { DYNAMIC_API_TOKEN, DYNAMIC_ENVIRONMENT_ID } from '../config.js';

let cachedClient: DynamicEvmWalletClient | null = null;

export async function createAuthenticatedDynamicClient(): Promise<DynamicEvmWalletClient> {
  if (!DYNAMIC_ENVIRONMENT_ID) {
    throw new Error('VITE_DYNAMIC_ENVIRONMENT_ID is not configured');
  }
  if (!DYNAMIC_API_TOKEN) {
    throw new Error('DYNAMIC_API_TOKEN is not configured');
  }

  const client = new DynamicEvmWalletClient({
    environmentId: DYNAMIC_ENVIRONMENT_ID,
    enableMPCAccelerator: false,
  });

  await client.authenticateApiToken(DYNAMIC_API_TOKEN);
  return client;
}

/** Reuse a single authenticated client per server process. */
export async function getDynamicClient(): Promise<DynamicEvmWalletClient> {
  if (!cachedClient) {
    cachedClient = await createAuthenticatedDynamicClient();
  }
  return cachedClient;
}

export function resetDynamicClientCache(): void {
  cachedClient = null;
}
