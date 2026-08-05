"use client";

export type MigrationSession = {
  deviceId: string | null;
  importVerified: boolean;
  importWordCount: number;
  newPhrase: string | null;
  migrated: boolean;
  phraseCompromised: boolean;
};

const KEY = "keystone-migration-session";

export const emptySession = (): MigrationSession => ({
  deviceId: null,
  importVerified: false,
  importWordCount: 0,
  newPhrase: null,
  migrated: false,
  phraseCompromised: false,
});

export function readSession(): MigrationSession {
  if (typeof window === "undefined") return emptySession();
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return emptySession();
    return { ...emptySession(), ...JSON.parse(raw) };
  } catch {
    return emptySession();
  }
}

export function writeSession(patch: Partial<MigrationSession>) {
  const next = { ...readSession(), ...patch };
  sessionStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}
