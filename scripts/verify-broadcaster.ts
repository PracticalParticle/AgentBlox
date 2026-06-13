/**
 * CLI: verify Dynamic Broadcaster env (DYNAMIC_API_TOKEN + BROADCASTER_WALLET_ADDRESS).
 * Usage: npm run verify:broadcaster
 */
import 'dotenv/config';
import {
  getBroadcasterStatus,
  listBroadcasterWallets,
  verifyBroadcasterConnection,
} from '../server/dynamic/broadcaster.js';

async function main() {
  const status = await getBroadcasterStatus();
  console.log('Broadcaster status:', JSON.stringify(status, null, 2));

  if (!status.apiTokenConfigured) {
    console.error('\nMissing DYNAMIC_API_TOKEN — create one in Dynamic Developer → API.');
    process.exit(1);
  }

  try {
    const wallets = await listBroadcasterWallets();
    console.log('\nServer wallets:');
    for (const wallet of wallets) {
      console.log(`  ${wallet.address}${wallet.name ? ` (${wallet.name})` : ''}`);
    }
  } catch (error) {
    console.error('\nCould not list wallets:', error instanceof Error ? error.message : error);
  }

  const connection = await verifyBroadcasterConnection();
  if (!connection.ok) {
    console.error('\nConnection failed:', connection.error);
    process.exit(1);
  }

  console.log('\nConnected wallet:', connection.walletAddress);
  if (status.matchesOnChainBroadcaster === false) {
    console.error('\nWarning: env wallet does not match on-chain Broadcaster role.');
    process.exit(1);
  }

  console.log('\nBroadcaster ready.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
