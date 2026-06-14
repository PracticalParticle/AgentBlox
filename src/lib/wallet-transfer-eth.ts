import { GUARD_CONTROLLER_FUNCTION_SELECTORS } from '@bloxchain/sdk';
import { isEthereumWallet } from '@dynamic-labs/ethereum';
import type { Wallet } from '@dynamic-labs/sdk-react-core';
import {
  keccak256,
  toBytes,
  type Address,
  type Hash,
  type Hex,
  type WalletClient,
  parseEther,
} from 'viem';
import { sepolia } from 'viem/chains';

const NATIVE_TRANSFER_OPERATION_TYPE = keccak256(toBytes('NATIVE_TRANSFER')) as Hex;

const EXECUTE_WITH_TIMELOCK_ABI = [
  {
    type: 'function',
    name: 'executeWithTimeLock',
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'functionSelector', type: 'bytes4' },
      { name: 'params', type: 'bytes' },
      { name: 'gasLimit', type: 'uint256' },
      { name: 'operationType', type: 'bytes32' },
    ],
    outputs: [{ name: 'txId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
] as const;

type EthereumDynamicWallet = Wallet & {
  sendBalance: (params: { amount: string; toAddress: string }) => Promise<Hash>;
  getWalletClient: (chainId?: string) => Promise<WalletClient>;
};

export type WalletTransferExecutionResult =
  | { ok: true; hash: Hash; txId?: string }
  | { ok: false; reason: string };

function requireEthereumWallet(wallet: Wallet | null | undefined): EthereumDynamicWallet {
  if (!wallet || !isEthereumWallet(wallet)) {
    throw new Error('Connect an Ethereum wallet via Dynamic in the header.');
  }
  return wallet as EthereumDynamicWallet;
}

export async function executeWalletDeposit(params: {
  wallet: Wallet | null | undefined;
  treasuryAddress: Address;
  amountEth?: string;
}): Promise<WalletTransferExecutionResult> {
  try {
    const wallet = requireEthereumWallet(params.wallet);
    const amount = params.amountEth ?? '0.01';
    const hash = (await wallet.sendBalance({
      amount,
      toAddress: params.treasuryAddress,
    })) as Hash;

    return { ok: true, hash };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Deposit transaction failed',
    };
  }
}

export async function executeWalletWithdrawRequest(params: {
  wallet: Wallet | null | undefined;
  treasuryAddress: Address;
  amountEth?: string;
}): Promise<WalletTransferExecutionResult> {
  try {
    const wallet = requireEthereumWallet(params.wallet);
    const recipient = wallet.address as Address;
    const amountEth = params.amountEth ?? '0.01';
    const walletClient = await wallet.getWalletClient(String(sepolia.id));
    const value = parseEther(amountEth);

    const hash = await walletClient.writeContract({
      account: recipient,
      address: params.treasuryAddress,
      abi: EXECUTE_WITH_TIMELOCK_ABI,
      functionName: 'executeWithTimeLock',
      args: [
        recipient,
        value,
        GUARD_CONTROLLER_FUNCTION_SELECTORS.NATIVE_TRANSFER_SELECTOR,
        '0x' as Hex,
        200_000n,
        NATIVE_TRANSFER_OPERATION_TYPE,
      ],
      chain: sepolia,
    });

    return { ok: true, hash };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Withdraw request failed',
    };
  }
}
