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

## Integration narrative

How AgentBlox demonstrates each sponsor integration in the product:

| Focus | Sponsor | AgentBlox angle |
|-------|---------|-----------------|
| Agentic workflows | LI.FI | Composer behind policy-gated treasury ops |
| Innovative execution | LI.FI | Bloxchain-gated Composer pattern |
| Agentic automation | Dynamic | Server wallet executes agent-signed meta-txs |
| Treasury UX | Dynamic | Embedded wallet approves timelock payments |
| Agent identity | ENS | Functional identity + `bloxchain.*` text records |

---

## Demo & submission

- **Setup:** [provisioning-checklist.md](../provisioning-checklist.md)
- **Build status:** [implementation-status.md](../implementation-status.md) — Phases 0–1 and 3 complete; Phase 4 (LI.FI compose) is next critical path
- **UI/UX spec:** [ui-ux-guidelines.md](../ui-ux-guidelines.md)
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
