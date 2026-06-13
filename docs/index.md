# AgentBlox Documentation

Implementation plan for the **Copilot-first** treasury platform.

## Product model

| Surface | Route | Purpose |
|---------|-------|---------|
| **Copilot** | `/` | Primary — conversational treasury operations via tools |
| **Console** | `/console` | Setup — import treasury, view roles, env checklist |

**bloxchain.app** provisions AccountBlox. **AgentBlox** operates it via Copilot tools.

## Start here

1. [architecture.md](./architecture.md) — Copilot + tools + policy gate
2. [copilot.md](./copilot.md) — Chat UI, LLM modes, slash commands
3. [treasury-tools.md](./treasury-tools.md) — MCP-style tool catalog
4. [implementation-plan.md](./implementation-plan.md) — Phased build plan
5. Integration guides: [bloxchain-integration.md](./bloxchain-integration.md), [dynamic-integration.md](./dynamic-integration.md), [lifi-integration.md](./lifi-integration.md), [ens-integration.md](./ens-integration.md)
6. [demo-script.md](./demo-script.md) — 3-minute demo via Copilot

## Document index

| Document | Purpose |
|----------|---------|
| [architecture.md](./architecture.md) | System layers and data flow |
| [copilot.md](./copilot.md) | Conversational interface |
| [treasury-tools.md](./treasury-tools.md) | Tool registry and tiers |
| [implementation-plan.md](./implementation-plan.md) | Phased tasks |
| [agent-bridge.md](./agent-bridge.md) | Legacy agent bridge → merged into tools |
| [bloxchain-integration.md](./bloxchain-integration.md) | AccountBlox SDK |
| [dynamic-integration.md](./dynamic-integration.md) | Owner + Broadcaster |
| [lifi-integration.md](./lifi-integration.md) | Composer quotes |
| [ens-integration.md](./ens-integration.md) | ENS in AgentBlox |
| [demo-script.md](./demo-script.md) | Hackathon demo |

## External references

| Resource | URL |
|----------|-----|
| LI.FI MCP Server | https://docs.li.fi/mcp-server/overview |
| LI.FI Agent Integration | https://docs.li.fi/agents/overview |
| Vercel AI SDK Tools | https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage |
| Modern Treasury MCP | https://www.moderntreasury.com/journal/introducing-the-modern-treasury-mcp-server |
| Bloxchain Protocol | https://github.com/PracticalParticle/Bloxchain-Protocol |
