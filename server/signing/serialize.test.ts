import { describe, expect, it } from 'vitest';
import type { MetaTransaction } from '@bloxchain/sdk';
import { deserializeMetaTransaction, serializeMetaTransaction } from './serialize.js';

const sampleMetaTx: MetaTransaction = {
  txRecord: {
    txId: 42n,
    releaseTime: 1_700_000_000n,
    status: 0,
    params: {
      requester: '0x1111111111111111111111111111111111111111',
      target: '0x2222222222222222222222222222222222222222',
      value: 0n,
      gasLimit: 1_000_000n,
      operationType: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      executionSelector: '0x12345678',
      executionParams: '0xdeadbeef',
    },
    message: '0x',
    resultHash: '0x',
    payment: {
      recipient: '0x3333333333333333333333333333333333333333',
      nativeTokenAmount: 0n,
      erc20TokenAddress: '0x4444444444444444444444444444444444444444',
      erc20TokenAmount: 100n,
    },
  },
  params: {
    chainId: 11155111n,
    nonce: 7n,
    handlerContract: '0x5555555555555555555555555555555555555555',
    handlerSelector: '0xabcdef01',
    action: 2,
    deadline: 1_700_003_600n,
    maxGasPrice: 50_000_000_000n,
    signer: '0x6666666666666666666666666666666666666666',
  },
  message: '0xmsg',
  signature: '0xsig',
  data: '0xdata',
};

describe('serializeMetaTransaction', () => {
  it('round-trips bigint fields as strings', () => {
    const serialized = serializeMetaTransaction(sampleMetaTx);
    expect(serialized.txRecord.txId).toBe('42');
    expect(serialized.txRecord.params.gasLimit).toBe('1000000');
    expect(serialized.params.chainId).toBe('11155111');

    const restored = deserializeMetaTransaction(serialized);
    expect(restored.txRecord.txId).toBe(42n);
    expect(restored.txRecord.params.gasLimit).toBe(1_000_000n);
    expect(restored.params.chainId).toBe(11155111n);
    expect(restored.txRecord.params.requester).toBe(sampleMetaTx.txRecord.params.requester);
  });
});
