import { describe, expect, it } from 'vitest';
import {
  parseWalletTransferCommand,
  WALLET_TRANSFER_AMOUNT_ETH,
  walletTransferLabel,
} from './wallet-transfer-command.js';

describe('parseWalletTransferCommand', () => {
  it('parses /deposit', () => {
    expect(parseWalletTransferCommand('/deposit')).toBe('deposit');
    expect(parseWalletTransferCommand('/DEPOSIT')).toBe('deposit');
  });

  it('parses /withdraw and /withdrawal', () => {
    expect(parseWalletTransferCommand('/withdraw')).toBe('withdraw');
    expect(parseWalletTransferCommand('/withdrawal')).toBe('withdraw');
  });

  it('returns null for unrelated commands', () => {
    expect(parseWalletTransferCommand('/status')).toBeNull();
    expect(parseWalletTransferCommand('/pay 5$')).toBeNull();
  });
});

describe('walletTransferLabel', () => {
  it('includes fixed demo amount', () => {
    expect(walletTransferLabel('deposit')).toContain(WALLET_TRANSFER_AMOUNT_ETH);
    expect(walletTransferLabel('withdraw')).toContain(WALLET_TRANSFER_AMOUNT_ETH);
  });
});
