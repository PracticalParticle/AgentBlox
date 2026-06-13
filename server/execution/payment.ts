import { GuardController, type PublicClient, type WalletClient } from '@bloxchain/sdk';
import { createWalletClient, http, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { createGuardController, sdkPublicClient, sdkSepolia } from '../bloxchain.js';
import {
  ANALYST_PRIVATE_KEY,
  ERC20_TRANSFER_SELECTOR,
  isAnalystConfigured,
  SEPOLIA_RPC_URL,
  SEPOLIA_USDC,
  TREASURY_ADDRESS,
} from '../config.js';
import {
  encodeErc20TransferParams,
  ERC20_TRANSFER_OPERATION_TYPE,
} from './payment-calldata.js';
import { extractTxIdFromReceipt } from './tx-id.js';

export type VendorPaymentOnChainResult =
  | {
      ok: true;
      txId: string;
      hash: string;
      releaseTime: string;
      releaseTimeIso: string | null;
      requester: Address;
    }
  | {
      ok: false;
      code: 'MISSING_ANALYST_KEY' | 'INVALID_RECIPIENT' | 'SUBMIT_FAILED';
      reason: string;
    };

export async function requestVendorPaymentOnChain(params: {
  recipient: Address;
  amount: bigint;
}): Promise<VendorPaymentOnChainResult> {
  if (!isAnalystConfigured()) {
    return {
      ok: false,
      code: 'MISSING_ANALYST_KEY',
      reason:
        'Set ANALYST_PRIVATE_KEY in .env — wallet must hold ANALYST role with EXECUTE_TIME_DELAY_REQUEST on ERC20 transfer.',
    };
  }

  try {
    const account = privateKeyToAccount(ANALYST_PRIVATE_KEY);
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(SEPOLIA_RPC_URL),
    });

    const guardController = new GuardController(
      sdkPublicClient as PublicClient,
      walletClient as unknown as WalletClient,
      TREASURY_ADDRESS,
      sdkSepolia,
    );

    const executionParams = encodeErc20TransferParams(params.recipient, params.amount);

    const result = await guardController.executeWithTimeLock(
      SEPOLIA_USDC,
      0n,
      ERC20_TRANSFER_SELECTOR,
      executionParams,
      200_000n,
      ERC20_TRANSFER_OPERATION_TYPE,
      { from: account.address, gas: 500_000n },
    );

    const receipt = await result.wait();
    const success = receipt.status === 'success';

    if (!success) {
      return {
        ok: false,
        code: 'SUBMIT_FAILED',
        reason: `Timelock request reverted on-chain (hash: ${result.hash})`,
      };
    }

    const txId = extractTxIdFromReceipt(receipt);
    if (txId === null) {
      return {
        ok: false,
        code: 'SUBMIT_FAILED',
        reason: `Timelock tx succeeded but txId could not be read from logs (hash: ${result.hash})`,
      };
    }

    const reader = createGuardController();
    const txRecord = await reader.getTransaction(txId);

    return {
      ok: true,
      txId: txId.toString(),
      hash: result.hash,
      releaseTime: txRecord.releaseTime.toString(),
      releaseTimeIso:
        txRecord.releaseTime > 0n
          ? new Date(Number(txRecord.releaseTime) * 1000).toISOString()
          : null,
      requester: account.address,
    };
  } catch (error) {
    return {
      ok: false,
      code: 'SUBMIT_FAILED',
      reason: error instanceof Error ? error.message : 'Vendor payment timelock request failed',
    };
  }
}
