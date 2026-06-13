import type { MetaTransaction, MetaTxParams, PaymentDetails, TxParams } from '@bloxchain/sdk';

/** JSON-safe meta-transaction (bigint → string). */
export type SerializedMetaTransaction = {
  txRecord: {
    txId: string;
    releaseTime: string;
    status: number;
    params: {
      requester: string;
      target: string;
      value: string;
      gasLimit: string;
      operationType: string;
      executionSelector: string;
      executionParams: string;
    };
    message: string;
    resultHash: string;
    payment: {
      recipient: string;
      nativeTokenAmount: string;
      erc20TokenAddress: string;
      erc20TokenAmount: string;
    };
  };
  params: {
    chainId: string;
    nonce: string;
    handlerContract: string;
    handlerSelector: string;
    action: number;
    deadline: string;
    maxGasPrice: string;
    signer: string;
  };
  message: string;
  signature: string;
  data: string;
};

function serializeTxParams(params: TxParams) {
  return {
    requester: params.requester,
    target: params.target,
    value: params.value.toString(),
    gasLimit: params.gasLimit.toString(),
    operationType: params.operationType,
    executionSelector: params.executionSelector,
    executionParams: params.executionParams,
  };
}

function serializePayment(payment: PaymentDetails) {
  return {
    recipient: payment.recipient,
    nativeTokenAmount: payment.nativeTokenAmount.toString(),
    erc20TokenAddress: payment.erc20TokenAddress,
    erc20TokenAmount: payment.erc20TokenAmount.toString(),
  };
}

function serializeMetaTxParams(params: MetaTxParams) {
  return {
    chainId: params.chainId.toString(),
    nonce: params.nonce.toString(),
    handlerContract: params.handlerContract,
    handlerSelector: params.handlerSelector,
    action: Number(params.action),
    deadline: params.deadline.toString(),
    maxGasPrice: params.maxGasPrice.toString(),
    signer: params.signer,
  };
}

export function serializeMetaTransaction(metaTx: MetaTransaction): SerializedMetaTransaction {
  return {
    txRecord: {
      txId: metaTx.txRecord.txId.toString(),
      releaseTime: metaTx.txRecord.releaseTime.toString(),
      status: Number(metaTx.txRecord.status),
      params: serializeTxParams(metaTx.txRecord.params),
      message: metaTx.txRecord.message,
      resultHash: metaTx.txRecord.resultHash,
      payment: serializePayment(metaTx.txRecord.payment),
    },
    params: serializeMetaTxParams(metaTx.params),
    message: metaTx.message,
    signature: metaTx.signature,
    data: metaTx.data ?? '0x',
  };
}

export function deserializeMetaTransaction(serialized: SerializedMetaTransaction): MetaTransaction {
  const p = serialized.txRecord.params;
  const pay = serialized.txRecord.payment;
  const mp = serialized.params;

  return {
    txRecord: {
      txId: BigInt(serialized.txRecord.txId),
      releaseTime: BigInt(serialized.txRecord.releaseTime),
      status: serialized.txRecord.status as MetaTransaction['txRecord']['status'],
      params: {
        requester: p.requester as TxParams['requester'],
        target: p.target as TxParams['target'],
        value: BigInt(p.value),
        gasLimit: BigInt(p.gasLimit),
        operationType: p.operationType as TxParams['operationType'],
        executionSelector: p.executionSelector as TxParams['executionSelector'],
        executionParams: p.executionParams as TxParams['executionParams'],
      },
      message: serialized.txRecord.message as MetaTransaction['txRecord']['message'],
      resultHash: serialized.txRecord.resultHash as MetaTransaction['txRecord']['resultHash'],
      payment: {
        recipient: pay.recipient as PaymentDetails['recipient'],
        nativeTokenAmount: BigInt(pay.nativeTokenAmount),
        erc20TokenAddress: pay.erc20TokenAddress as PaymentDetails['erc20TokenAddress'],
        erc20TokenAmount: BigInt(pay.erc20TokenAmount),
      },
    },
    params: {
      chainId: BigInt(mp.chainId),
      nonce: BigInt(mp.nonce),
      handlerContract: mp.handlerContract as MetaTxParams['handlerContract'],
      handlerSelector: mp.handlerSelector as MetaTxParams['handlerSelector'],
      action: mp.action as MetaTxParams['action'],
      deadline: BigInt(mp.deadline),
      maxGasPrice: BigInt(mp.maxGasPrice),
      signer: mp.signer as MetaTxParams['signer'],
    },
    message: serialized.message as MetaTransaction['message'],
    signature: serialized.signature as MetaTransaction['signature'],
    data: serialized.data as MetaTransaction['data'],
  };
}
