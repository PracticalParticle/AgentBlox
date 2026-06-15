/**
 * Reproduce B-fast broadcast failure with full error capture.
 * Run: docker exec agentblox-server npx tsx /app/scripts/debug-pay-broadcast.mjs
 */
import { formatUnits } from 'viem';
import { readTreasuryRoles } from '../server/bloxchain.js';
import { sepoliaClient } from '../server/clients.js';
import {
  BROADCASTER_WALLET_ADDRESS,
  SEPOLIA_USDC,
  TREASURY_ADDRESS,
} from '../server/config.js';
import { submitRequestAndApproveWithBroadcaster } from '../server/execution/meta-tx-broadcaster.js';
import { preflightRequestAndApproveExecution } from '../server/execution/preflight-meta-tx.js';
import { formatExecutionError } from '../server/execution/format-execution-error.js';
import { signPaymentInstantMetaTransaction } from '../server/signing/payment-meta-tx.js';
import { getBroadcasterWalletClient } from '../server/dynamic/broadcaster.js';

const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
];

function dumpError(label, error) {
  console.log(`\n=== ${label} ===`);
  console.log('formatted:', formatExecutionError(error));
  if (error && typeof error === 'object') {
    try {
      console.log('json:', JSON.stringify(error, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2));
    } catch {
      console.log('keys:', Object.keys(error));
      console.log('message:', error.message);
      console.log('shortMessage:', error.shortMessage);
      console.log('userMessage:', error.userMessage);
      console.log('errorData:', error.errorData);
      console.log('cause:', error.cause);
      console.log('originalError:', error.originalError);
    }
  } else {
    console.log(String(error));
  }
}

const roles = await readTreasuryRoles();
const recipient = roles.owner;
const amount = 5_000_000n;

console.log('treasury:', TREASURY_ADDRESS);
console.log('owner/recipient:', recipient);
console.log('broadcaster env:', BROADCASTER_WALLET_ADDRESS);

const [decimals, treasuryBalance, broadcasterEth] = await Promise.all([
  sepoliaClient.readContract({ address: SEPOLIA_USDC, abi: erc20Abi, functionName: 'decimals' }),
  sepoliaClient.readContract({
    address: SEPOLIA_USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [TREASURY_ADDRESS],
  }),
  sepoliaClient.getBalance({ address: BROADCASTER_WALLET_ADDRESS }),
]);

console.log(
  'treasury USDC balance:',
  formatUnits(treasuryBalance, Number(decimals)),
  `(${treasuryBalance.toString()} base units)`,
);
console.log('broadcaster ETH:', formatUnits(broadcasterEth, 18));

const walletClient = await getBroadcasterWalletClient();
const dynamicAccounts = await walletClient.getAddresses();
console.log('dynamic wallet accounts:', dynamicAccounts);

const signed = await signPaymentInstantMetaTransaction({ recipient, amount });
if (!signed.ok) {
  console.error('signing failed:', signed.reason);
  process.exit(1);
}

const pre = await preflightRequestAndApproveExecution(signed.signedMetaTx);
console.log('\npreflight:', pre.ok ? 'PASS' : `FAIL: ${pre.reason}`);

console.log('\nattempting Dynamic broadcast...');
const result = await submitRequestAndApproveWithBroadcaster(
  // deserialize inline — submit expects MetaTransaction object; signed.signedMetaTx is serialized
  (await import('../server/signing/serialize.js')).deserializeMetaTransaction(signed.signedMetaTx),
);

if (result.ok) {
  console.log('BROADCAST OK:', result.hash);
} else {
  console.log('BROADCAST FAIL:', result.reason);
}
