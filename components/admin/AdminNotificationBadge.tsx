interface AdminNotificationBadgeProps {
  count: number;
}

export function AdminNotificationBadge({ count }: AdminNotificationBadgeProps) {
  return (
    <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-[10px] font-black text-cyan-100">
      {count}
    </span>
  );
}
