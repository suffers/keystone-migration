"use client";

import type { Device } from "@/lib/devices";

type Props = {
  device: Device;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function DeviceCard({ device, selected, onSelect }: Props) {
  return (
    <label
      className={`device-card ${device.generation === "previous" ? "device-card--previous" : ""} ${selected ? "is-selected" : ""}`}
      style={{ ["--accent" as string]: device.accent }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(device.id);
        }
      }}
    >
      <input
        type="radio"
        name="device_id"
        value={device.id}
        checked={selected}
        onChange={() => onSelect(device.id)}
      />
      <div className="device-card-top">
        <span className={`device-badge ${device.badgeTone}`}>{device.badge}</span>
        <span className="check-ring" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </span>
      </div>

      <div className="device-visual">
        {device.image ? (
          <img src={device.image} alt={device.name} />
        ) : (
          <div className={`legacy-device legacy-device--${device.shell}`} aria-hidden="true">
            <div className="legacy-bezel">
              <div className="legacy-screen">
                <img className="legacy-brand" src="/img/logo-mark.webp" alt="" width={36} height={36} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="device-body">
        <h3>{device.name}</h3>
        <p>{device.tagline}</p>
        <ul className="device-specs">
          {device.specs.map((spec) => (
            <li key={spec}>{spec}</li>
          ))}
        </ul>
        <div className="device-meta">
          <span>{device.firmware}</span>
          <span
            className={`device-status ${device.generation === "previous" ? "device-status--assist" : ""}`}
          >
            {device.status}
          </span>
        </div>
      </div>
    </label>
  );
}
