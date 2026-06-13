# Treasury Tools

AgentBlox exposes treasury operations as **MCP-style tools** — structured functions the Copilot LLM (or fallback router) can invoke. Tools **propose** actions; Bloxchain **permits** execution.

> **Canonical spec** for agent operations. Legacy Agent Bridge REST API deprecated — see [agent-bridge.md](./agent-bridge.md).  
> Build status: [implementation-status.md](./implementation-status.md). Execution path: [on-chain-execution-flow.md](./on-chain-execution-flow.md).

## Tool tiers

| Tier | Executes on-chain? | Human approval? | Examples |
|------|-------------------|-----------------|----------|
| **Read** | No | No | `get_treasury_status` |
| **Propose** | No | Confirm in chat | `propose_rebalance` |
| **Execute** | Yes | Required role | Broadcaster / Owner after confirm |

## Tool catalog

### Read tools

| Tool | Operation type | Description | Integrates |
|------|----------------|-------------|------------|
| `get_treasury_status` | Monitor | Address, ETH balance, on-chain roles | viem + `@bloxchain/sdk` |
| `resolve_ens_treasury` | Monitor | ENS → address + text records | ENS via viem mainnet |
| `list_pending_approvals` | Monitor | Pending timelock txs | `@bloxchain/sdk` |
| `get_whitelisted_targets` | Monitor | GuardController whitelist | `@bloxchain/sdk` |
| `get_lifi_quote_preview` | Monitor | Read-only LI.FI compose preview | Stub — Phase 4 |

### Propose tools

| Tool | Operation type | Auth path | Policy gate | Sign | Execute |
|------|----------------|-----------|-------------|------|---------|
| `propose_rebalance` | Treasury operation | Policy execution | Flow ID allowlist | ✅ AGENT_POLICY | ⚠️ Broadcaster (env) |
| `request_vendor_payment` | Disbursement | Timelock | Treasury configured | Phase 5 | Phase 5 |
| `simulate_policy_violation` | Policy test | — (blocked) | Always blocks | — | — |

## Implementation files

```
server/tools/
├── index.ts      # AI SDK tool definitions (zod schemas)
├── read.ts       # Read tool executors
└── propose.ts    # Propose tool executors

server/policy-gate.ts          # Off-chain validation before sign/execute
server/signing/meta-tx.ts      # AGENT_POLICY EIP-712 signing
server/signing/serialize.ts    # JSON-safe meta-tx for API + UI
server/execution/rebalance.ts  # Broadcaster submit
```

Client confirm: `src/lib/execute-api.ts` → `POST /api/execute/rebalance`

## Policy gate rules

Before any propose tool returns success:

1. Treasury address configured (`TREASURY_ADDRESS`)
2. Flow ID in allowlist (`rebalance-sepolia-v1`)
3. Amount > 0
4. Unauthorized targets rejected with `TARGET_NOT_WHITELISTED`

On-chain, GuardController enforces the same properties.

## LI.FI integration pattern

```
get_lifi_quote_preview  →  read (Phase 4: real compose)
propose_rebalance       →  policy gate  →  AGENT_POLICY sign  →  Confirm  →  Broadcaster execute
```

See [integrations/lifi.md](./integrations/lifi.md).

## Adding a new tool

1. Define operation type and auth path — see [extending-use-cases.md](./extending-use-cases.md)
2. Implement executor in `read.ts` or `propose.ts`
3. Add zod schema + `tool()` in `server/tools/index.ts`
4. Add slash command in `server/chat/fallback-router.ts`
5. Add policy-gate rules in `server/policy-gate.ts`
6. Document in this file

## Future: AgentBlox MCP server

Export the same tools from `server/mcp/index.ts` for external agents (Hermes, OpenClaw, Cursor).

## Security rules

- AGENT_POLICY key stays server-side only
- Tools never call Broadcaster directly from propose executors — user confirm triggers `POST /api/execute/rebalance`
- LLM cannot invent balances — read tools hit chain/config
- Execute tier requires explicit user confirmation in UI
