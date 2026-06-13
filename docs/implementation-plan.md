# Implementation Plan

Phased build plan for AgentBlox. Track live progress in [implementation-status.md](./implementation-status.md).

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

- [ ] Create `src/lib/bloxchain.ts`
- [ ] Wire `list_pending_approvals`, `get_whitelisted_targets`

**Docs:** [integrations/bloxchain.md](./integrations/bloxchain.md)

---

## Phase 2 — Dynamic integration

**Goal:** Owner connects; Broadcaster ready for execution.

- [ ] Dynamic server wallet — `@dynamic-labs-wallet/node-evm`
- [ ] `server/dynamic/client.ts` + `server/dynamic/broadcaster.ts`

**Docs:** [integrations/dynamic.md](./integrations/dynamic.md)

---

## Phase 3 — Meta-tx sign + Copilot confirm

**Goal:** `/rebalance` → AGENT_POLICY signs → user confirms → Broadcaster executes.

- [ ] `server/signing/meta-tx.ts`
- [ ] Extend `propose_rebalance` with signed meta-tx
- [ ] Copilot `ToolResultCard` Confirm button

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
| `src/lib/bloxchain.ts` | 1 | Pending |
| `server/lifi/compose.ts` | 4 | Pending |
| `server/signing/meta-tx.ts` | 3 | Pending |
| `server/dynamic/broadcaster.ts` | 2 | Pending |
| `src/lib/agent-api.ts` | — | Stale — remove/rewrite |
