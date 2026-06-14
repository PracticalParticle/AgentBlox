import {
  GUARD_CONTROLLER_FUNCTION_SELECTORS,
  MetaTransactionSigner,
  TxAction,
  type Address,
  type Hex,
} from '@bloxchain/sdk';
import { privateKeyToAccount } from 'viem/accounts';
import {
  APPROVER_PRIVATE_KEY,
  ERC20_TRANSFER_SELECTOR,
  isApproverConfigured,
  SEPOLIA_USDC,
  TREASURY_ADDRESS,
} from '../config.js';
import { createGuardController, sdkPublicClient, sdkSepolia } from '../bloxchain.js';
import {
  encodeErc20TransferParams,
  ERC20_TRANSFER_OPERATION_TYPE,
} from '../execution/payment-calldata.js';
import {
  serializeMetaTransaction,
  type SerializedMetaTransaction,
} from './serialize.js';

export type PaymentExecutionIntent = {
  target: Address;
  executionSelector: Hex;
  executionParams: Hex;
  operationType: Hex;
  gasLimit: bigint;
};

export type SignPaymentMetaTxResult =
  | {
      ok: true;
      signedMetaTx: SerializedMetaTransaction;
      signerAddress: Address;
      intent: PaymentExecutionIntent;
    }
  | {
      ok: false;
      reason: string;
      code: 'MISSING_APPROVER_KEY' | 'SIGNING_FAILED';
    };

function buildPaymentIntent(recipient: Address, amount: bigint): PaymentExecutionIntent {
  return {
    target: SEPOLIA_USDC,
    executionSelector: ERC20_TRANSFER_SELECTOR,
    executionParams: encodeErc20TransferParams(recipient, amount),
    operationType: ERC20_TRANSFER_OPERATION_TYPE,
    gasLimit: 200_000n,
  };
}

async function signWithApprover(params: {
  handlerSelector: Hex;
  txAction: TxAction;
  txParams: {
    requester: Address;
    target: Address;
    value: bigint;
    gasLimit: bigint;
    operationType: Hex;
    executionSelector: Hex;
    executionParams: Hex;
  };
  existingTxId?: bigint;
}): Promise<SignPaymentMetaTxResult> {
  if (!isApproverConfigured()) {
    return {
      ok: false,
      code: 'MISSING_APPROVER_KEY',
      reason:
        'Set APPROVER_PRIVATE_KEY in .env — must match on-chain APPROVER role on USDC transfer selector.',
    };
  }

  try {
    const account = privateKeyToAccount(APPROVER_PRIVATE_KEY);
    const signerAddress = account.address;
    const guardController = createGuardController();
    const metaTxSigner = new MetaTransactionSigner(
      sdkPublicClient,
      undefined,
      TREASURY_ADDRESS,
      sdkSepolia,
    );

    const metaTxParams = await guardController.createMetaTxParams(
      TREASURY_ADDRESS,
      params.handlerSelector,
      params.txAction,
      3600n,
      0n,
      signerAddress,
    );

    const unsignedMetaTx =
      params.existingTxId !== undefined
        ? await metaTxSigner.createUnsignedMetaTransactionForExisting(
            params.existingTxId,
            metaTxParams,
          )
        : await metaTxSigner.createUnsignedMetaTransactionForNew(
            { ...params.txParams, requester: signerAddress },
            metaTxParams,
          );

    const signedMetaTx = await metaTxSigner.signMetaTransaction(
      unsignedMetaTx,
      signerAddress,
      APPROVER_PRIVATE_KEY,
    );

    return {
      ok: true,
      signedMetaTx: serializeMetaTransaction(signedMetaTx),
      signerAddress,
      intent: {
        target: params.txParams.target,
        executionSelector: params.txParams.executionSelector,
        executionParams: params.txParams.executionParams,
        operationType: params.txParams.operationType,
        gasLimit: params.txParams.gasLimit,
      },
    };
  } catch (error) {
    return {
      ok: false,
      code: 'SIGNING_FAILED',
      reason: error instanceof Error ? error.message : 'Payment meta-tx signing failed',
    };
  }
}

/** B-fast: APPROVER signs requestAndApprove for USDC transfer (Broadcaster submits). */
export async function signPaymentInstantMetaTransaction(params: {
  recipient: Address;
  amount: bigint;
}): Promise<SignPaymentMetaTxResult> {
  const intent = buildPaymentIntent(params.recipient, params.amount);

  return signWithApprover({
    handlerSelector: GUARD_CONTROLLER_FUNCTION_SELECTORS.REQUEST_AND_APPROVE_EXECUTION_SELECTOR,
    txAction: TxAction.SIGN_META_REQUEST_AND_APPROVE,
    txParams: {
      requester: '0x0000000000000000000000000000000000000000' as Address,
      target: intent.target,
      value: 0n,
      gasLimit: intent.gasLimit,
      operationType: intent.operationType,
      executionSelector: intent.executionSelector,
      executionParams: intent.executionParams,
    },
  });
}

/** B-timelock: APPROVER signs approveTimeLockExecutionWithMetaTx for an existing PENDING tx. */
export async function signPaymentTimelockApproveMetaTransaction(params: {
  txId: bigint;
}): Promise<SignPaymentMetaTxResult> {
  if (!isApproverConfigured()) {
    return {
      ok: false,
      code: 'MISSING_APPROVER_KEY',
      reason:
        'Set APPROVER_PRIVATE_KEY in .env — must match on-chain APPROVER role on USDC transfer selector.',
    };
  }

  const account = privateKeyToAccount(APPROVER_PRIVATE_KEY);

  return signWithApprover({
    handlerSelector: GUARD_CONTROLLER_FUNCTION_SELECTORS.APPROVE_TIMELOCK_EXECUTION_META_SELECTOR,
    txAction: TxAction.SIGN_META_APPROVE,
    existingTxId: params.txId,
    txParams: {
      requester: account.address,
      target: SEPOLIA_USDC,
      value: 0n,
      gasLimit: 200_000n,
      operationType: ERC20_TRANSFER_OPERATION_TYPE,
      executionSelector: ERC20_TRANSFER_SELECTOR,
      executionParams: '0x' as Hex,
    },
  });
}
