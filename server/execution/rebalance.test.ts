import { describe, expect, it, vi } from 'vitest';
import type { MetaTransaction } from '@bloxchain/sdk';

const { isDynamicBroadcasterConfigured, getBroadcasterWalletClient } = vi.hoisted(() => ({
  isDynamicBroadcasterConfigured: vi.fn(),
  getBroadcasterWalletClient: vi.fn(),
}));

vi.mock('../config.js', () => ({
  isDynamicBroadcasterConfigured,
  BROADCASTER_WALLET_ADDRESS: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  TREASURY_ADDRESS: '0xA6568F40d89E5c72E8142339Ff85Ad6E308925F3',
}));

vi.mock('../dynamic/broadcaster.js', () => ({
  getBroadcasterWalletClient,
}));

vi.mock('@bloxchain/sdk', () => ({
  GuardController: vi.fn().mockImplementation(() => ({
    requestAndApproveExecution: vi.fn(),
  })),
}));

vi.mock('../bloxchain.js', () => ({
  sdkPublicClient: {},
  sdkSepolia: {},
}));

import { executeRebalanceWithBroadcaster } from './rebalance.js';

const signedMetaTx = {} as MetaTransaction;

describe('executeRebalanceWithBroadcaster', () => {
  it('returns reason when Dynamic Broadcaster is not configured', async () => {
    isDynamicBroadcasterConfigured.mockReturnValue(false);

    const result = await executeRebalanceWithBroadcaster(signedMetaTx);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('Dynamic Broadcaster not configured');
    }
    expect(getBroadcasterWalletClient).not.toHaveBeenCalled();
  });
});
