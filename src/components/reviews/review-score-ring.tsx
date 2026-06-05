interface ReviewScoreRingProps {
  rating: number;
  label?: string;
}

export function ReviewScoreRing({ rating, label = "Our score" }: ReviewScoreRingProps) {
  const normalized = Math.min(Math.max(rating, 0), 5);
  const percentage = (normalized / 5) * 100;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="review-score-ring flex flex-col items-center gap-2"
      aria-label={`${label}: ${normalized.toFixed(1)} out of 5`}
    >
      <div className="relative size-28 sm:size-32">
        <svg
          viewBox="0 0 96 96"
          className="size-full -rotate-90"
          role="img"
          aria-hidden
        >
          <circle
            cx="48"
            cy="48"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-border/80"
          />
          <circle
            cx="48"
            cy="48"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-[var(--review-accent)] transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
            {normalized.toFixed(1)}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            / 5
          </span>
        </div>
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
