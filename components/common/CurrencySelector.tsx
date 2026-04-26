"use client";

import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/utils/currency";

interface CurrencySelectorProps {
  id?: string;
  label?: string;
  value: SupportedCurrency;
  onChange: (currency: SupportedCurrency) => void;
}

export function CurrencySelector({
  id = "display-currency",
  label = "Display currency",
  value,
  onChange,
}: CurrencySelectorProps) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
      <span>{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as SupportedCurrency)}
        className="h-9 rounded-xl border border-white/10 bg-slate-950 px-2 text-xs font-black text-white outline-none transition focus:border-cyan-300/55"
      >
        {SUPPORTED_CURRENCIES.map((currency) => (
          <option key={currency} value={currency}>
            {currency}
          </option>
        ))}
      </select>
    </label>
  );
}
