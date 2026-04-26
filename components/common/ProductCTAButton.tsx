import Link from "next/link";

interface ProductCTAButtonProps {
  className?: string;
  ctaType: string;
  href: string;
  label?: string;
  size?: "sm" | "md";
}

export function getProductCtaLabel(ctaType: string) {
  if (ctaType === "free") {
    return "View Details";
  }

  if (ctaType === "external") {
    return "View Details";
  }

  return "View Details";
}

export function ProductCTAButton({ className = "", ctaType, href, label, size = "md" }: ProductCTAButtonProps) {
  const sizeClass =
    size === "sm"
      ? "min-h-9 px-3.5 py-2 text-[11px] sm:text-xs"
      : "min-h-11 px-5 py-2.5 text-sm";

  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#23d3ee,#0b74f1)] font-black tracking-wide text-white shadow-[0_8px_22px_rgba(14,116,241,0.24)] transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-95 ${sizeClass} ${className}`}
    >
      {label || getProductCtaLabel(ctaType)}
    </Link>
  );
}
