/**
 * One-off CLI: create a Dynamic server wallet (Broadcaster) via Node SDK.
 * Requires VITE_DYNAMIC_ENVIRONMENT_ID + DYNAMIC_API_TOKEN in .env.
 *
 * Usage: npm run create:broadcaster-wallet
 *        npm run create:broadcaster-wallet -- --force   # overwrite existing JSON
 *
 * Writes metadata to ./data/dynamic-server-wallet.json (gitignored).
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { ThresholdSignatureScheme } from '@dynamic-labs-wallet/node';
import 'dotenv/config';
import { createAuthenticatedDynamicClient } from '../server/dynamic/client.js';

export const DYNAMIC_SERVER_WALLET_JSON = resolve(process.cwd(), 'data/dynamic-server-wallet.json');

type WalletRecord = {
  createdAt: string;
  role: 'Broadcaster';
  network: 'sepolia';
  environmentId: string;
  accountAddress: string;
  walletId: string;
  publicKeyHex: string;
  backUpToDynamic: true;
  walletMetadata: Record<string, unknown>;
  externalSharesBackedUpToDynamic: number;
  externalSharesRequireLocalStorage: number;
  env: {
    BROADCASTER_WALLET_ADDRESS: string;
  };
  notes: string[];
};

function parseForceFlag(): boolean {
  return process.argv.includes('--force');
}

async function main() {
  const environmentId = process.env.VITE_DYNAMIC_ENVIRONMENT_ID?.trim();
  const apiToken = process.env.DYNAMIC_API_TOKEN?.trim();
  const password = process.env.DYNAMIC_WALLET_PASSWORD?.trim() || undefined;

  if (!environmentId) {
    console.error('Missing VITE_DYNAMIC_ENVIRONMENT_ID in .env');
    process.exit(1);
  }
  if (!apiToken) {
    console.error('Missing DYNAMIC_API_TOKEN in .env — create an API token first (see docs/getting-started.md §1.6).');
    process.exit(1);
  }
  if (!password) {
    console.error(
      'Missing DYNAMIC_WALLET_PASSWORD in .env — required when backUpToDynamic is true.\n' +
        'Add a strong password, then re-run: npm run docker:ops:create-wallet',
    );
    process.exit(1);
  }

  if (existsSync(DYNAMIC_SERVER_WALLET_JSON) && !parseForceFlag()) {
    console.error(
      `${DYNAMIC_SERVER_WALLET_JSON} already exists. Use --force to create another wallet and overwrite the file.`,
    );
    process.exit(1);
  }

  mkdirSync(resolve(process.cwd(), 'data'), { recursive: true });

  const client = await createAuthenticatedDynamicClient();

  console.log('Creating Dynamic server wallet (backUpToDynamic: true)…');

  const wallet = await client.createWalletAccount({
    thresholdSignatureScheme: ThresholdSignatureScheme.TWO_OF_TWO,
    password,
    backUpToDynamic: true,
    onError: (error) => {
      console.error('Wallet creation error:', error.message);
    },
  });

  const accountAddress =
    typeof wallet.walletMetadata === 'object' &&
    wallet.walletMetadata !== null &&
    'accountAddress' in wallet.walletMetadata
      ? String((wallet.walletMetadata as { accountAddress: string }).accountAddress)
      : '';

  if (!accountAddress.startsWith('0x')) {
    console.error('Wallet created but accountAddress missing from walletMetadata:', wallet.walletMetadata);
    process.exit(1);
  }

  const backedUp = wallet.externalKeySharesWithBackupStatus.filter(
    (entry) => entry.backedUpToClientKeyShareService,
  ).length;
  const localShares = wallet.externalKeySharesWithBackupStatus.length - backedUp;

  const record: WalletRecord = {
    createdAt: new Date().toISOString(),
    role: 'Broadcaster',
    network: 'sepolia',
    environmentId,
    accountAddress,
    walletId:
      typeof wallet.walletMetadata === 'object' &&
      wallet.walletMetadata !== null &&
      'walletId' in wallet.walletMetadata
        ? String((wallet.walletMetadata as { walletId: string }).walletId)
        : '',
    publicKeyHex: wallet.publicKeyHex,
    backUpToDynamic: true,
    walletMetadata: wallet.walletMetadata as unknown as Record<string, unknown>,
    externalSharesBackedUpToDynamic: backedUp,
    externalSharesRequireLocalStorage: localShares,
    env: {
      BROADCASTER_WALLET_ADDRESS: accountAddress,
    },
    notes: [
      'Set BROADCASTER_WALLET_ADDRESS in .env to accountAddress above.',
      'Use this address as the Broadcaster role when provisioning AccountBlox on Sepolia.',
      'Do not commit this file — it is listed in .gitignore.',
      'Key shares are backed up to Dynamic; AgentBlox lists/signs via getEvmWallets() + DYNAMIC_API_TOKEN.',
    ],
  };

  if (localShares > 0) {
    record.notes.push(
      `WARNING: ${localShares} key share(s) were NOT backed up to Dynamic — secure externalServerKeyShares separately (not written to this file).`,
    );
  }

  writeFileSync(DYNAMIC_SERVER_WALLET_JSON, `${JSON.stringify(record, null, 2)}\n`, 'utf8');

  console.log('\nServer wallet created.');
  console.log(`  Address: ${accountAddress}`);
  console.log(`  Saved:   ${DYNAMIC_SERVER_WALLET_JSON}`);
  console.log('\nNext steps:');
  console.log(`  1. Add to .env: BROADCASTER_WALLET_ADDRESS=${accountAddress}`);
  console.log('  2. Set Broadcaster to this address at bloxchain.app provisioning');
  console.log('  3. npm run verify:broadcaster');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
