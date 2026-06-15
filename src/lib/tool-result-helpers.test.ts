import { describe, expect, it } from 'vitest';
import {
  canApprovePayment,
  canConfirmInstantPayment,
  canConfirmRebalance,
  canConfirmTimelockRelease,
  extractPaymentApproval,
  extractPaymentSignedMetaTx,
  extractSignedMetaTx,
} from './tool-result-helpers';

describe('extractSignedMetaTx', () => {
  it('returns signed meta-tx from rebalance proposal', () => {
    const signed = { txRecord: { txId: '1' } };
    const result = {
      proposal: {
        signing: { status: 'signed', signedMetaTx: signed },
      },
    };
    expect(extractSignedMetaTx(result)).toEqual(signed);
  });

  it('returns null when signing is unsigned', () => {
    expect(
      extractSignedMetaTx({
        proposal: { signing: { status: 'unsigned' } },
      }),
    ).toBeNull();
  });
});

describe('extractPaymentApproval', () => {
  it('returns approval payload for submitted on-chain payment', () => {
    const result = {
      request: {
        treasuryAddress: '0xA6568F40d89E5c72E8142339Ff85Ad6E308925F3',
        onChain: {
          status: 'submitted',
          txId: '12',
          releaseTime: '1700000300',
        },
      },
    };

    expect(extractPaymentApproval(result)).toEqual({
      txId: '12',
      treasuryAddress: '0xA6568F40d89E5c72E8142339Ff85Ad6E308925F3',
      releaseTime: '1700000300',
    });
  });

  it('returns null when on-chain submit did not happen', () => {
    expect(
      extractPaymentApproval({
        request: { onChain: { status: 'not_configured' } },
      }),
    ).toBeNull();
  });
});

describe('canConfirmRebalance', () => {
  it('is true only for proposed rebalance with signed meta-tx', () => {
    const result = {
      status: 'proposed',
      proposal: { signing: { status: 'signed', signedMetaTx: { ok: true } } },
    };
    expect(canConfirmRebalance('propose_rebalance', result)).toBe(true);
    expect(canConfirmRebalance('request_vendor_payment', result)).toBe(false);
    expect(canConfirmRebalance('propose_rebalance', { ...result, status: 'proposed_unsigned' })).toBe(
      false,
    );
  });
});

describe('canConfirmInstantPayment', () => {
  it('is true for B-fast proposed payment with signed meta-tx and passing preflight', () => {
    const result = {
      status: 'proposed',
      request: {
        paymentPath: 'B-fast',
        onChain: { status: 'signed' },
        signing: { status: 'signed', signedMetaTx: { ok: true } },
      },
    };
    expect(canConfirmInstantPayment('request_vendor_payment', result)).toBe(true);
    expect(canConfirmInstantPayment('request_vendor_payment', { ...result, status: 'requested_on_chain' })).toBe(
      false,
    );
  });

  it('is false when preflight failed', () => {
    const result = {
      status: 'proposed',
      request: {
        paymentPath: 'B-fast',
        onChain: { status: 'preflight_failed', reason: 'SignerNotAuthorized' },
        signing: { status: 'signed', signedMetaTx: { ok: true } },
      },
    };
    expect(canConfirmInstantPayment('request_vendor_payment', result)).toBe(false);
  });
});

describe('canApprovePayment / canConfirmTimelockRelease', () => {
  it('is true only for requested_on_chain payment with txId', () => {
    const result = {
      status: 'requested_on_chain',
      request: {
        treasuryAddress: '0xA6568F40d89E5c72E8142339Ff85Ad6E308925F3',
        onChain: { status: 'submitted', txId: '3', releaseTime: '1' },
      },
    };
    expect(canApprovePayment('request_vendor_payment', result)).toBe(true);
    expect(canConfirmTimelockRelease('request_vendor_payment', result)).toBe(true);
    expect(canApprovePayment('propose_rebalance', result)).toBe(false);
  });
});

describe('extractPaymentSignedMetaTx', () => {
  it('returns signed meta-tx from payment request', () => {
    const signed = { txRecord: { txId: '2' } };
    expect(
      extractPaymentSignedMetaTx({
        request: { signing: { status: 'signed', signedMetaTx: signed } },
      }),
    ).toEqual(signed);
  });
});
