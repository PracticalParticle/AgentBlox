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
- [ ] LI.FI Composer flow pre-tested on Sepolia (Phase 4)
- [ ] Sepolia Etherscan tabs open: success tx + revert tx
- [ ] Optional: pre-stage timelock payment via `/pay`

---

## Script (3 minutes)

| Time | Scene | Copilot action | What to say |
|------|-------|----------------|-------------|
| **0:00** | Problem | — | "AI agents and finance teams both move money — both need the same controls. Keys alone aren't enough." |
| **0:20** | Identity | `/ens` | "This is `treasury.acme.eth` — it resolves to our AccountBlox clone on Sepolia." |
| **0:40** | Status | `/status` | "Copilot reads real on-chain state — treasury address, balance, policy engine." |
| **0:55** | Architecture | Verbal / slide | "ENS names the actor. Bloxchain decides what's allowed. Dynamic holds keys. LI.FI runs approved flows." |
| **1:05** | Rebalance | `/rebalance` | "Policy agent proposes a rebalance. It signs a meta-tx — but cannot execute alone." |
| **1:25** | Execute | Confirm in tool card (Phase 3) | "Broadcaster submits. GuardController whitelists LI.FI only." |
| **1:45** | Blocked | `/attack` | "Unauthorized target — policy validation." |
| **2:00** | Revert | Show tool card + Etherscan | "TargetNotWhitelisted — architecturally enforced." |
| **2:10** | Payment | `/pay` | "Vendor payment enters timelock — PENDING." |
| **2:25** | Approve | Owner approves via Dynamic (Phase 5) | "Owner approves after the waiting period." |
| **2:40** | Audit | `/pending` | "Full on-chain audit trail — same treasury, same rules." |
| **2:50** | Close | — | "AgentBlox by Particle CS. Powered by Bloxchain Protocol." |

---

## Slash command cheat sheet

| Command | Purpose |
|---------|---------|
| `/status` | Treasury configured + ETH balance |
| `/ens` | Resolve name + text records |
| `/rebalance` | Propose LI.FI rebalance (policy execution) |
| `/attack` | Policy validation (blocked target) |
| `/pay` | Request timelock payment |
| `/pending` | Pending approvals |
| `/whitelist` | GuardController expectations |
| `/help` | Command list |

Natural language works when `OPENAI_API_KEY` is set.

---

## Key beats

1. **Bloxchain is load-bearing** — `/attack` proves policy enforcement
2. **Real txs** — Sepolia Etherscan when Phase 3–4 complete
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

## Until Phase 3–4 is complete

Current demo can show:

- `/status`, `/ens`, `/rebalance` (proposal cards with policy gate)
- `/attack` (off-chain blocked state)
- Console env checklist + Dynamic widget

Note: "On-chain execution wiring is Phase 3–4; policy and tool architecture are live today."
