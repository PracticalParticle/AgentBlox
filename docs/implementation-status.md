# Implementation Status

Living matrix of what is **built**, **stubbed**, or **pending** in AgentBlox. Update when phases complete.

Docs model: [treasury-lifecycle.md](./treasury-lifecycle.md)

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Copilot UI + slash commands | **Done** | `/api/chat`, fallback router, tool cards (JSON) |
| UI/UX Workspace (target) | **Pending** | Spec in [ui-ux-guidelines.md](./ui-ux-guidelines.md); UI-0–6 not started |
| Treasury tools (read) | **Partial** | ETH balance + ENS work; SDK reads stubbed |
| Treasury tools (propose) | **Partial** | Policy gate works; no on-chain execution |
| Policy gate (off-chain) | **Done** | Flow ID, amount, target validation |
| `@bloxchain/sdk` | **Pending** | Installed, not wired |
| `@lifi/sdk` | **Pending** | Quote preview is placeholder |
| Dynamic (Owner UI) | **Partial** | `DynamicWidget` only |
| Dynamic (Broadcaster) | **Pending** | No server wallet module |
| On-chain execution | **Pending** | No meta-tx signing or submit |
| Agent Bridge REST API | **Removed** | Superseded by Copilot tools |
| Documentation (lifecycle) | **Done** | treasury-lifecycle, governance, extending-use-cases, integrations/ |

---

## Tool × implementation matrix

| Tool | Operation type | Off-chain | On-chain read | Sign | Execute | UI confirm |
|------|----------------|-----------|---------------|------|---------|------------|
| `get_treasury_status` | Monitor | ✅ | ✅ ETH | — | — | — |
| `resolve_ens_treasury` | Monitor | ✅ | ✅ ENS | — | — | — |
| `list_pending_approvals` | Monitor | ⚠️ stub | ❌ | — | — | — |
| `get_whitelisted_targets` | Monitor | ⚠️ stub | ❌ | — | — | — |
| `get_lifi_quote_preview` | Monitor | ⚠️ stub | ❌ | — | — | — |
| `propose_rebalance` | Treasury op | ✅ policy | ❌ | ❌ | ❌ | ❌ Phase 3 |
| `request_vendor_payment` | Disbursement | ✅ stub | ❌ | ❌ | ❌ | ❌ Phase 5 |
| `simulate_policy_violation` | Policy test | ✅ | ❌ | ❌ | ❌ | — |

Legend: ✅ working · ⚠️ placeholder · ❌ not implemented

---

## Phase completion

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Scaffold + Copilot + Console | **Done** |
| 1 | Bloxchain SDK reads | **In progress** |
| 2 | Dynamic Owner + Broadcaster | **Not started** |
| 3 | Meta-tx sign in `propose_rebalance` | **Not started** |
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

## Next implementation priorities

1. Wire `@bloxchain/sdk` in `list_pending_approvals` and `get_whitelisted_targets`
2. Add `server/signing/meta-tx.ts` + call from `propose_rebalance`
3. Add `server/dynamic/broadcaster.ts` + Confirm button in Copilot UI
4. Integrate LI.FI compose in `get_lifi_quote_preview` and rebalance proposal
5. Remove or rewrite `src/lib/agent-api.ts`
