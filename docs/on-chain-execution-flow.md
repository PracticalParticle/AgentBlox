# On-Chain Execution Flow

End-to-end path from **Copilot tool** to **Sepolia transaction**. Canonical execution model after the Copilot pivot.

See also: [treasury-lifecycle.md](./treasury-lifecycle.md) · [treasury-tools.md](./treasury-tools.md) · [guard-controller.md](./guard-controller.md)

---

## Authorization paths

Same treasury, same TxRecord model — two paths:

| Path | Best for | Key methods |
|------|----------|-------------|
| **Policy execution** | Agent-proposed ops (e.g. LI.FI rebalance) | AGENT_POLICY sign → `requestAndApproveExecution` |
| **Timelock** | Human-gated disbursements | `executeWithTimeLock` → `approveTimeLockExecution` |

---

## Three policy layers

| Layer | Where | What it checks |
|-------|-------|----------------|
| **Off-chain** | `server/policy-gate.ts` | Flow ID allowlist, amount > 0, treasury configured |
| **ENS (optional)** | `bloxchain.allowedFlows` text record | Discoverable policy metadata |
| **On-chain** | GuardController + EngineBlox | Whitelist, RBAC, signer ≠ executor, timelock |

On-chain enforcement is authoritative. Off-chain and ENS layers should align for production.

---

## Treasury operation: Rebalance (policy execution)

```mermaid
sequenceDiagram
    participant User as User (Copilot)
    participant Tool as propose_rebalance
    participant Policy as policy-gate
    participant LI as LI.FI compose
    participant Sign as AGENT_POLICY sign
    participant BC as Broadcaster
    participant AB as AccountBlox
    participant Proxy as LI.FI userProxy

    User->>Tool: /rebalance
    Tool->>Policy: validateFlowId, amount
    Tool->>LI: POST /compose (fixed Flow)
    LI-->>Tool: userProxy, calldata
    Tool->>Sign: build + sign meta-tx
    Tool-->>User: proposal card (awaiting confirm)
    User->>BC: Confirm
    BC->>AB: requestAndApproveExecution(signedMetaTx)
    AB->>AB: whitelist + RBAC + signer≠executor
    AB->>Proxy: call(calldata)
    Proxy-->>User: TxRecord COMPLETED
```

### Implementation touchpoints

| Step | File (planned) |
|------|----------------|
| Tool entry | `server/tools/propose.ts` → `proposeRebalance` |
| Policy | `server/policy-gate.ts` |
| LI.FI | `server/lifi/compose.ts` |
| Sign | `server/signing/meta-tx.ts` |
| Execute | `server/dynamic/broadcaster.ts` |
| UI confirm | `src/components/chat/ToolResultCard.tsx` (Phase 3) |

### Bloxchain method

```typescript
guardController.requestAndApproveExecution(signedMetaTx, { from: broadcasterAddress });
```

---

## Policy validation: Blocked target

```mermaid
sequenceDiagram
    participant User as User
    participant Tool as simulate_policy_violation
    participant BC as Broadcaster
    participant AB as AccountBlox

    User->>Tool: /attack
    Tool-->>User: off-chain blocked + demo payload
    Note over User,AB: Phase 4: optional on-chain submit
    BC->>AB: meta-tx to non-whitelisted target
    AB-->>User: revert TargetNotWhitelisted
```

Off-chain tool returns `status: blocked`. Phase 4 adds optional Broadcaster submit for on-chain revert proof.

---

## Controlled disbursement: Vendor payment (timelock)

```mermaid
sequenceDiagram
    participant User as User / Analyst
    participant Tool as request_vendor_payment
    participant AB as AccountBlox
    participant Owner as Dynamic Owner

    User->>Tool: /pay
    Tool-->>User: request card (PENDING)
    Note over AB: Phase 5: executeWithTimeLock on-chain
    AB->>AB: TxRecord PENDING + releaseTime
    Owner->>AB: approveTimeLockExecution(txId)
    AB-->>User: COMPLETED + audit trail
```

### Bloxchain methods

```typescript
guardController.executeWithTimeLock(target, value, selector, params, gasLimit, operationType);
guardController.approveTimeLockExecution(txId, { from: ownerAddress });
```

**Whitelist required:** Sepolia USDC contract + `transfer(address,uint256)` selector (and attached-payment keys if applicable). See [guard-controller.md](./guard-controller.md) § Timelock disbursement.

---

## TxRecord lifecycle

Poll after any execution:

```typescript
const record = await guardController.getTransaction(txId);
```

| Status | Meaning | User action |
|--------|---------|-------------|
| `PENDING` | Awaiting timelock release or approval | Owner approve when ready |
| `EXECUTING` | On-chain in progress | Wait |
| `COMPLETED` | Success | Audit |
| `FAILED` | Reverted | Inspect |
| `CANCELLED` | Cancelled | — |

Fields: `releaseTime` (timelock countdown), `params.target` (whitelisted contract), `requester` (audit).

---

## Read path (no execution)

| Tool | Client |
|------|--------|
| `get_treasury_status` | viem `getBalance` |
| `resolve_ens_treasury` | viem ENS on mainnet |
| `list_pending_approvals` | `@bloxchain/sdk` TxRecord poll |
| `get_whitelisted_targets` | `@bloxchain/sdk` `getFunctionWhitelistTargets` |

Planned wrapper: `src/lib/bloxchain.ts`.

---

## What not to do

- Execute LI.FI `executeRoute` directly from browser wallet (bypasses GuardController)
- Let LLM call Broadcaster or hold `AGENT_POLICY_PRIVATE_KEY`
- Use legacy `POST /api/agent/rebalance` — use tools via `/api/chat`

See [agent-bridge.md](./agent-bridge.md) for migration note.
