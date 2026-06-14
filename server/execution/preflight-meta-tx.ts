import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MetaTransaction } from '@bloxchain/sdk';
import { BROADCASTER_WALLET_ADDRESS, TREASURY_ADDRESS } from '../config.js';
import { sdkPublicClient } from '../bloxchain.js';
import type { SerializedMetaTransaction } from '../signing/serialize.js';
import { deserializeMetaTransaction } from '../signing/serialize.js';
import { formatExecutionError } from './format-execution-error.js';

const guardControllerAbi = JSON.parse(
  readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      '../../node_modules/@bloxchain/sdk/dist/abi/GuardController.abi.json',
    ),
    'utf8',
  ),
) as readonly unknown[];

export async function preflightRequestAndApproveExecution(
  serialized: SerializedMetaTransaction,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const signedMetaTx: MetaTransaction = deserializeMetaTransaction(serialized);

  try {
    await sdkPublicClient.simulateContract({
      address: TREASURY_ADDRESS,
      abi: guardControllerAbi,
      functionName: 'requestAndApproveExecution',
      args: [signedMetaTx],
      account: BROADCASTER_WALLET_ADDRESS,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: formatExecutionError(error) };
  }
}
