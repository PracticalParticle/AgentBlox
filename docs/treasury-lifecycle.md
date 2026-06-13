# Treasury Lifecycle

Master guide for **creating**, **operating**, **governing**, and **extending** an on-chain treasury with AgentBlox and Bloxchain AccountBlox.

**Built for [ETHGlobal New York 2026](https://ethglobal.com/events/newyork2026)** — Sepolia testnet, three sponsor integrations (Dynamic, LI.FI, ENS). Event details: [event/ethglobal-2026.md](./event/ethglobal-2026.md).

---

## What a treasury is

Each treasury is an **AccountBlox clone** on Sepolia — one address that composes:

| Component | On-chain responsibility |
|-----------|-------------------------|
| **SecureOwnable** | Owner, Broadcaster, Recovery; global timelock period |
| **RuntimeRBAC** | Custom roles, wallets, function-level permissions |
| **GuardController** | All external calls; per-function whitelists; TxRecord audit trail |

AgentBlox **does not provision** clones. It **imports and operates** them after setup on [bloxchain.app](https://bloxchain.app/) or via Bloxchain Protocol scripts.

References: [Bloxchain Account Pattern](https://github.com/PracticalParticle/Bloxchain-Protocol/blob/main/docs/account-pattern.md) · [integrations/bloxchain.md](./integrations/bloxchain.md)

---

## Terminology

| Use | Deprecated |
|-----|------------|
| **Timelock payment** / controlled disbursement | Lane B |
| **Policy execution** / treasury operation (meta-tx) | Lane A |

Both authorization paths share the **same treasury**, **same TxRecord model**, and **same GuardController**.

---

## Lifecycle overview

```text
CREATE (on-chain)     →  clone → initialize → RBAC → whitelist → fund
CONFIGURE (app)       →  .env + Dynamic wallets + optional ENS
OPERATE               →  Copilot tools → policy gate → sign → execute
GOVERN (live)         →  roleConfigBatch / guardConfigBatch / SecureOwnable
EXTEND                →  register function → whitelist → grant role → new tool
```

---

## 1. Create

→ **[provisioning-checklist.md](./provisioning-checklist.md)** (Parts A–D)

1. Clone AccountBlox via CopyBlox or bloxchain.app
2. `initialize(owner, broadcaster, recovery, timeLockPeriodSec, eventForwarder)`
3. Configure RBAC (`AGENT_POLICY`, `ANALYST`, …)
4. Configure GuardController whitelist — [guard-controller.md](./guard-controller.md)
5. Fund clone (ETH + tokens)
6. Set `TREASURY_ADDRESS` in AgentBlox

---

## 2. Configure (application)

→ **[env-configuration.md](./env-configuration.md)**

Minimum: `TREASURY_ADDRESS`, `VITE_DYNAMIC_ENVIRONMENT_ID`.

For execution: `AGENT_POLICY_PRIVATE_KEY`, `DYNAMIC_API_TOKEN`.

Optional: `ENS_NAME` for identity and policy metadata.

---

## 3. Operate

Day-to-day actions via **Copilot treasury tools** (`POST /api/chat`).

| Doc | Contents |
|-----|----------|
| [on-chain-execution-flow.md](./on-chain-execution-flow.md) | Tool → sign → execute |
| [treasury-tools.md](./treasury-tools.md) | Tool catalog |
| [copilot.md](./copilot.md) | Chat UI and slash commands |
| [ui-ux-guidelines.md](./ui-ux-guidelines.md) | MVP interface spec |

### Authorization paths

| Path | Best for | Bloxchain methods |
|------|----------|-------------------|
| **Policy execution** | Agent-proposed ops (e.g. LI.FI rebalance) | AGENT_POLICY sign → `requestAndApproveExecution` |
| **Timelock** | Human-gated disbursements | `executeWithTimeLock` → `approveTimeLockExecution` |

### Three policy layers

| Layer | Where | What it checks |
|-------|-------|----------------|
| Off-chain | `server/policy-gate.ts` | Flow ID, amount, treasury configured |
| ENS (optional) | `bloxchain.allowedFlows` | Discoverable policy metadata |
| On-chain | GuardController + EngineBlox | Whitelist, RBAC, signer ≠ executor |

On-chain enforcement is authoritative.

---

## 4. Govern (live treasury)

→ **[governance.md](./governance.md)**

Governance via bloxchain.app or `@bloxchain/sdk`. AgentBlox **reads** state via tools like `get_whitelisted_targets`.

---

## 5. Extend (new capabilities)

→ **[extending-use-cases.md](./extending-use-cases.md)**

---

## Documentation map

### Protocol (Bloxchain)

| Doc | Purpose |
|-----|---------|
| [integrations/bloxchain.md](./integrations/bloxchain.md) | SDK, addresses, tool map |
| [guard-controller.md](./guard-controller.md) | Whitelist, TxRecord fields, payments |

### Sponsor integrations

| Doc | Purpose |
|-----|---------|
| [integrations/dynamic.md](./integrations/dynamic.md) | Owner + Broadcaster wallets |
| [integrations/lifi.md](./integrations/lifi.md) | Composer rebalance |
| [integrations/ens.md](./integrations/ens.md) | Identity + policy metadata |

Index: [integrations/README.md](./integrations/README.md)

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [architecture.md](./architecture.md) | System layers |
| [implementation-status.md](./implementation-status.md) | What is built today |
| [implementation-plan.md](./implementation-plan.md) | Build backlog |
