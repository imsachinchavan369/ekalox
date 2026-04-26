interface VerifiedByEkaloxBadgeProps {
  className?: string;
}

export function VerifiedByEkaloxBadge({ className = "" }: VerifiedByEkaloxBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-100 ${className}`}>
      <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
        <path d="m12 3 2.4 4.8 5.3.8-3.8 3.8.9 5.3L12 15.8 7.2 18l.9-5.3L4.3 8.6l5.3-.8L12 3Z" fill="currentColor" />
      </svg>
      Verified by EKALOX
    </span>
  );
}
