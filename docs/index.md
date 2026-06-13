# AgentBlox Documentation

Implementation guides for the **Copilot-first** treasury platform.

## Product model

| Surface | Route | Purpose |
|---------|-------|---------|
| **Copilot** | `/` | Primary — conversational treasury operations via tools |
| **Console** | `/console` | Setup — import treasury, view roles, env checklist |

**bloxchain.app** provisions AccountBlox. **AgentBlox** operates it via Copilot tools.

---

## Start here

1. [implementation-status.md](./implementation-status.md) — **what is built today**
2. [architecture.md](./architecture.md) — Copilot + tools + policy gate
3. [provisioning-checklist.md](./provisioning-checklist.md) — setup before demo
4. [env-configuration.md](./env-configuration.md) — all environment variables
5. [copilot.md](./copilot.md) — Chat UI, LLM modes, slash commands
6. [treasury-tools.md](./treasury-tools.md) — MCP-style tool catalog (canonical)
7. [implementation-plan.md](./implementation-plan.md) — Phased build plan
8. [on-chain-execution-flow.md](./on-chain-execution-flow.md) — tool → chain path
9. [guard-controller-setup.md](./guard-controller-setup.md) — LI.FI + GuardController
10. Integration: [bloxchain-integration.md](./bloxchain-integration.md), [dynamic-integration.md](./dynamic-integration.md), [lifi-integration.md](./lifi-integration.md), [ens-integration.md](./ens-integration.md)
11. [demo-script.md](./demo-script.md) — 3-minute Copilot demo

---

## Document index

### Core

| Document | Purpose |
|----------|---------|
| [implementation-status.md](./implementation-status.md) | Living build matrix |
| [architecture.md](./architecture.md) | System layers and data flow |
| [copilot.md](./copilot.md) | Conversational interface |
| [treasury-tools.md](./treasury-tools.md) | Tool registry and tiers |
| [implementation-plan.md](./implementation-plan.md) | Phased tasks |
| [on-chain-execution-flow.md](./on-chain-execution-flow.md) | Tool → sign → execute |
| [provisioning-checklist.md](./provisioning-checklist.md) | bloxchain.app + AgentBlox setup |
| [env-configuration.md](./env-configuration.md) | `.env` reference |
| [demo-script.md](./demo-script.md) | Hackathon demo via Copilot |

### Integrations

| Document | Purpose |
|----------|---------|
| [guard-controller-setup.md](./guard-controller-setup.md) | Whitelist + LI.FI proxy |
| [bloxchain-integration.md](./bloxchain-integration.md) | AccountBlox SDK |
| [dynamic-integration.md](./dynamic-integration.md) | Owner + Broadcaster |
| [lifi-integration.md](./lifi-integration.md) | Composer compose |
| [ens-integration.md](./ens-integration.md) | ENS in AgentBlox |

### Legacy

| Document | Purpose |
|----------|---------|
| [agent-bridge.md](./agent-bridge.md) | **Deprecated** — merged into treasury tools |

---

## External references

| Resource | URL |
|----------|-----|
| LI.FI Composer | https://docs.li.fi/composer/overview |
| LI.FI Agents | https://docs.li.fi/agents/overview |
| Dynamic React SDK | https://www.dynamic.xyz/docs/react/reference/quickstart |
| Vercel AI SDK Tools | https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage |
| Modern Treasury MCP | https://www.moderntreasury.com/journal/introducing-the-modern-treasury-mcp-server |
| Bloxchain Protocol | https://github.com/PracticalParticle/Bloxchain-Protocol |
