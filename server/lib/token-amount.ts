import type { Address } from 'viem';
import { formatUnits } from 'viem';
import { sepoliaClient } from '../clients.js';
import { SEPOLIA_USDC } from '../config.js';

const erc20DecimalsAbi = [
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const;

const decimalsCache = new Map<string, number>();

/** @internal Test helper — clears cached ERC-20 decimals between tests. */
export function clearTokenDecimalsCacheForTests(): void {
  decimalsCache.clear();
}

export class TokenDecimalsReadError extends Error {
  readonly tokenAddress: Address;

  constructor(tokenAddress: Address, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'TokenDecimalsReadError';
    this.tokenAddress = tokenAddress;
  }
}

/** Human-readable token amount from base units (trims trailing zeros). */
export function formatTokenAmount(baseUnits: bigint, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new Error(`Cannot format token amount with invalid decimals: ${decimals}`);
  }
  const formatted = formatUnits(baseUnits, decimals);
  if (!formatted.includes('.')) {
    return formatted;
  }
  return formatted.replace(/\.?0+$/, '');
}

export function formatPaymentAmountLabel(
  baseUnits: bigint,
  decimals: number,
  symbol: string,
): string {
  const amount = formatTokenAmount(baseUnits, decimals);
  const upper = symbol.toUpperCase();
  if (upper === 'USDC' || upper === 'USDT' || upper === 'DAI') {
    return `$${amount} ${symbol}`;
  }
  return `${amount} ${symbol}`;
}

export type PaymentAmountDisplay = {
  amountBaseUnits: string;
  tokenDecimals: number;
  displayAmount: string;
  displayLabel: string;
};

export function buildPaymentAmountDisplay(
  baseUnits: bigint,
  decimals: number,
  symbol: string,
): PaymentAmountDisplay {
  return {
    amountBaseUnits: baseUnits.toString(),
    tokenDecimals: decimals,
    displayAmount: formatTokenAmount(baseUnits, decimals),
    displayLabel: formatPaymentAmountLabel(baseUnits, decimals, symbol),
  };
}

/** Convert a human display amount (e.g. "5" or "1.5") to token base units using on-chain decimals. */
export function displayAmountToBaseUnits(displayAmount: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new Error(`Cannot convert display amount with invalid decimals: ${decimals}`);
  }

  const trimmed = displayAmount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid display amount: "${displayAmount}"`);
  }

  const [whole = '0', fraction = ''] = trimmed.split('.');
  if (fraction.length > decimals) {
    throw new Error(
      `Amount "${displayAmount}" has more fractional digits than token supports (${decimals} decimals).`,
    );
  }

  const paddedFraction = fraction.padEnd(decimals, '0');
  return BigInt(`${whole}${paddedFraction}`);
}

export async function readErc20Decimals(tokenAddress: Address): Promise<number> {
  const key = tokenAddress.toLowerCase();
  const cached = decimalsCache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  let rawDecimals: unknown;
  try {
    rawDecimals = await sepoliaClient.readContract({
      address: tokenAddress,
      abi: erc20DecimalsAbi,
      functionName: 'decimals',
    });
  } catch (cause) {
    throw new TokenDecimalsReadError(
      tokenAddress,
      `ERC-20 decimals() call failed for ${tokenAddress}. Payments are blocked until on-chain decimals can be read.`,
      { cause },
    );
  }

  const value = Number(rawDecimals);
  if (!Number.isInteger(value) || value < 0 || value > 36) {
    throw new TokenDecimalsReadError(
      tokenAddress,
      `ERC-20 decimals() returned invalid value "${String(rawDecimals)}" for ${tokenAddress}.`,
    );
  }

  decimalsCache.set(key, value);
  return value;
}

export async function getPaymentTokenDecimals(): Promise<number> {
  return readErc20Decimals(SEPOLIA_USDC);
}
