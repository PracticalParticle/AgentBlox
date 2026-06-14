import type { MetaTransaction } from '@bloxchain/sdk';
import { signPaymentTimelockApproveMetaTransaction } from '../signing/payment-meta-tx.js';
import { deserializeMetaTransaction } from '../signing/serialize.js';
import type { SerializedMetaTransaction } from '../signing/serialize.js';
import {
  submitRequestAndApproveWithBroadcaster,
  submitTimelockApproveWithBroadcaster,
} from './meta-tx-broadcaster.js';

export async function executeInstantPaymentWithBroadcaster(
  serialized: SerializedMetaTransaction,
): Promise<{ ok: true; hash: string } | { ok: false; reason: string }> {
  return submitRequestAndApproveWithBroadcaster(deserializeMetaTransaction(serialized));
}

export async function approveTimelockPaymentOnChain(params: {
  txId: bigint;
  preSignedMetaTx?: SerializedMetaTransaction;
}): Promise<
  | { ok: true; hash: string; signerAddress: string }
  | { ok: false; reason: string; code?: string }
> {
  let signedMetaTx: MetaTransaction;

  if (params.preSignedMetaTx) {
    signedMetaTx = deserializeMetaTransaction(params.preSignedMetaTx);
  } else {
    const signed = await signPaymentTimelockApproveMetaTransaction({ txId: params.txId });
    if (!signed.ok) {
      return { ok: false, reason: signed.reason, code: signed.code };
    }
    signedMetaTx = deserializeMetaTransaction(signed.signedMetaTx);
  }

  const submit = await submitTimelockApproveWithBroadcaster(signedMetaTx);
  if (!submit.ok) {
    return { ok: false, reason: submit.reason };
  }

  return {
    ok: true,
    hash: submit.hash,
    signerAddress: signedMetaTx.params.signer,
  };
}
