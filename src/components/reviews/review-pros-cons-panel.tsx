import { Minus, Plus } from "lucide-react";

interface ReviewProsConsPanelProps {
  pros: string[];
  cons: string[];
}

export function ReviewProsConsPanel({ pros, cons }: ReviewProsConsPanelProps) {
  return (
    <section
      aria-labelledby="verdict-heading"
      className="review-verdict grid gap-4 sm:grid-cols-2"
    >
      <h2 id="verdict-heading" className="sr-only">
        Quick verdict
      </h2>

      <div className="review-verdict-card review-verdict-pro rounded-2xl border p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Plus className="size-4" aria-hidden />
          </span>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
            What we like
          </h3>
        </div>
        <ul className="space-y-3">
          {pros.map((item) => (
            <li
              key={item}
              className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
            >
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="review-verdict-card review-verdict-con rounded-2xl border p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Minus className="size-4" aria-hidden />
          </span>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
            Room for improvement
          </h3>
        </div>
        <ul className="space-y-3">
          {cons.map((item) => (
            <li
              key={item}
              className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
            >
              <span
                className="mt-2 size-1.5 shrink-0 rounded-full bg-rose-500"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
