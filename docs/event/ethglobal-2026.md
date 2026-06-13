# ETHGlobal New York 2026

AgentBlox is built for **[ETHGlobal New York 2026](https://ethglobal.com/events/newyork2026)** by [Particle CS](https://particlecs.com). It showcases the [Bloxchain Protocol](https://github.com/PracticalParticle/Bloxchain-Protocol) AccountBlox pattern on **Sepolia testnet** — without modifying `contracts/core/`.

---

## Sponsor integrations

AgentBlox uses three sponsor integrations (event maximum):

| Sponsor | Role in AgentBlox | Doc |
|---------|-------------------|-----|
| [Dynamic](https://www.dynamic.xyz/) | Owner (embedded wallet), Broadcaster (server wallet) | [integrations/dynamic.md](../integrations/dynamic.md) |
| [LI.FI Composer](https://docs.li.fi/composer/overview) | Whitelisted atomic execution (rebalance flows) | [integrations/lifi.md](../integrations/lifi.md) |
| [ENS](https://ens.domains/) | Treasury identity + policy text records | [integrations/ens.md](../integrations/ens.md) |

**Bloxchain GuardController** is protocol infrastructure (not a sponsor) — see [guard-controller.md](../guard-controller.md).

---

## Prize tracks (reference)

See [ethglobal.com/events/newyork2026/prizes](https://ethglobal.com/events/newyork2026/prizes) for current amounts and criteria.

| Track | Sponsor | AgentBlox angle |
|-------|---------|-----------------|
| Agentic Workflows | LI.FI | Composer behind policy-gated treasury ops |
| Most Innovative | LI.FI | Bloxchain-gated Composer pattern |
| Best Agentic Build | Dynamic | Server wallet executes agent-signed meta-txs |
| Best Money App | Dynamic | Embedded wallet approves timelock payments |
| Best ENS Integration for AI Agents | ENS | Functional identity + `bloxchain.*` text records |

---

## Demo & submission

- **Setup:** [provisioning-checklist.md](../provisioning-checklist.md)
- **Build status:** [implementation-status.md](../implementation-status.md)
- **LI.FI hackathon guide:** [docs.li.fi/composer/ethglobal-ny-2026](https://docs.li.fi/composer/ethglobal-ny-2026)

### ENS booth (Sunday AM)

Live demo flow:

1. Copilot `/ens` — resolve treasury name + text records
2. `/rebalance` — policy-limited treasury operation
3. Verbal: *"ENS names the actor; Bloxchain limits the actor."*

---

## Partnership positioning

> Dynamic holds the keys, LI.FI runs the flows, ENS names the actors — Bloxchain decides what anyone is allowed to trigger.

> LI.FI handles execution complexity; Bloxchain handles authorization constitution. Per-treasury allowed Flow IDs whitelisted in GuardController.

> ENS names the actor; Bloxchain limits the actor. Text records carry allowed flow IDs so agents discover treasuries without centralized registries.
