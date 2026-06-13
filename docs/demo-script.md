# Demo Script

3-minute demo for ETHGlobal judges and ENS booth (Sunday AM). **All interactions run through Copilot** (`/`) using slash commands or natural language.

See [provisioning-checklist.md](./provisioning-checklist.md) before rehearsing.

---

## Pre-demo checklist

- [ ] Treasury provisioned on bloxchain.app (AccountBlox clone on Sepolia)
- [ ] `TREASURY_ADDRESS` set in `.env`; `/api/health` shows `treasuryConfigured: true`
- [ ] ENS name linked (`/ens` resolves to clone)
- [ ] Dynamic Owner logged in (`DynamicWidget` in header)
- [ ] `npm run dev:all` running
- [ ] LI.FI Composer flow pre-tested on Sepolia (Phase 4)
- [ ] Sepolia Etherscan tabs open: success tx + revert tx
- [ ] Optional: pre-stage Lane B timelock via `/pay`

---

## Script (3 minutes)

| Time | Scene | Copilot action | What to say |
|------|-------|----------------|-------------|
| **0:00** | Problem | — | "AI agents and finance teams both move money — both need the same controls. Keys alone aren't enough." |
| **0:20** | Identity | `/ens` | "This is `treasury.acme.eth` — it resolves to our AccountBlox clone on Sepolia." |
| **0:40** | Status | `/status` | "Copilot reads real on-chain state — treasury address, balance, policy engine." |
| **0:55** | Architecture | Verbal / slide | "ENS names the actor. Bloxchain decides what's allowed. Dynamic holds keys. LI.FI runs approved flows." |
| **1:05** | Lane A — propose | `/rebalance` | "Our policy agent proposes a rebalance. It signs a meta-tx — but cannot execute alone." |
| **1:25** | Lane A — execute | Confirm in tool card (Phase 3) | "Dynamic's server wallet broadcasts. GuardController checks the whitelist. LI.FI Composer runs." |
| **1:45** | Lane A — blocked | `/attack` | "Now the agent is prompt-injected to drain the wallet." |
| **2:00** | Lane A — revert | Show tool card + Etherscan | "TargetNotWhitelisted — architecturally enforced, not prompt engineering." |
| **2:10** | Lane B — request | `/pay` | "Finance lane: vendor payment enters timelock — PENDING." |
| **2:25** | Lane B — approve | Owner approves via Dynamic (Phase 5) | "CFO approves after the waiting period." |
| **2:40** | Audit | `/pending` or tx timeline | "Full on-chain audit trail — same AccountBlox, different persona." |
| **2:50** | Close | — | "AgentBlox by Particle CS. Powered by Bloxchain Protocol. Dynamic, LI.FI, ENS." |

---

## Slash command cheat sheet (demo)

| Command | Lane | Purpose |
|---------|------|---------|
| `/status` | — | Show treasury configured + ETH balance |
| `/ens` | Identity | Resolve name + text records |
| `/rebalance` | A | Propose LI.FI rebalance |
| `/attack` | A | Show policy block |
| `/pay` | B | Request timelock payment |
| `/pending` | B | Pending approvals |
| `/whitelist` | — | GuardController expectations |
| `/help` | — | Command list |

Natural language works when `OPENAI_API_KEY` is set.

---

## Key beats judges must see

1. **Bloxchain is load-bearing** — `/attack` proves policy enforcement story
2. **Real txs** — Sepolia Etherscan links when Phase 3–4 complete (not mocked JSON only)
3. **ENS is functional** — `/ens` with text records
4. **Three sponsor layers** — Dynamic + LI.FI + ENS, not three wallet vendors
5. **Dual audience** — agent + fintech in one Copilot workspace

---

## ENS booth script (2 minutes)

| Time | Copilot action | Say |
|------|----------------|-----|
| 0:00 | `/ens` | "ENS gives treasuries persistent identity beyond addresses." |
| 0:30 | Show text records in tool result | "Policy version and allowed flow IDs on ENS — agents discover policy without a centralized registry." |
| 1:00 | `/rebalance` | "Named actor, policy-limited actions — trustworthy agent treasuries." |
| 1:30 | Verbal | "ENS names the actor; Bloxchain limits the actor." |

---

## Submission assets

- [ ] Public GitHub repo (AgentBlox)
- [ ] Link to Bloxchain Protocol repo
- [ ] Demo video (≤3–5 min) recorded from Copilot
- [ ] Live URL (Vercel)
- [ ] Sepolia tx hashes (success + revert)
- [ ] Architecture diagram in README
- [ ] Prize track statement per sponsor in README

---

## Fallbacks if live demo fails

| Failure | Fallback |
|---------|----------|
| Composer tx fails | Show pre-recorded Etherscan success tx |
| ENS resolution slow | Show pre-resolved `/ens` output screenshot |
| Dynamic login fails | Walk architecture + recorded clip |
| Server down | Show `implementation-status.md` + architecture |

---

## What not to say

- "We built a full autonomous AI agent" → say **policy agent with deterministic tools, LLM optional**
- "Bloxchain is a wallet" → say **policy middleware**
- "ENS is branding" → show `/ens` text records

---

## Until Phase 3–4 is complete

Current demo can still show:

- `/status`, `/ens`, `/rebalance` (proposal cards with policy gate)
- `/attack` (off-chain blocked state + expected on-chain error)
- Console env checklist + Dynamic widget

Note to judges: "On-chain execution wiring is Phase 3–4; policy and tool architecture are live today."
