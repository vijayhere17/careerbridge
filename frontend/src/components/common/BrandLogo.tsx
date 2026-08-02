import { Link } from "@tanstack/react-router";

type BrandLogoProps = {
  /** visual size of the mark */
  size?: "sm" | "md" | "lg";
  /** show wordmark next to the image (hidden when false) */
  showWordmark?: boolean;
  /** wrap in a home link */
  asLink?: boolean;
  className?: string;
  /** force light/dark wordmark for colored headers */
  wordmarkClassName?: string;
};

const SIZE = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
} as const;

const WORDMARK = {
  sm: "text-sm",
  md: "text-base sm:text-lg",
  lg: "text-lg sm:text-xl",
} as const;

/**
 * Site brand mark — uses /logo.jpeg from frontend/public.
 * Drop your Oppverse logo at: frontend/public/logo.jpeg
 */
export function BrandLogo({
  size = "md",
  showWordmark = true,
  asLink = true,
  className = "",
  wordmarkClassName = "",
}: BrandLogoProps) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.jpeg"
        alt="Oppverse"
        className={`${SIZE[size]} shrink-0 rounded-xl object-contain bg-white shadow-sm ring-1 ring-black/5`}
      />
      {showWordmark && (
        <span
          className={`font-display font-bold tracking-tight leading-none ${WORDMARK[size]} ${wordmarkClassName}`}
        >
          <span className="text-[#003399]">Opp</span>
          <span className="text-[#0066FF]">verse</span>
        </span>
      )}
    </span>
  );

  if (!asLink) return content;

  return (
    <Link to="/" className="inline-flex items-center" aria-label="Oppverse home">
      {content}
    </Link>
  );
}
