import { describe, expect, it } from 'vitest';
import { formatPaymentAmountLabel, resolvePaymentDisplayLabel } from './token-amount';

describe('resolvePaymentDisplayLabel', () => {
  it('uses server-provided displayLabel when present', () => {
    expect(resolvePaymentDisplayLabel({ displayLabel: '$5 USDC' })).toBe('$5 USDC');
  });

  it('formats from base units and on-chain decimals when displayLabel is missing', () => {
    expect(
      resolvePaymentDisplayLabel({
        amountUsdc: '5000000',
        tokenDecimals: 6,
        token: 'USDC',
      }),
    ).toBe('$5 USDC');
  });

  it('does not guess decimals when tokenDecimals is missing', () => {
    expect(
      resolvePaymentDisplayLabel({
        amountUsdc: '5000000',
        token: 'USDC',
      }),
    ).toBe('5000000 base units');
  });
});

describe('formatPaymentAmountLabel', () => {
  it('accepts string base units', () => {
    expect(formatPaymentAmountLabel('20000000', 6, 'USDC')).toBe('$20 USDC');
  });
});
