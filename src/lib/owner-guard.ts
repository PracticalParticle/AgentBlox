import { GuardController, type Chain, type PublicClient, type WalletClient } from '@bloxchain/sdk';
import { createPublicClient, http, type Address, type WalletClient as ViemWalletClient } from 'viem';
import { sepolia } from 'viem/chains';

export type ApprovePaymentResult =
  | { ok: true; hash: string }
  | { ok: false; reason: string };

export async function approveTimelockPayment(params: {
  txId: string;
  treasuryAddress: Address;
  walletClient: ViemWalletClient;
  ownerAddress: Address;
}): Promise<ApprovePaymentResult> {
  try {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http('https://rpc.sepolia.org'),
    });

    const guardController = new GuardController(
      publicClient as unknown as PublicClient,
      params.walletClient as unknown as WalletClient,
      params.treasuryAddress,
      sepolia as unknown as Chain,
    );

    const result = await guardController.approveTimeLockExecution(BigInt(params.txId), {
      from: params.ownerAddress,
      gas: 500_000n,
    });

    const receipt = await result.wait();
    if (receipt.status !== 'success') {
      return {
        ok: false,
        reason: `Approval reverted on-chain (hash: ${result.hash})`,
      };
    }

    return { ok: true, hash: result.hash };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Owner approval failed',
    };
  }
}

/** Seconds until releaseTime (0 if already releasable). */
export function secondsUntilRelease(releaseTimeSec: string | undefined): number {
  if (!releaseTimeSec) return 0;
  const releaseMs = Number(releaseTimeSec) * 1000;
  return Math.max(0, Math.ceil((releaseMs - Date.now()) / 1000));
}
