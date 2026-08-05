"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeviceCard } from "@/components/DeviceCard";
import { CURRENT_DEVICES, PREVIOUS_DEVICES } from "@/lib/devices";
import { clearSession, writeSession } from "@/lib/session";

export default function SelectDevicePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const continueWith = () => {
    if (!selected) return;
    clearSession();
    writeSession({ deviceId: selected });
    router.push("/migrate/import");
  };

  return (
    <section className="page">
      <div className="select-hero">
        <img
          className="hero-logo"
          src="/img/logo-mark.webp"
          alt="Keystone"
          width={56}
          height={56}
        />
        <p className="eyebrow">Security migration</p>
        <h1 className="page-title">Select your device</h1>
        <p className="page-sub" style={{ marginLeft: "auto", marginRight: "auto" }}>
          A weakness was identified in the random number generation used when creating
          some wallets. Choose your Keystone, enter your recovery phrase, and we’ll
          issue a new BIP39-compliant seed and move your funds.
        </p>
      </div>

      <aside className="alert-banner" role="status">
        <div className="alert-icon" aria-hidden="true">
          !
        </div>
        <div>
          <strong>PRNG advisory</strong>
          <p>
            If your seed was created on an affected firmware build, migrate as soon as
            possible. You’ll enter your current phrase, receive a new secure seed, then
            we move balances automatically.
          </p>
        </div>
      </aside>

      <div className="device-section">
        <div className="device-section-head">
          <h2>Current devices</h2>
          <p>Keystone 3 Pro — select, then continue to phrase migration.</p>
        </div>
        <div className="device-grid" role="radiogroup" aria-label="Current Keystone devices">
          {CURRENT_DEVICES.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              selected={selected === d.id}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>

      <div className="device-section">
        <div className="device-section-head">
          <h2>Previous devices</h2>
          <p>Older models — same phrase import, new seed, automatic fund move.</p>
        </div>
        <div
          className="device-grid previous-grid"
          role="radiogroup"
          aria-label="Previous Keystone devices"
        >
          {PREVIOUS_DEVICES.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              selected={selected === d.id}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>

      <div className="select-actions">
        <button
          className="primary-btn"
          type="button"
          disabled={!selected}
          onClick={continueWith}
        >
          {selected
            ? `Continue with ${
                [...CURRENT_DEVICES, ...PREVIOUS_DEVICES].find((d) => d.id === selected)
                  ?.name ?? "device"
              }`
            : "Continue"}
        </button>
      </div>
      <p className="footer-note">
        Next: enter recovery phrase · new BIP39 seed · funds moved automatically
      </p>
    </section>
  );
}
