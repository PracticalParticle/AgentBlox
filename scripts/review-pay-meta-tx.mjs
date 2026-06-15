/**
 * Full B-fast payment meta-tx review: on-chain RBAC + signed payload shape.
 * Run: docker exec agentblox-server-1 npx tsx /app/scripts/review-pay-meta-tx.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { keccak256, toBytes } from 'viem';
import { GUARD_CONTROLLER_FUNCTION_SELECTORS, TxAction } from '@bloxchain/sdk';
import { createGuardController, readTreasuryRoles } from '../server/bloxchain.js';
import { sepoliaClient } from '../server/clients.js';
import {
  ANALYST_WALLET_ADDRESS,
  BROADCASTER_WALLET_ADDRESS,
  ERC20_TRANSFER_SELECTOR,
  SEPOLIA_USDC,
  TREASURY_ADDRESS,
} from '../server/config.js';
import { signPaymentInstantMetaTransaction } from '../server/signing/payment-meta-tx.js';
import { preflightRequestAndApproveExecution } from '../server/execution/preflight-meta-tx.js';

const HANDLER = GUARD_CONTROLLER_FUNCTION_SELECTORS.REQUEST_AND_APPROVE_EXECUTION_SELECTOR;
const SIGN = TxAction.SIGN_META_REQUEST_AND_APPROVE;
const EXECUTE = TxAction.EXECUTE_META_REQUEST_AND_APPROVE;

const gc = createGuardController();
const guardAbi = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../node_modules/@bloxchain/sdk/dist/abi/GuardController.abi.json'),
    'utf8',
  ),
);

async function readAs(wallet, functionName, args = []) {
  return sepoliaClient.readContract({
    address: TREASURY_ADDRESS,
    abi: guardAbi,
    functionName,
    args,
    account: wallet,
  });
}

function roleHash(name) {
  return keccak256(toBytes(name));
}

async function safe(label, fn) {
  try {
    return { ok: true, label, value: await fn() };
  } catch (error) {
    const msg = error?.shortMessage ?? error?.message ?? String(error);
    return { ok: false, label, message: msg.split('\n')[0] };
  }
}

function decodeActions(bitmap) {
  const actions = [];
  const names = [
    'EXECUTE_TIME_DELAY_REQUEST',
    'EXECUTE_TIME_DELAY_APPROVE',
    'EXECUTE_TIME_DELAY_CANCEL',
    'SIGN_META_REQUEST_AND_APPROVE',
    'SIGN_META_APPROVE',
    'SIGN_META_CANCEL',
    'EXECUTE_META_REQUEST_AND_APPROVE',
    'EXECUTE_META_APPROVE',
    'EXECUTE_META_CANCEL',
  ];
  const n = Number(bitmap);
  for (let i = 0; i < names.length; i++) {
    if (n & (1 << i)) actions.push(names[i]);
  }
  return actions;
}

console.log('=== Treasury ===');
console.log('address:', TREASURY_ADDRESS);
console.log('analyst signer:', ANALYST_WALLET_ADDRESS);
console.log('broadcaster/submitter wallet:', BROADCASTER_WALLET_ADDRESS);
console.log('handler selector:', HANDLER);
console.log('execution selector:', ERC20_TRANSFER_SELECTOR);
console.log('usdc:', SEPOLIA_USDC);

const roleNames = ['ANALYST', 'SUBMITTER', 'BROADCASTER_ROLE'];
console.log('\n=== Role membership ===');
for (const name of roleNames) {
  const hash = roleHash(name);
  const memberAnalyst = await safe(`analyst in ${name}`, () => gc.hasRole(hash, ANALYST_WALLET_ADDRESS));
  const memberBc = await safe(`broadcaster in ${name}`, () => gc.hasRole(hash, BROADCASTER_WALLET_ADDRESS));
  console.log(
    name,
    '| analyst:',
    memberAnalyst.ok ? memberAnalyst.value : memberAnalyst.message,
    '| broadcaster:',
    memberBc.ok ? memberBc.value : memberBc.message,
  );
}

const reader = ANALYST_WALLET_ADDRESS;

console.log('\n=== Registered functions (read as ANALYST) ===');
for (const sel of [HANDLER, ERC20_TRANSFER_SELECTOR]) {
  const schema = await safe(`schema ${sel}`, () => readAs(reader, 'getFunctionSchema', [sel]));
  if (schema.ok) {
    console.log(sel, '→', schema.value.operationName, 'enforceRelations:', schema.value.enforceHandlerRelations);
  } else {
    console.log(sel, '→ NOT REGISTERED:', schema.message);
  }
}

console.log('\n=== Whitelist (execution selector) ===');
const wl = await safe('whitelist', () => readAs(reader, 'getFunctionWhitelistTargets', [ERC20_TRANSFER_SELECTOR]));
console.log(wl.ok ? wl.value : `ERROR: ${wl.message}`);

console.log('\n=== ANALYST role permissions ===');
const analystHash = roleHash('ANALYST');
const perms = await safe('getActiveRolePermissions', () => readAs(reader, 'getActiveRolePermissions', [analystHash]));
if (perms.ok) {
  for (const p of perms.value) {
    const actions = decodeActions(p.grantedActionsBitmap);
    console.log(`  ${p.functionSelector} → [${actions.join(', ')}]`);
  }
} else {
  console.log('  ERROR:', perms.message);
}

console.log('\n=== SUBMITTER role permissions ===');
const submitterHash = roleHash('SUBMITTER');
const subPerms = await safe('getActiveRolePermissions', () => readAs(reader, 'getActiveRolePermissions', [submitterHash]));
if (subPerms.ok) {
  for (const p of subPerms.value) {
    const actions = decodeActions(p.grantedActionsBitmap);
    console.log(`  ${p.functionSelector} → [${actions.join(', ')}]`);
  }
} else {
  console.log('  ERROR:', subPerms.message);
}

console.log('\n=== Signer nonce ===');
const nonce = await safe('nonce', () => readAs(reader, 'getSignerNonce', [ANALYST_WALLET_ADDRESS]));
console.log(nonce.ok ? nonce.value.toString() : nonce.message);

console.log('\n=== Sign + inspect meta-tx ===');
const roles = await readTreasuryRoles();
const recipient = roles.owner;
console.log('recipient (treasury owner):', recipient);
const amount = 5_000_000n;
const signed = await signPaymentInstantMetaTransaction({ recipient, amount });
if (!signed.ok) {
  console.error('Signing failed:', signed.reason);
  process.exit(1);
}

const m = signed.signedMetaTx;
console.log('signer:', signed.signerAddress);
console.log('txId (preview):', m.txRecord.txId);
console.log('requester:', m.txRecord.params.requester);
console.log('target:', m.txRecord.params.target);
console.log('operationType:', m.txRecord.params.operationType);
console.log('executionSelector:', m.txRecord.params.executionSelector);
console.log('handlerContract:', m.params.handlerContract);
console.log('handlerSelector:', m.params.handlerSelector);
console.log('action:', m.params.action, `(SIGN=${SIGN})`);
console.log('nonce:', m.params.nonce);
console.log('chainId:', m.params.chainId);
console.log('data prefix:', m.data?.slice(0, 10));

const pending = await safe('pending', () => readAs(reader, 'getPendingTransactions', []));
console.log('pending txs:', pending.ok ? pending.value.map(String) : pending.message);

console.log('\n=== Preflight simulate ===');
const pre = await preflightRequestAndApproveExecution(m);
console.log(pre.ok ? 'PASS' : `FAIL: ${pre.reason}`);

console.log('\nRevert 0x3b94fe24 = SignerNotAuthorized(signer) inside verifySignature');
console.log('Revert 0xf37a3442 = NoPermission(caller) — broadcaster/submitter EXECUTE check');
