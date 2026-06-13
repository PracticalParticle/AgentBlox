# Bloxchain Integration

AgentBlox consumes the **AccountBlox pattern as-is** on Sepolia. No changes to `contracts/core/`.

Integration happens through **Copilot treasury tools** and planned server modules — not a separate Agent Bridge REST API.

---

## References

- Protocol repo: https://github.com/PracticalParticle/Bloxchain-Protocol
- Account pattern: `docs/account-pattern.md`
- SDK: `@bloxchain/sdk` (viem-based)
- GuardController + LI.FI: [guard-controller-setup.md](./guard-controller-setup.md)
- Execution flow: [on-chain-execution-flow.md](./on-chain-execution-flow.md)

## Sepolia deployment

| Contract | Address |
|----------|---------|
| EngineBlox | `0x726d78c9683a96d66196d2b8350923e8ca0d8597` |
| AccountBlox (template) | `0x783eb64d7d5de55f6913f9cb42ef5a4c402884c0` |
| CopyBlox (factory) | `0x928a2bd6c13e4f48a0850d2171a8d79b29959fc7` |

## Provisioning flow (bloxchain.app)

See [provisioning-checklist.md](./provisioning-checklist.md).

1. Clone AccountBlox via CopyBlox
2. `initialize(owner, broadcaster, recovery, timeLockPeriodSec, eventForwarder)`
3. RBAC: `AGENT_POLICY`, `ANALYST`
4. GuardController whitelist via `guardConfigBatch` — LI.FI proxy + USDC
5. Set `TREASURY_ADDRESS` in AgentBlox `.env`

---

## SDK setup in AgentBlox

Create `src/lib/bloxchain.ts` (Phase 1):

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
  transport: http(process.env.SEPOLIA_RPC_URL),
});

const treasuryAddress = process.env.TREASURY_ADDRESS as `0x${string}`;

export function createBloxchainClients(walletClient?: ReturnType<typeof createWalletClient>) {
  return {
    secureOwnable: new SecureOwnable(publicClient, walletClient, treasuryAddress, sepolia),
    runtimeRbac: new RuntimeRBAC(publicClient, walletClient, treasuryAddress, sepolia),
    guardController: new GuardController(publicClient, walletClient, treasuryAddress, sepolia),
  };
}
```

Use in **server tools** for reads; use with Dynamic `walletClient` for Owner/Broadcaster writes.

---

## Role configuration

| Role | Configured on | Used in AgentBlox |
|------|---------------|-------------------|
| Owner | bloxchain.app | Dynamic embedded — timelock approve |
| Broadcaster | bloxchain.app | Dynamic server — `requestAndApproveExecution` |
| Recovery | bloxchain.app | Document only |
| AGENT_POLICY | bloxchain.app | `server/signing/meta-tx.ts` |
| ANALYST | bloxchain.app | Lane B payment requests |

---

## Lane A — Meta-transaction (via Copilot tool)

### Sequence

1. User: `/rebalance` → `propose_rebalance` tool
2. Tool builds meta-tx targeting whitelisted LI.FI user proxy
3. `AGENT_POLICY` signs EIP-712 (`server/signing/meta-tx.ts`)
4. User confirms in Copilot tool card
5. Broadcaster calls `requestAndApproveExecution`
6. EngineBlox: signer ≠ executor, RBAC, whitelist
7. External call at `EXECUTING` only

### SDK references

- `sdk/typescript/utils/metaTx/metaTransaction.tsx`
- `scripts/sanity-sdk/guard-controller/erc20-mint-controller-tests.ts`
- `test/foundry/integration/WhitelistWorkflow.t.sol`

---

## Lane B — Timelock (via Copilot tool)

1. User: `/pay` → `request_vendor_payment` tool
2. `executeWithTimeLock` on GuardController (Phase 5)
3. `/pending` polls `getTransaction(txId)`
4. Owner approves via Dynamic — `approveTimeLockExecution`

---

## GuardController whitelist

Critical gate for LI.FI. See [guard-controller-setup.md](./guard-controller-setup.md).

```solidity
// EngineBlox — reverts if target not whitelisted
revert SharedValidation.TargetNotWhitelisted(target, functionSelector);
```

### Attack demo

`/attack` → `simulate_policy_violation` tool. Phase 4: optional on-chain submit → revert.

---

## Tool integration map

| Tool | Bloxchain API |
|------|---------------|
| `get_whitelisted_targets` | `getFunctionWhitelistTargets(selector)` |
| `list_pending_approvals` | `getTransactionHistory` / poll pending set |
| `propose_rebalance` | `requestAndApproveExecution` (via signed meta-tx) |
| `request_vendor_payment` | `executeWithTimeLock` |

---

## Files to implement

| File | Purpose |
|------|---------|
| `src/lib/bloxchain.ts` | SDK client factory |
| `server/signing/meta-tx.ts` | AGENT_POLICY EIP-712 signing |
| `server/tools/read.ts` | Wire SDK reads (Phase 1) |
| `server/tools/propose.ts` | Wire sign + execute (Phase 3–5) |

---

## Testing

```bash
# In Bloxchain Protocol repo
npm run test:foundry
npm run test:sanity-sdk:core
```

---

## Do not

- Modify `contracts/core/`
- Bypass GuardController from UI
- Give AGENT_POLICY Broadcaster permissions
- Store Broadcaster key in `VITE_*` env vars
