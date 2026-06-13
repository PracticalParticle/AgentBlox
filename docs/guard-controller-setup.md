# GuardController Setup

How to connect **LI.FI Composer** to **Bloxchain GuardController** for AgentBlox treasuries. Provisioning happens on [bloxchain.app](https://bloxchain.app/); AgentBlox executes through Copilot tools.

See also: [on-chain-execution-flow.md](./on-chain-execution-flow.md), [lifi-integration.md](./lifi-integration.md), [provisioning-checklist.md](./provisioning-checklist.md).

---

## Mental model

GuardController does **not** embed LI.FI. It is a gated low-level caller:

1. Register an **external function schema** (Composer proxy entry function).
2. **Whitelist** allowed target addresses for that selector.
3. Execute via meta-tx or timelock; EngineBlox validates, then `target.call(calldata)`.

```
executionSelector (4 bytes) + executionParams (ABI args without selector)
        ↓
EngineBlox.buildCallData → abi.encodePacked(selector, params)
        ↓
AccountBlox → LI.FI user proxy (atomic Composer flow)
```

---

## LI.FI Composer account model

Composer uses a **per-signer execution proxy**:

| Concept | AgentBlox mapping |
|---------|-------------------|
| Signer | AccountBlox clone address (treasury) |
| Execution `to` | `userProxy` from `POST /compose` (or proxy factory on first deploy) |
| Calldata | Compiled Flow from Composer API / `@lifi/composer-sdk` |
| Funds | Sit on proxy during flow; optional `sweepTo` sends remainder out |

Docs: [Composer overview](https://docs.li.fi/composer/overview)

---

## Provisioning steps (bloxchain.app)

### 1. Clone AccountBlox

Via CopyBlox or bloxchain.app wizard. Record clone address for `TREASURY_ADDRESS`.

### 2. Initialize roles

| Role | Holder | AgentBlox usage |
|------|--------|-----------------|
| Owner | Dynamic embedded wallet | Timelock approve, whitelist changes |
| Broadcaster | Dynamic server wallet | `requestAndApproveExecution` |
| Recovery | Cold backup | Document only for demo |
| `AGENT_POLICY` | Server key (`AGENT_POLICY_PRIVATE_KEY`) | Sign meta-tx only |
| `ANALYST` | Ops wallet (optional) | Lane B payment requests |

### 3. Register Composer function schema

Use `guardConfigBatchRequestAndApprove` with `REGISTER_FUNCTION`:

- **Function signature:** from LI.FI compile response (e.g. proxy execute function)
- **Operation type:** e.g. `LIFI_COMPOSER_FLOW`
- **Actions:** include `SIGN_META_REQUEST_AND_APPROVE` + `EXECUTE_META_REQUEST_AND_APPROVE`

Reference: Bloxchain `scripts/sanity-sdk/guard-controller/erc20-mint-controller-tests.ts` (schema registration pattern).

### 4. Whitelist targets

Use `guardConfigBatchRequestAndApprove` with `ADD_TARGET_TO_WHITELIST`:

| Target | Why |
|--------|-----|
| Composer `userProxy` for this treasury | Normal execution |
| Proxy factory (chain-specific) | First-time deploy + execute |
| Sepolia USDC (Lane B) | Vendor payments via `executeWithTimeLock` |

**Empty whitelist = deny all** external targets for that selector.

### 5. Grant RBAC to AGENT_POLICY

Via `roleConfigBatch` on RuntimeRBAC:

- `SIGN_META_REQUEST_AND_APPROVE` on the Composer **execution selector** only
- **Not** Broadcaster role
- **Not** execute permission on `requestAndApproveExecution` handler

---

## AgentBlox execution (Lane A)

### Meta-tx path (recommended)

```
Copilot: /rebalance
    ↓
propose_rebalance tool → LI.FI compose → build TxRecord fields
    ↓
AGENT_POLICY signs EIP-712 (server/signing/meta-tx.ts)
    ↓
User confirms in Copilot (Phase 3 UI)
    ↓
Broadcaster: requestAndApproveExecution(signedMetaTx)
    ↓
GuardController whitelist check → LI.FI proxy executes
```

### TxRecord fields for Composer call

| Field | Source |
|-------|--------|
| `target` | LI.FI `userProxy` |
| `value` | Usually `0` |
| `executionSelector` | First 4 bytes of compiled calldata |
| `executionParams` | Remainder of calldata (no selector prefix) |
| `operationType` | `keccak256("LIFI_COMPOSER_FLOW")` |
| `gasLimit` | Generous cap — Composer flows need headroom |

### SDK handler

Broadcaster calls on AccountBlox clone:

```typescript
await guardController.requestAndApproveExecution(signedMetaTx, { from: broadcasterAddress });
```

Signer in meta-tx must be `AGENT_POLICY` wallet; executor (`msg.sender`) must be Broadcaster. EngineBlox enforces **signer ≠ executor**.

---

## Timelock path (high-risk changes)

Adding new whitelist entries or large policy changes:

1. `executeWithTimeLock` → `PENDING`
2. Countdown (`timeLockPeriodSec`)
3. Owner (Dynamic) → `approveTimeLockExecution`

Use for demo: "agent requests new target → Owner approves on device."

---

## Token approvals

**Preferred:** include `approve` as a step **inside** the Composer Flow (atomic).

**Alternative:** register + whitelist `approve(address,uint256)` on ERC20 as a separate execution selector (two gated txs).

EngineBlox attached-payment flow does not implement generic approve-before-call for bridges.

---

## Attack demo

`simulate_policy_violation` tool builds a proposal to a **non-whitelisted** target. When Broadcaster submits (Phase 4), on-chain revert:

```
TargetNotWhitelisted(target, functionSelector)
```

Off-chain policy gate already rejects; on-chain revert proves architectural enforcement.

---

## Files to implement in AgentBlox

| File | Phase |
|------|-------|
| `server/signing/meta-tx.ts` | 3 |
| `server/lifi/compose.ts` | 4 |
| `server/dynamic/broadcaster.ts` | 2 |
| `src/lib/bloxchain.ts` | 1 |

---

## Bloxchain references

| Resource | Path |
|----------|------|
| Whitelist tests | `test/foundry/integration/WhitelistWorkflow.t.sol` |
| Meta-tx tests | `test/foundry/integration/MetaTransaction.t.sol` |
| SDK mint flow | `scripts/sanity-sdk/guard-controller/erc20-mint-controller-tests.ts` |
| GuardController defs | `contracts/core/execution/lib/definitions/GuardControllerDefinitions.sol` |
