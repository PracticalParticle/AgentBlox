# ENS Integration

ENS provides **treasury and agent identity** in AgentBlox. ENS is **not** part of bloxchain.app — all ENS setup and resolution lives in this repo.

Primary UX: Copilot `/ens` tool and Console reference fields.

---

## Official documentation

- ENS integrating guide: https://ensdomains-ens-contracts.mintlify.app/guides/integrating-ens
- viem `getEnsAddress`: https://viem.sh/docs/ens/actions/getEnsAddress
- viem `getEnsText`: https://viem.sh/docs/ens/actions/getEnsText

---

## Architecture role

```
ENS name (treasury.acme.eth)
     ↓ resolve (mainnet)
AccountBlox clone address
     ↓ text records
Policy metadata (version, allowed flows)
```

ENS answers **who is this treasury?** Bloxchain answers **what may it do?**

---

## Text record schema

| Key | Example | Purpose |
|-----|---------|---------|
| `bloxchain.policyVersion` | `1.0.0` | Policy schema version |
| `bloxchain.allowedFlows` | `rebalance-sepolia-v1` | Allowed LI.FI flow IDs |
| `bloxchain.app` | `agentblox` | Managing application |
| `description` | `Acme Corp treasury` | Standard ENS key |
| `url` | Dashboard link | Optional |

Constants in `src/lib/config.ts` as `ENS_TEXT_KEYS`.

---

## Reading ENS (implemented)

### Server tool

`resolve_ens_treasury` in `server/tools/read.ts`:

- Forward resolution via mainnet viem client
- Reads `bloxchain.*` text records
- Compares to `TREASURY_ADDRESS` → `matchesConfiguredTreasury`

### Client helpers

`src/lib/ens.ts` — `resolveEnsToAddress`, `readTreasuryEnsRecords`

### Chain note

`.eth` resolution uses **Ethereum mainnet** resolver even when treasury is on Sepolia. Configure `MAINNET_RPC_URL` in `.env`.

---

## Writing ENS records (Phase 6)

Owner wallet (Dynamic embedded) must own the ENS name.

Implement write helpers in `src/lib/ens.ts` or Console wizard:

```typescript
await resolver.write.setAddr([namehash(normalize(name)), treasuryAddress]);
await resolver.write.setText([node, 'bloxchain.allowedFlows', 'rebalance-sepolia-v1']);
```

---

## UI flows

### Console (`/console`)

- Display fields for treasury address + ENS name (reference)
- Phase 6: persist to localStorage; link ENS button

### Copilot

- `/ens` — resolve + text records + match check
- Natural language: "What is our treasury ENS?"

### Policy integration (Phase 6)

`propose_rebalance` should read `bloxchain.allowedFlows` from ENS and cross-check `flowId` before signing.

---

## Environment

```env
ENS_NAME=treasury.acme.eth
VITE_ENS_NAME=treasury.acme.eth
```

See [env-configuration.md](./env-configuration.md).

---

## Pre-hackathon checklist

- [ ] Register ENS name
- [ ] Set address → Sepolia clone
- [ ] Set `bloxchain.*` text records
- [ ] Verify Copilot `/ens`
- [ ] Calendar ENS booth Sunday AM — [demo-script.md](./demo-script.md)

---

## Files

| File | Status |
|------|--------|
| `server/tools/read.ts` | ✅ `resolveEnsTreasury` |
| `src/lib/ens.ts` | ✅ read helpers |
| `src/pages/ConsolePage.tsx` | Partial — display only |
| `src/lib/ens.ts` write helpers | Phase 6 |
| `src/hooks/useEnsTreasury.ts` | Phase 6 |

---

## Prize alignment

| Track | Requirement |
|-------|-------------|
| Best ENS Integration for AI Agents | Functional identity in Copilot |
| Integrate ENS pool | Meaningful resolution + text records |
| ENS Continuity (stretch) | Extended Bloxchain OSS with ENS in AgentBlox |

---

## Do not

- Hard-code fake resolution without on-chain lookup
- Put ENS setup in bloxchain.app
- Use ENS only as decoration — must affect `/ens` tool and policy metadata

---

## Demo talking points

> "ENS names the actor; Bloxchain limits the actor. Text records carry allowed flow IDs so agents discover treasuries without centralized registries."

Run live in Copilot: `/ens` then `/rebalance`.
