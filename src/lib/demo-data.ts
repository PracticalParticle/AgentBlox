import type { TreasuryStatusResponse } from './treasury-api';
import type { ServerHealth } from '../hooks/useServerHealth';

export const DEMO_TREASURY_STATUS: TreasuryStatusResponse = {
  configured: true,
  network: 'sepolia',
  address: '0xA6568F40d89E5c72E8142339Ff85Ad6E308925F3',
  ensName: 'treasury.demo.eth',
  ethBalance: '0.42',
  roles: {
    owner: '0x1111111111111111111111111111111111111111',
    broadcasters: ['0x2222222222222222222222222222222222222222'],
    recovery: '0x3333333333333333333333333333333333333333',
    timeLockPeriodSec: '120',
    initialized: true,
  },
  policy: {
    engine: 'Bloxchain AccountBlox',
    guard: 'GuardController whitelist enforced on-chain',
  },
};

export const DEMO_HEALTH: ServerHealth = {
  status: 'ok',
  service: 'agentblox-server',
  llmEnabled: false,
  treasuryConfigured: true,
  dynamicEnvironmentConfigured: true,
  dynamicBroadcasterConfigured: true,
  agentPolicySigningConfigured: true,
  analystConfigured: false,
  lifiComposeConfigured: true,
  mode: 'copilot-fallback',
  broadcaster: {
    configured: true,
    message: 'Demo mode — sample integration status',
    matchesOnChainBroadcaster: true,
  },
};

export const DEMO_SAMPLE_COMMANDS = [
  { label: 'Treasury status', command: '/status' },
  { label: 'Instant pay $5', command: '/pay 5$' },
  { label: 'Timelock pay $20', command: '/pay 20$' },
  { label: 'Policy block demo', command: '/attack' },
  { label: 'Pending approvals', command: '/pending' },
];
