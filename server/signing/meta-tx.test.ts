import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { keccak256, toBytes } from 'viem';

const isAgentPolicySigningConfigured = vi.hoisted(() => vi.fn());

vi.mock('../config.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../config.js')>();
  return {
    ...actual,
    REBALANCE_OPERATION_TYPE: '',
    REBALANCE_EXECUTION_TARGET: '0x2222222222222222222222222222222222222222',
    REBALANCE_EXECUTION_PARAMS: '0xdeadbeef',
    isAgentPolicySigningConfigured,
  };
});

import {
  getRebalanceExecutionIntent,
  resolveRebalanceOperationType,
  signRebalanceMetaTransaction,
} from './meta-tx.js';

describe('resolveRebalanceOperationType', () => {
  it('defaults to keccak256(flowId)', () => {
    const op = resolveRebalanceOperationType('rebalance-sepolia-v1');
    expect(op).toBe(keccak256(toBytes('rebalance-sepolia-v1')));
  });
});

describe('getRebalanceExecutionIntent', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns null when selector env is missing', () => {
    expect(getRebalanceExecutionIntent('rebalance-sepolia-v1')).toBeNull();
  });

  it('returns intent when selector env is set', () => {
    vi.stubEnv('LIFI_EXECUTION_SELECTOR', '0x12345678');

    const intent = getRebalanceExecutionIntent('rebalance-sepolia-v1');
    expect(intent).not.toBeNull();
    expect(intent?.target).toBe('0x2222222222222222222222222222222222222222');
    expect(intent?.executionSelector).toBe('0x12345678');
    expect(intent?.gasLimit).toBe(1_000_000n);
  });
});

describe('signRebalanceMetaTransaction', () => {
  beforeEach(() => {
    isAgentPolicySigningConfigured.mockReturnValue(false);
  });

  it('returns MISSING_AGENT_KEY when AGENT_POLICY key is unset', async () => {
    const result = await signRebalanceMetaTransaction({ flowId: 'rebalance-sepolia-v1' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('MISSING_AGENT_KEY');
    }
  });

  it('returns MISSING_EXECUTION_CONFIG when intent cannot be resolved', async () => {
    isAgentPolicySigningConfigured.mockReturnValue(true);

    const result = await signRebalanceMetaTransaction({ flowId: 'rebalance-sepolia-v1' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('MISSING_EXECUTION_CONFIG');
    }
  });
});
