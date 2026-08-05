"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getDevice } from "@/lib/devices";
import { readSession } from "@/lib/session";

export default function MigrateDonePage() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [compromised, setCompromised] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (!session.migrated) {
      router.replace("/select-device");
      return;
    }
    setDeviceId(session.deviceId);
    setCompromised(session.phraseCompromised);
    setReady(true);
  }, [router]);

  const device = useMemo(() => getDevice(deviceId), [deviceId]);

  if (!ready) {
    return (
      <section className="page page-narrow">
        <p className="simple-help">Loading…</p>
      </section>
    );
  }

  return (
    <section className="page page-narrow">
      <div className="simple-flow center-copy done-final">
        <img
          className="hero-logo"
          src="/img/logo-mark.webp"
          alt="Keystone"
          width={48}
          height={48}
        />
        <div className="done-mark" aria-hidden="true">
          ✓
        </div>
        <h1 className="simple-title">You’re all set!</h1>
        <p className="simple-sub" style={{ marginLeft: "auto", marginRight: "auto" }}>
          You’re fully migrated and secure. Your new recovery phrase is the only backup
          you need — keep it offline and never share it with anyone.
        </p>

        {compromised && (
          <aside className="compromised-banner" role="status">
            <strong>Old phrase labeled compromised</strong>
            <p>
              That recovery phrase is marked unsafe. If it’s entered again later, we’ll
              show a compromised warning before continuing.
            </p>
          </aside>
        )}

        {device && (
          <p className="simple-help">{device.name} · migration complete</p>
        )}

        <Link className="primary-btn full mt-24" href="/select-device">
          Back to select device
        </Link>
      </div>
    </section>
  );
}
