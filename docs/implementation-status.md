# Implementation Status

Living matrix of what is **built**, **stubbed**, or **pending** in AgentBlox. Update when phases complete.

Docs model: [treasury-lifecycle.md](./treasury-lifecycle.md)

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Copilot UI + slash commands | **Done** | `/api/chat`, fallback router, tool cards |
| UI/UX Workspace (target) | **Done** | UI-0–UI-6: workspace, typed cards, demo mode, polish |
| Treasury tools (read) | **Done** | ETH + ENS + SDK pending/whitelist/roles |
| Treasury tools (propose) | **Done** | Policy gate + Lane B dual-path `/pay` + rebalance sign |
| Policy gate (off-chain) | **Done** | Flow ID, amount, **`resolvePaymentPath`** ($10 threshold) |
| `@bloxchain/sdk` | **Done** | Reads + meta-tx signing + payment approve paths |
| `@lifi/sdk` | **Future** | Composer scaffold; not hackathon MVP |
| Dynamic (Owner UI) | **Partial** | `DynamicWidget` only |
| Dynamic (Broadcaster) | **Done** | Server wallet submit + UI **Submit on-chain (Broadcaster)** button |
| Docker dev stack | **Done** | `docker-compose.yml` |
| On-chain execution | **Partial** | Code complete; E2E needs operator provisioning |
| Unit tests (Vitest) | **Done** | `npm run verify` — 59 tests |

---

## Tool × implementation matrix

| Tool | Operation type | Off-chain | On-chain read | Sign | Execute | UI confirm |
|------|----------------|-----------|---------------|------|---------|------------|
| `get_treasury_status` | Monitor | ✅ | ✅ ETH + roles | — | — | — |
| `resolve_ens_treasury` | Monitor | ✅ | ✅ ENS | — | — | — |
| `list_pending_approvals` | Monitor | ✅ | ✅ SDK | — | — | — |
| `get_whitelisted_targets` | Monitor | ✅ | ✅ SDK | — | — | — |
| `get_lifi_quote_preview` | Monitor | ✅ | ⚠️ compose *(future)* | — | — | — |
| `propose_rebalance` | Treasury op | ✅ policy | — | ✅ | ⚠️ env | ✅ |
| `request_vendor_payment` | Disbursement | ✅ path route | ✅ B-timelock | ✅ ANALYST | ✅ API | ✅ |
| `simulate_policy_violation` | Policy test | ✅ | ❌ | ❌ | ❌ | — |

Legend: ✅ working · ⚠️ env-dependent / future · ❌ not implemented

**`/pay` paths:**
- **B-fast** (&lt; 10 USDC): ANALYST signs → `POST /api/execute/payment` → Broadcaster
- **B-timelock** (≥ 10 USDC): ANALYST `executeWithTimeLock` → ANALYST sign approve → `POST /api/execute/payment-approve` → Broadcaster

---

## Phase completion

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Scaffold + Copilot + Console | **Done** |
| 1 | Bloxchain SDK reads | **Done** |
| 2 | Dynamic Owner + Broadcaster | **In progress** (scaffold ✅; operator env) |
| 3 | Meta-tx sign + Copilot confirm | **Done** |
| 4 | LI.FI + whitelist demo | **Future** (scaffold done) |
| 5 | Lane B dual-path `/pay` | **Done** (code + tests; E2E needs on-chain) |
| 6 | ENS write + Console persistence | **Partial** (read only) |
| 7 | Polish + submission | **Not started** |

See [implementation-plan.md](./implementation-plan.md) · [ROADMAP-PLAN.md](./ROADMAP-PLAN.md).

---

## API endpoints

| Endpoint | Method | Status | Purpose |
|----------|--------|--------|---------|
| `/api/health` | GET | Done | Includes `analystConfigured`, `approverConfigured` |
| `/api/chat` | POST | Done | Copilot + treasury tools |
| `/api/treasury/status` | GET | Done | Status rail poll |
| `/api/treasury/pending` | GET | Done | Approvals panel poll |
| `/api/treasury/whitelist` | GET | Done | Optional whitelist read |
| `/api/broadcaster/verify` | GET | Done | Live Dynamic auth + on-chain match |
| `/api/broadcaster/wallets` | GET | Done | List server wallets for Setup |
| `/api/execute/rebalance` | POST | Done | Broadcaster `requestAndApproveExecution` |
| `/api/execute/payment` | POST | Done | B-fast instant USDC payment |
| `/api/execute/payment-approve` | POST | Done | B-timelock APPROVER sign + Broadcaster approve |

---

## Code paths

| Path | Status | Notes |
|------|--------|-------|
| `server/bloxchain.ts` | Done | SDK factory + role reads |
| `server/policy-gate.ts` | Done | `resolvePaymentPath` |
| `server/signing/payment-meta-tx.ts` | Done | ANALYST B-fast + timelock approve sign |
| `server/execution/payment.ts` | Done | ANALYST `executeWithTimeLock` |
| `server/execution/payment-approve.ts` | Done | Approve + instant execute |
| `server/execution/meta-tx-broadcaster.ts` | Done | Shared Broadcaster submit |
| `server/signing/meta-tx.ts` | Done | AGENT_POLICY rebalance sign |
| `server/execution/rebalance.ts` | Done | Delegates to meta-tx-broadcaster |
| `src/lib/execute-api.ts` | Done | payment + payment-approve clients |
| `src/components/cards/PaymentRequestCard.tsx` | Done | Dual-path broadcast UX |
| `src/components/cards/RebalanceProposalCard.tsx` | Done | Rebalance broadcast UX |
| `src/components/broadcaster/BroadcasterSubmitBlock.tsx` | Done | Shared Dynamic Broadcaster submit button |
| `src/lib/broadcaster-ready.ts` | Done | Health gating for submit button |
| `src/lib/tool-result-helpers.ts` | Done | B-fast / B-timelock detection |

---

## Next operator steps (E2E on Sepolia)

1. Verify health: `analystConfigured: true`, `analystWalletAddressMatches: true`, `dynamicBroadcasterConfigured: true`
2. On-chain: ANALYST wallet `0xbC9A7dc5f68a8F3629DC8D2a4D2605e2371a5700` with `SIGN_META_REQUEST_AND_APPROVE` + `SIGN_META_APPROVE` + `EXECUTE_TIME_DELAY_REQUEST` on USDC transfer
3. Whitelist Sepolia USDC for `0xa9059cbb`
4. Fund ANALYST wallet with Sepolia ETH (B-timelock only)
5. Demo B-fast: `/pay` with amount &lt; 10_000_000 (e.g. `5000000` = 5 USDC)
6. Demo B-timelock: `/pay` with amount ≥ 10_000_000, wait release, Confirm release
