import ReactMarkdown from "react-markdown";

import { ReviewFigure } from "@/components/reviews/review-figure";
import { slugifyHeading } from "@/lib/reviews/markdown-utils";

interface ReviewMarkdownContentProps {
  content: string;
}

export function ReviewMarkdownContent({ content }: ReviewMarkdownContentProps) {
  return (
    <div className="review-prose">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h2 className="review-prose-h2">{children}</h2>
          ),
          h2: ({ children }) => {
            const text = String(children);
            const id = slugifyHeading(text);

            return (
              <h2 id={id} className="review-prose-h2 scroll-mt-28 lg:scroll-mt-32">
                {children}
              </h2>
            );
          },
          h3: ({ children }) => (
            <h3 className="review-prose-h3">{children}</h3>
          ),
          p: ({ children, node }) => {
            const hasImage = node?.children?.some(
              (child) =>
                typeof child === "object" &&
                child !== null &&
                "tagName" in child &&
                child.tagName === "img",
            );

            if (hasImage) {
              return <div className="review-prose-media">{children}</div>;
            }

            return <p className="review-prose-p">{children}</p>;
          },
          ul: ({ children }) => (
            <ul className="review-prose-ul">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="review-prose-ol">{children}</ol>
          ),
          li: ({ children }) => <li className="review-prose-li">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          img: ({ src, alt, title }) => (
            <ReviewFigure
              src={typeof src === "string" ? src : ""}
              alt={alt ?? ""}
              caption={title ?? alt ?? ""}
            />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium text-[var(--review-accent)] underline-offset-4 hover:underline"
              rel="nofollow sponsored noopener"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
