// ---------------------------------------------------------------------------
// Tooltip — hover ⓘ icon that reveals help text
// HowTo  — static inline hint block with lightbulb icon
// ---------------------------------------------------------------------------

interface TooltipProps {
  /** The help text shown on hover */
  text: string;
  /** Position relative to the icon */
  position?: 'top' | 'bottom';
}

/**
 * Inline info-circle icon that shows a floating tooltip on hover / tap.
 * Pure CSS — no JS state. Works on mobile via focus-within.
 *
 * Usage: `<span>Label <Tooltip text="Explanation here" /></span>`
 */
export function Tooltip({ text, position = 'top' }: TooltipProps) {
  const isTop = position === 'top';

  return (
    <span className="group/tooltip relative ml-1 inline-flex cursor-help align-middle">
      {/* ⓘ icon */}
      <span
        tabIndex={0}
        role="img"
        aria-label={text}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[10px] font-semibold leading-none text-gray-400 transition hover:border-gray-400 hover:text-gray-500 focus:border-gray-400 focus:text-gray-500 focus:outline-none"
      >
        i
      </span>

      {/* Floating card */}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-50 w-64 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-lg transition-opacity duration-150 ${
          isTop ? 'bottom-full mb-2' : 'top-full mt-2'
        } invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100`}
      >
        {text}
        {/* Arrow */}
        <span
          className={`absolute left-1/2 -translate-x-1/2 border-[5px] border-transparent ${
            isTop
              ? 'top-full border-t-gray-900'
              : 'bottom-full border-b-gray-900'
          }`}
        />
      </span>
    </span>
  );
}

interface HowToProps {
  /** The guidance text */
  text: string;
  /** Optional extra classes */
  className?: string;
}

/**
 * Static inline hint block with a lightbulb icon.
 * Use for "what to do next" guidance.
 *
 * Usage: `<HowTo text="Start by adding a client..." />`
 */
export function HowTo({ text, className = '' }: HowToProps) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5 text-sm text-blue-700 ${className}`}
    >
      <svg
        className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
        />
      </svg>
      <span>{text}</span>
    </div>
  );
}
