# Implementation Status

Living matrix of what is **built**, **stubbed**, or **pending** in AgentBlox. Update when phases complete.

Docs model: [treasury-lifecycle.md](./treasury-lifecycle.md)

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Copilot UI + slash commands | **Done** | `/api/chat`, fallback router, tool cards |
| UI/UX Workspace (target) | **Pending** | Spec in [ui-ux-guidelines.md](./ui-ux-guidelines.md); UI-0–6 not started |
| Treasury tools (read) | **Done** | ETH + ENS + SDK pending/whitelist/roles |
| Treasury tools (propose) | **Partial** | Policy gate + meta-tx sign; on-chain execute needs env |
| Policy gate (off-chain) | **Done** | Flow ID, amount, target validation |
| `@bloxchain/sdk` | **Partial** | Reads + meta-tx signing; timelock writes Phase 5 |
| `@lifi/sdk` | **Pending** | Quote preview stub; compose Phase 4 |
| Dynamic (Owner UI) | **Partial** | `DynamicWidget` only |
| Dynamic (Broadcaster) | **Partial** | SDK wired; needs API token + wallet in `.env` |
| On-chain execution | **Partial** | Sign + `POST /api/execute/rebalance`; needs Broadcaster + execution target env |
| Agent Bridge REST API | **Removed** | Superseded by Copilot tools |
| Unit tests (Vitest) | **Done** | `npm run test` — policy-gate, fallback-router, tool-parser, serialize |

---

## Tool × implementation matrix

| Tool | Operation type | Off-chain | On-chain read | Sign | Execute | UI confirm |
|------|----------------|-----------|---------------|------|---------|------------|
| `get_treasury_status` | Monitor | ✅ | ✅ ETH + roles | — | — | — |
| `resolve_ens_treasury` | Monitor | ✅ | ✅ ENS | — | — | — |
| `list_pending_approvals` | Monitor | ✅ | ✅ SDK | — | — | — |
| `get_whitelisted_targets` | Monitor | ✅ | ✅ SDK | — | — | — |
| `get_lifi_quote_preview` | Monitor | ⚠️ stub | ❌ | — | — | — |
| `propose_rebalance` | Treasury op | ✅ policy | — | ✅ | ⚠️ env | ✅ |
| `request_vendor_payment` | Disbursement | ✅ stub | ❌ | ❌ | ❌ | ❌ Phase 5 |
| `simulate_policy_violation` | Policy test | ✅ | ❌ | ❌ | ❌ | — |

Legend: ✅ working · ⚠️ env-dependent / stub · ❌ not implemented

---

## Phase completion

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Scaffold + Copilot + Console | **Done** |
| 1 | Bloxchain SDK reads | **Done** |
| 2 | Dynamic Owner + Broadcaster | **In progress** (scaffold done; env pending) |
| 3 | Meta-tx sign + Copilot confirm | **Done** (end-to-end needs env + Phase 4 calldata) |
| 4 | LI.FI + whitelist demo | **Not started** |
| 5 | Timelock payments + Owner approve | **Not started** |
| 6 | ENS write + Console persistence | **Partial** (read only) |
| 7 | Polish + submission | **Not started** |

See [implementation-plan.md](./implementation-plan.md).

---

## API endpoints

| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/api/health` | GET | Done | Mode, treasury, Dynamic, Broadcaster, signing config |
| `/api/chat` | POST | Done | Copilot + treasury tools |
| `/api/execute/rebalance` | POST | Done | Broadcaster submits signed meta-tx |

---

## Code paths

| Path | Status | Notes |
|------|--------|-------|
| `server/bloxchain.ts` | Done | SDK factory + role reads |
| `server/tools/read.ts` | Done | Monitor tools + SDK reads |
| `server/tools/propose.ts` | Done | Policy gate + signed meta-tx in proposal |
| `server/signing/meta-tx.ts` | Done | AGENT_POLICY sign + submit helper |
| `server/signing/serialize.ts` | Done | JSON-safe meta-tx round-trip |
| `server/execution/rebalance.ts` | Done | Broadcaster `requestAndApproveExecution` |
| `server/dynamic/client.ts` | Done | Authenticated Dynamic client |
| `server/dynamic/broadcaster.ts` | Done | Status + viem wallet client |
| `server/lifi/compose.ts` | **Missing** | Phase 4 |
| `src/lib/execute-api.ts` | Done | Client → `POST /api/execute/rebalance` |
| `src/lib/meta-tx-types.ts` | Done | Shared serialized meta-tx type |
| `src/components/chat/ToolResultCard.tsx` | Done | Confirm execution button (UI-3 partial) |

---

## Next implementation priorities

1. Set Dynamic env: `VITE_DYNAMIC_ENVIRONMENT_ID`, `DYNAMIC_API_TOKEN`, `BROADCASTER_WALLET_ADDRESS`
2. Set signing env: `AGENT_POLICY_PRIVATE_KEY`, `REBALANCE_EXECUTION_TARGET`, `LIFI_EXECUTION_SELECTOR`
3. Phase 4 — `server/lifi/compose.ts` + real `get_lifi_quote_preview`
4. UI-0 — Workspace shell per [ui-ux-guidelines.md](./ui-ux-guidelines.md)
