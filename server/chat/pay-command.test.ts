import { afterEach, describe, expect, it, vi } from 'vitest';
import { parsePaySlashCommand, PAY_DEMO_COMMANDS } from './pay-command.js';

describe('parsePaySlashCommand', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('parses /pay 5$ as B-fast amount', () => {
    const parsed = parsePaySlashCommand('/pay 5$');
    expect(parsed).not.toBeNull();
    expect(parsed?.amountUsdc).toBe('5000000');
    expect(parsed?.paymentPath).toBe('B-fast');
  });

  it('parses /pay 20$ as B-timelock amount', () => {
    const parsed = parsePaySlashCommand('/pay 20$');
    expect(parsed).not.toBeNull();
    expect(parsed?.amountUsdc).toBe('20000000');
    expect(parsed?.paymentPath).toBe('B-timelock');
  });

  it('accepts $ prefix and usdc suffix', () => {
    expect(parsePaySlashCommand('/pay $5')?.amountUsdc).toBe('5000000');
    expect(parsePaySlashCommand('/pay 20 usdc')?.amountUsdc).toBe('20000000');
  });

  it('returns null for bare /pay', () => {
    expect(parsePaySlashCommand('/pay')).toBeNull();
    expect(parsePaySlashCommand('/pay vendor')).toBeNull();
  });

  it('exports demo command constants', () => {
    expect(PAY_DEMO_COMMANDS.fast).toBe('/pay 5$');
    expect(PAY_DEMO_COMMANDS.timelock).toBe('/pay 20$');
  });
});
