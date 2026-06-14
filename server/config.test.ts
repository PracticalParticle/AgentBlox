import { afterEach, describe, expect, it, vi } from 'vitest';

const TEST_KEY =
  '0xac0974beb39a17e36ba4a4ba40dad0ae22bd3a6d8bd3e804ae1e7e3a8e0b8f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9';

describe('config helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadConfig() {
    return import('./config.js');
  }

  it('isTreasuryConfigured requires 42-char hex address', async () => {
    vi.stubEnv('TREASURY_ADDRESS', '0xA6568F40d89E5c72E8142339Ff85Ad6E308925F3');
    const { isTreasuryConfigured } = await loadConfig();
    expect(isTreasuryConfigured()).toBe(true);

    vi.resetModules();
    vi.stubEnv('TREASURY_ADDRESS', 'not-valid');
    const cfg2 = await loadConfig();
    expect(cfg2.isTreasuryConfigured()).toBe(false);
  });

  it('isDynamicEnvironmentConfigured reads VITE_DYNAMIC_ENVIRONMENT_ID', async () => {
    vi.stubEnv('VITE_DYNAMIC_ENVIRONMENT_ID', '48a9cd89-4e6c-4fdf-ad53-e5461c5fd95c');
    const { isDynamicEnvironmentConfigured } = await loadConfig();
    expect(isDynamicEnvironmentConfigured()).toBe(true);
  });

  it('isDynamicBroadcasterConfigured requires token, env id, and wallet address', async () => {
    vi.stubEnv('VITE_DYNAMIC_ENVIRONMENT_ID', '48a9cd89-4e6c-4fdf-ad53-e5461c5fd95c');
    vi.stubEnv('DYNAMIC_API_TOKEN', 'token');
    vi.stubEnv('BROADCASTER_WALLET_ADDRESS', '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB');
    const { isDynamicBroadcasterConfigured } = await loadConfig();
    expect(isDynamicBroadcasterConfigured()).toBe(true);
  });

  it('isAnalystConfigured and isApproverConfigured require private key hex', async () => {
    vi.stubEnv('ANALYST_PRIVATE_KEY', TEST_KEY);
    vi.stubEnv('APPROVER_PRIVATE_KEY', TEST_KEY);
    const cfg = await loadConfig();
    expect(cfg.isAnalystConfigured()).toBe(true);
    expect(cfg.isApproverConfigured()).toBe(true);

    vi.resetModules();
    vi.stubEnv('ANALYST_PRIVATE_KEY', '');
    vi.stubEnv('APPROVER_PRIVATE_KEY', '');
    const cfg2 = await loadConfig();
    expect(cfg2.isAnalystConfigured()).toBe(false);
    expect(cfg2.isApproverConfigured()).toBe(false);
  });

  it('PAYMENT_INSTANT_MAX_USDC defaults to 10 USDC units', async () => {
    const { PAYMENT_INSTANT_MAX_USDC } = await loadConfig();
    expect(PAYMENT_INSTANT_MAX_USDC).toBe(10_000_000n);
  });

  it('isLifiComposeConfigured is always true; isLifiApiKeyConfigured tracks LIFI_API_KEY', async () => {
    vi.stubEnv('LIFI_API_KEY', '');
    const { isLifiComposeConfigured, isLifiApiKeyConfigured } = await loadConfig();
    expect(isLifiComposeConfigured()).toBe(true);
    expect(isLifiApiKeyConfigured()).toBe(false);

    vi.resetModules();
    vi.stubEnv('LIFI_API_KEY', 'test-key');
    const cfg2 = await loadConfig();
    expect(cfg2.isLifiComposeConfigured()).toBe(true);
    expect(cfg2.isLifiApiKeyConfigured()).toBe(true);
  });

  it('getWhitelistSelectors always includes ERC-20 transfer', async () => {
    vi.stubEnv('LIFI_EXECUTION_SELECTOR', '');
    const { getWhitelistSelectors } = await loadConfig();
    const selectors = getWhitelistSelectors();
    expect(selectors.some((s) => s.selector === '0xa9059cbb')).toBe(true);
  });
});
