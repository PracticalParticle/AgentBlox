import { formatUnits } from 'viem';

/** Human-readable token amount from base units (trims trailing zeros). */
export function formatTokenAmount(baseUnits: string | bigint, decimals: number): string {
  let units: bigint;
  try {
    units = typeof baseUnits === 'bigint' ? baseUnits : BigInt(baseUnits);
  } catch {
    return String(baseUnits);
  }

  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new Error(`Cannot format token amount with invalid decimals: ${decimals}`);
  }

  const formatted = formatUnits(units, decimals);
  if (!formatted.includes('.')) {
    return formatted;
  }
  return formatted.replace(/\.?0+$/, '');
}

export function formatPaymentAmountLabel(
  baseUnits: string | bigint,
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

export function resolvePaymentDisplayLabel(request: Record<string, unknown> | undefined): string {
  if (!request) {
    return '—';
  }
  if (typeof request.displayLabel === 'string' && request.displayLabel.length > 0) {
    return request.displayLabel;
  }

  const decimalsRaw = request.tokenDecimals;
  const hasValidDecimals =
    typeof decimalsRaw === 'number' &&
    Number.isInteger(decimalsRaw) &&
    decimalsRaw >= 0 &&
    decimalsRaw <= 36;

  if (!hasValidDecimals) {
    const baseUnits = request.amountBaseUnits ?? request.amountUsdc;
    return typeof baseUnits === 'string' ? `${baseUnits} base units` : '—';
  }

  const symbol = typeof request.token === 'string' ? request.token : 'USDC';
  const baseUnits =
    typeof request.amountBaseUnits === 'string'
      ? request.amountBaseUnits
      : String(request.amountUsdc ?? '0');

  return formatPaymentAmountLabel(baseUnits, decimalsRaw, symbol);
}
