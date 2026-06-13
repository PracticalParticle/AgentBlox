# Implementation Plan

Phased build plan for ETHGlobal NY 2026. Tasks are ordered by demo value — each phase should produce something demo-able.

## Timeline overview

| Phase | Focus | Hours (est.) | Demo output |
|-------|-------|--------------|-------------|
| 0 | Scaffold + config | 2h | App runs locally |
| 1 | Treasury import + Bloxchain reads | 4h | Show TxRecords in UI |
| 2 | Dynamic wallets | 5h | Owner connects, Broadcaster executes |
| 3 | Agent Bridge + Lane A | 6h | Rebalance meta-tx succeeds |
| 4 | LI.FI + whitelist block | 4h | Composer flow + attack reverts |
| 5 | Lane B timelock | 4h | Payment request → approve |
| 6 | ENS integration | 3h | Name resolves in dashboard |
| 7 | Polish + submission | 4h | Video, README, booth prep |

**Total:** ~32h for 2–3 engineers

---

## Phase 0 — Scaffold & environment

**Goal:** Dev environment running with Copilot + Console.

### Tasks

- [x] Vite 5 + React + TypeScript scaffold
- [x] Install `@bloxchain/sdk`, `@dynamic-labs/*`, `@lifi/sdk`, `viem`, `ai`, `@ai-sdk/*`
- [x] `.env.example` with all required variables
- [x] Server with `/api/chat` + `/api/health`
- [x] Treasury tool registry (`server/tools/`)
- [x] Policy gate (`server/policy-gate.ts`)
- [x] Copilot page with `useChat` + slash-command fallback
- [x] Console page for setup
- [ ] Copy `.env.example` → `.env` and set `TREASURY_ADDRESS`
- [ ] Dynamic dashboard: enable Sepolia, embedded wallets, CORS
- [ ] Provision AccountBlox clone on Sepolia

### Verification

```bash
npm install
npm run dev:all
# Frontend: http://localhost:5173
# Agent Bridge: http://localhost:3001/api/health
```

---

## Phase 1 — Treasury reads in Copilot tools

**Goal:** Copilot `/status` shows real Sepolia data.

### Tasks

- [x] `get_treasury_status` tool (ETH balance via viem)
- [x] `resolve_ens_treasury` tool
- [ ] Wire `@bloxchain/sdk` for Owner/Broadcaster/timelock reads
- [ ] `list_pending_approvals` via TxRecord polling
- [ ] Console persistence for treasury address

### SDK references

- `@bloxchain/sdk` — `SecureOwnable`, `RuntimeRBAC`, `GuardController`
- Bloxchain docs: `docs/account-pattern.md`, `docs/getting-started.md`
- Sanity scripts: `scripts/sanity-sdk/` in Bloxchain Protocol repo

### Verification

- Dashboard shows real Sepolia data for imported treasury address
- At least one `TxRecord` visible (create test tx if needed)

---

## Phase 2 — Dynamic integration

**Goal:** Owner connects via embedded wallet; Broadcaster configured for execution.

### Tasks

- [ ] `DynamicWidget` in header (done in scaffold)
- [ ] Verify Owner embedded wallet address matches treasury Owner (or document mismatch for demo)
- [ ] Set up Dynamic server wallet for Broadcaster role
  - Install `@dynamic-labs-wallet/node-evm` in server (optional separate dep)
  - Store `walletMetadata` + key shares per Dynamic docs
- [ ] Map `primaryWallet.address` to UI "Connected as Owner"
- [ ] Server: Broadcaster signs and submits meta-tx execution

### Docs

- [dynamic-integration.md](./dynamic-integration.md)
- https://www.dynamic.xyz/docs/node/wallets/server-wallets/overview

### Verification

- User logs in via DynamicWidget
- Server wallet can sign a test transaction on Sepolia

---

## Phase 3 — Agent Bridge + Lane A meta-tx

**Goal:** Deterministic rebalance proposal → AGENT_POLICY signs → Broadcaster executes.

### Tasks

- [ ] Implement `POST /api/agent/rebalance` in `server/index.ts`
- [ ] Hardcoded policy: check balance threshold, fixed flow parameters
- [ ] Use `@bloxchain/sdk` meta-tx helpers to build and sign EIP-712 payload
- [ ] `AGENT_POLICY_PRIVATE_KEY` in server `.env` only
- [ ] Wire "Run Rebalance" button on Agent Flows page
- [ ] Broadcaster submits signed meta-tx after Agent Bridge returns signature

### Docs

- [agent-bridge.md](./agent-bridge.md)
- [bloxchain-integration.md](./bloxchain-integration.md)

### Verification

- Click "Run Rebalance" → meta-tx executes on Sepolia
- Etherscan shows successful tx from AccountBlox clone

---

## Phase 4 — LI.FI + whitelist guard

**Goal:** Composer flow as only allowed external target; attack demo blocked.

### Tasks

- [ ] Configure GuardController whitelist at provisioning (LI.FI executor contract)
- [ ] Integrate `@lifi/sdk` — `createClient`, `getQuote`, `convertQuoteToRoute`
- [ ] Build calldata for whitelisted Composer flow on Sepolia
- [ ] Embed calldata in meta-tx `TxRecord` targeting whitelisted contract
- [ ] Implement `POST /api/agent/simulate-attack` — non-whitelisted target calldata
- [ ] UI shows `TargetNotWhitelisted` revert with clear "Blocked by Bloxchain Guard" message

### Docs

- [lifi-integration.md](./lifi-integration.md)
- https://docs.li.fi/composer/ethglobal-ny-2026

### Verification

- Rebalance uses LI.FI Composer (check `tool: composer` in quote)
- Simulate attack reverts on-chain; UI displays failure state

---

## Phase 5 — Lane B timelock payment

**Goal:** Analyst requests payment → timelock → Owner approves.

### Tasks

- [ ] "Request Payment" flow — `executeWithTimeLock` to USDC contract on Sepolia
- [ ] Dashboard countdown for `PENDING` TxRecord
- [ ] Owner approves via Dynamic embedded wallet (`approveTimeLockExecution`)
- [ ] Audit log table: txId, status, requester, timestamps

### Verification

- Full Lane B flow completes on Sepolia
- TxRecord transitions: `PENDING` → `EXECUTING` → `COMPLETED`

---

## Phase 6 — ENS integration

**Goal:** Functional ENS in AgentBlox (not bloxchain.app).

### Tasks

- [ ] Treasury setup page: link ENS name to clone address
- [ ] Set text records: `bloxchain.policyVersion`, `bloxchain.allowedFlows`, `bloxchain.app`
- [ ] Dashboard: resolve ENS → display name in header
- [ ] `src/lib/ens.ts` — extend with write helpers if Owner sets records via UI
- [ ] Register demo ENS name before hackathon

### Docs

- [ens-integration.md](./ens-integration.md)

### Verification

- `treasury.acme.eth` resolves to clone address in UI
- Text records readable via `getEnsText`

### ENS booth (Sunday AM)

- [ ] Calendar ENS booth presentation
- [ ] Prepare live demo: resolve name → show treasury → show agent flow

---

## Phase 7 — Polish & submission

### Tasks

- [ ] Architecture diagram in README
- [ ] Demo video (≤3 min) — see [demo-script.md](./demo-script.md)
- [ ] Sepolia Etherscan links for success + revert txs
- [ ] README sponsor integration sections (Dynamic, LI.FI, ENS)
- [ ] ETHGlobal submission
- [ ] Deploy frontend to Vercel (optional)

---

## MVP scope cuts (if behind)

| Cut first | Never cut |
|-----------|-----------|
| ENS subnames | GuardController whitelist block demo |
| Dynamic Flow funding | Meta-tx two-party success path |
| Custom RBAC roles (Owner/Broadcaster only) | Lane B timelock approval |
| Multiple Composer flows | On-chain tx hashes |
| Treasury factory UI polish | AccountBlox as load-bearing infra |
| Hermes/OpenClaw integration | Agent Bridge deterministic rebalance |

---

## File creation checklist

| File | Phase | Status |
|------|-------|--------|
| `src/lib/bloxchain.ts` | 1 | Pending |
| `src/lib/lifi.ts` | 4 | Pending |
| `src/hooks/useTreasury.ts` | 1 | Pending |
| `src/hooks/useTxRecords.ts` | 1 | Pending |
| `src/components/TxTimeline.tsx` | 1 | Pending |
| `src/components/ApprovalQueue.tsx` | 5 | Pending |
| `server/flows/rebalance.ts` | 3 | Pending |
| `server/flows/simulate-attack.ts` | 4 | Pending |
| `server/signing/meta-tx.ts` | 3 | Pending |
| `server/dynamic/broadcaster.ts` | 2 | Pending |

---

## Definition of done (hackathon)

- [ ] Treasury imported from bloxchain.app provisioning
- [ ] Lane A: rebalance succeeds via LI.FI + meta-tx
- [ ] Lane A: attack blocked (`TargetNotWhitelisted`)
- [ ] Lane B: timelock payment approved by Dynamic Owner
- [ ] ENS name resolves in AgentBlox UI
- [ ] 3 sponsor integrations documented and functional
- [ ] Demo video + live URL submitted
- [ ] ENS booth presentation completed
