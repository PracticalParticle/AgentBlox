# Implementation Plan

Phased build plan for ETHGlobal NY 2026. Tasks are ordered by demo value — each phase should produce something demo-able in **Copilot**.

Track live progress in [implementation-status.md](./implementation-status.md).

---

## Timeline overview

| Phase | Focus | Hours (est.) | Demo output |
|-------|-------|--------------|-------------|
| 0 | Scaffold + Copilot + Console | 2h | App runs; slash commands work |
| 1 | Bloxchain SDK reads in tools | 4h | `/pending`, `/whitelist` show real data |
| 2 | Dynamic wallets | 5h | Owner connects; Broadcaster configured |
| 3 | Meta-tx sign + Copilot confirm | 6h | `/rebalance` signs; Broadcaster executes |
| 4 | LI.FI + on-chain attack revert | 4h | Composer flow + Etherscan revert |
| 5 | Lane B timelock | 4h | `/pay` → Owner approve |
| 6 | ENS write + Console persistence | 3h | Link name from Console |
| 7 | Polish + submission | 4h | Video, README, booth prep |

**Total:** ~32h for 2–3 engineers

---

## Phase 0 — Scaffold & environment ✅

**Goal:** Dev environment with Copilot + Console.

### Tasks

- [x] Vite 5 + React + TypeScript scaffold
- [x] Install `@bloxchain/sdk`, `@dynamic-labs/*`, `@lifi/sdk`, `viem`, `ai`, `@ai-sdk/*`
- [x] `.env.example` — see [env-configuration.md](./env-configuration.md)
- [x] Server: `/api/health`, `/api/chat`
- [x] Treasury tools (`server/tools/`)
- [x] Policy gate (`server/policy-gate.ts`)
- [x] Copilot page + fallback slash router
- [x] Console page
- [ ] Copy `.env` and set `TREASURY_ADDRESS`
- [ ] Dynamic dashboard: Sepolia, embedded wallets, CORS
- [ ] Provision AccountBlox clone — [provisioning-checklist.md](./provisioning-checklist.md)

### Verification

```bash
npm run dev:all
# Copilot: /status, /help
# Health: treasuryConfigured true after .env
```

---

## Phase 1 — Bloxchain reads in tools

**Goal:** `/pending` and `/whitelist` return real Sepolia data.

### Tasks

- [x] `get_treasury_status` — ETH balance via viem
- [x] `resolve_ens_treasury` — mainnet ENS
- [ ] Create `src/lib/bloxchain.ts` — SDK client factory
- [ ] `list_pending_approvals` — poll TxRecords via `@bloxchain/sdk`
- [ ] `get_whitelisted_targets` — `getFunctionWhitelistTargets` for Composer selector
- [ ] Console: show on-chain Owner/Broadcaster addresses

### Docs

- [bloxchain-integration.md](./bloxchain-integration.md)
- Bloxchain: `scripts/sanity-sdk/`

### Verification

- `/whitelist` lists actual whitelisted proxy address
- `/pending` shows test timelock tx if one exists

---

## Phase 2 — Dynamic integration

**Goal:** Owner connects; Broadcaster ready for execution.

### Tasks

- [x] `DynamicWidget` in header
- [ ] Verify Owner address matches on-chain Owner
- [ ] Dynamic server wallet for Broadcaster — `@dynamic-labs-wallet/node-evm`
- [ ] `server/dynamic/client.ts` + `server/dynamic/broadcaster.ts`
- [ ] Store `DYNAMIC_API_TOKEN` server-side only

### Docs

- [dynamic-integration.md](./dynamic-integration.md)

### Verification

- User logs in via DynamicWidget
- Server wallet signs test tx on Sepolia

---

## Phase 3 — Meta-tx sign + Copilot confirm

**Goal:** `/rebalance` → AGENT_POLICY signs → user confirms → Broadcaster executes.

### Tasks

- [ ] `server/signing/meta-tx.ts` — EIP-712 with `@bloxchain/sdk` helpers
- [ ] Extend `propose_rebalance` in `server/tools/propose.ts` to return signed meta-tx
- [ ] `AGENT_POLICY_PRIVATE_KEY` in server `.env`
- [ ] Copilot `ToolResultCard` — **Confirm** button triggers Broadcaster
- [ ] Remove or rewrite stale `src/lib/agent-api.ts`

### Docs

- [on-chain-execution-flow.md](./on-chain-execution-flow.md)
- [guard-controller-setup.md](./guard-controller-setup.md)

### Verification

- `/rebalance` → Confirm → meta-tx on Sepolia
- Etherscan tx from AccountBlox clone

---

## Phase 4 — LI.FI + whitelist guard

**Goal:** Composer flow as whitelisted target; on-chain attack revert.

### Tasks

- [ ] Whitelist Composer proxy at provisioning — [guard-controller-setup.md](./guard-controller-setup.md)
- [ ] `server/lifi/compose.ts` — `@lifi/sdk` v4 or Composer API
- [ ] `get_lifi_quote_preview` — real quote in tool
- [ ] Embed compose calldata in meta-tx (target = userProxy)
- [ ] Optional: Broadcaster submits attack payload → on-chain revert
- [ ] UI distinguishes success vs `TargetNotWhitelisted`

### Docs

- [lifi-integration.md](./lifi-integration.md)

### Verification

- Rebalance uses LI.FI Composer (check compose response)
- Attack demo: Etherscan revert tx

---

## Phase 5 — Lane B timelock payment

**Goal:** `/pay` → timelock → Owner approves in Copilot.

### Tasks

- [ ] `request_vendor_payment` calls `executeWithTimeLock` on-chain
- [ ] `/pending` shows countdown from `releaseTime`
- [ ] Owner approves via Dynamic — `approveTimeLockExecution`
- [ ] Tool card: Approve button for Owner wallet

### Verification

- Full Lane B: `PENDING` → `COMPLETED`
- TxRecord in `/pending` output

---

## Phase 6 — ENS integration

**Goal:** Functional ENS in AgentBlox.

### Tasks

- [x] Read ENS in `resolve_ens_treasury` tool
- [ ] Console: persist treasury + ENS (localStorage or backend)
- [ ] Write helpers in `src/lib/ens.ts` — setAddr + setText via Owner
- [ ] `propose_rebalance` reads `bloxchain.allowedFlows` from ENS
- [ ] Register demo ENS name

### Docs

- [ens-integration.md](./ens-integration.md)

### Verification

- `/ens` matches `TREASURY_ADDRESS`
- ENS booth: live resolve + text records

---

## Phase 7 — Polish & submission

### Tasks

- [ ] Update [implementation-status.md](./implementation-status.md)
- [ ] Demo video from Copilot — [demo-script.md](./demo-script.md)
- [ ] Sepolia Etherscan links in README
- [ ] Sponsor sections in README
- [ ] ETHGlobal submission
- [ ] Deploy to Vercel (optional)

---

## MVP scope cuts (if behind)

| Cut first | Never cut |
|-----------|-----------|
| ENS subnames | GuardController whitelist block demo |
| LLM natural language | Meta-tx two-party success path |
| Custom RBAC roles | Lane B timelock approval |
| Multiple Composer flows | On-chain tx hashes |
| Console persistence polish | AccountBlox as load-bearing infra |
| Orphan page cleanup | Copilot slash command demo |

---

## File checklist

| File | Phase | Status |
|------|-------|--------|
| `src/lib/bloxchain.ts` | 1 | Pending |
| `src/lib/lifi.ts` | 4 | Pending |
| `server/lifi/compose.ts` | 4 | Pending |
| `server/signing/meta-tx.ts` | 3 | Pending |
| `server/dynamic/broadcaster.ts` | 2 | Pending |
| `server/tools/propose.ts` | 3–4 | Partial |
| `src/components/chat/ToolResultCard.tsx` | 3–5 | Partial (no actions) |
| `src/lib/agent-api.ts` | — | Stale — remove/rewrite |

---

## Definition of done (hackathon)

- [ ] Treasury provisioned — [provisioning-checklist.md](./provisioning-checklist.md)
- [ ] Lane A: `/rebalance` succeeds via LI.FI + meta-tx
- [ ] Lane A: `/attack` shows block (off-chain + on-chain revert)
- [ ] Lane B: `/pay` approved by Dynamic Owner
- [ ] `/ens` resolves in Copilot
- [ ] Dynamic + LI.FI + ENS documented and functional
- [ ] Demo video + live URL submitted
- [ ] ENS booth presentation completed
