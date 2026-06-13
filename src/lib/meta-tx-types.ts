/** JSON-safe meta-transaction returned by propose_rebalance signing (bigint → string). */
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
