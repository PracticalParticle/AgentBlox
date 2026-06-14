/** Slash command chips shown in Copilot / Workspace chat input. */
export const CHAT_SLASH_SUGGESTIONS = [
  '/status',
  '/deposit',
  '/withdraw',
  '/pay 5$',
  '/pay 20$',
  '/rebalance',
  '/attack',
  '/ens',
  '/help',
] as const;

export const CHAT_SLASH_PLACEHOLDER_FALLBACK =
  'Use /status, /deposit, /withdraw, /pay 5$, /pay 20$, /rebalance, /attack, or /help';
