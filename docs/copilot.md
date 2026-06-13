# Copilot

The **Treasury Copilot** (`/`) is the primary interface for AgentBlox. Users interact via natural language (when an LLM is configured) or slash commands (always available).

See also: [treasury-tools.md](./treasury-tools.md) · [on-chain-execution-flow.md](./on-chain-execution-flow.md)

## Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| **LLM Copilot** | `OPENAI_API_KEY` set | Vercel AI SDK `streamText` + treasury tools |
| **Fallback Copilot** | No API key | Slash commands + keyword router |

Check mode: `GET /api/health` → `{ mode: "copilot-llm" | "copilot-fallback" }`

## Slash commands

Grouped by intent:

### Monitor

| Command | Tool |
|---------|------|
| `/status` | `get_treasury_status` |
| `/ens` | `resolve_ens_treasury` |
| `/pending` | `list_pending_approvals` |
| `/whitelist` | `get_whitelisted_targets` |
| `/quote` | `get_lifi_quote_preview` |

### Operate

| Command | Tool | Auth path |
|---------|------|-----------|
| `/rebalance` | `propose_rebalance` | Policy execution |
| `/pay` | `request_vendor_payment` | Timelock |

### Validate

| Command | Tool |
|---------|------|
| `/attack` | `simulate_policy_violation` |

### Help

| Command | Tool |
|---------|------|
| `/help` | — |

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

## LLM configuration

```env
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

See [env-configuration.md](./env-configuration.md).

## Human-in-the-loop (planned)

| Tool output | User action |
|-------------|-------------|
| `propose_rebalance` | Confirm → Broadcaster executes |
| `request_vendor_payment` | Owner approves via Dynamic |

Phase 3–5 in [implementation-plan.md](./implementation-plan.md). Flow details: [on-chain-execution-flow.md](./on-chain-execution-flow.md).

## Suggested Copilot flow

1. `/status` — configured vs not
2. `/rebalance` — treasury operation proposal
3. `/attack` — policy validation (blocked target)
4. `/pay` — timelock disbursement

Event context: [event/ethglobal-2026.md](./event/ethglobal-2026.md).
