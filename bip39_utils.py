"""BIP39 helpers — validate and generate English mnemonics."""

from __future__ import annotations

import re

from mnemonic import Mnemonic

_MNEMO = Mnemonic("english")
_WORDLIST = set(_MNEMO.wordlist)
_ALLOWED_LENGTHS = {12, 15, 18, 21, 24}


def normalize_phrase(phrase: str) -> str:
    words = re.findall(r"[a-zA-Z]+", phrase.lower())
    return " ".join(words)


def phrase_words(phrase: str) -> list[str]:
    return normalize_phrase(phrase).split() if normalize_phrase(phrase) else []


def validate_bip39(phrase: str) -> tuple[bool, str, list[str]]:
    """Return (ok, message, words). Checks wordlist membership, length, and checksum."""
    words = phrase_words(phrase)
    if not words:
        return False, "Enter your recovery phrase.", words

    if len(words) not in _ALLOWED_LENGTHS:
        return (
            False,
            f"BIP39 phrases must be 12, 15, 18, 21, or 24 words (got {len(words)}).",
            words,
        )

    unknown = [w for w in words if w not in _WORDLIST]
    if unknown:
        sample = ", ".join(unknown[:5])
        extra = f" (+{len(unknown) - 5} more)" if len(unknown) > 5 else ""
        return False, f"Not in the BIP39 English wordlist: {sample}{extra}.", words

    normalized = " ".join(words)
    if not _MNEMO.check(normalized):
        return (
            False,
            "Words are BIP39 vocabulary, but the checksum is invalid. Check for typos.",
            words,
        )

    return True, "Valid BIP39 English mnemonic.", words


def generate_secure_phrase(strength: int = 256) -> str:
    """Generate a cryptographically secure BIP39 mnemonic.

    strength: 128 → 12 words, 256 → 24 words.
    """
    if strength not in (128, 160, 192, 224, 256):
        raise ValueError("Invalid BIP39 strength")
    phrase = _MNEMO.generate(strength=strength)
    if not _MNEMO.check(phrase):
        raise RuntimeError("Generated mnemonic failed BIP39 check")
    return phrase


def is_bip39(phrase: str) -> bool:
    ok, _, _ = validate_bip39(phrase)
    return ok


def suggest_words(prefix: str, limit: int = 6) -> list[str]:
    """Return BIP39 English words that start with prefix."""
    needle = re.sub(r"[^a-z]", "", (prefix or "").lower())
    if not needle:
        return []
    matches = [w for w in _MNEMO.wordlist if w.startswith(needle)]
    return matches[:limit]


def wordlist() -> list[str]:
    return list(_MNEMO.wordlist)
