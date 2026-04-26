"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MaskedEmailToggle } from "@/components/profile/settings/MaskedEmailToggle";
import { SettingsDetailPanel } from "@/components/profile/settings/SettingsDetailPanel";
import { SettingsRow } from "@/components/profile/settings/SettingsRow";
import { SettingsSection } from "@/components/profile/settings/SettingsSection";
import type { ProfileIdentity } from "./types";

interface ProfileSettingsProps {
  identity: ProfileIdentity;
  isOpen: boolean;
  logoutAction: () => void;
  onClose: () => void;
  onIdentityChange: (identity: ProfileIdentity) => void;
}

type SettingsMode = "profile" | "password" | "notifications" | "privacy" | "support" | "download-history" | "purchase-history" | "affiliate";

export function ProfileSettings({ identity, isOpen, logoutAction, onClose, onIdentityChange }: ProfileSettingsProps) {
  const [mode, setMode] = useState<SettingsMode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMode(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/72 px-4 py-5 backdrop-blur-sm sm:items-center">
      <div className="max-h-[88vh] w-full max-w-xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-black text-white">Profile Settings</p>
            <MaskedEmailToggle email={identity.email} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-cyan-300/35 hover:text-white"
            aria-label="Close profile settings"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(88vh-4.5rem)] space-y-5 overflow-y-auto p-5">
          <SettingsDetailPanel
            identity={identity}
            mode={mode}
            onBack={() => setMode(null)}
            onIdentityChange={onIdentityChange}
          />

          <SettingsSection title="Account">
            <SettingsRow active={mode === "profile"} label="Change display name" detail={identity.displayName} onClick={() => setMode("profile")} />
            <SettingsRow active={mode === "profile"} label="Change username" detail="Limited changes" onClick={() => setMode("profile")} />
            <div className="border-b border-white/10 px-4 py-3 text-xs leading-5 text-slate-500">
              Username changes are limited to protect creator identity, buyer trust, and existing profile links.
            </div>
            <SettingsRow active={mode === "profile"} label="Change profile photo" onClick={() => setMode("profile")} />
            <SettingsRow active={mode === "profile"} label="Edit bio" detail={`${identity.bio.length}/160`} onClick={() => setMode("profile")} />
            <SettingsRow active={mode === "password"} label="Change password" onClick={() => setMode("password")} />
          </SettingsSection>

          <SettingsSection title="App / User">
            <SettingsRow active={mode === "download-history"} label="Download history" onClick={() => setMode("download-history")} />
            <SettingsRow active={mode === "purchase-history"} label="Purchase history" onClick={() => setMode("purchase-history")} />
            <SettingsRow active={mode === "notifications"} label="Notifications" onClick={() => setMode("notifications")} />
            <SettingsRow active={mode === "privacy"} label="Privacy settings" onClick={() => setMode("privacy")} />
            <SettingsRow active={mode === "support"} label="Help / Support" onClick={() => setMode("support")} />
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold text-rose-300 transition hover:bg-white/[0.035] hover:text-rose-200"
              >
                Logout
              </button>
            </form>
          </SettingsSection>

          <SettingsSection title="Creator">
            <SettingsRow
              label="Manage my reels/products"
              onClick={() => {
                onClose();
                window.location.assign("/creator/products");
              }}
            />
            <SettingsRow label="Payout / payment details" detail="Soon" disabled />
            <SettingsRow active={mode === "affiliate"} label="Affiliate settings" onClick={() => setMode("affiliate")} />
          </SettingsSection>

          <SettingsSection title="Legal">
            <Link
              href="/legal/terms"
              className="flex w-full items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/[0.035]"
            >
              Terms
            </Link>
            <Link
              href="/legal/privacy"
              className="flex w-full items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/[0.035]"
            >
              Privacy
            </Link>
            <Link
              href="/legal/refund"
              className="flex w-full items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/[0.035]"
            >
              Refund
            </Link>
            <Link
              href="/legal/seller-policy"
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/[0.035]"
            >
              Seller Policy
            </Link>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
