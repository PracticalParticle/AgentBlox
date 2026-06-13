# Implementation Plan

Phased build plan for AgentBlox. **Strategy and milestones:** [ROADMAP-PLAN.md](./ROADMAP-PLAN.md). Track live progress in [implementation-status.md](./implementation-status.md).

Setup: [provisioning-checklist.md](./provisioning-checklist.md) · Lifecycle: [treasury-lifecycle.md](./treasury-lifecycle.md) · Event: [event/ethglobal-2026.md](./event/ethglobal-2026.md)

---

## Timeline overview

| Phase | Focus | Hours (est.) | Output |
|-------|-------|--------------|--------|
| 0 | Scaffold + Copilot + Console | 2h | App runs; slash commands work |
| 1 | Bloxchain SDK reads in tools | 4h | `/pending`, `/whitelist` show real data |
| 2 | Dynamic wallets | 5h | Owner connects; Broadcaster configured |
| 3 | Meta-tx sign + Copilot confirm | 6h | `/rebalance` signs; Broadcaster executes |
| 4 | LI.FI + on-chain policy revert | 4h | Composer flow + Etherscan revert |
| 5 | Timelock payments | 4h | `/pay` → Owner approve |
| 6 | ENS write + Console persistence | 3h | Link name from Console |
| 7 | Polish + submission | 4h | Video, README, docs |

**Total:** ~32h for 2–3 engineers

---

## Phase 0 — Scaffold & environment ✅

- [x] Vite 5 + React + TypeScript scaffold
- [x] Treasury tools, policy gate, Copilot, Console
- [ ] Copy `.env` and set `TREASURY_ADDRESS`
- [ ] Provision AccountBlox — [provisioning-checklist.md](./provisioning-checklist.md)

---

## Phase 1 — Bloxchain reads in tools

**Goal:** `/pending` and `/whitelist` return real Sepolia data.

- [x] Create `server/bloxchain.ts` — SDK client factory
- [x] Wire `list_pending_approvals`, `get_whitelisted_targets`
- [x] On-chain Owner/Broadcaster in `get_treasury_status`

**Docs:** [integrations/bloxchain.md](./integrations/bloxchain.md)

---

## Phase 2 — Dynamic integration

**Goal:** Owner connects; Broadcaster ready for execution.

- [x] `DynamicWidget` in header
- [x] `server/dynamic/client.ts` — authenticated `DynamicEvmWalletClient`
- [x] `server/dynamic/broadcaster.ts` — status + viem wallet client factory
- [x] `/api/health` — broadcaster status + on-chain match check
- [ ] Set `VITE_DYNAMIC_ENVIRONMENT_ID`, `DYNAMIC_API_TOKEN`, `BROADCASTER_WALLET_ADDRESS`
- [ ] Verify Broadcaster address matches treasury at provisioning

**Docs:** [integrations/dynamic.md](./integrations/dynamic.md)

---

## Phase 3 — Meta-tx sign + Copilot confirm

**Goal:** `/rebalance` → AGENT_POLICY signs → user confirms → Broadcaster executes.

- [x] `server/signing/meta-tx.ts`
- [x] `server/signing/serialize.ts` + unit test
- [x] `server/execution/rebalance.ts`
- [x] `POST /api/execute/rebalance`
- [x] Extend `propose_rebalance` with signed meta-tx
- [x] Copilot `ToolResultCard` Confirm button
- [x] Remove stale `src/lib/agent-api.ts` → `src/lib/execute-api.ts`

**Docs:** [on-chain-execution-flow.md](./on-chain-execution-flow.md) · [guard-controller.md](./guard-controller.md)

---

## Phase 4 — LI.FI + whitelist guard

**Goal:** Composer flow as whitelisted target; on-chain policy revert.

- [ ] Whitelist at provisioning — [guard-controller.md](./guard-controller.md)
- [ ] `server/lifi/compose.ts`
- [ ] Real `get_lifi_quote_preview`
- [ ] Optional on-chain attack revert

**Docs:** [integrations/lifi.md](./integrations/lifi.md)

---

## Phase 5 — Timelock payments

**Goal:** `/pay` → timelock → Owner approves in Copilot.

- [ ] `request_vendor_payment` calls `executeWithTimeLock`
- [ ] Owner approves via Dynamic — `approveTimeLockExecution`

---

## Phase 6 — ENS integration

- [x] Read ENS in `resolve_ens_treasury`
- [ ] Write helpers, Console persistence
- [ ] `propose_rebalance` reads `bloxchain.allowedFlows`

**Docs:** [integrations/ens.md](./integrations/ens.md)

---

## Phase 7 — Polish

- [ ] Update [implementation-status.md](./implementation-status.md)
- [ ] Documentation pass — [treasury-lifecycle.md](./treasury-lifecycle.md)
- [ ] Deploy to Vercel (optional)

---

## UI phases

Frontend work tracked in [ui-ux-guidelines.md](./ui-ux-guidelines.md). Pair with backend phases above.

| Phase | Focus | Hours | Backend dep. | Status |
|-------|-------|-------|--------------|--------|
| UI-0 | Workspace shell (3-column layout, status rail, activity) | 2–3h | Phase 0 | Pending |
| UI-1 | Typed read cards (`ToolCardRouter` + monitor cards) | 2h | Phase 1 | Pending |
| UI-2 | Setup wizard (`/setup`, Workspace gate) | 2h | Phase 2 Dynamic | Pending |
| UI-3 | Intent Preview + Approvals (`RebalanceProposalCard`, Confirm) | 3h | Phase 3 | Pending |
| UI-4 | LI.FI quote + `PolicyBlockedCard` + Etherscan | 2h | Phase 4 | Pending |
| UI-5 | Timelock payment card + Owner approve + countdown | 2h | Phase 5 | Pending |
| UI-6 | Demo polish (`?demo=1`, loading states, keyboard focus) | 2h | Phase 7 | Pending |

**Total UI:** ~15h

---

## Definition of done

- [ ] Treasury provisioned — [provisioning-checklist.md](./provisioning-checklist.md)
- [ ] `/rebalance` succeeds via LI.FI + meta-tx
- [ ] `/attack` shows block (off-chain + on-chain revert)
- [ ] `/pay` approved by Dynamic Owner
- [ ] `/ens` resolves in Copilot
- [ ] Dynamic + LI.FI + ENS documented and functional

---

## File checklist

| File | Phase | Status |
|------|-------|--------|
| `server/bloxchain.ts` | 1 | Done |
| `server/lifi/compose.ts` | 4 | Pending |
| `server/signing/meta-tx.ts` | 3 | Pending |
| `server/dynamic/client.ts` | 2 | Done |
| `server/dynamic/broadcaster.ts` | 2 | Done |
| `src/lib/execute-api.ts` | Phase 3 | Done — `POST /api/execute/rebalance` |
