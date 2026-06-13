# Bloxchain Integration

AgentBlox consumes the **AccountBlox pattern as-is** on Sepolia. No changes to `contracts/core/`.

## References

- Protocol repo: https://github.com/PracticalParticle/Bloxchain-Protocol
- Account pattern: `docs/account-pattern.md`
- SDK: `@bloxchain/sdk` (viem-based)
- Sepolia addresses in `deployed-addresses.json`

## Sepolia deployment

| Contract | Address |
|----------|---------|
| EngineBlox | `0x726d78c9683a96d66196d2b8350923e8ca0d8597` |
| AccountBlox (template) | `0x783eb64d7d5de55f6913f9cb42ef5a4c402884c0` |
| CopyBlox (factory) | `0x928a2bd6c13e4f48a0850d2171a8d79b29959fc7` |

## Provisioning flow (bloxchain.app)

1. Clone AccountBlox via CopyBlox pattern
2. `initialize(owner, broadcaster, recovery, timeLockPeriodSec, eventForwarder)`
3. Configure RBAC roles via `roleConfigBatch`:
   - `AGENT_POLICY` — meta-tx sign permissions only
   - `ANALYST` — time-delay request permissions
4. Configure GuardController whitelist via `guardConfigBatch`:
   - LI.FI Composer executor contract
   - USDC token contract (Sepolia)
   - Deny all other external targets
5. Export treasury address → import into AgentBlox

Alternative: `CREATE_WALLET_USE_DEFAULTS=1 node scripts/deployment/create-wallet-copyblox.js` in Bloxchain Protocol repo.

## SDK setup in AgentBlox

```typescript
import {
  SecureOwnable,
  RuntimeRBAC,
  GuardController,
} from '@bloxchain/sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(import.meta.env.VITE_SEPOLIA_RPC_URL),
});

const treasuryAddress = '0x...' as const;

// All three wrappers point to the same AccountBlox clone address
const secureOwnable = new SecureOwnable(publicClient, walletClient, treasuryAddress, sepolia);
const runtimeRbac = new RuntimeRBAC(publicClient, walletClient, treasuryAddress, sepolia);
const guardController = new GuardController(publicClient, walletClient, treasuryAddress, sepolia);
```

Create `src/lib/bloxchain.ts` wrapping these three clients.

## Role configuration

| Role | Configured on | Used in AgentBlox |
|------|---------------|-------------------|
| Owner | bloxchain.app | Dynamic embedded wallet — timelock approve |
| Broadcaster | bloxchain.app | Dynamic server wallet — meta-tx execute |
| Recovery | bloxchain.app | Document only for demo |
| AGENT_POLICY | bloxchain.app | Agent Bridge private key |
| ANALYST | bloxchain.app | Request timelock payments |

Grant `AGENT_POLICY`:
- Meta-tx sign permission for guard execution selectors
- **Not** Broadcaster role
- **Not** execute permission

## Lane A — Meta-transaction flow

### Sequence

1. Agent Bridge builds `MetaTransaction` payload targeting whitelisted LI.FI contract
2. `AGENT_POLICY` key signs EIP-712 off-chain (`@bloxchain/sdk` meta-tx utils)
3. Dynamic Broadcaster calls `requestAndApproveExecution` or batch meta-tx flow
4. EngineBlox validates: signer ≠ executor, role permissions, whitelist
5. External call executes at `EXECUTING` status only

### SDK references (Bloxchain repo)

- `sdk/typescript/utils/metaTx/metaTransaction.tsx`
- `test/foundry/integration/MetaTransaction.t.sol`
- `test/foundry/integration/WhitelistWorkflow.t.sol`

### Implementation (`server/signing/meta-tx.ts`)

```typescript
// Pseudocode — align with @bloxchain/sdk exports
// 1. createMetaTxParams(target, value, selector, params, ...)
// 2. generateUnsignedMetaTransactionForNew(...)
// 3. sign with AGENT_POLICY wallet
// 4. return signed meta-tx to Broadcaster service
```

## Lane B — Timelock flow

### Sequence

1. Analyst (or UI button) calls `executeWithTimeLock` on GuardController
2. `TxRecord` created with status `PENDING`, `releaseTime = now + timeLockPeriodSec`
3. AgentBlox dashboard polls `getTransaction(txId)`
4. After release time, Owner calls `approveTimeLockExecution(txId)` via Dynamic wallet
5. Status progresses: `PENDING` → `EXECUTING` → `COMPLETED`

### UI requirements

- Countdown timer from `releaseTime`
- Approve button enabled only for Owner wallet
- Status badge per `TxStatus` enum

## GuardController whitelist

Critical security gate for LI.FI integration.

```solidity
// EngineBlox._validateTargetWhitelist — reverts if target not whitelisted
revert SharedValidation.TargetNotWhitelisted(target, functionSelector);
```

### Whitelist at provisioning

Use `guardConfigBatch` to add:
- LI.FI Composer / executor contract address
- Function selector for the execution path used in meta-tx
- USDC contract for Lane B payments

### Attack demo

Agent Bridge builds calldata targeting a **non-whitelisted** address (e.g. random EOA transfer). Broadcaster submits → revert → UI shows "Blocked by Bloxchain Guard".

## TxRecord audit trail

Every operation returns a `txId`. Poll `getTransaction(txId)` for:

| Field | Use in UI |
|-------|-----------|
| `status` | Badge: PENDING, EXECUTING, COMPLETED, FAILED, CANCELLED |
| `releaseTime` | Lane B countdown |
| `requester` | Audit log |
| `params.target` | Show whitelisted vs blocked target |

## Files to implement

| File | Purpose |
|------|---------|
| `src/lib/bloxchain.ts` | SDK client factory |
| `src/hooks/useTreasury.ts` | Read roles, timelock, address |
| `src/hooks/useTxRecords.ts` | Poll transaction history |
| `server/signing/meta-tx.ts` | AGENT_POLICY EIP-712 signing |

## Testing

Reuse patterns from Bloxchain Protocol:

```bash
# In Bloxchain Protocol repo
npm run test:foundry
npm run test:sanity-sdk:core
```

For AgentBlox: verify against live Sepolia clone with known config.

## Do not

- Modify `contracts/core/`
- Bypass GuardController with direct contract calls from UI
- Give AGENT_POLICY key Broadcaster permissions
- Store Broadcaster key in frontend bundle
