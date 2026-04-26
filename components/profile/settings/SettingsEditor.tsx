"use client";

import { useState } from "react";

import type { ProfileIdentity } from "@/components/profile/types";

interface SettingsEditorProps {
  identity: ProfileIdentity;
  mode: "profile" | "password" | "notifications" | "privacy" | "support" | "download-history" | "purchase-history" | "affiliate";
  onIdentityChange: (identity: ProfileIdentity) => void;
}

function getTitle(mode: SettingsEditorProps["mode"]) {
  const titles = {
    affiliate: "Affiliate settings",
    "download-history": "Download history",
    notifications: "Notifications settings",
    password: "Change password",
    "purchase-history": "Purchase history",
    privacy: "Privacy settings",
    profile: "Account details",
    support: "Help / Support",
  };

  return titles[mode];
}

export function SettingsEditor({ identity, mode, onIdentityChange }: SettingsEditorProps) {
  const [displayName, setDisplayName] = useState(identity.displayName);
  const [username, setUsername] = useState(identity.username);
  const [bio, setBio] = useState(identity.bio);
  const [avatarUrl, setAvatarUrl] = useState(identity.avatarUrl ?? "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const saveProfile = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile/settings", {
        body: JSON.stringify({ avatarUrl, bio, displayName, password: mode === "password" ? password : "", username }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; identity?: ProfileIdentity };

      if (!response.ok || !payload.identity) {
        setMessage(payload.error || "Settings could not be saved.");
        return;
      }

      onIdentityChange(payload.identity);
      setPassword("");
      setMessage("Saved");
    } catch {
      setMessage("Settings could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === "profile" || mode === "password") {
    return (
      <div>
        <div className="grid gap-3">
          {mode === "profile" ? (
            <>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">Display name</span>
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/45" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">Username</span>
                <input value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/45" />
              </label>
              <p className="text-xs leading-5 text-slate-500">
                Username changes are limited to protect creator identity, buyer trust, and profile links.
              </p>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">Profile photo URL</span>
                <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/45" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">Bio</span>
                <textarea value={bio} maxLength={160} onChange={(event) => setBio(event.target.value)} className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none focus:border-cyan-300/45" />
              </label>
              <p className="text-right text-xs text-slate-500">{bio.length}/160</p>
            </>
          ) : (
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-400">New password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/45" />
            </label>
          )}
          <button type="button" onClick={saveProfile} disabled={isSaving} className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-70">
            {isSaving ? "Saving..." : "Save"}
          </button>
          {message ? <p className="text-xs font-semibold text-cyan-200">{message}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        This setting is active in the profile architecture and ready for detailed controls as the backend expands.
      </p>
    </div>
  );
}
