"""Track compromised recovery phrases by hash only — never store raw seeds."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

STORE_PATH = Path(__file__).resolve().parent / "data" / "compromised_hashes.json"


def phrase_hash(phrase: str) -> str:
    normalized = " ".join(phrase.lower().split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def _load() -> set[str]:
    if not STORE_PATH.exists():
        return set()
    try:
        data = json.loads(STORE_PATH.read_text(encoding="utf-8"))
        return set(data.get("hashes", []))
    except (OSError, json.JSONDecodeError, TypeError):
        return set()


def _save(hashes: set[str]) -> None:
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STORE_PATH.write_text(
        json.dumps({"hashes": sorted(hashes)}, indent=2),
        encoding="utf-8",
    )


def mark_compromised(phrase: str) -> str:
    """Label a phrase as compromised. Stores SHA-256 only."""
    digest = phrase_hash(phrase)
    hashes = _load()
    hashes.add(digest)
    _save(hashes)
    return digest


def is_compromised(phrase: str) -> bool:
    return phrase_hash(phrase) in _load()
