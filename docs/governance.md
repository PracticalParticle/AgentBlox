# Treasury Governance

How to **change policy on a live treasury** after initial provisioning. Governance is on-chain via Bloxchain; AgentBlox reads the resulting state.

See also: [treasury-lifecycle.md](./treasury-lifecycle.md) · [integrations/bloxchain.md](./integrations/bloxchain.md) · [guard-controller.md](./guard-controller.md)

---

## What can be governed

| Change | Mechanism | Typical signer |
|--------|-----------|----------------|
| Rotate Owner | SecureOwnable (timelocked) | Owner / Recovery |
| Rotate Broadcaster | SecureOwnable (timelocked) | Owner |
| Update Recovery | SecureOwnable (timelocked) | Owner / Recovery |
| Change global timelock period | SecureOwnable | Owner |
| Add/revoke role wallets | `roleConfigBatch` | Owner meta-tx → Broadcaster |
| Add/remove function permissions | `roleConfigBatch` | Owner meta-tx → Broadcaster |
| Register/unregister function schemas | `guardConfigBatch` | Owner meta-tx → Broadcaster |
| Add/remove whitelist targets | `guardConfigBatch` | Owner meta-tx → Broadcaster |

High-risk governance changes often use the **timelock path**: `executeWithTimeLock` → countdown → Owner `approveTimeLockExecution`.

---

## SecureOwnable operations

Use `@bloxchain/sdk` `SecureOwnable` wrapper against the treasury clone address.

Common reads:

```typescript
const owner = await secureOwnable.owner();
const broadcasters = await secureOwnable.getBroadcasters();
const recovery = await secureOwnable.getRecovery();
const timeLockPeriod = await secureOwnable.getTimeLockPeriodSec();
```

Ownership transfer and role rotation follow **delayed approval** flows — request creates a pending tx; approve after `timeLockPeriodSec`. See [Bloxchain Getting Started](https://github.com/PracticalParticle/Bloxchain-Protocol/blob/main/docs/getting-started.md).

**AgentBlox mapping:** Dynamic **embedded wallet** must match on-chain Owner for timelock approvals in Copilot.

---

## Role management (`roleConfigBatch`)

Via `RuntimeRBAC` — [Bloxchain RuntimeRBAC docs](https://github.com/PracticalParticle/Bloxchain-Protocol/blob/main/docs/runtime-rbac.md).

### Action types

| Action | Purpose |
|--------|---------|
| `CREATE_ROLE` | New custom role with function permissions |
| `REMOVE_ROLE` | Remove non-protected role |
| `ADD_WALLET` | Assign wallet to role |
| `REVOKE_WALLET` | Remove wallet from role |
| `ADD_FUNCTION_TO_ROLE` | Grant function + action bitmap to role |
| `REMOVE_FUNCTION_FROM_ROLE` | Revoke function permission |

### Rules

- **Function schema must be registered in GuardController** before granting to a role
- Protected roles (`OWNER`, `BROADCASTER`, `RECOVERY`) cannot be removed
- Batch changes typically require Owner-signed meta-tx executed by Broadcaster

### AgentBlox roles (reference)

| Role | Holder | Permissions (typical) |
|------|--------|----------------------|
| `AGENT_POLICY` | Server key | `SIGN_META_REQUEST_AND_APPROVE` on execution selectors only |
| `ANALYST` | Ops wallet | `EXECUTE_TIME_DELAY_REQUEST` on payment selectors |

Never grant `AGENT_POLICY` Broadcaster role or direct execute on `requestAndApproveExecution`.

---

## Whitelist and function schema (`guardConfigBatch`)

Via `GuardController` — [guard-controller.md](./guard-controller.md).

### Action types

| Action | Purpose |
|--------|---------|
| `REGISTER_FUNCTION` | Register external function schema + allowed TxActions |
| `UNREGISTER_FUNCTION` | Remove schema (see warnings below) |
| `ADD_TARGET_TO_WHITELIST` | Allow contract address for a function selector |
| `REMOVE_TARGET_FROM_WHITELIST` | Deny contract for a selector |

### Read current whitelist

```typescript
const targets = await guardController.getFunctionWhitelistTargets(functionSelector);
```

AgentBlox tool: `get_whitelisted_targets` (when SDK wired).

---

## Operational warnings

From Bloxchain GuardController behavior — **must follow** when changing live policy:

1. **Do not delist a target** while pending TxRecords reference it — cancel or complete those txs first, or cancel/complete will revert.
2. **Unregistering a function** breaks pending txs using that selector until re-registered.
3. **Empty whitelist = deny all** external targets for that selector.
4. **Off-chain ENS policy** (`bloxchain.allowedFlows`) must stay a **subset** of on-chain capability — ENS is discovery; GuardController is authoritative.

---

## ENS policy metadata

ENS text records are **not** governance transactions — they are set on mainnet by the ENS name Owner (Dynamic embedded wallet).

| Key | Governance relationship |
|-----|-------------------------|
| `bloxchain.allowedFlows` | Should reflect whitelisted + tool-supported flows |
| `bloxchain.policyVersion` | Bump when whitelist or role model changes |

See [integrations/ens.md](./integrations/ens.md).

When on-chain policy changes, update ENS text records so agents and operators see consistent metadata.

---

## Where governance happens today

| Surface | Governance actions |
|---------|-------------------|
| [bloxchain.app](https://bloxchain.app/) | Provisioning, initial RBAC, whitelist |
| `@bloxchain/sdk` scripts | Live role/whitelist changes |
| AgentBlox Copilot | **Read** policy state; **operate** within policy (not change it) |

Future: Console governance wizard or dedicated admin tools — out of current scope.

---

## AgentBlox read tools after governance

After any governance change, verify via Copilot:

| Command | Tool |
|---------|------|
| `/whitelist` | `get_whitelisted_targets` |
| `/pending` | `list_pending_approvals` |
| `/status` | `get_treasury_status` |

---

## Related Bloxchain protocol docs

| Topic | URL |
|-------|-----|
| GuardController | [guard-controller.md](https://github.com/PracticalParticle/Bloxchain-Protocol/blob/main/docs/guard-controller.md) |
| RuntimeRBAC | [runtime-rbac.md](https://github.com/PracticalParticle/Bloxchain-Protocol/blob/main/docs/runtime-rbac.md) |
| SecureOwnable | [secure-ownable.md](https://github.com/PracticalParticle/Bloxchain-Protocol/blob/main/docs/secure-ownable.md) |
| Best practices | [best-practices.md](https://github.com/PracticalParticle/Bloxchain-Protocol/blob/main/docs/best-practices.md) |
