import { afterEach, describe, expect, it, vi } from 'vitest';
import { parsePaySlashCommand, PAY_DEMO_COMMANDS, PAY_RECIPIENT_TREASURY_OWNER } from './pay-command.js';

describe('parsePaySlashCommand', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('parses /pay 5$ as human dollar amount', () => {
    const parsed = parsePaySlashCommand('/pay 5$');
    expect(parsed).not.toBeNull();
    expect(parsed?.amountDollars).toBe('5');
    expect(parsed?.displayDollars).toBe('5');
    expect(parsed?.recipient).toBe(PAY_RECIPIENT_TREASURY_OWNER);
  });

  it('parses /pay 20$ as human dollar amount', () => {
    const parsed = parsePaySlashCommand('/pay 20$');
    expect(parsed).not.toBeNull();
    expect(parsed?.amountDollars).toBe('20');
  });

  it('accepts $ prefix and usdc suffix', () => {
    expect(parsePaySlashCommand('/pay $5')?.amountDollars).toBe('5');
    expect(parsePaySlashCommand('/pay 20 usdc')?.amountDollars).toBe('20');
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
