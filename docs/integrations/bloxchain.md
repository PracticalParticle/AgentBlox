# Bloxchain Integration

**Audience:** Developers reading/writing AccountBlox state via `@bloxchain/sdk`.  
**Prerequisites:** Treasury clone provisioned — [provisioning-checklist.md](../provisioning-checklist.md).  
**See also:** [guard-controller.md](../guard-controller.md) · [on-chain-execution-flow.md](../on-chain-execution-flow.md) · [governance.md](../governance.md)

AgentBlox consumes the **AccountBlox pattern as-is** on Sepolia. No changes to `contracts/core/`.

---

## References

- Protocol repo: https://github.com/PracticalParticle/Bloxchain-Protocol
- Account pattern: https://github.com/PracticalParticle/Bloxchain-Protocol/blob/main/docs/account-pattern.md
- SDK: `@bloxchain/sdk` (viem-based)
- Sepolia addresses: Bloxchain repo `deployed-addresses.json`

---

## Sepolia deployment

| Contract | Address |
|----------|---------|
| EngineBlox | `0x726d78c9683a96d66196d2b8350923e8ca0d8597` |
| AccountBlox (template) | `0x783eb64d7d5de55f6913f9cb42ef5a4c402884c0` |
| CopyBlox (factory) | `0x928a2bd6c13e4f48a0850d2171a8d79b29959fc7` |

### Definition libraries (advanced)

Integrators calling `guardConfigBatch` / `roleConfigBatch` need definition contract addresses from Bloxchain `deployed-addresses.json` for Sepolia:

| Key | Purpose |
|-----|---------|
| `SecureOwnableDefinitions` | Ownership batch encoders |
| `RuntimeRBACDefinitions` | Role batch encoders |
| `GuardControllerDefinitions` | Guard batch encoders |

See [Bloxchain Getting Started](https://github.com/PracticalParticle/Bloxchain-Protocol/blob/main/docs/getting-started.md).

---

## Provisioning

Full steps: [provisioning-checklist.md](../provisioning-checklist.md) Part A.

Summary: clone → `initialize` → RBAC → GuardController whitelist → fund → set `TREASURY_ADDRESS`.

Whitelist detail: [guard-controller.md](../guard-controller.md).

---

## SDK setup in AgentBlox

Implemented in `server/bloxchain.ts` (Phase 1 ✅):

```typescript
import { GuardController, SecureOwnable } from '@bloxchain/sdk';
import { sepoliaClient } from './clients.js';
import { TREASURY_ADDRESS } from './config.js';

/** @bloxchain/sdk bundles its own viem — cast shared client/chain for SDK constructors. */
export const sdkPublicClient = sepoliaClient as unknown as PublicClient;
export const sdkSepolia = sepolia as unknown as Chain;

export function createGuardController(): GuardController {
  return new GuardController(sdkPublicClient, undefined, TREASURY_ADDRESS, sdkSepolia);
}

export async function readTreasuryRoles() { /* owner, broadcasters, recovery, timelock */ }
```

Use in **server tools** (`server/tools/read.ts`) for reads. Meta-tx signing uses the same factory in `server/signing/meta-tx.ts`. Broadcaster writes use Dynamic `walletClient` in `server/execution/rebalance.ts`.

There is **no** `src/lib/bloxchain.ts` in the current MVP — all SDK access is server-side.

---

## Role configuration

| Role | Holder | AgentBlox usage |
|------|--------|-----------------|
| Owner | Dynamic embedded | Governance, recovery — not Lane B demo approve |
| Broadcaster | Dynamic server | Meta-tx execution (Lane A + Lane B approve submit) |
| Recovery | Cold backup | Emergency rotation |
| AGENT_POLICY | Server key | Sign Lane A meta-tx *(future LI.FI)* |
| ANALYST | Ops wallet | Timelock payment requests (`executeWithTimeLock`) |
| APPROVER | Policy server key | Sign timelock approval meta-tx (`SIGN_META_APPROVE`) |

Live changes: [governance.md](../governance.md).

---

## Authorization paths

Full sequences with diagrams: [on-chain-execution-flow.md](../on-chain-execution-flow.md).

| Path | Copilot | Bloxchain entry |
|------|---------|-----------------|
| Policy execution *(future)* | `/rebalance` | `requestAndApproveExecution` |
| Timelock disbursement (Lane B) | `/pay` | `executeWithTimeLock` → APPROVER sign → Broadcaster `approveTimeLockExecutionWithMetaTx` |

**Key invariant:** signer ≠ executor for meta-tx. Lane A: `AGENT_POLICY` signs, Broadcaster executes. Lane B: `APPROVER` signs, Broadcaster executes.

---

## Tool integration map

| Tool | Operation type | Auth path | Bloxchain API |
|------|----------------|-----------|---------------|
| `get_whitelisted_targets` | Monitor | — | `getFunctionWhitelistTargets(selector)` |
| `list_pending_approvals` | Monitor | — | TxRecord poll |
| `propose_rebalance` | Treasury operation | Policy execution | `requestAndApproveExecution` |
| `request_vendor_payment` | Disbursement | Timelock | `executeWithTimeLock` |
| `simulate_policy_violation` | Policy test | — (blocked) | — |

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
- Store Broadcaster keys in `VITE_*` env vars

---

## Extend capabilities

→ [extending-use-cases.md](../extending-use-cases.md)
