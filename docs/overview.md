# AgentBlox Overview

**Last updated:** June 2026  
**Audience:** Team members, judges, and contributors who need a fast picture of the project — what it is, where we are, and what comes next.

For setup → [getting-started.md](./getting-started.md)  
For strategy and milestones → [ROADMAP-PLAN.md](./ROADMAP-PLAN.md)  
For live build matrix → [implementation-status.md](./implementation-status.md)  
For task checklist → [implementation-plan.md](./implementation-plan.md)

---

## What AgentBlox is

AgentBlox is Particle CS’s **treasury operations platform** for [ETHGlobal New York 2026](https://ethglobal.com/events/newyork2026). It operates **AccountBlox clones** on Sepolia using the [Bloxchain Protocol](https://github.com/PracticalParticle/Bloxchain-Protocol) — without modifying on-chain core contracts.

| Layer | Sponsor / system | Role |
|-------|------------------|------|
| Identity | ENS | Names treasuries; optional `bloxchain.*` policy text records |
| Authorization | Bloxchain GuardController | Whitelist, RBAC, TxRecord audit, signer ≠ executor |
| Custody | Dynamic | Owner (embedded wallet) + Broadcaster (server wallet) |
| Execution | LI.FI Composer *(future)* | Atomic rebalance flows via whitelisted proxy calls |
| Lane B (MVP) | Bloxchain timelock + Dynamic | Dual path: B-fast (signer+BC) or B-timelock (ANALYST gas) |

**One line (hackathon MVP):** *Dynamic holds the keys. ENS names the actors. Bloxchain decides what anyone is allowed to trigger.*

**One line (with LI.FI — future):** *Dynamic holds the keys. LI.FI runs the flows. ENS names the actors. Bloxchain decides what anyone is allowed to trigger.*

**Product surfaces today:** three-column **Workspace** at `/` (Copilot + status rail + approvals); **Setup** at `/setup` (Broadcaster verify, ENS link wizard). Legacy `/console` redirects to Setup.

---

## Build snapshot (~85% code · E2E operator-dependent)

```text
Phase 0  Scaffold + Workspace + Setup       ✅ Done
Phase 1  Bloxchain SDK reads                 ✅ Done
Phase 2  Dynamic Broadcaster                 ⚠️  Scaffold done — operator env pending
Phase 3  Meta-tx sign + Confirm              ✅ Done
Phase 4  LI.FI compose + whitelist demo      ⏸ Future — not hackathon MVP
Phase 5  Lane B dual-path /pay               ✅ Code + tests; E2E needs on-chain RBAC
Phase 6  ENS read + write + policy gate      ✅ Done
Phase 7  Demo + submission                   ❌ Not started
```

### Working now

- Workspace UI with 9 treasury tools (LLM or slash-command fallback)
- `/deposit`, `/withdraw` — connected Dynamic wallet (0.01 ETH)
- Real Sepolia reads: balance, roles, pending txs, whitelist
- Mainnet ENS resolution + write wizard (`EnsLinkWizard`)
- Off-chain policy gate + ENS `allowedFlows` cross-check
- Lane B payment paths: ANALYST B-fast sign; ANALYST request + APPROVER approve sign
- AGENT_POLICY rebalance meta-tx + Broadcaster submit APIs
- Typed tool cards + timelock countdown
- Vitest: `npm run verify` (93 tests)

### Not demo-complete yet

- Lane B `/pay` E2E on Sepolia (operator RBAC + whitelist + funded ANALYST)
- On-chain `/attack` revert proof (optional)
- **LI.FI (future):** on-chain rebalance E2E

---

## Critical path to hackathon demo

Minimum sequence for a judge-ready story:

```mermaid
flowchart TD
    PROV[Provisioning: clone + roles + whitelist] --> ENV[Fill .env execution vars]
    ENV --> P5[Phase 5: Lane B /pay]
    P5 --> E2E["/pay B-fast or B-timelock → Etherscan"]
    P5 --> P7[Phase 7: video + submission]
    P6[Phase 6 ENS] --> P7
    ENV -.-> P4[Phase 4: LI.FI future]
    P4 -.-> E2E2["/rebalance → Confirm → Etherscan"]
    UI[UI-0 shell + typed cards] -.-> E2E
```

**Parallel human work:** [provisioning-checklist.md](./provisioning-checklist.md) — must run alongside engineering.

---

## Next steps (ordered)

### 1. Unblock environment (human — highest priority)

Without these, code paths exist but nothing lands on-chain:

| Variable | Why |
|----------|-----|
| `TREASURY_ADDRESS` | Already set if clone exists |
| `VITE_DYNAMIC_ENVIRONMENT_ID` | Owner widget + server Dynamic client |
| `DYNAMIC_API_TOKEN` | Broadcaster authentication |
| `BROADCASTER_WALLET_ADDRESS` | Must match on-chain Broadcaster role |
| `AGENT_POLICY_PRIVATE_KEY` | Lane A rebalance signing *(future with LI.FI)* |
| `ANALYST_PRIVATE_KEY` | Lane B timelock request — must match on-chain ANALYST |
| `APPROVER_PRIVATE_KEY` | Lane B timelock approval sign — must match on-chain APPROVER |
| `LIFI_EXECUTION_SELECTOR` | LI.FI whitelist + signing *(future)* |
| `REBALANCE_EXECUTION_TARGET` | LI.FI userProxy *(future)* |

Verify: `curl http://localhost:3001/api/health` — all `*Configured` flags should be `true`.

### 2. Phase 5 — Lane B timelock payments *(hackathon critical path)*

| Deliverable | Purpose |
|-------------|---------|
| `request_vendor_payment` on-chain | ANALYST → `executeWithTimeLock` (B-timelock) or ANALYST sign (B-fast) ✅ |
| APPROVER timelock approve sign | `approveTimeLockExecutionWithMetaTx` ✅ |
| On-chain APPROVER role | `SIGN_META_APPROVE` on USDC transfer selector |
| UI-5 card | Payment request + countdown + Confirm release |

See [on-chain-execution-flow.md](./on-chain-execution-flow.md) · [guard-controller.md](./guard-controller.md).

### 3. Phase 4 — LI.FI compose *(future implementation)*

| Deliverable | File |
|-------------|------|
| Composer integration | `server/lifi/compose.ts` (scaffold ✅) |
| Wire into propose flow | `server/tools/propose.ts` |
| Real quote tool | `server/tools/read.ts` |

Blocked on `LIFI_API_KEY` + on-chain whitelist. See [integrations/lifi.md](./integrations/lifi.md).

### 4. UI parallel track

| Priority | Phase | Why |
|----------|-------|-----|
| P0 | UI-0 | Workspace shell — judges see control surface, not raw JSON |
| P0 | UI-1 | Typed read cards for `/status`, `/pending`, `/whitelist` |
| P0 | UI-5 | Timelock payment + APPROVER / Broadcaster confirm |
| P2 | UI-4 | LI.FI quote + policy-blocked cards *(future)* |
| P1 | UI-2 | Setup wizard replaces Console checklist |

| UI-3 Confirm | **Done** — `RebalanceProposalCard`, `PaymentRequestCard`, `BroadcasterSubmitBlock` |

### 5. Phase 7 — Submission

- Record 3-min demo ([demo-script.md](./demo-script.md))
- Etherscan links in README
- ENS booth rehearsal ([event/ethglobal-2026.md](./event/ethglobal-2026.md))

---

## Gaps and blockers

### Hard blockers (stop E2E demo)

| Blocker | Type | Resolution |
|---------|------|------------|
| Treasury not fully provisioned | Human | bloxchain.app clone + RBAC + whitelist — [provisioning-checklist.md](./provisioning-checklist.md) Part A |
| Dynamic env empty | Config | Dashboard + `VITE_DYNAMIC_ENVIRONMENT_ID`, `DYNAMIC_API_TOKEN`, `BROADCASTER_WALLET_ADDRESS` |
| AGENT_POLICY key mismatch | Config | Private key must match on-chain role assigned at init |
| No LI.FI API key | Config | **Defer Lane A** — demo Lane B; see [integrations/lifi.md](./integrations/lifi.md) |
| APPROVER key mismatch | Config | Private key must match on-chain APPROVER + `SIGN_META_APPROVE` |
| No LI.FI compose | Code | Phase 4 future — manual `REBALANCE_*` env is interim only |
| userProxy not whitelisted | On-chain | Part A4 — wrong proxy = revert even with correct meta-tx |

### Soft gaps (demo works but weaker story)

| Gap | Impact | Mitigation |
|-----|--------|------------|
| No Workspace UI (UI-0) | JSON tool cards look unfinished | Ship shell + 2–3 typed cards minimum |
| ENS name unset | `/ens` less compelling at booth | Register + link name early |
| No on-chain attack revert | `/attack` is off-chain only | Phase 4 optional Broadcaster submit |
| README says Copilot + Console | Naming drift vs docs | Update README (Workspace + Setup) |
| Orphan pages in repo | Confusing for contributors | Delete `ConsolePage`, `DashboardPage`, etc. |
| No LLM key | Natural language disabled | Slash commands sufficient for demo |

### Risks to watch

From [ROADMAP-PLAN.md](./ROADMAP-PLAN.md) §7:

- LI.FI selector / userProxy mismatch → rebalance reverts on-chain
- Dynamic server wallet API friction → test Broadcaster early
- Scope creep on full Workspace → prioritize typed cards over Settings/mobile
- ENS booth without live name → register and rehearse `/ens` now

---

## Hackathon definition of done

| Criterion | Status |
|-----------|--------|
| Treasury provisioned on Sepolia | ⬜ Operator |
| `/pay` B-fast (&lt; $10 USDC) → ANALYST sign → Broadcaster | ⚠️ Code ✅; E2E operator |
| `/pay` B-timelock → ANALYST request → APPROVER sign → Broadcaster | ⚠️ Code ✅; E2E operator |
| `/ens` resolves treasury + text records | ✅ (write via Setup wizard) |
| Demo video + submission | ❌ Phase 7 |

---

## Architecture at a glance

**Lane B (hackathon MVP) — two paths:**

```text
B-fast (< $10 USDC):
  ANALYST → sign USDC transfer meta-tx → Broadcaster requestAndApproveExecution

B-timelock (≥ $10 USDC):
  ANALYST → executeWithTimeLock (pays gas) → APPROVER sign approve → Broadcaster approve meta-tx
```

**Lane A (future — LI.FI):**

```text
User → Copilot → propose_rebalance → sign (AGENT_POLICY) → Confirm
                                    ↓
              Broadcaster → requestAndApproveExecution → LI.FI proxy
```

Details: [architecture.md](./architecture.md) · [on-chain-execution-flow.md](./on-chain-execution-flow.md)

---

## Documentation map

| I want to… | Read |
|------------|------|
| See strategy and milestones | [ROADMAP-PLAN.md](./ROADMAP-PLAN.md) |
| See what's built today | [implementation-status.md](./implementation-status.md) |
| Set up a treasury | [getting-started.md](./getting-started.md) |
| Configure `.env` | [env-configuration.md](./env-configuration.md) |
| Understand tools | [treasury-tools.md](./treasury-tools.md) |
| Wire sponsors | [integrations/README.md](./integrations/README.md) |
| Plan UI work | [ui-ux-guidelines.md](./ui-ux-guidelines.md) |
| Rehearse demo | [demo-script.md](./demo-script.md) |
| Full doc index | [index.md](./index.md) |

---

## Commands

```bash
npm run dev:all          # Vite + server
npm run test             # Vitest
npm run typecheck        # TypeScript
curl localhost:3001/api/health
```
