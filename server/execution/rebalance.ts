import { GuardController, type MetaTransaction, type PublicClient, type WalletClient } from '@bloxchain/sdk';
import { sdkPublicClient, sdkSepolia } from '../bloxchain.js';
import {
  BROADCASTER_WALLET_ADDRESS,
  isDynamicBroadcasterConfigured,
  TREASURY_ADDRESS,
} from '../config.js';
import { getBroadcasterWalletClient } from '../dynamic/broadcaster.js';

export async function executeRebalanceWithBroadcaster(
  signedMetaTx: MetaTransaction,
): Promise<{ ok: true; hash: string } | { ok: false; reason: string }> {
  if (!isDynamicBroadcasterConfigured()) {
    return {
      ok: false,
      reason: 'Dynamic Broadcaster not configured — set DYNAMIC_API_TOKEN and BROADCASTER_WALLET_ADDRESS.',
    };
  }

  try {
    const walletClient = (await getBroadcasterWalletClient()) as unknown as WalletClient;
    const guardController = new GuardController(
      sdkPublicClient as PublicClient,
      walletClient,
      TREASURY_ADDRESS,
      sdkSepolia,
    );

    const result = await guardController.requestAndApproveExecution(signedMetaTx, {
      from: BROADCASTER_WALLET_ADDRESS,
      gas: 1_500_000n,
    });

    const receipt = await result.wait();
    const success = receipt.status === 'success';

    if (!success) {
      return {
        ok: false,
        reason: `Transaction reverted on-chain (hash: ${result.hash})`,
      };
    }

    return { ok: true, hash: result.hash };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Broadcaster execution failed',
    };
  }
}
