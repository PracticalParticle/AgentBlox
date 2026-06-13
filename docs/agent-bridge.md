# Agent Bridge (Deprecated)

> **Status:** Deprecated after Copilot pivot (June 2026).  
> **Use instead:** [treasury-tools.md](./treasury-tools.md) + [on-chain-execution-flow.md](./on-chain-execution-flow.md)

The original design exposed a standalone **Agent Bridge REST API** (`POST /api/agent/rebalance`, etc.). The current architecture routes all agent operations through **Copilot treasury tools** on `POST /api/chat`, with execution via `POST /api/execute/rebalance`.

---

## What changed

| Legacy (Agent Bridge) | Current (Copilot tools) |
|----------------------|-------------------------|
| `POST /api/agent/rebalance` | `propose_rebalance` tool via `/api/chat` |
| `POST /api/agent/simulate-attack` | `simulate_policy_violation` tool |
| `server/flows/rebalance.ts` | `server/tools/propose.ts` + `server/signing/` + `server/lifi/` (Phase 4) |
| Agent Flows page buttons | Copilot `/rebalance`, `/attack` slash commands |
| `src/lib/agent-api.ts` | `src/lib/execute-api.ts` + `ToolResultCard` Confirm |

---

## Design principles (still valid)

| Principle | Current implementation |
|-----------|------------------------|
| No LLM required for demo | Fallback slash router + optional LLM |
| Agent-ready for MCP | Same tools exportable from `server/mcp/` (future) |
| Sign only (AGENT_POLICY) | `server/signing/meta-tx.ts` |
| Policy before sign | `server/policy-gate.ts` |
| Broadcaster executes | `server/execution/rebalance.ts` via Dynamic Node SDK |

---

## Migration guide for developers

If you see references to Agent Bridge in old notes or code:

1. **Proposals** → `server/tools/propose.ts`
2. **Signing** → `server/signing/meta-tx.ts` (called from `proposeRebalance`)
3. **Execution** → `POST /api/execute/rebalance` → `server/execution/rebalance.ts`
4. **Frontend** → `ToolResultCard` Confirm + `src/lib/execute-api.ts`
5. **Do not restore** `src/lib/agent-api.ts` or REST agent routes

---

## Future: MCP export (not REST)

Post-hackathon, expose tools as MCP rather than restoring REST:

| MCP tool | Maps to |
|----------|---------|
| `agentblox_propose_rebalance` | `propose_rebalance` executor |
| `agentblox_simulate_attack` | `simulate_policy_violation` executor |
| `agentblox_get_treasury_status` | `get_treasury_status` executor |

See [treasury-tools.md](./treasury-tools.md) § Future: AgentBlox MCP server.

---

## Historical API spec (reference only)

<details>
<summary>Original REST endpoints (not implemented)</summary>

### `POST /api/agent/rebalance`

Request: `{ "treasuryAddress": "0x..." }`  
Response: `{ "flowId", "target", "calldata", "signedMetaTx" }`

### `POST /api/agent/simulate-attack`

Request: `{ "treasuryAddress": "0x..." }`  
Response: `{ "expectedError": "TargetNotWhitelisted" }`

These were never added to `server/index.ts`. Do not implement unless you have a specific external integration need — prefer MCP export of the same tool executors.

</details>
