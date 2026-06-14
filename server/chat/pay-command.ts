import { resolvePaymentPath } from '../policy-gate.js';

const DEMO_VENDOR_RECIPIENT = '0x0000000000000000000000000000000000000001';

/** Whole or fractional USDC dollars → 6-decimal base units. */
export function dollarsToUsdcUnits(dollars: number): bigint {
  if (!Number.isFinite(dollars) || dollars <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }
  return BigInt(Math.round(dollars * 1_000_000));
}

export type ParsedPayCommand = {
  amountUsdc: string;
  displayDollars: string;
  paymentPath: ReturnType<typeof resolvePaymentPath>;
  recipient: string;
  memo: string;
  label: string;
};

/**
 * Parse demo pay slash commands: `/pay 5$`, `/pay 20$`, `/pay $5`, `/pay 5 usdc`.
 * Amount selects B-fast (under $10) vs B-timelock ($10+) via policy gate threshold.
 */
export function parsePaySlashCommand(text: string): ParsedPayCommand | null {
  const trimmed = text.trim();
  const match = trimmed.match(
    /^(?:\/pay|pay)\s+(?:\$(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*\$?)(?:\s+usdc)?$/i,
  );
  if (!match) return null;

  const displayDollars = match[1] ?? match[2];
  const dollars = Number(displayDollars);
  if (!Number.isFinite(dollars) || dollars <= 0) return null;

  const amount = dollarsToUsdcUnits(dollars);
  const paymentPath = resolvePaymentPath(amount);
  const pathLabel = paymentPath === 'B-fast' ? 'instant B-fast' : 'timelock B-timelock';

  return {
    amountUsdc: amount.toString(),
    displayDollars,
    paymentPath,
    recipient: DEMO_VENDOR_RECIPIENT,
    memo: `Demo vendor payment $${displayDollars}`,
    label: `Vendor payment $${displayDollars} (${pathLabel})`,
  };
}

export const PAY_DEMO_COMMANDS = {
  fast: '/pay 5$',
  timelock: '/pay 20$',
} as const;
