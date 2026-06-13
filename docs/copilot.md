# Copilot

The **Treasury Copilot** (`/`) is the primary interface for AgentBlox. Users interact via natural language (when an LLM is configured) or slash commands (always available).

## Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **LLM Copilot** | `OPENAI_API_KEY` set | Vercel AI SDK `streamText` + treasury tools |
| **Fallback Copilot** | No API key | Slash commands + keyword router |

Check mode: `GET /api/health` → `{ mode: "copilot-llm" | "copilot-fallback" }`

## Slash commands (fallback + demo reliability)

| Command | Tool | Lane |
|---------|------|------|
| `/status` | `get_treasury_status` | Read |
| `/ens` | `resolve_ens_treasury` | Read |
| `/pending` | `list_pending_approvals` | Read |
| `/whitelist` | `get_whitelisted_targets` | Read |
| `/quote` | `get_lifi_quote_preview` | Read |
| `/rebalance` | `propose_rebalance` | A — agentic |
| `/pay` | `request_vendor_payment` | B — fintech |
| `/attack` | `simulate_policy_violation` | Demo |
| `/help` | — | Help text |

Natural language examples (LLM mode):

- "What's our treasury status?"
- "Propose a rebalance to ETH"
- "Pay vendor 500 USDC"
- "Try to drain the wallet"

## Architecture

```
User message
    ↓
/api/chat (server/chat/handler.ts)
    ↓
LLM + tools  OR  fallback-router
    ↓
server/tools/* (read | propose)
    ↓
server/policy-gate.ts (off-chain validation)
    ↓
Response with tool result cards
    ↓
On-chain execution (Phase 3+) via Dynamic + Bloxchain
```

## UI components

| File | Role |
|------|------|
| `src/pages/CopilotPage.tsx` | Chat layout, `useChat` hook |
| `src/components/chat/ChatInput.tsx` | Input + suggestion chips |
| `src/components/chat/ChatMessageView.tsx` | Message rendering |
| `src/components/chat/ToolResultCard.tsx` | Structured tool output |

Tool results in fallback mode use markdown blocks:

````markdown
```agentblox-tool
{ "tool": "get_treasury_status", "result": { ... } }
```
````

## LLM configuration

```env
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

Uses `@ai-sdk/openai` + `ai` package on the server.

## Future: local LLM (Ollama)

The tool server (`server/tools/`) is LLM-agnostic. To add Ollama:

1. Add `@ai-sdk/openai` compatible Ollama provider or custom provider
2. Swap model in `server/chat/handler.ts`
3. Optionally expose `server/mcp/` for Hermes/OpenClaw

Same tools, different brain.

## Human-in-the-loop (planned)

Chat tool cards will gain action buttons:

| Tool output | User action |
|-------------|-------------|
| `propose_rebalance` | Confirm → Broadcaster executes |
| `request_vendor_payment` | Owner approves via Dynamic |

Phase 3–5 in [implementation-plan.md](./implementation-plan.md). Flow details: [on-chain-execution-flow.md](./on-chain-execution-flow.md).

## Demo tips

1. Start with `/status` — shows configured vs not
2. `/rebalance` — Lane A proposal card
3. `/attack` — Bloxchain policy block story
4. `/pay` — Lane B timelock story
5. If LLM enabled, repeat in natural language

See [demo-script.md](./demo-script.md).
