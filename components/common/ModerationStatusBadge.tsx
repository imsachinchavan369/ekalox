interface ModerationStatusBadgeProps {
  status?: string | null;
}

const statusMap: Record<string, string> = {
  clean: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  flagged: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  removed: "border-rose-300/30 bg-rose-300/10 text-rose-100",
  under_review: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  unverified: "border-white/15 bg-white/[0.05] text-slate-300",
  verified: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  verification_rejected: "border-white/15 bg-white/[0.05] text-slate-300",
  verification_requested: "border-amber-300/30 bg-amber-300/10 text-amber-100",
};

function getLabel(status?: string | null) {
  if (!status) {
    return "";
  }

  return status.replace(/_/g, " ");
}

export function ModerationStatusBadge({ status }: ModerationStatusBadgeProps) {
  if (!status) {
    return null;
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusMap[status] || statusMap.unverified}`}>
      {getLabel(status)}
    </span>
  );
}
