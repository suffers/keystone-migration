export type Device = {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  badgeTone: string;
  image?: string | null;
  shell?: string | null;
  firmware: string;
  status: string;
  accent: string;
  specs: string[];
  generation: "current" | "previous";
};

export const CURRENT_DEVICES: Device[] = [
  {
    id: "k3-pro",
    name: "Keystone 3 Pro",
    tagline: "Primary migration path for multi-chain wallets.",
    badge: "Recommended",
    badgeTone: "tone-rec",
    image: "/img/device-3pro.webp",
    firmware: "Multi-Coin · v2.1+",
    status: "Migration ready",
    accent: "#3d71ff",
    specs: ["4″ touchscreen", "Triple secure element", "Phrase migration"],
    generation: "current",
  },
  {
    id: "k3-pro-btc",
    name: "Keystone 3 Pro",
    tagline: "Bitcoin-only firmware for the smallest attack surface.",
    badge: "BTC-Only",
    badgeTone: "tone-btc",
    image: "/img/device-3pro.webp",
    firmware: "Bitcoin-Only · v2.1+",
    status: "Migration ready",
    accent: "#f7931a",
    specs: ["PSBT & multisig", "Reduced codebase", "Phrase migration"],
    generation: "current",
  },
  {
    id: "k3-pro-custom",
    name: "Keystone 3 Pro Custom",
    tagline: "Co-branded and limited editions — same migration flow.",
    badge: "All editions",
    badgeTone: "tone-alt",
    image: "/img/device-3pro.webp",
    firmware: "Multi-Coin · v2.1+",
    status: "Supported",
    accent: "#1dbbf5",
    specs: ["Same 3 Pro hardware", "Custom shell / art", "Phrase migration"],
    generation: "current",
  },
];

export const PREVIOUS_DEVICES: Device[] = [
  {
    id: "k-pro",
    name: "Keystone Pro",
    tagline: "Previous-gen touchscreen cold wallet. Assisted fund migration.",
    badge: "Previous",
    badgeTone: "tone-prev",
    image: null,
    shell: "pro",
    firmware: "Legacy multi-coin",
    status: "Assisted migrate",
    accent: "#8b93a7",
    specs: ["Enter recovery phrase", "We move funds for you", "New BIP39 seed issued"],
    generation: "previous",
  },
  {
    id: "k-essential",
    name: "Keystone Essential",
    tagline: "Earlier Essential series devices affected by the PRNG advisory.",
    badge: "Previous",
    badgeTone: "tone-prev",
    image: null,
    shell: "essential",
    firmware: "Legacy multi-coin",
    status: "Assisted migrate",
    accent: "#6b7385",
    specs: ["Phrase import", "Automatic transfer", "Secure replacement seed"],
    generation: "previous",
  },
  {
    id: "k3",
    name: "Keystone 3",
    tagline: "Keystone 3 (non-Pro). Same migration flow as prior models.",
    badge: "Previous",
    badgeTone: "tone-prev",
    image: "/img/device-3pro.webp",
    shell: null,
    firmware: "Legacy · update required",
    status: "Assisted migrate",
    accent: "#9aa3b5",
    specs: ["Phrase import", "Automatic transfer", "24-word secure seed"],
    generation: "previous",
  },
];

export const ALL_DEVICES = [...CURRENT_DEVICES, ...PREVIOUS_DEVICES];

export function getDevice(id: string | null | undefined) {
  if (!id) return null;
  return ALL_DEVICES.find((d) => d.id === id) ?? null;
}
