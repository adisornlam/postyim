interface ReviewFigureProps {
  src: string;
  alt: string;
  caption?: string;
}

export function ReviewFigure({ src, alt, caption }: ReviewFigureProps) {
  const label = caption ?? alt;
  const figureId = label ? `figure-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48)}` : undefined;

  return (
    <figure
      id={figureId}
      className="review-figure my-8 overflow-hidden rounded-2xl border bg-card"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="aspect-[16/10] w-full object-cover"
      />
      {label ? (
        <figcaption className="border-t px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {label}
        </figcaption>
      ) : null}
    </figure>
  );
}
