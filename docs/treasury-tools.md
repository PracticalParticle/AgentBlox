# Treasury Tools

AgentBlox exposes treasury operations as **MCP-style tools** — structured functions the Copilot LLM (or fallback router) can invoke. Tools **propose** actions; Bloxchain **permits** execution.

## Tool tiers

| Tier | Executes on-chain? | Human approval? | Examples |
|------|-------------------|-----------------|----------|
| **Read** | No | No | `get_treasury_status` |
| **Propose** | No | Confirm in chat (Phase 3+) | `propose_rebalance` |
| **Execute** | Yes | Required role | Broadcaster / Owner (Phase 3+) |

## Tool catalog

### Read tools

| Tool | Description | Integrates |
|------|-------------|------------|
| `get_treasury_status` | Address, ETH balance, policy summary | viem + config |
| `resolve_ens_treasury` | ENS → address + text records | ENS via viem mainnet |
| `list_pending_approvals` | Pending timelock txs | @bloxchain/sdk (Phase 2) |
| `get_whitelisted_targets` | GuardController expectations | SDK (Phase 2) |
| `get_lifi_quote_preview` | Read-only LI.FI quote params | @lifi/sdk (Phase 4) |

### Propose tools

| Tool | Description | Policy gate |
|------|-------------|-------------|
| `propose_rebalance` | LI.FI Composer rebalance proposal | Flow ID allowlist |
| `request_vendor_payment` | Lane B timelock payment | Treasury configured |
| `simulate_policy_violation` | Demo blocked transfer | Always blocks |

## Implementation files

```
server/tools/
├── index.ts      # AI SDK tool definitions (zod schemas)
├── read.ts       # Read tool executors
└── propose.ts    # Propose tool executors

server/policy-gate.ts   # Off-chain validation before sign/execute
```

## Policy gate rules

Before any propose tool returns success:

1. Treasury address configured (`TREASURY_ADDRESS`)
2. Flow ID in allowlist (`rebalance-sepolia-v1`)
3. Amount > 0
4. Unauthorized targets rejected with `TARGET_NOT_WHITELISTED`

On-chain, GuardController enforces the same properties architecturally.

## LI.FI integration pattern

Per [LI.FI MCP docs](https://docs.li.fi/mcp-server/overview):

- MCP / tools get quotes (read-only)
- Wallet / Broadcaster signs and submits
- AgentBlox adds Bloxchain meta-tx layer between quote and execution

```
get_lifi_quote_preview  →  read
propose_rebalance       →  policy gate  →  AGENT_POLICY sign  →  Broadcaster execute
```

## Future: AgentBlox MCP server

Export the same tools from `server/mcp/index.ts` for:

- Cursor / Claude Desktop
- Hermes / OpenClaw agents
- Local Ollama clients

Structure matches [Modern Treasury MCP](https://www.moderntreasury.com/journal/introducing-the-modern-treasury-mcp-server) pattern.

## Adding a new tool

1. Implement executor in `read.ts` or `propose.ts`
2. Add zod schema + `tool()` in `server/tools/index.ts`
3. Add slash command in `server/chat/fallback-router.ts`
4. Document in this file
5. Add suggestion chip in `ChatInput.tsx` (optional)

## Security rules

- AGENT_POLICY key stays server-side only
- Tools never call Broadcaster directly
- LLM cannot invent balances — read tools hit chain/config
- Execute tier requires explicit user confirmation in UI
