import {
  GuardController,
  type MetaTransaction,
  type PublicClient,
  type WalletClient,
} from '@bloxchain/sdk';
import { sdkPublicClient, sdkSepolia } from '../bloxchain.js';
import {
  BROADCASTER_WALLET_ADDRESS,
  isDynamicBroadcasterConfigured,
  TREASURY_ADDRESS,
} from '../config.js';
import { getBroadcasterWalletClient } from '../dynamic/broadcaster.js';
import { formatExecutionError } from './format-execution-error.js';

export type BroadcasterSubmitResult =
  | { ok: true; hash: string }
  | { ok: false; reason: string };

async function createBroadcasterGuardController(): Promise<GuardController> {
  const walletClient = (await getBroadcasterWalletClient()) as unknown as WalletClient;
  return new GuardController(
    sdkPublicClient as PublicClient,
    walletClient,
    TREASURY_ADDRESS,
    sdkSepolia,
  );
}

export async function submitRequestAndApproveWithBroadcaster(
  signedMetaTx: MetaTransaction,
): Promise<BroadcasterSubmitResult> {
  if (!isDynamicBroadcasterConfigured()) {
    return {
      ok: false,
      reason:
        'Dynamic Broadcaster not configured — set DYNAMIC_API_TOKEN and BROADCASTER_WALLET_ADDRESS.',
    };
  }

  try {
    const guardController = await createBroadcasterGuardController();
    const result = await guardController.requestAndApproveExecution(signedMetaTx, {
      from: BROADCASTER_WALLET_ADDRESS,
      gas: 1_500_000n,
    });

    const receipt = await result.wait();
    if (receipt.status !== 'success') {
      return {
        ok: false,
        reason: `Transaction reverted on-chain (hash: ${result.hash})`,
      };
    }

    return { ok: true, hash: result.hash };
  } catch (error) {
    return {
      ok: false,
      reason: formatExecutionError(error),
    };
  }
}

export async function submitTimelockApproveWithBroadcaster(
  signedMetaTx: MetaTransaction,
): Promise<BroadcasterSubmitResult> {
  if (!isDynamicBroadcasterConfigured()) {
    return {
      ok: false,
      reason:
        'Dynamic Broadcaster not configured — set DYNAMIC_API_TOKEN and BROADCASTER_WALLET_ADDRESS.',
    };
  }

  try {
    const guardController = await createBroadcasterGuardController();
    const result = await guardController.approveTimeLockExecutionWithMetaTx(signedMetaTx, {
      from: BROADCASTER_WALLET_ADDRESS,
      gas: 1_500_000n,
    });

    const receipt = await result.wait();
    if (receipt.status !== 'success') {
      return {
        ok: false,
        reason: `Timelock approve reverted on-chain (hash: ${result.hash})`,
      };
    }

    return { ok: true, hash: result.hash };
  } catch (error) {
    return {
      ok: false,
      reason: formatExecutionError(error),
    };
  }
}
