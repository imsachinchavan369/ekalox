"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useCreatorFollows } from "@/hooks/use-creator-follows";
import { useReelLikes } from "@/hooks/use-reel-likes";
import { getCreatorHref } from "@/lib/reels/creator-routing";
import { rankReelsFeed } from "@/lib/reels/feedRanking";
import {
  getLastFirstReelId,
  getRecentlySeenReelIds,
  rememberLastFirstReelId,
  rememberSeenReelId,
} from "@/lib/reels/seenReels";
import { DEFAULT_CURRENCY, normalizeCurrency, type SupportedCurrency } from "@/lib/utils/currency";

import { ReelActions } from "./reel/ReelActions";
import { ReelContainer, ReelSlide } from "./reel/ReelContainer";
import { ReelCTA } from "./reel/ReelCTA";
import { ReelHeader } from "./reel/ReelHeader";
import { ReelMeta } from "./reel/ReelMeta";
import { ReelOverlay } from "./reel/ReelOverlay";
import { ReelVideo } from "./reel/ReelVideo";

export interface PublicReelFeedItem {
  productId: string;
  title: string;
  caption: string | null;
  creatorProfileId: string;
  creatorFollowingCount: number;
  creatorName: string;
  ctaType: string;
  priceAmount?: number;
  priceCurrency?: string;
  priceCents?: number;
  currencyCode?: string;
  reelUrl: string | null;
  createdAt?: string;
  verificationStatus?: string;
  downloadsCount: number;
  likesCount?: number;
  viewsCount?: number;
  averageRating: number;
  ratingCount: number;
  reviewsCount: number;
}

interface PublicReelFeedProps {
  items: PublicReelFeedItem[];
}

function formatCompactCount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }

  return `${value}`;
}

function SoundFeedbackIcon({ isSoundOn, show }: { isSoundOn: boolean; show: boolean }) {
  return (
    <span
      className={`pointer-events-none absolute top-[42%] z-30 rounded-full bg-black/35 p-4 text-white/85 shadow-lg backdrop-blur-sm transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      {isSoundOn ? (
        <svg viewBox="0 0 24 24" className="h-8 w-8">
          <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" opacity=".95" />
          <path d="M16 8.5a5 5 0 0 1 0 7M18.4 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-8 w-8">
          <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" opacity=".95" />
          <path d="m16 9 5 5m0-5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        </svg>
      )}
    </span>
  );
}

export function PublicReelFeed({ items }: PublicReelFeedProps) {
  const [feedItems, setFeedItems] = useState(items);
  const [activeProductId, setActiveProductId] = useState<string | null>(items[0]?.productId ?? null);
  const [hasRankedFeed, setHasRankedFeed] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>(DEFAULT_CURRENCY);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [pausedProductId, setPausedProductId] = useState<string | null>(null);
  const [showSoundFeedback, setShowSoundFeedback] = useState(false);
  const [cartProductIds, setCartProductIds] = useState<Record<string, boolean>>({});
  const [reviewProductId, setReviewProductId] = useState<string | null>(null);
  const [shareProductId, setShareProductId] = useState<string | null>(null);

  const reelIds = useMemo(() => feedItems.map((item) => item.productId), [feedItems]);
  const creatorProfileIds = useMemo(() => feedItems.map((item) => item.creatorProfileId), [feedItems]);
  const { getLikeCount, isLiked, loginPrompt: likeLoginPrompt, toggleLike } = useReelLikes(reelIds);
  const {
    getFollowerCount,
    isFollowing,
    loginPrompt: followLoginPrompt,
    toggleFollow,
  } = useCreatorFollows(creatorProfileIds);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const slideRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const feedRef = useRef<HTMLUListElement | null>(null);
  const visibleRatiosRef = useRef<Record<string, number>>({});

  useEffect(() => {
    setDisplayCurrency(normalizeCurrency(window.localStorage.getItem("ekalox-display-currency")));
  }, []);

  useLayoutEffect(() => {
    const rankedItems = rankReelsFeed(items, {
      lastFirstReelId: getLastFirstReelId(),
      recentlySeenReelIds: getRecentlySeenReelIds(),
    });
    setFeedItems(rankedItems);
    setActiveProductId(rankedItems[0]?.productId ?? null);
    if (rankedItems[0]) {
      rememberLastFirstReelId(rankedItems[0].productId);
    }
    setHasRankedFeed(true);
  }, [items]);

  useEffect(() => {
    if (activeProductId && hasRankedFeed) {
      rememberSeenReelId(activeProductId);
    }
  }, [activeProductId, hasRankedFeed]);

  const handleDisplayCurrencyChange = (currency: SupportedCurrency) => {
    setDisplayCurrency(currency);
    window.localStorage.setItem("ekalox-display-currency", currency);
    window.dispatchEvent(new Event("ekalox:display-currency"));
  };

  useEffect(() => {
    if (feedItems.length === 0) {
      return;
    }

    visibleRatiosRef.current = {};

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.productId;
          if (!id) {
            continue;
          }

          visibleRatiosRef.current[id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        }

        let bestId: string | null = null;
        let bestRatio = 0;

        for (const item of feedItems) {
          const ratio = visibleRatiosRef.current[item.productId] ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = item.productId;
          }
        }

        setActiveProductId(bestRatio > 0 ? bestId : null);
      },
      {
        root: feedRef.current,
        threshold: [0, 0.25, 0.5, 0.75, 0.9, 1],
      },
    );

    for (const item of feedItems) {
      const element = slideRefs.current[item.productId];
      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, [feedItems]);

  useEffect(() => {
    setPausedProductId(null);
  }, [activeProductId]);

  useEffect(() => {
    if (!showSoundFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSoundFeedback(false);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [showSoundFeedback, isSoundOn]);

  useEffect(() => {
    for (const item of feedItems) {
      const video = videoRefs.current[item.productId];
      if (!video) {
        continue;
      }

      const isActive = item.productId === activeProductId;
      video.muted = !isSoundOn;

      if (isActive && pausedProductId !== item.productId) {
        void video.play().catch(() => {
          // Ignore autoplay failures; user can tap play.
        });
      } else if (isActive) {
        video.pause();
      } else {
        video.pause();
        video.currentTime = 0;
      }
    }
  }, [activeProductId, isSoundOn, feedItems, pausedProductId]);

  const togglePlayForActive = (productId: string) => {
    if (productId !== activeProductId) {
      return;
    }

    const activeVideo = videoRefs.current[productId];
    if (!activeVideo) {
      return;
    }

    if (activeVideo.paused) {
      setPausedProductId(null);
      void activeVideo.play().catch(() => {
        // Ignore autoplay failures; user can tap again.
      });
    } else {
      activeVideo.pause();
      setPausedProductId(productId);
    }
  };

  const toggleSound = () => {
    setIsSoundOn((current) => !current);
    setShowSoundFeedback(true);
  };

  const handleAddToCart = (productId: string) => {
    setCartProductIds((current) => ({ ...current, [productId]: true }));
    window.dispatchEvent(new CustomEvent("ekalox:add-to-cart", { detail: { productId } }));
  };

  const handleShare = (productId: string) => {
    setShareProductId(productId);
    const url = new URL(`/products/${productId}`, window.location.href).toString();

    if (navigator.share) {
      void navigator.share({ url }).catch(() => undefined);
      return;
    }

    void navigator.clipboard?.writeText(url);
  };

  if (feedItems.length === 0) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black px-4 text-center text-sm text-white/60">
        No reels yet
      </div>
    );
  }

  return (
    <>
      <ReelContainer containerRef={feedRef}>
      {feedItems.map((item) => {
        const isActive = item.productId === activeProductId;
        const isPaused = isActive && pausedProductId === item.productId;

        return (
          <ReelSlide
            key={item.productId}
            productId={item.productId}
            slideRef={(element) => {
              slideRefs.current[item.productId] = element;
            }}
          >
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black">
              {likeLoginPrompt || followLoginPrompt ? (
                <div className="pointer-events-none absolute left-1/2 top-16 z-40 -translate-x-1/2 rounded-full bg-black/55 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur">
                  {likeLoginPrompt || followLoginPrompt}
                </div>
              ) : null}

              <div className="absolute inset-0 bg-black" />

              <div className="relative h-full w-full overflow-hidden bg-black">
                {item.reelUrl ? (
                  <ReelVideo
                    videoRef={(element) => {
                      videoRefs.current[item.productId] = element;
                    }}
                    src={item.reelUrl}
                    muted={!isSoundOn}
                    autoPlay={isActive}
                    onPlay={() => {
                      if (!isActive) {
                        setActiveProductId(item.productId);
                      }
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-950 p-4 text-center text-sm text-white/55">
                    Reel unavailable right now.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => togglePlayForActive(item.productId)}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-transparent text-white"
                  aria-label={isPaused ? "Play reel" : "Pause reel"}
                >
                  <SoundFeedbackIcon isSoundOn={isSoundOn} show={isActive && showSoundFeedback} />
                  {isPaused ? (
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/45 shadow-lg backdrop-blur-sm">
                      <span className="ml-1 h-0 w-0 border-y-[12px] border-l-[18px] border-y-transparent border-l-white" />
                    </span>
                  ) : null}
                </button>

                <ReelOverlay>
                  <ReelHeader
                    creatorHref={getCreatorHref(item.creatorProfileId)}
                    creatorName={item.creatorName}
                    followerCount={formatCompactCount(getFollowerCount(item.creatorProfileId))}
                    isFollowing={isFollowing(item.creatorProfileId)}
                    isSoundOn={isSoundOn}
                    onFollowToggle={() => void toggleFollow(item.creatorProfileId)}
                    onSoundToggle={toggleSound}
                  />
                  <ReelActions
                    isCartActive={Boolean(cartProductIds[item.productId])}
                    isLiked={isLiked(item.productId)}
                    isReviewActive={reviewProductId === item.productId}
                    isShareActive={shareProductId === item.productId}
                    productId={item.productId}
                    likeCount={formatCompactCount(getLikeCount(item.productId))}
                    onLike={() => void toggleLike(item.productId)}
                    onAddToCart={() => handleAddToCart(item.productId)}
                    onReviewOpen={() => setReviewProductId(item.productId)}
                    reviewCount={formatCompactCount(item.reviewsCount)}
                    onShare={() => handleShare(item.productId)}
                  />
                  <div className="pointer-events-auto absolute inset-x-0 bottom-0 px-4 pb-[calc(9.2rem+env(safe-area-inset-bottom))] pr-[4.8rem] pt-16 min-[390px]:pr-[5.2rem]">
                    <ReelMeta
                      averageRating={item.averageRating}
                      caption={item.caption}
                      downloadsCount={item.downloadsCount}
                      productId={item.productId}
                      ratingCount={item.ratingCount}
                      title={item.title}
                    />
                    <div className="mt-4">
                    <ReelCTA
                      ctaType={item.ctaType}
                      currencyCode={item.priceCurrency ?? item.currencyCode}
                      displayCurrency={displayCurrency}
                      onDisplayCurrencyChange={handleDisplayCurrencyChange}
                      priceAmount={item.priceAmount}
                      priceCents={item.priceCents}
                      productId={item.productId}
                    />
                    </div>
                  </div>
                </ReelOverlay>
              </div>
            </div>
          </ReelSlide>
        );
      })}
      </ReelContainer>
    </>
  );
}
