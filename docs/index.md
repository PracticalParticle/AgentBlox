# AgentBlox Documentation

Guides for creating, operating, governing, and extending on-chain treasuries with AgentBlox and Bloxchain AccountBlox.

## About this project

**AgentBlox** is built for **[ETHGlobal New York 2026](https://ethglobal.com/events/newyork2026)** by [Particle CS](https://particlecs.com). It demonstrates the [Bloxchain Protocol](https://github.com/PracticalParticle/Bloxchain-Protocol) AccountBlox pattern on Sepolia — Dynamic (keys), LI.FI (execution), ENS (identity), Bloxchain (policy).

→ [ROADMAP-PLAN.md](./ROADMAP-PLAN.md) · [event/ethglobal-2026.md](./event/ethglobal-2026.md) · [implementation-status.md](./implementation-status.md)

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

1. [ROADMAP-PLAN.md](./ROADMAP-PLAN.md) — **strategy, milestones, critical path**
2. [treasury-lifecycle.md](./treasury-lifecycle.md) — **create, operate, govern, extend**
3. [provisioning-checklist.md](./provisioning-checklist.md) — step-by-step on-chain + app setup
4. [guard-controller.md](./guard-controller.md) — whitelist + execution mechanics
5. [env-configuration.md](./env-configuration.md) — environment variables
6. [on-chain-execution-flow.md](./on-chain-execution-flow.md) — tool → chain execution
7. [treasury-tools.md](./treasury-tools.md) — canonical tool catalog
8. [architecture.md](./architecture.md) — system layers
9. [implementation-status.md](./implementation-status.md) — what is built today
10. [implementation-plan.md](./implementation-plan.md) — phased task checklist
11. [governance.md](./governance.md) — change policy on a live treasury
12. [extending-use-cases.md](./extending-use-cases.md) — add new on-chain capabilities
13. [integrations/README.md](./integrations/README.md) — Dynamic, LI.FI, ENS
14. [ui-ux-guidelines.md](./ui-ux-guidelines.md) — MVP interface spec (control surface + agentic patterns)
15. [copilot.md](./copilot.md) — chat UI and slash commands

---

## Document index

### Core

| Document | Purpose |
|----------|---------|
| [treasury-lifecycle.md](./treasury-lifecycle.md) | Master guide |
| [guard-controller.md](./guard-controller.md) | Bloxchain whitelist + TxRecord (protocol) |
| [provisioning-checklist.md](./provisioning-checklist.md) | Setup checklist |
| [on-chain-execution-flow.md](./on-chain-execution-flow.md) | Tool → sign → execute |
| [treasury-tools.md](./treasury-tools.md) | Tool registry |
| [architecture.md](./architecture.md) | System layers |
| [governance.md](./governance.md) | Live policy changes |
| [extending-use-cases.md](./extending-use-cases.md) | New capabilities |
| [env-configuration.md](./env-configuration.md) | `.env` reference |
| [implementation-status.md](./implementation-status.md) | Build matrix |
| [ROADMAP-PLAN.md](./ROADMAP-PLAN.md) | Strategy, milestones, critical path |
| [implementation-plan.md](./implementation-plan.md) | Build backlog |
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
