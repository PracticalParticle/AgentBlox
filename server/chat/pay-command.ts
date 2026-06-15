/** Resolved to on-chain treasury Owner in requestVendorPayment (slash /pay* demo). */
export const PAY_RECIPIENT_TREASURY_OWNER = '__treasury_owner__' as const;

export type ParsedPayCommand = {
  /** Human-readable dollar amount from the slash command (converted server-side using on-chain decimals). */
  amountDollars: string;
  displayDollars: string;
  recipient: string;
  memo: string;
  label: string;
};

/**
 * Parse demo pay slash commands: `/pay 5$`, `/pay 20$`, `/pay $5`, `/pay 5 usdc`.
 * Base-unit conversion and B-fast vs B-timelock routing happen in requestVendorPayment
 * after ERC-20 decimals() is read on-chain.
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

  return {
    amountDollars: displayDollars,
    displayDollars,
    recipient: PAY_RECIPIENT_TREASURY_OWNER,
    memo: `Demo vendor payment to treasury owner $${displayDollars}`,
    label: `Vendor payment $${displayDollars}`,
  };
}

export const PAY_DEMO_COMMANDS = {
  fast: '/pay 5$',
  timelock: '/pay 20$',
} as const;
