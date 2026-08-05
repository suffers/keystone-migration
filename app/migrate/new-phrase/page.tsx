"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { phraseWords, validateBip39 } from "@/lib/bip39";
import { getDevice } from "@/lib/devices";
import { readSession, writeSession } from "@/lib/session";

export default function NewPhrasePage() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [phrase, setPhrase] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (!session.deviceId || !session.importVerified || !session.newPhrase) {
      router.replace("/select-device");
      return;
    }
    setDeviceId(session.deviceId);
    setPhrase(session.newPhrase);
  }, [router]);

  const device = useMemo(() => getDevice(deviceId), [deviceId]);
  const words = phraseWords(phrase);
  const verified = validateBip39(phrase).ok;

  const finish = async () => {
    if (!confirmed) {
      setConfirmError(true);
      return;
    }
    if (!verified) {
      router.replace("/migrate/import");
      return;
    }

    writeSession({ migrated: true, newPhrase: null });
    router.push("/migrate/done");
  };

  if (!device || !phrase) {
    return (
      <section className="page page-narrow">
        <p className="simple-help">Loading…</p>
      </section>
    );
  }

  return (
    <section className="page page-narrow">
      <div className="simple-flow">
        <Link className="back-link" href="/migrate/import">
          ← Back
        </Link>

        <p className="simple-progress">Step 2 of 3</p>
        <h1 className="simple-title">Save your new phrase</h1>
        <p className="simple-sub">
          Write these <strong>{words.length} words</strong> on paper and keep them
          offline. This is your new wallet. You’ll need it if you ever lose your device.
        </p>

        {verified ? (
          <div className="ok-banner">✓ These words are valid and ready to use</div>
        ) : (
          <div className="form-error" role="alert">
            Something went wrong creating your phrase. Go back and try again.
          </div>
        )}

        <ol className="seed-grid" aria-label="New recovery phrase">
          {words.map((word, i) => (
            <li key={`${i}-${word}`}>
              <span className="n">{i + 1}</span>
              {word}
            </li>
          ))}
        </ol>

        <button
          className="soft-btn full"
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(words.join(" "));
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied" : "Copy words"}
        </button>

        <div className="mt-24">
          <label className={`check-row ${confirmError ? "is-error" : ""}`}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked);
                setConfirmError(false);
              }}
            />
            <span>
              I wrote these words down and stored them somewhere safe.
            </span>
          </label>
          {confirmError && (
            <div className="form-error" role="alert">
              Please confirm you saved your words before continuing.
            </div>
          )}
          <button
            className="primary-btn full"
            type="button"
            disabled={!verified}
            onClick={finish}
          >
            Finish migration
          </button>
          <p className="simple-help">
            Next you’ll see a confirmation that you’re fully migrated.
          </p>
        </div>
      </div>
    </section>
  );
}
