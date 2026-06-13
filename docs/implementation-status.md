# Implementation Status

Living matrix of what is **built**, **stubbed**, or **pending** in AgentBlox. Update when phases complete.

Docs model: [treasury-lifecycle.md](./treasury-lifecycle.md)

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Copilot UI + slash commands | **Done** | `/api/chat`, fallback router, tool cards (JSON) |
| UI/UX Workspace (target) | **Pending** | Spec in [ui-ux-guidelines.md](./ui-ux-guidelines.md); UI-0–6 not started |
| Treasury tools (read) | **Partial** | ETH + ENS + SDK pending/whitelist/roles |
| Treasury tools (propose) | **Partial** | Policy gate + meta-tx sign; execution needs Dynamic + env |
| Policy gate (off-chain) | **Done** | Flow ID, amount, target validation |
| `@bloxchain/sdk` | **Partial** | Wired for monitor-tool reads + meta-tx signing |
| `@lifi/sdk` | **Pending** | Quote preview is placeholder |
| Dynamic (Owner UI) | **Partial** | `DynamicWidget` only |
| Dynamic (Broadcaster) | **Partial** | SDK wired; needs API token + wallet address in `.env` |
| On-chain execution | **Partial** | Sign + `/api/execute/rebalance`; needs Broadcaster env |
| Agent Bridge REST API | **Removed** | Superseded by Copilot tools |
| Documentation (lifecycle) | **Done** | treasury-lifecycle, governance, extending-use-cases, integrations/ |
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
| `propose_rebalance` | Treasury op | ✅ policy | ❌ | ✅ | ⚠️ env | ✅ |
| `request_vendor_payment` | Disbursement | ✅ stub | ❌ | ❌ | ❌ | ❌ Phase 5 |
| `simulate_policy_violation` | Policy test | ✅ | ❌ | ❌ | ❌ | — |

Legend: ✅ working · ⚠️ placeholder / env-dependent · ❌ not implemented

---

## Phase completion

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Scaffold + Copilot + Console | **Done** |
| 1 | Bloxchain SDK reads | **Done** (needs live treasury to verify) |
| 2 | Dynamic Owner + Broadcaster | **In progress** (scaffold done; env pending) |
| 3 | Meta-tx sign in `propose_rebalance` | **Done** (execution env-dependent) |
| 4 | LI.FI + whitelist demo | **Not started** |
| 5 | Timelock payments + Owner approve | **Not started** |
| 6 | ENS write + Console persistence | **Partial** (read only) |
| 7 | Polish + submission | **Not started** |

See [implementation-plan.md](./implementation-plan.md).

---

## Documentation alignment

| Doc | Status |
|-----|--------|
| [treasury-lifecycle.md](./treasury-lifecycle.md) | ✅ Master guide |
| [governance.md](./governance.md) | ✅ Live policy changes |
| [extending-use-cases.md](./extending-use-cases.md) | ✅ Extension recipe |
| [guard-controller.md](./guard-controller.md) | ✅ Whitelist + TxRecord spec |
| [event/ethglobal-2026.md](./event/ethglobal-2026.md) | ✅ ETHGlobal context |
| [integrations/](./integrations/README.md) | ✅ Sponsor integrations |
| [ui-ux-guidelines.md](./ui-ux-guidelines.md) | ✅ MVP UI/UX spec |
| [treasury-tools.md](./treasury-tools.md) | ✅ Canonical tool spec |
| [on-chain-execution-flow.md](./on-chain-execution-flow.md) | ✅ Execution model |
| [agent-bridge.md](./agent-bridge.md) | ⚠️ Deprecated |

---

## Code paths

| Path | Status | Notes |
|------|--------|-------|
| `server/bloxchain.ts` | Done | SDK factory + role reads |
| `server/tools/read.ts` | Done | SDK reads for pending + whitelist |
| `server/tools/propose.ts` | Done | Policy gate + signed meta-tx in proposal |
| `server/signing/meta-tx.ts` | Done | AGENT_POLICY sign + submit helper |
| `server/signing/serialize.ts` | Done | JSON-safe meta-tx round-trip |
| `server/execution/rebalance.ts` | Done | Broadcaster `requestAndApproveExecution` |
| `server/dynamic/client.ts` | Done | Authenticated Dynamic client |
| `server/dynamic/broadcaster.ts` | Done | Status + viem wallet client |
| `server/lifi/compose.ts` | **Missing** | Phase 4 |
| `src/lib/execute-api.ts` | Done | Client → `POST /api/execute/rebalance` |
| `src/components/chat/ToolResultCard.tsx` | Done | Confirm execution button |

---

## Next implementation priorities

1. Set Dynamic env: `VITE_DYNAMIC_ENVIRONMENT_ID`, `DYNAMIC_API_TOKEN`, `BROADCASTER_WALLET_ADDRESS`
2. Set signing env: `AGENT_POLICY_PRIVATE_KEY`, `REBALANCE_EXECUTION_TARGET`, `LIFI_EXECUTION_SELECTOR`
3. Phase 4 — LI.FI compose + real quote preview
4. UI-0 — Workspace shell per [ui-ux-guidelines.md](./ui-ux-guidelines.md)
