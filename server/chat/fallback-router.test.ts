import { describe, expect, it } from 'vitest';
import { formatToolResult, routeUserMessage } from './fallback-router.js';

describe('routeUserMessage', () => {
  it('routes slash commands to treasury tools', () => {
    expect(routeUserMessage('/status')?.tool).toBe('get_treasury_status');
    expect(routeUserMessage('/pending')?.tool).toBe('list_pending_approvals');
    expect(routeUserMessage('/whitelist')?.tool).toBe('get_whitelisted_targets');
    expect(routeUserMessage('/rebalance')?.tool).toBe('propose_rebalance');
    expect(routeUserMessage('/quote')?.tool).toBe('get_lifi_quote_preview');
    expect(routeUserMessage('/pay')?.tool).toBe('request_vendor_payment');
    expect(routeUserMessage('/attack')?.tool).toBe('simulate_policy_violation');
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
