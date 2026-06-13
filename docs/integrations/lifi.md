# LI.FI Integration

**Audience:** Developers wiring Composer rebalance flows into Copilot tools.  
**Prerequisites:** GuardController whitelist configured — [guard-controller.md](../guard-controller.md) · [provisioning-checklist.md](../provisioning-checklist.md) Part A4, D.  
**See also:** [on-chain-execution-flow.md](../on-chain-execution-flow.md) · [event/ethglobal-2026.md](../event/ethglobal-2026.md)

LI.FI **Composer** provides atomic multi-step execution (swap, bridge, deposit). In AgentBlox, Composer runs **only** through GuardController-whitelisted calls triggered by Copilot tools.

**LI.FI does not enforce policy.** Bloxchain GuardController does.

---

## Official documentation

- Composer overview: https://docs.li.fi/composer/overview
- Composer API: https://docs.li.fi/composer/composer-api/overview
- ETHGlobal NY 2026 guide: https://docs.li.fi/composer/ethglobal-ny-2026
- Agent / MCP: https://docs.li.fi/agents/

---

## Architecture role

```
Copilot /rebalance → propose_rebalance tool
     ↓
LI.FI POST /compose → userProxy + calldata
     ↓
AGENT_POLICY signs meta-tx (target = userProxy)
     ↓
Dynamic Broadcaster → requestAndApproveExecution
     ↓
GuardController whitelist check → LI.FI user proxy executes
```

User proxy model and TxRecord fields: [guard-controller.md](../guard-controller.md).

---

## Packages

```bash
npm i @lifi/sdk@^4.0.0 @lifi/sdk-provider-ethereum@^4.0.0
```

For Composer authoring: `@lifi/composer-sdk`.

> Use Composer API / compose for AgentBlox — **not** direct browser `executeRoute`. AccountBlox must mediate all external calls.

---

## SDK usage in AgentBlox

Implement in `server/lifi/compose.ts` (Phase 4):

```typescript
// Option A: Composer API POST /compose
// Option B: @lifi/composer-sdk build Flow + compose
// Returns: { userProxy, calldata, executionSelector, executionParams }
```

Wire into:

- `get_lifi_quote_preview` — read-only
- `propose_rebalance` — embed in signed meta-tx

### Verify Composer route

When using legacy SDK quote paths, check response `tool === 'composer'`. Prefer Composer API `POST /compose` for AgentBlox.

---

## Execution via Bloxchain meta-tx

1. Compose Flow with `sender: TREASURY_ADDRESS`
2. Extract `userProxy` and calldata
3. Split: `executionSelector` (first 4 bytes) + `executionParams` (remainder)
4. Whitelist `userProxy` + proxy factory at provisioning
5. AGENT_POLICY signs; Broadcaster submits `requestAndApproveExecution`

---

## Tool integration

| Tool | Operation type | LI.FI usage |
|------|----------------|-------------|
| `get_lifi_quote_preview` | Monitor | Compose read-only |
| `propose_rebalance` | Treasury operation | Fixed Flow ID + compose → meta-tx |

Policy gate: `flowId ∈ AGENT_POLICY.allowedFlowIds` before compose. Optional ENS cross-check: `bloxchain.allowedFlows`.

---

## Default policy

| Rule | Default |
|------|---------|
| Flow ID | `rebalance-sepolia-v1` |
| Amount | 1 USDC (`1000000` units, 6 decimals) |
| Threshold | `AGENT_POLICY.rebalanceUsdcThreshold` in `server/config.ts` |

No LLM required for deterministic demo flows.

---

## Sepolia & reliability notes

- Pre-simulate compose before live demo or submission
- Confirm Composer-supported tokens on Sepolia
- Save Etherscan tx hashes (success + policy revert) for submission
- **Fallback:** if compose API blocked, pre-build one fixed Flow calldata offline and embed in `server/lifi/compose.ts` — still whitelist executor on-chain
- Document `userProxy` for your treasury signer — it is **per clone**, not a shared router address

---

## Environment variables

```env
VITE_LIFI_INTEGRATOR=AgentBlox
LIFI_INTEGRATOR=AgentBlox
```

See [env-configuration.md](../env-configuration.md).

---

## Files to implement

| File | Phase | Purpose |
|------|-------|---------|
| `server/lifi/compose.ts` | 4 | Compose + calldata split |
| `src/lib/lifi.ts` | 4 | Optional client wrapper |
| `server/tools/propose.ts` | 3–4 | Wire compose into rebalance |
| `server/tools/read.ts` | 4 | Real quote in preview tool |

---

## Do not

- Whitelist arbitrary contracts
- Let tools pick any Flow without policy validation
- Execute routes directly from Dynamic embedded wallet bypassing AccountBlox

---

## Other executors

LI.FI is one whitelisted executor. Same GuardController pattern for other routers — [extending-use-cases.md](../extending-use-cases.md).
