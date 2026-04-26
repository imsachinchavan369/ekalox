"use client";

interface ProductVisibilityToggleProps {
  onChange: (value: "public" | "private") => void;
  value: "public" | "private";
}

export function ProductVisibilityToggle({ onChange, value }: ProductVisibilityToggleProps) {
  return (
    <div className="flex rounded-full bg-black/18 p-1">
      {(["public", "private"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`min-h-10 flex-1 rounded-full px-4 text-xs font-black uppercase tracking-wide transition ${
            value === option ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/8 hover:text-white"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
