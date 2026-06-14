import { afterEach, describe, expect, it, vi } from 'vitest';

describe('dynamic-config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('detects configured environment id', async () => {
    vi.stubEnv('VITE_DYNAMIC_ENVIRONMENT_ID', '48a9cd89-4e6c-4fdf-ad53-e5461c5fd95c');
    const { isDynamicEnvironmentConfigured } = await import('./dynamic-config.js');
    expect(isDynamicEnvironmentConfigured()).toBe(true);
  });

  it('rejects missing or placeholder ids', async () => {
    vi.stubEnv('VITE_DYNAMIC_ENVIRONMENT_ID', '');
    const { isDynamicEnvironmentConfigured } = await import('./dynamic-config.js');
    expect(isDynamicEnvironmentConfigured()).toBe(false);
  });
});
