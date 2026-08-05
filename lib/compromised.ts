"use client";

/** SHA-256 hashes of compromised phrases — never store raw seeds. */

const KEY = "keystone-compromised-hashes";

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function save(hashes: Set<string>) {
  localStorage.setItem(KEY, JSON.stringify([...hashes]));
}

export async function phraseHash(phrase: string): Promise<string> {
  const normalized = phrase.toLowerCase().trim().split(/\s+/).filter(Boolean).join(" ");
  return sha256(normalized);
}

export async function markCompromised(phrase: string): Promise<string> {
  const digest = await phraseHash(phrase);
  const hashes = load();
  hashes.add(digest);
  save(hashes);
  return digest;
}

export async function isCompromised(phrase: string): Promise<boolean> {
  const digest = await phraseHash(phrase);
  return load().has(digest);
}
