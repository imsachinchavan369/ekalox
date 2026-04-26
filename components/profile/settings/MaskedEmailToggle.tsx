"use client";

import { useMemo, useState } from "react";

function maskEmail(email: string) {
  const [name, domain] = email.split("@");

  if (!domain) {
    return email;
  }

  const prefix = name.slice(0, 2);
  const suffix = name.slice(-3);
  const hiddenCount = Math.max(8, name.length);

  return `${prefix}${"*".repeat(hiddenCount)}${suffix}@${domain}`;
}

interface MaskedEmailToggleProps {
  email: string | null;
}

export function MaskedEmailToggle({ email }: MaskedEmailToggleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const displayValue = useMemo(() => {
    if (!email) {
      return "";
    }

    return isVisible ? email : maskEmail(email);
  }, [email, isVisible]);

  if (!email) {
    return null;
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      <p className="min-w-0 truncate text-xs text-slate-500">{displayValue}</p>
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        className="shrink-0 text-[11px] font-semibold text-cyan-300 transition hover:text-cyan-200"
      >
        {isVisible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
