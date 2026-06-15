"use client";

import { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative z-10 flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 min-w-0 px-6 lg:px-10 py-8">{children}</main>
        <footer className="px-6 lg:px-10 py-6 border-t border-white/5 text-[11px] text-[var(--shinkei-cream-mute)] font-mono flex flex-wrap items-center justify-between gap-2">
          <span>
            ShinkeiOS Lite · Built on DaFiF (Prasetyo et al., Mendeley DOI 10.17632/vx4ptwk3pb.1)
            and Global Fishing Watch AIS.
          </span>
          <span className="opacity-70">v0.2 · Internal Preview</span>
        </footer>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="hidden lg:flex w-[240px] shrink-0 border-r border-white/5 bg-[var(--shinkei-ink)] flex-col">
      <div className="px-6 py-7 border-b border-white/5">
        <div className="flex items-center gap-2">
          <LogoMark />
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight">ShinkeiOS</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--shinkei-cream-mute)]">
              Lite · Preview
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 text-[13px]">
        <NavItem label="Overview" active />
        <NavItem label="Fleet Map" badge="CHRN" />
        <NavItem label="Quality Telemetry" badge="NERA" />
        <NavItem label="Routing & Triage" />
        <NavItem label="Species Profiles" />
        <div className="mt-6 px-3 shinkei-eyebrow">Robotics</div>
        <NavItem label="Poseidon Fleet" />
        <NavItem label="Processing Centers" />
        <div className="mt-6 px-3 shinkei-eyebrow">Operations</div>
        <NavItem label="Seremoni Direct" />
        <NavItem label="Wholesale Lanes" />
      </nav>

      <div className="px-5 pb-6 pt-4 border-t border-white/5 text-[11px] text-[var(--shinkei-cream-mute)] leading-relaxed">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] mb-2 text-[var(--shinkei-cream-mute)]">
          Region
        </div>
        <div className="text-[var(--shinkei-cream)] text-[12px]">North Pacific · Honshu</div>
        <div className="mt-1">5 vessels active · 1 dock online</div>
      </div>
    </aside>
  );
}

function NavItem({ label, active, badge }: { label: string; active?: boolean; badge?: string }) {
  return (
    <div
      className={`group flex items-center justify-between rounded-md px-3 py-2 cursor-pointer transition-colors ${
        active
          ? "bg-[var(--shinkei-orange)]/10 text-[var(--shinkei-orange)]"
          : "text-[var(--shinkei-cream)]/80 hover:bg-white/[0.03] hover:text-[var(--shinkei-cream)]"
      }`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            active ? "bg-[var(--shinkei-orange)]" : "bg-white/15 group-hover:bg-white/30"
          }`}
        />
        {label}
      </span>
      {badge && (
        <span className="font-mono text-[9px] tracking-widest uppercase text-[var(--shinkei-cream-mute)]">
          {badge}
        </span>
      )}
    </div>
  );
}

function TopBar() {
  return (
    <div className="border-b border-white/5 px-6 lg:px-10 py-5 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="shinkei-eyebrow">Operations Console</div>
        <h1 className="shinkei-display text-2xl lg:text-[28px] font-semibold mt-1">
          Artisanal quality
          <span className="text-[var(--shinkei-orange)]"> at industrial scale.</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <StatusPill label="Poseidon Edge v2.1" tone="ok" />
        <StatusPill label="CHRN online" tone="ok" />
        <StatusPill label="NERA forecasting" tone="ok" />
      </div>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "ok" | "warn" }) {
  const dotColor = tone === "ok" ? "bg-emerald-400" : "bg-amber-400";
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.02] px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.14em] text-[var(--shinkei-cream)]">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shinkei-pulse`} />
      {label}
    </div>
  );
}

function LogoMark() {
  return (
    <div className="relative h-9 w-9 rounded-md bg-gradient-to-br from-[var(--shinkei-orange)] to-[var(--shinkei-ember)] flex items-center justify-center shadow-[0_8px_24px_-12px_rgba(255,122,31,0.7)]">
      <span className="font-mono text-[14px] font-bold text-[var(--shinkei-ink)]">心</span>
    </div>
  );
}
