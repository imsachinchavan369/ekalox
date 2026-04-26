"use client";

import { SettingsEditor } from "@/components/profile/settings/SettingsEditor";
import type { ProfileIdentity } from "@/components/profile/types";

type SettingsMode =
  | "profile"
  | "password"
  | "notifications"
  | "privacy"
  | "support"
  | "download-history"
  | "purchase-history"
  | "affiliate";

interface SettingsDetailPanelProps {
  identity: ProfileIdentity;
  mode: SettingsMode | null;
  onBack: () => void;
  onIdentityChange: (identity: ProfileIdentity) => void;
}

function getModeLabel(mode: SettingsMode) {
  const labels: Record<SettingsMode, string> = {
    affiliate: "Affiliate settings",
    "download-history": "Download history",
    notifications: "Notifications",
    password: "Change password",
    "purchase-history": "Purchase history",
    privacy: "Privacy settings",
    profile: "Account details",
    support: "Help / Support",
  };

  return labels[mode];
}

export function SettingsDetailPanel({ identity, mode, onBack, onIdentityChange }: SettingsDetailPanelProps) {
  if (!mode) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-cyan-300/18 bg-slate-900/88 p-4 shadow-xl shadow-black/20">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-cyan-300/35 hover:text-white"
          aria-label="Back to settings list"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path d="M14.5 6.5 9 12l5.5 5.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="text-sm font-black text-white">{getModeLabel(mode)}</p>
          <p className="mt-1 text-xs text-slate-500">Update this setting here, then return to the list.</p>
        </div>
      </div>

      <SettingsEditor identity={identity} mode={mode} onIdentityChange={onIdentityChange} />
    </div>
  );
}
