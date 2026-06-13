import type { Address } from 'viem';
import type { SerializedMetaTransaction } from './meta-tx-types';

export function extractSignedMetaTx(
  result: Record<string, unknown>,
): SerializedMetaTransaction | null {
  const proposal = result.proposal as Record<string, unknown> | undefined;
  const signing = proposal?.signing as Record<string, unknown> | undefined;
  if (signing?.status !== 'signed' || !signing.signedMetaTx) {
    return null;
  }
  return signing.signedMetaTx as SerializedMetaTransaction;
}

export function extractPaymentApproval(result: Record<string, unknown>): {
  txId: string;
  treasuryAddress: Address;
  releaseTime: string;
} | null {
  const request = result.request as Record<string, unknown> | undefined;
  const onChain = request?.onChain as Record<string, unknown> | undefined;
  if (onChain?.status !== 'submitted' || !onChain.txId || !request?.treasuryAddress) {
    return null;
  }
  return {
    txId: String(onChain.txId),
    treasuryAddress: request.treasuryAddress as Address,
    releaseTime: String(onChain.releaseTime ?? '0'),
  };
}

export function canConfirmRebalance(
  tool: string,
  result: Record<string, unknown> | null,
): boolean {
  if (!result || tool !== 'propose_rebalance') {
    return false;
  }
  return extractSignedMetaTx(result) !== null && result.status === 'proposed';
}

export function canApprovePayment(
  tool: string,
  result: Record<string, unknown> | null,
): boolean {
  if (!result || tool !== 'request_vendor_payment') {
    return false;
  }
  return extractPaymentApproval(result) !== null && result.status === 'requested_on_chain';
}
