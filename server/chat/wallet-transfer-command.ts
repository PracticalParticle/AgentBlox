/** Fixed demo amount for /deposit and /withdraw (connected Dynamic wallet). */
export const WALLET_TRANSFER_AMOUNT_ETH = '0.01';

export const WALLET_TRANSFER_AMOUNT_WEI = 10_000_000_000_000_000n;

export type WalletTransferDirection = 'deposit' | 'withdraw';

export function parseWalletTransferCommand(text: string): WalletTransferDirection | null {
  const msg = text.trim().toLowerCase();
  if (msg.startsWith('/deposit')) {
    return 'deposit';
  }
  if (msg.startsWith('/withdraw') || msg.startsWith('/withdrawal')) {
    return 'withdraw';
  }
  return null;
}

export function walletTransferLabel(direction: WalletTransferDirection): string {
  return direction === 'deposit'
    ? `Deposit ${WALLET_TRANSFER_AMOUNT_ETH} ETH (connected wallet → treasury)`
    : `Withdraw ${WALLET_TRANSFER_AMOUNT_ETH} ETH (treasury → connected wallet, timelock)`;
}
