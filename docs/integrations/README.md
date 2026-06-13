# Integrations

**Audience:** Developers wiring AgentBlox to sponsor SDKs.  
**Prerequisites:** [treasury-lifecycle.md](../treasury-lifecycle.md) · [provisioning-checklist.md](../provisioning-checklist.md)

AgentBlox uses **three sponsor integrations** for ETHGlobal NY 2026, plus **Bloxchain protocol** infrastructure.

**Build status:** [implementation-status.md](../implementation-status.md) — Phases 0–1 and 3 complete; Dynamic Broadcaster scaffold done; LI.FI compose Phase 4 pending.

---

## Sponsor integrations

| Integration | Doc | Role |
|-------------|-----|------|
| **Dynamic** | [dynamic.md](./dynamic.md) | Owner (embedded) + Broadcaster (server) wallets |
| **LI.FI** | [lifi.md](./lifi.md) | Composer compose, rebalance flows |
| **ENS** | [ens.md](./ens.md) | Treasury identity + policy text records |

---

## Bloxchain protocol (not a sponsor)

| Doc | Role |
|-----|------|
| [integrations/bloxchain.md](./bloxchain.md) | AccountBlox SDK, Sepolia addresses, tool mapping |
| [guard-controller.md](../guard-controller.md) | Whitelist setup, TxRecord fields, payment selectors |

---

## Layer model

```text
┌─────────────────────────────────────┐
│  ENS — who is this treasury?        │
├─────────────────────────────────────┤
│  Bloxchain — what may it do?        │  ← GuardController + RBAC
├─────────────────────────────────────┤
│  Dynamic — who signs?               │
├─────────────────────────────────────┤
│  LI.FI — how does execution run?    │
└─────────────────────────────────────┘
```

Event context: [event/ethglobal-2026.md](../event/ethglobal-2026.md)

---

## Setup order

1. [bloxchain.md](./bloxchain.md) + [guard-controller.md](../guard-controller.md) — provision on bloxchain.app ([checklist](../provisioning-checklist.md) Part A)
2. [dynamic.md](./dynamic.md) — map Owner and Broadcaster wallets
3. [ens.md](./ens.md) — optional identity and policy metadata
4. [lifi.md](./lifi.md) — Composer flows for treasury operations
