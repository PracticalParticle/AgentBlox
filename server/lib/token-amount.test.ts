import { describe, expect, it } from 'vitest';
import {
  buildPaymentAmountDisplay,
  displayAmountToBaseUnits,
  formatPaymentAmountLabel,
  formatTokenAmount,
} from './token-amount.js';

describe('formatTokenAmount', () => {
  it('formats 6-decimal USDC base units', () => {
    expect(formatTokenAmount(5_000_000n, 6)).toBe('5');
    expect(formatTokenAmount(1_500_000n, 6)).toBe('1.5');
    expect(formatTokenAmount(20_000_000n, 6)).toBe('20');
  });

  it('formats 18-decimal tokens', () => {
    expect(formatTokenAmount(1_000_000_000_000_000_000n, 18)).toBe('1');
    expect(formatTokenAmount(5_000_000_000_000_000n, 18)).toBe('0.005');
  });

  it('rejects invalid decimals', () => {
    expect(() => formatTokenAmount(1n, -1)).toThrow(/invalid decimals/i);
  });
});

describe('displayAmountToBaseUnits', () => {
  it('converts display dollars using on-chain decimals', () => {
    expect(displayAmountToBaseUnits('5', 6)).toBe(5_000_000n);
    expect(displayAmountToBaseUnits('1.5', 6)).toBe(1_500_000n);
    expect(displayAmountToBaseUnits('20', 6)).toBe(20_000_000n);
  });

  it('rejects excess fractional precision', () => {
    expect(() => displayAmountToBaseUnits('1.1234567', 6)).toThrow(/fractional digits/i);
  });
});

describe('formatPaymentAmountLabel', () => {
  it('prefixes dollar stablecoins', () => {
    expect(formatPaymentAmountLabel(5_000_000n, 6, 'USDC')).toBe('$5 USDC');
  });
});

describe('buildPaymentAmountDisplay', () => {
  it('returns display fields for API payloads', () => {
    expect(buildPaymentAmountDisplay(5_000_000n, 6, 'USDC')).toEqual({
      amountBaseUnits: '5000000',
      tokenDecimals: 6,
      displayAmount: '5',
      displayLabel: '$5 USDC',
    });
  });
});
