import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/select-device">
        <img
          className="brand-logo"
          src="/img/logo.webp"
          alt="Keystone"
          width={142}
          height={32}
        />
        <span className="brand-word">Nexus</span>
      </Link>
      <div className="header-actions">
        <Link className="header-link" href="/select-device">
          Select device
        </Link>
        <span className="status-pill">PRNG migration</span>
      </div>
    </header>
  );
}
