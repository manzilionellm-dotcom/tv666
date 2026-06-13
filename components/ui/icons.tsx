// The Few — Icônes au trait (stroke 1.8), currentColor. Sobres, 10-foot.

type P = { className?: string; size?: number };

function svg(path: React.ReactNode, { className = "", size = 22 }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {path}
    </svg>
  );
}

export const IconDirect = (p: P) =>
  svg(
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M8 21h8" />
    </>,
    p,
  );
export const IconFilms = (p: P) =>
  svg(
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4" />
    </>,
    p,
  );
export const IconSeries = (p: P) =>
  svg(
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M7 7l3-3M13 7l3-3" />
    </>,
    p,
  );
export const IconGuide = (p: P) =>
  svg(
    <>
      <rect x="3" y="4" width="7" height="7" rx="1.5" />
      <rect x="14" y="4" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="6" rx="1.5" />
      <rect x="14" y="14" width="7" height="6" rx="1.5" />
    </>,
    p,
  );
export const IconSearch = (p: P) =>
  svg(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>,
    p,
  );
export const IconMulti = (p: P) =>
  svg(
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </>,
    p,
  );
export const IconSettings = (p: P) =>
  svg(
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" />
    </>,
    p,
  );
export const IconTvBig = (p: P) =>
  svg(
    <>
      <rect x="2.5" y="5" width="19" height="13" rx="2" />
      <path d="M8 21h8M10 11l4 2-4 2v-4z" />
    </>,
    { ...p, size: p.size ?? 34 },
  );
