interface RatingStarsProps {
  rating: number;
  sizeClassName?: string;
}

function clampRating(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 5);
}

export function RatingStars({ rating, sizeClassName = "h-3.5 w-3.5" }: RatingStarsProps) {
  const normalizedRating = clampRating(rating);

  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => {
        const fillPercentage = Math.min(Math.max(normalizedRating - index, 0), 1) * 100;

        return (
          <span key={index} className={`relative inline-flex ${sizeClassName}`}>
            <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full text-white/78">
              <path
                d="m12 3 2.6 5.7 6.2.7-4.6 4.2 1.2 6.1-5.4-3.1-5.4 3.1 1.2-6.1-4.6-4.2 6.2-.7L12 3Z"
                fill="none"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage}%` }}>
              <svg viewBox="0 0 24 24" className="h-full w-full text-emerald-300">
                <path
                  d="m12 3 2.6 5.7 6.2.7-4.6 4.2 1.2 6.1-5.4-3.1-5.4 3.1 1.2-6.1-4.6-4.2 6.2-.7L12 3Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </span>
        );
      })}
    </span>
  );
}
