# Demo Script

> **Not linked from public docs** — internal rehearsal notes only. Safe to delete from the repo before or after the event.

Optional 3-minute demo for ETHGlobal NY 2026. **All interactions run through Copilot** (`/`) using slash commands or natural language.

See [provisioning-checklist.md](./provisioning-checklist.md) before rehearsing. Product docs: [treasury-lifecycle.md](./treasury-lifecycle.md) · [event/ethglobal-2026.md](./event/ethglobal-2026.md).

---

## Pre-demo checklist

- [ ] Treasury provisioned on bloxchain.app (AccountBlox clone on Sepolia)
- [ ] `TREASURY_ADDRESS` set in `.env`; `/api/health` shows `treasuryConfigured: true`
- [ ] ENS name linked (`/ens` resolves to clone)
- [ ] Dynamic Owner logged in (`DynamicWidget` in header)
- [ ] `npm run dev:all` running
- [ ] `ANALYST_PRIVATE_KEY` + `APPROVER_PRIVATE_KEY` + on-chain roles configured
- [ ] Sepolia Etherscan tabs open: success tx + revert tx
- [ ] Optional: pre-stage timelock payment via `/pay`
- [ ] *(Future)* LI.FI Composer flow pre-tested on Sepolia

---

## Script (3 minutes)

| Time | Scene | Copilot action | What to say |
|------|-------|----------------|-------------|
| **0:00** | Problem | — | "AI agents and finance teams both move money — both need the same controls. Keys alone aren't enough." |
| **0:20** | Identity | `/ens` | "This is `treasury.acme.eth` — it resolves to our AccountBlox clone on Sepolia." |
| **0:40** | Status | `/status` | "Copilot reads real on-chain state — treasury address, balance, policy engine." |
| **0:55** | Architecture | Verbal / slide | "ENS names the actor. Bloxchain decides what's allowed. Dynamic holds keys — signer and executor are separate roles." |
| **1:05** | Payment | `/pay` | "ANALYST requests a vendor payment. It enters timelock — PENDING." |
| **1:25** | Approve | Confirm release in tool card | "APPROVER signed the approval meta-tx. Broadcaster submits after the waiting period." |
| **1:45** | Blocked | `/attack` | "Unauthorized target — policy validation." |
| **2:00** | Revert | Show tool card + Etherscan | "TargetNotWhitelisted — architecturally enforced." |
| **2:10** | Audit | `/pending` | "Full on-chain audit trail — same treasury, same rules." |
| **2:25** | *(Optional future)* | `/rebalance` | "Lane A: LI.FI Composer behind the same GuardController pattern." |
| **2:50** | Close | — | "AgentBlox by Particle CS. Powered by Bloxchain Protocol." |

---

## Slash command cheat sheet

| Command | Purpose |
|---------|---------|
| `/status` | Treasury configured + ETH balance |
| `/ens` | Resolve name + text records |
| `/rebalance` | Propose LI.FI rebalance *(future — Lane A)* |
| `/attack` | Policy validation (blocked target) |
| `/pay` | Request timelock payment |
| `/pending` | Pending approvals |
| `/whitelist` | GuardController expectations |
| `/help` | Command list |

Natural language works when `OPENAI_API_KEY` is set.

---

## Key beats

1. **Bloxchain is load-bearing** — `/attack` proves policy enforcement
2. **Real txs** — Sepolia Etherscan when Dynamic + execution env configured (Phase 4 for LI.FI calldata)
3. **ENS is functional** — `/ens` with text records
4. **One treasury, two auth paths** — policy execution + timelock in same Copilot

---

## Fallbacks

| Failure | Fallback |
|---------|----------|
| Composer tx fails | Pre-recorded Etherscan success tx |
| ENS resolution slow | Pre-resolved `/ens` screenshot |
| Dynamic login fails | Walk architecture + recorded clip |
| Server down | Show `implementation-status.md` + [treasury-lifecycle.md](./treasury-lifecycle.md) |

---

## Demo modes by build state

### Full demo (env + Phase 4)

All script beats including on-chain rebalance success and optional attack revert.

### Current build (Phases 0–1, 3 scaffold)

Can show:

- `/status`, `/ens`, `/pending`, `/whitelist` — real reads
- `/rebalance` — policy gate + signed meta-tx when signing env set; Confirm button when signed
- `/attack` — off-chain blocked state
- Console env checklist + Dynamic widget

On-chain execution requires: `AGENT_POLICY_PRIVATE_KEY`, `DYNAMIC_API_TOKEN`, `BROADCASTER_WALLET_ADDRESS`, `REBALANCE_EXECUTION_TARGET`, and selector/calldata (Phase 4 compose automates calldata).
