import { describe, expect, it } from 'vitest';
import { formatToolResult, routeUserMessage } from './fallback-router.js';
import { PAY_DEMO_COMMANDS, PAY_RECIPIENT_TREASURY_OWNER } from './pay-command.js';

describe('routeUserMessage', () => {
  it('routes slash commands to treasury tools', () => {
    expect(routeUserMessage('/status')?.tool).toBe('get_treasury_status');
    expect(routeUserMessage('/pending')?.tool).toBe('list_pending_approvals');
    expect(routeUserMessage('/whitelist')?.tool).toBe('get_whitelisted_targets');
    expect(routeUserMessage('/rebalance')?.tool).toBe('propose_rebalance');
    expect(routeUserMessage('/quote')?.tool).toBe('get_lifi_quote_preview');
    expect(routeUserMessage('/attack')?.tool).toBe('simulate_policy_violation');
  });

  it('routes /deposit and /withdraw to wallet transfer prep', () => {
    expect(routeUserMessage('/deposit')?.tool).toBe('prepare_wallet_transfer');
    expect(routeUserMessage('/deposit')?.args.direction).toBe('deposit');
    expect(routeUserMessage('/withdraw')?.tool).toBe('prepare_wallet_transfer');
    expect(routeUserMessage('/withdraw')?.args.direction).toBe('withdraw');
    expect(routeUserMessage('/withdrawal')?.args.direction).toBe('withdraw');
  });

  it('routes /pay 5$ and /pay 20$ to vendor payment with distinct amounts', () => {
    const fast = routeUserMessage(PAY_DEMO_COMMANDS.fast);
    const timelock = routeUserMessage(PAY_DEMO_COMMANDS.timelock);

    expect(fast?.tool).toBe('request_vendor_payment');
    expect(fast?.args.amountDollars).toBe('5');
    expect(fast?.args.recipient).toBe(PAY_RECIPIENT_TREASURY_OWNER);
    expect(fast?.label).toContain('$5');

    expect(timelock?.tool).toBe('request_vendor_payment');
    expect(timelock?.args.amountDollars).toBe('20');
  });

  it('returns null for bare /pay', () => {
    expect(routeUserMessage('/pay')).toBeNull();
  });

  it('extracts ENS names from slash commands', () => {
    const routed = routeUserMessage('/ens treasury.eth');
    expect(routed?.tool).toBe('resolve_ens_treasury');
    expect(routed?.args.name).toBe('treasury.eth');
  });

  it('returns null for help and unknown input', () => {
    expect(routeUserMessage('/help')).toBeNull();
    expect(routeUserMessage('random gibberish')).toBeNull();
  });
});

describe('formatToolResult', () => {
  it('wraps tool output in agentblox-tool fenced block', () => {
    const formatted = formatToolResult('get_treasury_status', { configured: true });
    expect(formatted).toContain('```agentblox-tool');
    expect(formatted).toContain('"tool": "get_treasury_status"');
    expect(formatted).toContain('"configured": true');
  });
});
