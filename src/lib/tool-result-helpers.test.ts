import { describe, expect, it } from 'vitest';
import {
  canApprovePayment,
  canConfirmRebalance,
  extractPaymentApproval,
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

describe('canApprovePayment', () => {
  it('is true only for requested_on_chain payment with txId', () => {
    const result = {
      status: 'requested_on_chain',
      request: {
        treasuryAddress: '0xA6568F40d89E5c72E8142339Ff85Ad6E308925F3',
        onChain: { status: 'submitted', txId: '3', releaseTime: '1' },
      },
    };
    expect(canApprovePayment('request_vendor_payment', result)).toBe(true);
    expect(canApprovePayment('propose_rebalance', result)).toBe(false);
  });
});
