interface ReviewSpecChipsProps {
  specs: Record<string, unknown>;
}

function collectSpecLabels(specs: Record<string, unknown>): string[] {
  const labels = new Set<string>();

  if (typeof specs.brand === "string") {
    labels.add(specs.brand);
  }

  if (typeof specs.color === "string") {
    labels.add(specs.color);
  }

  if (Array.isArray(specs.features)) {
    for (const feature of specs.features.slice(0, 4)) {
      if (typeof feature === "string") {
        labels.add(feature);
      }
    }
  }

  return [...labels].slice(0, 6);
}

export function ReviewSpecChips({ specs }: ReviewSpecChipsProps) {
  const chips = collectSpecLabels(specs);

  if (chips.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Product highlights">
      {chips.map((chip) => (
        <li
          key={chip}
          className="rounded-full border border-[var(--review-accent)]/20 bg-[var(--review-accent)]/5 px-3 py-1 text-xs font-medium text-foreground"
        >
          {chip}
        </li>
      ))}
    </ul>
  );
}
