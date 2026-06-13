# ENS Integration

ENS provides **treasury and agent identity** in AgentBlox. ENS is **not** part of bloxchain.app — all ENS setup and resolution lives in this repo.

## Official documentation

- ENS integrating guide: https://ensdomains-ens-contracts.mintlify.app/guides/integrating-ens
- Resolving names: https://ensdomains-ens-contracts.mintlify.app/guides/resolving-names
- viem `getEnsAddress`: https://viem.sh/docs/ens/actions/getEnsAddress
- viem `getEnsText`: https://viem.sh/docs/ens/actions/getEnsText
- viem `normalize`: https://viem.sh/docs/ens/utilities/normalize

## Architecture role

```
ENS name (treasury.acme.eth)
     ↓ resolve
AccountBlox clone address
     ↓ text records
Policy metadata (version, allowed flows)
```

ENS answers **who is this treasury?** Bloxchain answers **what may it do?**

## Packages

ENS resolution uses **viem** (already installed). No separate ENS SDK required.

```typescript
import { normalize } from 'viem/ens';
```

For writing records (set resolver, set text), use viem contract writes with Owner wallet via Dynamic.

## Text record schema (AgentBlox)

Custom keys for policy metadata:

| Key | Example value | Purpose |
|-----|---------------|---------|
| `bloxchain.policyVersion` | `1.0.0` | Policy schema version |
| `bloxchain.allowedFlows` | `rebalance-sepolia-v1` | Comma-separated allowed LI.FI flow IDs |
| `bloxchain.app` | `agentblox` | Identifies managing application |
| `description` | `Acme Corp treasury` | Human-readable (standard ENS key) |
| `url` | `https://agentblox.app/treasury/acme` | Dashboard link |

Defined in `src/lib/config.ts` as `ENS_TEXT_KEYS`.

## Reading ENS (implemented stub)

`src/lib/ens.ts`:

```typescript
import { normalize } from 'viem/ens';

// Forward resolution: name → address
const address = await client.getEnsAddress({ name: normalize('treasury.acme.eth') });

// Text records
const policyVersion = await client.getEnsText({
  name: normalize('treasury.acme.eth'),
  key: 'bloxchain.policyVersion',
});
```

### Chain note

ENS resolution for `.eth` names typically uses **Ethereum mainnet** resolver, even when treasury is on Sepolia. Configure viem client accordingly:

```typescript
import { mainnet } from 'viem/chains';

const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(mainnetRpcUrl),
});
```

Sepolia has ENS testnet utilities but for hackathon demo, mainnet ENS pointing to Sepolia address is acceptable if documented.

## Writing ENS records

Owner wallet (Dynamic embedded) must own the ENS name.

### Set address record

```typescript
import { namehash } from 'viem';

// Via PublicResolver contract on mainnet
await resolver.write.setAddr([namehash(normalize('treasury.acme.eth')), treasuryAddress]);
```

### Set text records

```typescript
await resolver.write.setText([node, 'bloxchain.policyVersion', '1.0.0']);
await resolver.write.setText([node, 'bloxchain.allowedFlows', 'rebalance-sepolia-v1']);
await resolver.write.setText([node, 'bloxchain.app', 'agentblox']);
```

Implement in `src/lib/ens.ts` write helpers or dedicated setup wizard component.

## UI flows

### Treasury Setup page (`src/pages/TreasurySetupPage.tsx`)

1. User enters ENS name
2. User enters or confirms AccountBlox clone address
3. "Link ENS" button — Owner signs setAddr + setText txs
4. Save to app state / localStorage

### Dashboard

1. Display ENS name in header (not raw 0x if name exists)
2. On load: resolve ENS → verify matches imported treasury address
3. Show text records in "Policy" panel

### Agent flows

1. Agent Bridge reads `bloxchain.allowedFlows` from ENS before proposing rebalance
2. Reject proposal if flow ID not in allowed list (off-chain policy + on-chain whitelist)

## Subnames (stretch)

| Name | Purpose |
|------|---------|
| `treasury.acme.eth` | Main treasury clone |
| `rebalancer.agent.acme.eth` | Agent identity metadata |
| `payroll.acme.eth` | Lane B vendor payment treasury (same clone or alias) |

Skip subnames if behind schedule — single name is sufficient for ENS prizes.

## Prize alignment

| Track | Requirement |
|-------|-------------|
| Best ENS Integration for AI Agents | Functional identity improving discoverability |
| Integrate ENS pool | ENS used meaningfully, not cosmetic |
| ENS Continuity (stretch) | "Extended Bloxchain OSS with ENS in AgentBlox" |

### ENS booth (Sunday AM — required)

Prepare:
1. Live resolve `treasury.acme.eth` in AgentBlox UI
2. Show text records with policy metadata
3. Connect ENS identity to agent flow execution

## Environment variables

```env
VITE_ENS_NAME=treasury.acme.eth
```

## Pre-hackathon checklist

- [ ] Register ENS name (or subname under team domain)
- [ ] Fund Owner wallet with ETH for gas (mainnet resolver writes)
- [ ] Pre-link name to Sepolia clone address before demo
- [ ] Set all `bloxchain.*` text records
- [ ] Calendar ENS booth Sunday morning

## Files to implement

| File | Purpose |
|------|---------|
| `src/lib/ens.ts` | Read + write helpers (extend existing) |
| `src/hooks/useEnsTreasury.ts` | Resolve name, load text records |
| `src/components/EnsSetupWizard.tsx` | Link name to treasury |
| `src/components/PolicyMetadata.tsx` | Display text records |

## Do not

- Hard-code fake ENS resolution in UI without on-chain lookup
- Put ENS setup in bloxchain.app (out of scope)
- Use ENS only as logo decoration — must affect discovery or policy display

## Demo talking points

> "ENS names the actor; Bloxchain limits the actor. Text records carry policy version and allowed flow IDs so agents can discover treasuries without centralized registries."
