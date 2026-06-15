import type { Address } from 'viem';
import type { SerializedMetaTransaction } from './meta-tx-types';

export function extractSignedMetaTx(
  result: Record<string, unknown>,
): SerializedMetaTransaction | null {
  const proposal = result.proposal as Record<string, unknown> | undefined;
  const signing = proposal?.signing as Record<string, unknown> | undefined;
  if (signing?.status === 'signed' && signing.signedMetaTx) {
    return signing.signedMetaTx as SerializedMetaTransaction;
  }
  return null;
}

export function extractPaymentSignedMetaTx(
  result: Record<string, unknown>,
): SerializedMetaTransaction | null {
  const request = result.request as Record<string, unknown> | undefined;
  const signing = request?.signing as Record<string, unknown> | undefined;
  if (signing?.status === 'signed' && signing.signedMetaTx) {
    return signing.signedMetaTx as SerializedMetaTransaction;
  }
  return null;
}

export function extractPaymentApproval(result: Record<string, unknown>): {
  txId: string;
  treasuryAddress: Address;
  releaseTime: string;
  paymentPath?: string;
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
    paymentPath: typeof request.paymentPath === 'string' ? request.paymentPath : undefined,
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

export function canConfirmInstantPayment(
  tool: string,
  result: Record<string, unknown> | null,
): boolean {
  if (!result || tool !== 'request_vendor_payment') {
    return false;
  }
  const request = result.request as Record<string, unknown> | undefined;
  const onChain = request?.onChain as Record<string, unknown> | undefined;
  return (
    extractPaymentSignedMetaTx(result) !== null &&
    result.status === 'proposed' &&
    request?.paymentPath === 'B-fast' &&
    onChain?.status === 'signed'
  );
}

export function canConfirmTimelockRelease(
  tool: string,
  result: Record<string, unknown> | null,
): boolean {
  if (!result || tool !== 'request_vendor_payment') {
    return false;
  }
  return extractPaymentApproval(result) !== null && result.status === 'requested_on_chain';
}

/** @deprecated Use canConfirmTimelockRelease — Owner fallback remains in card only. */
export function canApprovePayment(
  tool: string,
  result: Record<string, unknown> | null,
): boolean {
  return canConfirmTimelockRelease(tool, result);
}
