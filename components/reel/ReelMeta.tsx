"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface ReelMetaProps {
  averageRating: number;
  caption: string | null;
  downloadsCount: number;
  productId: string;
  ratingCount: number;
  title: string;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        d="m12 3 2.6 5.7 6.2.7-4.6 4.2 1.2 6.1-5.4-3.1-5.4 3.1 1.2-6.1-4.6-4.2 6.2-.7L12 3Z"
        fill={filled ? "#FFD700" : "none"}
        stroke={filled ? "#FFD700" : "rgba(255,255,255,0.5)"}
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function StarRating({ rating, ratingCount }: { rating: number; ratingCount: number }) {
  const filledStars = ratingCount > 0 ? Math.min(Math.max(Math.round(rating), 0), 5) : 0;

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon key={index} filled={index < filledStars} />
      ))}
    </span>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M12 4v9m0 0 3.5-3.5M12 13 8.5 9.5M5 18h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function formatDownloads(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k downloads`;
  }

  return `${value} downloads`;
}

function ReelDescription({ caption, productId }: { caption: string; productId: string }) {
  const containerRef = useRef<HTMLAnchorElement | null>(null);
  const measureRef = useRef<HTMLSpanElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const containerElement = containerRef.current;
    const measureElement = measureRef.current;
    if (!containerElement || !measureElement) {
      return;
    }

    const updateOverflow = () => {
      setIsOverflowing(measureElement.scrollWidth > containerElement.clientWidth + 1);
    };

    updateOverflow();

    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(containerElement);
    window.addEventListener("resize", updateOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, [caption]);

  return (
    <Link
      ref={containerRef}
      href={`/products/${productId}`}
      className="relative mb-1.5 flex max-w-full items-center overflow-hidden whitespace-nowrap text-sm font-medium leading-5 text-white/85 transition hover:text-white"
    >
      <span ref={measureRef} className="pointer-events-none absolute invisible whitespace-nowrap">
        {caption}
      </span>
      <span className="min-w-0 truncate">
        {caption}
      </span>
      {isOverflowing ? <span className="shrink-0 pl-1 text-white">... more</span> : null}
    </Link>
  );
}

export function ReelMeta({ averageRating, caption, downloadsCount, productId, ratingCount, title }: ReelMetaProps) {
  const ratingLabel = ratingCount > 0 ? averageRating.toFixed(1) : "No ratings";

  return (
    <div>
      <h2 className="mb-1 line-clamp-2 text-[20px] font-bold leading-[1.08] text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.9)] min-[390px]:text-[22px]">
        {title}
      </h2>
      {caption ? <ReelDescription caption={caption} productId={productId} /> : null}
      <Link
        href={`/products/${productId}`}
        className="mb-2.5 inline-flex max-w-full items-center gap-1.5 truncate text-[13px] font-normal text-white transition hover:text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]"
      >
        <span className="inline-flex items-center gap-1">
          <StarRating rating={averageRating} ratingCount={ratingCount} />
          <span>{ratingLabel}</span>
        </span>
        <span className="text-white/58">&bull;</span>
        <span className="inline-flex min-w-0 items-center gap-1 truncate">
          <DownloadIcon />
          {formatDownloads(downloadsCount)}
        </span>
      </Link>
    </div>
  );
}
