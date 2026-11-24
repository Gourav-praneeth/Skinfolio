export function BrandMark({
  size = "md",
  subtitle,
  tone = "dark",
}: {
  size?: "sm" | "md" | "lg";
  subtitle?: string;
  tone?: "dark" | "light";
}) {
  const title =
    size === "lg" ? "text-5xl sm:text-6xl" : size === "sm" ? "text-2xl" : "text-3xl";
  const light = tone === "light";

  return (
    <div className="animate-rise">
      <div className="mb-2 inline-flex items-center gap-2">
        <span
          aria-hidden
          className={`animate-drift grid h-9 w-9 place-items-center rounded-2xl shadow-[var(--shadow)] ${
            light
              ? "bg-[rgba(255,250,245,0.92)] text-[var(--brand)]"
              : "bg-[var(--brand)] text-[var(--surface-solid)]"
          }`}
        >
          <Leaf />
        </span>
        <span
          className={`text-xs font-semibold uppercase tracking-[0.22em] ${
            light ? "text-[rgba(255,250,245,0.85)]" : "text-[var(--brand)]"
          }`}
        >
          Personal coach + journal
        </span>
      </div>
      <h1
        className={`font-display ${title} leading-[0.95] tracking-tight ${
          light ? "text-[#fffaf5]" : "text-[var(--brand-deep)]"
        }`}
      >
        Skinfolio
      </h1>
      {subtitle ? (
        <p
          className={`mt-3 max-w-md animate-rise-delay ${
            light ? "text-[rgba(255,250,245,0.88)]" : "text-[var(--ink-soft)]"
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function Leaf() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 14c6-9 14-9 14-9s2 10-6 14c-4 2-7 1-8-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8 16c3-3 7-6 11-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
