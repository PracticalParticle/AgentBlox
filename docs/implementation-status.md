# Implementation Status

Living matrix of what is **built**, **stubbed**, or **pending** in AgentBlox. Update this file when phases complete.

Last reviewed: hackathon baseline after Copilot pivot.

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Copilot UI + slash commands | **Done** | `/api/chat`, fallback router, tool cards |
| Treasury tools (read) | **Partial** | ETH balance + ENS work; SDK reads stubbed |
| Treasury tools (propose) | **Partial** | Policy gate works; no on-chain execution |
| Policy gate (off-chain) | **Done** | Flow ID, amount, target validation |
| `@bloxchain/sdk` | **Pending** | Installed, not wired |
| `@lifi/sdk` | **Pending** | Installed; quote preview is placeholder |
| Dynamic (Owner UI) | **Partial** | `DynamicWidget` only |
| Dynamic (Broadcaster) | **Pending** | No server wallet module |
| On-chain execution | **Pending** | No meta-tx signing or submit |
| Agent Bridge REST API | **Removed** | Superseded by Copilot tools |

---

## Tool × implementation matrix

| Tool | Off-chain | On-chain read | Sign | Execute | UI confirm |
|------|-----------|---------------|------|---------|------------|
| `get_treasury_status` | ✅ | ✅ ETH balance | — | — | — |
| `resolve_ens_treasury` | ✅ | ✅ mainnet ENS | — | — | — |
| `list_pending_approvals` | ⚠️ stub | ❌ | — | — | — |
| `get_whitelisted_targets` | ⚠️ stub | ❌ | — | — | — |
| `get_lifi_quote_preview` | ⚠️ stub | ❌ | — | — | — |
| `propose_rebalance` | ✅ policy | ❌ | ❌ | ❌ | ❌ Phase 3 |
| `request_vendor_payment` | ✅ stub | ❌ | ❌ | ❌ | ❌ Phase 5 |
| `simulate_policy_violation` | ✅ | ❌ | ❌ | ❌ | — |

Legend: ✅ working · ⚠️ returns placeholder · ❌ not implemented

---

## Phase completion

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Scaffold + Copilot + Console | **Done** |
| 1 | Bloxchain SDK reads in tools | **In progress** |
| 2 | Dynamic Owner + Broadcaster | **Not started** |
| 3 | Meta-tx sign in `propose_rebalance` | **Not started** |
| 4 | LI.FI quote + whitelist demo | **Not started** |
| 5 | Lane B timelock + Owner approve | **Not started** |
| 6 | ENS write + Console persistence | **Partial** (read only) |
| 7 | Demo video + submission | **Not started** |

See [implementation-plan.md](./implementation-plan.md) for task lists.

---

## Code paths

| Path | Status | Notes |
|------|--------|-------|
| `server/tools/read.ts` | Partial | SDK reads TODO |
| `server/tools/propose.ts` | Partial | Proposals only, no sign |
| `server/policy-gate.ts` | Done | |
| `server/signing/meta-tx.ts` | **Missing** | Phase 3 |
| `server/dynamic/broadcaster.ts` | **Missing** | Phase 2 |
| `server/lifi/quote.ts` | **Missing** | Phase 4 |
| `src/lib/bloxchain.ts` | **Missing** | Phase 1 |
| `src/lib/lifi.ts` | **Missing** | Phase 4 |
| `src/lib/agent-api.ts` | **Stale** | References removed REST API; deprecate or rewrite |
| `src/pages/AgentFlowsPage.tsx` | Orphan | Route redirects to `/` |
| `src/pages/DashboardPage.tsx` | Orphan | Route redirects to `/console` |
| `src/pages/TreasurySetupPage.tsx` | Orphan | Merged into Console |

---

## Documentation alignment

| Doc | Aligned with code? |
|-----|-------------------|
| [treasury-tools.md](./treasury-tools.md) | ✅ Yes — canonical |
| [copilot.md](./copilot.md) | ✅ Yes |
| [agent-bridge.md](./agent-bridge.md) | ⚠️ Deprecated — see note at top |
| [demo-script.md](./demo-script.md) | ✅ Updated for Copilot |
| [guard-controller-setup.md](./guard-controller-setup.md) | ✅ Target spec for Phase 3–4 |

---

## Next implementation priorities

1. Wire `@bloxchain/sdk` in `list_pending_approvals` and `get_whitelisted_targets`
2. Add `server/signing/meta-tx.ts` + call from `propose_rebalance`
3. Add `server/dynamic/broadcaster.ts` + Confirm button in Copilot UI
4. Integrate `@lifi/sdk` v4 in `get_lifi_quote_preview` and rebalance proposal
5. Remove or rewrite `src/lib/agent-api.ts`
