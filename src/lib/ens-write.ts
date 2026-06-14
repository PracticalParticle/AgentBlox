import { isEthereumWallet } from '@dynamic-labs/ethereum';
import type { Wallet } from '@dynamic-labs/sdk-react-core';
import {
  type Address,
  type Hash,
  type Hex,
  type WalletClient,
} from 'viem';
import { mainnet } from 'viem/chains';
import { namehash, normalize } from 'viem/ens';
import { ENS_TEXT_KEYS } from './config';
import { createMainnetPublicClient } from './mainnet-client';

const PUBLIC_RESOLVER_ABI = [
  {
    type: 'function',
    name: 'setAddr',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'a', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setText',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

export const DEFAULT_ENS_POLICY_VERSION = '1.0.0';
export const DEFAULT_ENS_APP = 'agentblox';
export const DEFAULT_ENS_ALLOWED_FLOWS = 'rebalance-sepolia-v1';

export type EnsWriteParams = {
  ensName: string;
  treasuryAddress: Address;
  policyVersion?: string;
  allowedFlows?: string;
  app?: string;
};

type EthereumDynamicWallet = Wallet & {
  getWalletClient: (chainId?: string) => Promise<WalletClient>;
};

export type EnsWriteProgress = {
  step: string;
  hash?: Hash;
};

export type EnsWriteResult =
  | { ok: true; hashes: Hash[] }
  | { ok: false; reason: string; step?: string };

function requireEthereumWallet(wallet: Wallet | null | undefined): EthereumDynamicWallet {
  if (!wallet || !isEthereumWallet(wallet)) {
    throw new Error('Connect your Dynamic wallet — it must own the ENS name on mainnet.');
  }
  return wallet as EthereumDynamicWallet;
}

export function buildEnsTextRecords(params: EnsWriteParams): Record<string, string> {
  return {
    [ENS_TEXT_KEYS.policyVersion]: params.policyVersion ?? DEFAULT_ENS_POLICY_VERSION,
    [ENS_TEXT_KEYS.allowedFlows]: params.allowedFlows ?? DEFAULT_ENS_ALLOWED_FLOWS,
    [ENS_TEXT_KEYS.app]: params.app ?? DEFAULT_ENS_APP,
  };
}

async function resolveEnsResolver(ensName: string): Promise<Address> {
  const client = createMainnetPublicClient();
  const normalized = normalize(ensName);
  const resolver = await client.getEnsResolver({ name: normalized });
  if (!resolver) {
    throw new Error(`No ENS resolver found for ${ensName}. Register the name on mainnet first.`);
  }
  return resolver;
}

export async function writeEnsTreasuryRecords(params: {
  wallet: Wallet | null | undefined;
  records: EnsWriteParams;
  onProgress?: (progress: EnsWriteProgress) => void;
}): Promise<EnsWriteResult> {
  try {
    const wallet = requireEthereumWallet(params.wallet);
    const walletClient = await wallet.getWalletClient(String(mainnet.id));
    const account = wallet.address as Address;
    const normalized = normalize(params.records.ensName);
    const node = namehash(normalized) as Hex;
    const resolver = await resolveEnsResolver(params.records.ensName);
    const hashes: Hash[] = [];

    const report = (step: string, hash: Hash) => {
      hashes.push(hash);
      params.onProgress?.({ step, hash });
    };

    const addrHash = await walletClient.writeContract({
      account,
      address: resolver,
      abi: PUBLIC_RESOLVER_ABI,
      functionName: 'setAddr',
      args: [node, params.records.treasuryAddress],
      chain: mainnet,
    });
    report('setAddr', addrHash);

    const textRecords = buildEnsTextRecords(params.records);
    for (const [key, value] of Object.entries(textRecords)) {
      const hash = await walletClient.writeContract({
        account,
        address: resolver,
        abi: PUBLIC_RESOLVER_ABI,
        functionName: 'setText',
        args: [node, key, value],
        chain: mainnet,
      });
      report(`setText:${key}`, hash);
    }

    return { ok: true, hashes };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'ENS write failed',
    };
  }
}
