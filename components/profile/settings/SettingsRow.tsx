interface SettingsRowProps {
  active?: boolean;
  detail?: string;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
}

export function SettingsRow({ active = false, detail, disabled = false, label, onClick }: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-left last:border-b-0 transition enabled:hover:bg-white/[0.035] disabled:cursor-not-allowed disabled:opacity-60 ${
        active ? "bg-cyan-300/[0.08]" : ""
      }`}
    >
      <span className="text-sm font-semibold text-white">{label}</span>
      {detail ? <span className="min-w-0 truncate text-right text-xs text-slate-500">{detail}</span> : null}
    </button>
  );
}
