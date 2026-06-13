import { describe, expect, it } from 'vitest';
import { splitExecutionCalldata } from './calldata.js';
import { isKnownRebalanceFlowId } from './flows.js';

describe('splitExecutionCalldata', () => {
  it('splits selector and params', () => {
    const { executionSelector, executionParams } = splitExecutionCalldata(
      '0x12345678abcdef0000000000000000000000000000000000000000000000000001',
    );
    expect(executionSelector).toBe('0x12345678');
    expect(executionParams).toMatch(/^0xabcdef/);
  });

  it('handles selector-only calldata', () => {
    const { executionSelector, executionParams } = splitExecutionCalldata('0x12345678');
    expect(executionSelector).toBe('0x12345678');
    expect(executionParams).toBe('0x');
  });
});

describe('isKnownRebalanceFlowId', () => {
  it('accepts rebalance-sepolia-v1', () => {
    expect(isKnownRebalanceFlowId('rebalance-sepolia-v1')).toBe(true);
  });

  it('rejects unknown flows', () => {
    expect(isKnownRebalanceFlowId('drain-vault')).toBe(false);
  });
});
