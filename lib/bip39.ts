import {
  generateMnemonic,
  validateMnemonic,
  wordlists,
} from "bip39";

const WORDLIST = wordlists.english;
const ALLOWED = new Set([12, 15, 18, 21, 24]);

export function normalizePhrase(phrase: string): string {
  return phrase
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

export function phraseWords(phrase: string): string[] {
  const n = normalizePhrase(phrase);
  return n ? n.split(" ") : [];
}

export function validateBip39(phrase: string): {
  ok: boolean;
  message: string;
  words: string[];
} {
  const words = phraseWords(phrase);
  if (!words.length) {
    return { ok: false, message: "Enter your recovery phrase.", words };
  }
  if (!ALLOWED.has(words.length)) {
    return {
      ok: false,
      message: `BIP39 phrases must be 12, 15, 18, 21, or 24 words (got ${words.length}).`,
      words,
    };
  }
  const unknown = words.filter((w) => !WORDLIST.includes(w));
  if (unknown.length) {
    return {
      ok: false,
      message: `Not in the BIP39 English wordlist: ${unknown.slice(0, 5).join(", ")}.`,
      words,
    };
  }
  const normalized = words.join(" ");
  if (!validateMnemonic(normalized)) {
    return {
      ok: false,
      message: "Words are BIP39 vocabulary, but the checksum is invalid.",
      words,
    };
  }
  return { ok: true, message: "Valid BIP39 English mnemonic.", words };
}

export function generateSecurePhrase(strength: 128 | 256 = 256): string {
  const phrase = generateMnemonic(strength);
  if (!validateMnemonic(phrase)) {
    throw new Error("Generated mnemonic failed BIP39 check");
  }
  return phrase;
}

export function suggestWords(prefix: string, limit = 6): string[] {
  const needle = (prefix || "").toLowerCase().replace(/[^a-z]/g, "");
  if (!needle) return [];
  return WORDLIST.filter((w) => w.startsWith(needle)).slice(0, limit);
}
