import { GuardController, type MetaTransaction, type PublicClient, type WalletClient } from '@bloxchain/sdk';
import { submitRequestAndApproveWithBroadcaster } from './meta-tx-broadcaster.js';

export async function executeRebalanceWithBroadcaster(
  signedMetaTx: MetaTransaction,
): Promise<{ ok: true; hash: string } | { ok: false; reason: string }> {
  return submitRequestAndApproveWithBroadcaster(signedMetaTx);
}
