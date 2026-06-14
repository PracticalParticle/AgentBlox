# Copilot

The **Treasury Copilot** is the conversational input layer for AgentBlox. Users interact via natural language (when an LLM is configured) or slash commands (always available). In the target UI, Copilot is **embedded in the Treasury Workspace** action center — not a standalone chat page. See [ui-ux-guidelines.md](./ui-ux-guidelines.md).

See also: [treasury-tools.md](./treasury-tools.md) · [on-chain-execution-flow.md](./on-chain-execution-flow.md) · [ui-ux-guidelines.md](./ui-ux-guidelines.md)

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
| `/pay 5$` | `request_vendor_payment` | B-fast (instant — ANALYST sign → Broadcaster) |
| `/pay 20$` | `request_vendor_payment` | B-timelock (ANALYST request → ANALYST sign → Broadcaster) |

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
User confirms (propose_rebalance) → POST /api/execute/rebalance
    ↓
Dynamic Broadcaster → requestAndApproveExecution (env-dependent)
```

## UI components

Current scaffold (migrating to [ui-ux-guidelines.md](./ui-ux-guidelines.md) Workspace model):

| File | Role | Status |
|------|------|--------|
| `src/pages/CopilotPage.tsx` | Chat layout, `useChat` hook | Current `/` |
| `src/components/chat/ChatInput.tsx` | Input + suggestion chips | Done |
| `src/components/chat/ChatMessageView.tsx` | Message rendering | Done |
| `src/components/chat/ToolResultCard.tsx` | Tool output + Confirm button | Done (JSON card; typed cards UI-3 deferred) |

## LLM configuration

```env
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

See [env-configuration.md](./env-configuration.md).

## Human-in-the-loop

| Tool output | User action | Status |
|-------------|-------------|--------|
| `request_vendor_payment` | **Confirm release** (Broadcaster) after APPROVER signed | ⚠️ APPROVER path in progress; Owner fallback exists |
| `propose_rebalance` | **Confirm execution** in `ToolResultCard` → Broadcaster submits | ✅ *(future with LI.FI)* |

Flow details: [on-chain-execution-flow.md](./on-chain-execution-flow.md). Hackathon MVP: **Lane B** (`/pay`). LI.FI rebalance is future implementation.

## Suggested Copilot flow

1. `/status` — configured vs not
2. `/rebalance` — treasury operation proposal (+ Confirm when signed)
3. `/attack` — policy validation (blocked target)
4. `/pay` — timelock disbursement (Phase 5)

Event context: [event/ethglobal-2026.md](./event/ethglobal-2026.md).
