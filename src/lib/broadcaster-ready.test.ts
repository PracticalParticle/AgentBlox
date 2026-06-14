import { describe, expect, it } from 'vitest';
import {
  broadcasterNotReadyMessage,
  broadcasterWalletAddress,
  isBroadcasterReady,
} from './broadcaster-ready';
import type { ServerHealth } from '../hooks/useServerHealth';

const baseHealth: ServerHealth = {
  status: 'ok',
  service: 'agentblox',
  llmEnabled: false,
  treasuryConfigured: true,
  mode: 'development',
};

describe('isBroadcasterReady', () => {
  it('is true when configured and on-chain match is not false', () => {
    expect(
      isBroadcasterReady({
        ...baseHealth,
        dynamicBroadcasterConfigured: true,
        broadcaster: { configured: true, message: 'ok', matchesOnChainBroadcaster: true },
      }),
    ).toBe(true);
  });

  it('is false when Dynamic Broadcaster env is missing', () => {
    expect(
      isBroadcasterReady({
        ...baseHealth,
        dynamicBroadcasterConfigured: false,
        broadcaster: { configured: false, message: 'missing token', matchesOnChainBroadcaster: null },
      }),
    ).toBe(false);
  });

  it('is false when on-chain Broadcaster role mismatches', () => {
    expect(
      isBroadcasterReady({
        ...baseHealth,
        dynamicBroadcasterConfigured: true,
        broadcaster: {
          configured: true,
          message: 'mismatch',
          matchesOnChainBroadcaster: false,
        },
      }),
    ).toBe(false);
  });
});

describe('broadcasterNotReadyMessage', () => {
  it('returns server message when env is missing', () => {
    expect(
      broadcasterNotReadyMessage({
        ...baseHealth,
        dynamicBroadcasterConfigured: false,
        broadcaster: { configured: false, message: 'Set BROADCASTER_WALLET_ADDRESS', matchesOnChainBroadcaster: null },
      }),
    ).toBe('Set BROADCASTER_WALLET_ADDRESS');
  });

  it('returns mismatch guidance when on-chain role differs', () => {
    expect(
      broadcasterNotReadyMessage({
        ...baseHealth,
        dynamicBroadcasterConfigured: true,
        broadcaster: { configured: true, message: 'ok', matchesOnChainBroadcaster: false },
      }),
    ).toContain('does not match on-chain Broadcaster');
  });
});

describe('broadcasterWalletAddress', () => {
  it('returns wallet address from health', () => {
    expect(
      broadcasterWalletAddress({
        ...baseHealth,
        broadcaster: {
          configured: true,
          message: 'ok',
          matchesOnChainBroadcaster: true,
          walletAddress: '0xabc',
        },
      }),
    ).toBe('0xabc');
  });
});
