# AgentBlox Documentation

Guides for creating, operating, governing, and extending on-chain treasuries with AgentBlox and Bloxchain AccountBlox.

## About this project

**AgentBlox** is built for **[ETHGlobal New York 2026](https://ethglobal.com/events/newyork2026)** by [Particle CS](https://particlecs.com). It demonstrates the [Bloxchain Protocol](https://github.com/PracticalParticle/Bloxchain-Protocol) AccountBlox pattern on Sepolia — Dynamic (keys), LI.FI (execution), ENS (identity), Bloxchain (policy).

→ [overview.md](./overview.md) · [ROADMAP-PLAN.md](./ROADMAP-PLAN.md) · [event/ethglobal-2026.md](./event/ethglobal-2026.md) · [implementation-status.md](./implementation-status.md)

**Build snapshot (June 2026):** ~50% complete — Phases 0–1 and 3 done; Phase 2 scaffold done; **Phase 4 (LI.FI) is the engineering critical path.** See [overview.md](./overview.md).

## Product model

| Surface | Route | Purpose |
|---------|-------|---------|
| **Treasury Workspace** | `/` | Day-to-day ops — status, actions, approvals, activity ([ui-ux-guidelines.md](./ui-ux-guidelines.md)) |
| **Setup** | `/setup` | First-run wizard — connect Dynamic, import treasury, verify policy |
| **Copilot** (current) | `/` | Conversational input embedded in Workspace |
| **Console** (legacy) | `/console` | Static checklist — migrating to Setup wizard |

**bloxchain.app** provisions AccountBlox. **AgentBlox** operates it via Copilot tools.

Master guide: [treasury-lifecycle.md](./treasury-lifecycle.md)

---

## Start here

1. **[getting-started.md](./getting-started.md)** — **step-by-step setup: AccountBlox + AgentBlox**
2. [overview.md](./overview.md) — executive snapshot: status, next steps, blockers
3. [ROADMAP-PLAN.md](./ROADMAP-PLAN.md) — strategy, milestones, critical path
4. [treasury-lifecycle.md](./treasury-lifecycle.md) — create, operate, govern, extend
5. [provisioning-checklist.md](./provisioning-checklist.md) — checklist (companion to getting-started)
6. [guard-controller.md](./guard-controller.md) — whitelist + execution mechanics
7. [env-configuration.md](./env-configuration.md) — environment variables
8. [on-chain-execution-flow.md](./on-chain-execution-flow.md) — tool → chain execution
9. [treasury-tools.md](./treasury-tools.md) — canonical tool catalog
10. [architecture.md](./architecture.md) — system layers
11. [implementation-status.md](./implementation-status.md) — what is built today
12. [implementation-plan.md](./implementation-plan.md) — phased task checklist
13. [governance.md](./governance.md) — change policy on a live treasury
14. [extending-use-cases.md](./extending-use-cases.md) — add new on-chain capabilities
15. [integrations/README.md](./integrations/README.md) — Dynamic, LI.FI, ENS
16. [ui-ux-guidelines.md](./ui-ux-guidelines.md) — MVP interface spec
17. [copilot.md](./copilot.md) — chat UI and slash commands

---

## Document index

### Planning

| Document | Purpose |
|----------|---------|
| [overview.md](./overview.md) | Executive snapshot — status, next steps, blockers |
| [ROADMAP-PLAN.md](./ROADMAP-PLAN.md) | Strategy, milestones, critical path |
| [docker-plan.md](./docker-plan.md) | Docker-native dev/ops plan (Dynamic SDK / Windows) |
| [implementation-status.md](./implementation-status.md) | Live build matrix |
| [implementation-plan.md](./implementation-plan.md) | Phased task checklist |

### Core

| Document | Purpose |
|----------|---------|
| [getting-started.md](./getting-started.md) | **Step-by-step setup guide** |
| [treasury-lifecycle.md](./treasury-lifecycle.md) | Master guide |
| [guard-controller.md](./guard-controller.md) | Bloxchain whitelist + TxRecord (protocol) |
| [provisioning-checklist.md](./provisioning-checklist.md) | Setup checklist |
| [on-chain-execution-flow.md](./on-chain-execution-flow.md) | Tool → sign → execute |
| [treasury-tools.md](./treasury-tools.md) | Tool registry |
| [architecture.md](./architecture.md) | System layers |
| [governance.md](./governance.md) | Live policy changes |
| [extending-use-cases.md](./extending-use-cases.md) | New capabilities |
| [env-configuration.md](./env-configuration.md) | `.env` reference |
| [ui-ux-guidelines.md](./ui-ux-guidelines.md) | MVP UI/UX spec |
| [copilot.md](./copilot.md) | Conversational interface |

### Event

| Document | Purpose |
|----------|---------|
| [event/ethglobal-2026.md](./event/ethglobal-2026.md) | ETHGlobal context, sponsor integrations, submission |

### Integrations (sponsors)

| Document | Purpose |
|----------|---------|
| [integrations/bloxchain.md](./integrations/bloxchain.md) | AccountBlox SDK |
| [integrations/dynamic.md](./integrations/dynamic.md) | Owner + Broadcaster |
| [integrations/lifi.md](./integrations/lifi.md) | Composer compose |
| [integrations/ens.md](./integrations/ens.md) | ENS identity |

### Legacy

| Document | Purpose |
|----------|---------|
| [agent-bridge.md](./agent-bridge.md) | Deprecated — use treasury tools |

---

## External references

| Resource | URL |
|----------|-----|
| ETHGlobal NY 2026 | https://ethglobal.com/events/newyork2026 |
| Bloxchain Protocol | https://github.com/PracticalParticle/Bloxchain-Protocol |
| LI.FI Composer | https://docs.li.fi/composer/overview |
| Dynamic React SDK | https://www.dynamic.xyz/docs/react/reference/quickstart |
| Vercel AI SDK Tools | https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage |
