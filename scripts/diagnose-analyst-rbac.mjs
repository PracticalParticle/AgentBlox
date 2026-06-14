import { keccak256, toBytes } from 'viem';
import { GUARD_CONTROLLER_FUNCTION_SELECTORS } from '@bloxchain/sdk';
import { createGuardController } from '../server/bloxchain.js';
import {
  ANALYST_WALLET_ADDRESS,
  ERC20_TRANSFER_SELECTOR,
  SEPOLIA_USDC,
  TREASURY_ADDRESS,
} from '../server/config.js';

const REQUEST_AND_APPROVE =
  GUARD_CONTROLLER_FUNCTION_SELECTORS.REQUEST_AND_APPROVE_EXECUTION_SELECTOR;

const gc = createGuardController();
const analyst = ANALYST_WALLET_ADDRESS;

const roleNames = ['ANALYST', 'SUBMITTER', 'submitter', 'APPROVER', 'AGENT_POLICY'];

async function safe(fn, label) {
  try {
    const value = await fn();
    return { ok: true, label, value };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, label, message: message.split('\n')[0] };
  }
}

const [nonce, whitelist, supportedRoles] = await Promise.all([
  safe(() => gc.getSignerNonce(analyst), 'signerNonce'),
  safe(() => gc.getFunctionWhitelistTargets(SEPOLIA_USDC), 'usdcWhitelist'),
  safe(() => gc.getSupportedRoles(), 'supportedRoles'),
]);

console.log('treasury:', TREASURY_ADDRESS);
console.log('signer wallet (ANALYST_PRIVATE_KEY):', analyst);
console.log('selectors:', {
  erc20Transfer: ERC20_TRANSFER_SELECTOR,
  requestAndApprove: REQUEST_AND_APPROVE,
});

console.log('\nreads:');
for (const row of [nonce, whitelist, supportedRoles]) {
  console.log(row.ok ? `${row.label}: ${JSON.stringify(row.value)}` : `${row.label}: ERROR ${row.message}`);
}

console.log('\nhasRole checks for signer wallet:');
for (const name of roleNames) {
  const roleHash = keccak256(toBytes(name));
  const result = await safe(() => gc.hasRole(roleHash, analyst), `hasRole(${name})`);
  console.log(result.ok ? `${result.label}: ${result.value}` : `${result.label}: ${result.message}`);
}

if (supportedRoles.ok && Array.isArray(supportedRoles.value)) {
  console.log('\non-chain role hashes:', supportedRoles.value);
  for (const hash of supportedRoles.value) {
    const role = await safe(() => gc.getRole(hash), `getRole(${hash})`);
    if (role.ok) {
      console.log(`  ${hash} -> ${role.value.roleName} wallets=${role.value.walletCount}`);
    }
  }
}
