"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppShellProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/fleet", label: "Fleet Map", badge: "CHRN" },
  { href: "/quality", label: "Quality Telemetry", badge: "NERA" },
  { href: "/routing", label: "Routing & Triage" },
  { href: "/species", label: "Species Profiles" },
] as const;

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative z-10 flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 min-w-0 px-6 lg:px-10 py-8">{children}</main>
        <footer className="px-6 lg:px-10 py-6 border-t border-[var(--shinkei-rule)] text-[11px] text-[var(--shinkei-text-mute)] font-mono flex flex-wrap items-center justify-between gap-2">
          <span>
            ShinkeiOS Lite · Built on DaFiF (Prasetyo et al., Mendeley DOI 10.17632/vx4ptwk3pb.1)
            and Global Fishing Watch AIS.
          </span>
          <span className="opacity-70">v0.3 · Internal Preview</span>
        </footer>
      </div>
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-[240px] shrink-0 border-r border-[var(--shinkei-rule)] bg-[var(--shinkei-paper)] flex-col">
      <div className="px-6 py-7 border-b border-[var(--shinkei-rule)]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <LogoMark />
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight text-[var(--shinkei-text)]">
              ShinkeiOS
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--shinkei-text-mute)]">
              Lite · Preview
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 text-[13px]">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            badge={"badge" in item ? item.badge : undefined}
            active={pathname === item.href}
          />
        ))}
      </nav>

      <div className="px-5 pb-6 pt-4 border-t border-[var(--shinkei-rule)] text-[11px] text-[var(--shinkei-text-mute)] leading-relaxed">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] mb-2">Region</div>
        <div className="text-[var(--shinkei-text)] text-[12px]">North Pacific · Honshu</div>
        <div className="mt-1">5 vessels active · 1 dock online</div>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  active,
  badge,
}: {
  href: string;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-md px-3 py-2 cursor-pointer transition-colors ${
        active
          ? "bg-[var(--shinkei-orange)]/10 text-[var(--shinkei-orange)]"
          : "text-[var(--shinkei-text)]/85 hover:bg-[var(--shinkei-cream-deep)]/50 hover:text-[var(--shinkei-text)]"
      }`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full transition-colors ${
            active
              ? "bg-[var(--shinkei-orange)]"
              : "bg-[var(--shinkei-text-mute)]/40 group-hover:bg-[var(--shinkei-text-mute)]"
          }`}
        />
        {label}
      </span>
      {badge && (
        <span className="font-mono text-[9px] tracking-widest uppercase text-[var(--shinkei-text-mute)]">
          {badge}
        </span>
      )}
    </Link>
  );
}

function TopBar() {
  return (
    <div className="relative border-b border-[var(--shinkei-rule)] px-6 lg:px-10 py-5 bg-[var(--shinkei-paper)] overflow-hidden">
      <div className="absolute inset-0 shinkei-halftone-soft opacity-50 pointer-events-none" />
      <div className="relative">
        <div className="shinkei-eyebrow">Operations Console</div>
        <h1 className="shinkei-display text-2xl lg:text-[28px] font-semibold mt-1">
          Artisanal quality
          <span className="text-[var(--shinkei-orange)]"> at industrial scale.</span>
        </h1>
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <div className="relative h-9 w-9 rounded-md bg-gradient-to-br from-[var(--shinkei-orange)] to-[var(--shinkei-ember)] flex items-center justify-center shadow-[0_8px_24px_-12px_rgba(255,107,26,0.7)] group-hover:scale-105 transition-transform">
      <span className="font-mono text-[14px] font-bold text-[var(--shinkei-paper)]">心</span>
    </div>
  );
}
