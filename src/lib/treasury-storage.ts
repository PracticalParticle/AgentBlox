const STORAGE_KEY = 'agentblox.console.treasury';

export type StoredTreasuryReference = {
  treasuryAddress: string;
  ensName: string;
};

export function loadStoredTreasuryReference(): StoredTreasuryReference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { treasuryAddress: '', ensName: '' };
    const parsed = JSON.parse(raw) as Partial<StoredTreasuryReference>;
    return {
      treasuryAddress: parsed.treasuryAddress ?? '',
      ensName: parsed.ensName ?? '',
    };
  } catch {
    return { treasuryAddress: '', ensName: '' };
  }
}

export function saveStoredTreasuryReference(payload: StoredTreasuryReference): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
