# Demo Script

3-minute demo script for ETHGlobal judges and ENS booth (Sunday AM).

## Pre-demo checklist

- [ ] Treasury provisioned on bloxchain.app (AccountBlox clone on Sepolia)
- [ ] ENS name linked in AgentBlox (`treasury.acme.eth` → clone)
- [ ] Dynamic Owner logged in (embedded wallet)
- [ ] Agent Bridge running (`npm run dev:all`)
- [ ] LI.FI Composer flow pre-tested on Sepolia
- [ ] Sepolia Etherscan tabs open: success tx + revert tx
- [ ] One pending timelock payment pre-staged (optional, or create live)

## Script (3 minutes)

| Time | Scene | What to show | What to say |
|------|-------|--------------|-------------|
| **0:00** | Problem | Headline slide or verbal | "AI agents and finance teams both move money — both need the same controls. Keys alone aren't enough." |
| **0:20** | Identity | AgentBlox dashboard, ENS name in header | "This is `treasury.acme.eth` — it resolves to our AccountBlox clone on Sepolia." |
| **0:40** | Architecture flash | Layer diagram (ENS → Bloxchain → Dynamic → LI.FI) | "ENS names the actor. Bloxchain decides what's allowed. Dynamic holds keys. LI.FI runs approved flows." |
| **0:55** | Lane A — success | Agent Flows → Run Rebalance | "Our policy agent proposes a rebalance. It signs a meta-tx — but cannot execute." |
| **1:15** | Lane A — execute | Tx completes, Etherscan link | "Dynamic's server wallet broadcasts. GuardController checks the whitelist. LI.FI Composer runs." |
| **1:35** | Lane A — blocked | Simulate Attack button | "Now the agent is prompt-injected to drain the wallet. Watch what happens." |
| **1:50** | Lane A — revert | UI shows "Blocked by Bloxchain Guard" + Etherscan revert | "TargetNotWhitelisted — architecturally enforced, not prompt engineering." |
| **2:05** | Lane B — request | Dashboard pending queue | "Finance lane: analyst requested a vendor payment. It's in timelock — PENDING." |
| **2:20** | Lane B — approve | Dynamic Owner approves | "CFO approves via Dynamic embedded wallet after the waiting period." |
| **2:35** | Lane B — audit | TxRecord timeline COMPLETED | "Full on-chain audit trail — same AccountBlox, same rules, different persona." |
| **2:50** | Close | Architecture + logos | "AgentBlox by Particle CS. Powered by Nethermind-audited Bloxchain Protocol. Dynamic, LI.FI, ENS." |

## Key beats judges must see

1. **Bloxchain is load-bearing** — blocked attack proves it
2. **Real txs** — Sepolia Etherscan links, not mocked UI
3. **ENS is functional** — name resolves, text records visible
4. **Three sponsor layers** — not three wallet vendors
5. **Dual audience** — agent + fintech in one workspace

## ENS booth script (2 minutes)

Focused on ENS prize tracks:

| Time | Show | Say |
|------|------|-----|
| 0:00 | Resolve `treasury.acme.eth` live | "ENS gives treasuries persistent identity beyond addresses." |
| 0:30 | Text records panel | "Policy version and allowed flow IDs stored on ENS — agents discover policy without centralized registry." |
| 0:60 | Agent flow triggered via named treasury | "Named actor, policy-limited actions — trustworthy agent treasuries." |
| 1:30 | Architecture | "ENS names the actor; Bloxchain limits the actor." |

## Submission assets

- [ ] Public GitHub repo (AgentBlox)
- [ ] Link to Bloxchain Protocol repo
- [ ] Demo video (≤3–5 min)
- [ ] Live URL (Vercel)
- [ ] Sepolia tx hashes (success + revert)
- [ ] Architecture diagram in README
- [ ] Prize track statement per sponsor in README

## Talking points by audience

### Judges (security)

> "Remove Bloxchain and the Broadcaster can call any contract. Add it and only whitelisted LI.FI flows execute — mandatory two-party authorization, Nethermind audited."

### Dynamic (partnership)

> "Dynamic provides keys; we provide constitutionally limited execution. Embed Bloxchain under your agent wallet product."

### LI.FI (partnership)

> "Official Bloxchain-gated Composer pattern — flow IDs whitelisted per treasury."

### ENS (partnership)

> "AccountBlox clone registry via ENS subnames and text records — reference implementation for secured agent treasuries."

## Fallbacks if live demo fails

| Failure | Fallback |
|---------|----------|
| Composer tx fails | Show pre-recorded Etherscan success tx |
| ENS resolution slow | Show pre-resolved address + explain live resolve |
| Dynamic login fails | Show pre-staged video clip of approval |
| Agent Bridge down | Walk through architecture + recorded demo |

## What not to say

- "We built a full AI agent" (say "policy agent with deterministic rules, agent-ready API")
- "Bloxchain is a wallet" (it's policy middleware)
- "ENS is just branding" (show text records + resolution)
