# ETHGlobal New York 2026

AgentBlox is built for **[ETHGlobal New York 2026](https://ethglobal.com/events/newyork2026)** by [Particle CS](https://particlecs.com). It showcases the [Bloxchain Protocol](https://github.com/PracticalParticle/Bloxchain-Protocol) AccountBlox pattern on **Sepolia testnet** — without modifying `contracts/core/`.

---

## Sponsor integrations

AgentBlox uses three sponsor integrations (event maximum):

| Sponsor | Role in AgentBlox | Doc |
|---------|-------------------|-----|
| [Dynamic](https://www.dynamic.xyz/) | Owner (embedded wallet), Broadcaster (server wallet) | [integrations/dynamic.md](../integrations/dynamic.md) |
| [LI.FI Composer](https://docs.li.fi/composer/overview) | Whitelisted atomic execution (rebalance flows) — **future implementation** | [integrations/lifi.md](../integrations/lifi.md) |
| [ENS](https://ens.domains/) | Treasury identity + policy text records | [integrations/ens.md](../integrations/ens.md) |

**Bloxchain GuardController** is protocol infrastructure (not a sponsor) — see [guard-controller.md](../guard-controller.md).

---

## Integration narrative

How AgentBlox demonstrates each sponsor integration in the product:

| Focus | Sponsor | AgentBlox angle |
|-------|---------|-----------------|
| Agentic workflows | LI.FI *(future)* | Composer behind policy-gated treasury ops |
| Innovative execution | Bloxchain + Dynamic | Signer ≠ executor on Lane B timelock payments |
| Agentic automation | Dynamic | Server wallet executes APPROVER-signed meta-txs |
| Treasury UX | Dynamic | Broadcaster submits; Owner for governance |
| Agent identity | ENS | Functional identity + `bloxchain.*` text records |

---

## Demo & submission

- **Setup:** [provisioning-checklist.md](../provisioning-checklist.md)
- **Build status:** [implementation-status.md](../implementation-status.md) — **Lane B** (timelock `/pay`: ANALYST → APPROVER → Broadcaster) is hackathon MVP; LI.FI is future
- **UI/UX spec:** [ui-ux-guidelines.md](../ui-ux-guidelines.md)
- **LI.FI hackathon guide:** [docs.li.fi/composer/ethglobal-ny-2026](https://docs.li.fi/composer/ethglobal-ny-2026)

### ENS booth (Sunday AM)

Live demo flow:

1. Copilot `/ens` — resolve treasury name + text records
2. `/pay` — Lane B timelock payment (ANALYST → APPROVER → Broadcaster)
3. Verbal: *"ENS names the actor; Bloxchain limits the actor."*
4. *(Optional future)* `/rebalance` — policy-limited LI.FI treasury operation

---

## Partnership positioning

> Dynamic holds the keys. ENS names the actors — Bloxchain decides what anyone is allowed to trigger.

> Lane B demo: ANALYST requests, APPROVER signs, Broadcaster executes — same signer ≠ executor pattern as policy meta-txs.

> *(Future)* LI.FI handles execution complexity; Bloxchain handles authorization constitution.

> ENS names the actor; Bloxchain limits the actor. Text records carry allowed flow IDs so agents discover treasuries without centralized registries.
