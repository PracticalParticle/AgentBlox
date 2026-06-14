# Treasury Tools

AgentBlox exposes treasury operations as **MCP-style tools** — structured functions the Copilot LLM (or fallback router) can invoke. Tools **propose** actions; Bloxchain **permits** execution.

> **Canonical spec** for agent operations. Legacy Agent Bridge REST API deprecated — see [agent-bridge.md](./agent-bridge.md).  
> Build status: [implementation-status.md](./implementation-status.md). Execution path: [on-chain-execution-flow.md](./on-chain-execution-flow.md).

## Tool tiers

| Tier | Executes on-chain? | Human approval? | Examples |
|------|-------------------|-----------------|----------|
| **Read** | No | No | `get_treasury_status` |
| **Propose** | No | Confirm in chat | `propose_rebalance`, `request_vendor_payment` |
| **Execute** | Yes | User clicks **Submit on-chain (Broadcaster)** or Dynamic wallet | Broadcaster after sign; `/deposit` via connected wallet |

## Tool catalog

### Read tools

| Tool | Operation type | Description | Integrates |
|------|----------------|-------------|------------|
| `get_treasury_status` | Monitor | Address, ETH balance, on-chain roles, ENS flows | viem + `@bloxchain/sdk` |
| `resolve_ens_treasury` | Monitor | ENS → address + text records | ENS via viem mainnet |
| `list_pending_approvals` | Monitor | Pending timelock txs | `@bloxchain/sdk` |
| `get_whitelisted_targets` | Monitor | GuardController whitelist | `@bloxchain/sdk` |
| `get_lifi_quote_preview` | Monitor | LI.FI compose preview | Composer + fallback — Phase 4 E2E future |

### Propose / execute tools

| Tool | Operation type | Auth path | Policy gate | Sign | Execute |
|------|----------------|-----------|-------------|------|---------|
| `propose_rebalance` | Treasury operation | Policy execution | Flow ID + ENS flows | ✅ AGENT_POLICY | ⚠️ Broadcaster (env) |
| `request_vendor_payment` | Disbursement | Lane B dual path | Amount routing | ✅ ANALYST (B-fast) / ANALYST+APPROVER (B-timelock) | ✅ Broadcaster |
| `prepare_wallet_transfer` | Funding | Connected Dynamic wallet | Treasury configured | — | ✅ User wallet (`/deposit`, `/withdraw`) |
| `simulate_policy_violation` | Policy test | — (blocked) | Always blocks | — | — |

## Implementation files

```
server/tools/
├── index.ts      # AI SDK tool definitions (zod schemas)
├── read.ts       # Read tool executors
├── propose.ts    # Propose tool executors
└── wallet-transfer.ts  # /deposit, /withdraw prep

server/policy-gate.ts          # Off-chain validation before sign/execute
server/signing/meta-tx.ts      # AGENT_POLICY EIP-712 signing (rebalance)
server/signing/payment-meta-tx.ts  # ANALYST B-fast + APPROVER B-timelock approve
server/signing/serialize.ts    # JSON-safe meta-tx for API + UI
server/execution/rebalance.ts  # Broadcaster submit (rebalance)
server/execution/payment.ts    # ANALYST executeWithTimeLock
server/execution/payment-approve.ts  # APPROVER sign + Broadcaster approve/instant
```

Client broadcast (Dynamic server wallet):

- `src/components/broadcaster/BroadcasterSubmitBlock.tsx` — shared **Submit on-chain (Broadcaster)** button (gated by `/api/health`)
- `src/lib/execute-api.ts` → `POST /api/execute/rebalance` | `/payment` | `/payment-approve`
- `src/lib/wallet-transfer-eth.ts` — `/deposit` / `/withdraw` via connected Dynamic wallet

## Policy gate rules

Before any propose tool returns success:

1. Treasury address configured (`TREASURY_ADDRESS`)
2. Flow ID in allowlist (`rebalance-sepolia-v1`) — intersected with ENS `bloxchain.allowedFlows` when configured
3. Amount > 0
4. Unauthorized targets rejected with `TARGET_NOT_WHITELISTED`

On-chain, GuardController enforces the same properties.

## Lane B payment roles

| Path | Sign | Execute |
|------|------|---------|
| **B-fast** (&lt; $10 USDC) | **ANALYST** — `SIGN_META_REQUEST_AND_APPROVE` | Broadcaster — `requestAndApproveExecution` |
| **B-timelock** (≥ $10 USDC) | **ANALYST** — `executeWithTimeLock` request; **APPROVER** — `SIGN_META_APPROVE` | Broadcaster — `approveTimeLockExecutionWithMetaTx` |

## LI.FI integration pattern

```
get_lifi_quote_preview  →  read (Phase 4: real compose)
propose_rebalance       →  policy gate  →  AGENT_POLICY sign  →  Confirm  →  Broadcaster execute
```

See [integrations/lifi.md](./integrations/lifi.md).

## Adding a new tool

1. Define operation type and auth path — see [extending-use-cases.md](./extending-use-cases.md)
2. Implement executor in `read.ts`, `propose.ts`, or a dedicated module
3. Add zod schema + `tool()` in `server/tools/index.ts`
4. Add slash command in `server/chat/fallback-router.ts`
5. Add policy-gate rules in `server/policy-gate.ts`
6. Document in this file

## Future: AgentBlox MCP server

Export the same tools from `server/mcp/index.ts` for external agents (Hermes, OpenClaw, Cursor).

## Security rules

- Server role keys (`ANALYST`, `APPROVER`, `AGENT_POLICY`) stay server-side only
- Tools never call Broadcaster directly from propose executors — user **Submit on-chain (Broadcaster)** triggers execute APIs
- LLM cannot invent balances — read tools hit chain/config
- Execute tier requires explicit user confirmation in UI
