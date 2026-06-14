import { describe, expect, it } from 'vitest';
import { buildEnsTextRecords, DEFAULT_ENS_ALLOWED_FLOWS } from './ens-write';

describe('buildEnsTextRecords', () => {
  it('uses defaults when optional fields omitted', () => {
    const records = buildEnsTextRecords({
      ensName: 'treasury.example.eth',
      treasuryAddress: '0xA6568F40d89E5c72E8142339Ff85Ad6E308925F3',
    });
    expect(records['bloxchain.allowedFlows']).toBe(DEFAULT_ENS_ALLOWED_FLOWS);
    expect(records['bloxchain.policyVersion']).toBe('1.0.0');
    expect(records['bloxchain.app']).toBe('agentblox');
  });

  it('accepts custom policy fields', () => {
    const records = buildEnsTextRecords({
      ensName: 'treasury.example.eth',
      treasuryAddress: '0xA6568F40d89E5c72E8142339Ff85Ad6E308925F3',
      allowedFlows: 'rebalance-sepolia-v1,custom-flow',
      policyVersion: '2.0.0',
      app: 'demo',
    });
    expect(records['bloxchain.allowedFlows']).toBe('rebalance-sepolia-v1,custom-flow');
    expect(records['bloxchain.policyVersion']).toBe('2.0.0');
    expect(records['bloxchain.app']).toBe('demo');
  });
});
