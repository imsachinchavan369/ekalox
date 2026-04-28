import Link from "next/link";
import type { ReactNode } from "react";

interface ReelActionsProps {
  isCartActive: boolean;
  isLiked: boolean;
  isReviewActive: boolean;
  isShareActive: boolean;
  likeCount: string;
  onLike: () => void;
  onReviewOpen: () => void;
  productId: string;
  onAddToCart: () => void;
  reviewCount: string;
  onShare: () => void;
}

interface ActionButtonProps {
  active?: boolean;
  label: string;
  children: ReactNode;
  count?: string;
  href?: string;
  emphasis?: boolean;
  tone?: "like" | "brand";
  onClick?: () => void;
}

function ActionButton({ active, label, children, count, emphasis, href, tone = "brand", onClick }: ActionButtonProps) {
  const activeToneClass = tone === "like" ? "text-rose-400" : "text-cyan-100";
  const className = `flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-black/35 shadow-[0_8px_20px_rgba(0,0,0,0.24)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/[0.08] active:scale-95 ${
    active
      ? emphasis
        ? "bg-cyan-300/20 text-cyan-100 shadow-[0_0_22px_rgba(103,232,249,0.28)]"
        : activeToneClass
      : emphasis
        ? "text-white/90 drop-shadow-lg"
        : "text-white/90 drop-shadow-lg"
  }`;

  const button = href ? (
      <Link href={href} onClick={onClick} aria-label={label} title={label} className={className}>
        {children}
      </Link>
    ) : (
      <button type="button" onClick={onClick} aria-label={label} title={label} className={className}>
        {children}
      </button>
    );

  return (
    <div className="flex flex-col items-center gap-1">
      {button}
      {count ? <span className="text-[11px] font-bold leading-none text-white/88 drop-shadow">{count}</span> : null}
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-6 w-6 ${filled ? "scale-110" : ""} transition-transform`} aria-hidden="true">
      <path
        d="M12 20s-7-4.4-7-10.2C5 6.8 6.9 5 9.3 5c1.4 0 2.4.7 2.7 1.3C12.3 5.7 13.3 5 14.7 5 17.1 5 19 6.8 19 9.8 19 15.6 12 20 12 20Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function VerifiedReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path d="m12 3 2.2 1.8 2.8-.2.8 2.7 2.3 1.6-1.1 2.6.8 2.7-2.6 1.2-1.2 2.6-2.7-.8-2.6 1.1-1.6-2.3-2.7-.8.2-2.8L4 10l2.6-1.3.8-2.7 2.8.2L12 3Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="m8.8 12 2.1 2.1 4.4-4.7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path d="M8.5 12.7 15.5 16m0-8L8.5 11.3M18 8.5a2.5 2.5 0 1 0-2.5-2.5A2.5 2.5 0 0 0 18 8.5ZM6 14.5A2.5 2.5 0 1 0 3.5 12 2.5 2.5 0 0 0 6 14.5Zm12 5A2.5 2.5 0 1 0 15.5 17a2.5 2.5 0 0 0 2.5 2.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <path d="M4 5h2l1.5 9h8.8l1.7-6.5H7.1M9 19.5h.1m6.9 0h.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function ReelActions({
  isCartActive,
  isLiked,
  isReviewActive,
  isShareActive,
  likeCount,
  onLike,
  onReviewOpen,
  productId,
  onAddToCart,
  reviewCount,
  onShare,
}: ReelActionsProps) {
  return (
    <div className="pointer-events-auto absolute right-3 top-1/2 flex -translate-y-1/2 flex-col items-center gap-4 min-[390px]:right-4">
      <ActionButton active={isLiked} label="Like product" count={likeCount} tone="like" onClick={onLike}>
        <HeartIcon filled={isLiked} />
      </ActionButton>
      <ActionButton
        active={isReviewActive}
        label="Verified reviews"
        count={reviewCount}
        href={`/products/${productId}#reviews`}
        onClick={onReviewOpen}
      >
        <VerifiedReviewIcon />
      </ActionButton>
      <ActionButton active={isShareActive} label="Share product" onClick={onShare}>
        <ShareIcon />
      </ActionButton>
      <ActionButton active={isCartActive} label="Add to cart" emphasis onClick={onAddToCart}>
        <CartIcon />
      </ActionButton>
    </div>
  );
}
