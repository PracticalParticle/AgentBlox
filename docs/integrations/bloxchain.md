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

Create `server/bloxchain.ts` (Phase 1):

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

| Role | Holder | AgentBlox usage |
|------|--------|-----------------|
| Owner | Dynamic embedded | Timelock approve, governance |
| Broadcaster | Dynamic server | `requestAndApproveExecution` |
| Recovery | Cold backup | Emergency rotation |
| AGENT_POLICY | Server key | Sign meta-tx only — [integrations/dynamic.md](./dynamic.md) |
| ANALYST | Ops wallet | Timelock payment requests |

Live changes: [governance.md](../governance.md).

---

## Authorization paths

Full sequences with diagrams: [on-chain-execution-flow.md](../on-chain-execution-flow.md).

| Path | Copilot | Bloxchain entry |
|------|---------|-----------------|
| Policy execution | `/rebalance` | `requestAndApproveExecution` |
| Timelock disbursement | `/pay` | `executeWithTimeLock` → `approveTimeLockExecution` |

**Key invariant:** signer ≠ executor for meta-tx. `AGENT_POLICY` signs; Broadcaster executes.

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
