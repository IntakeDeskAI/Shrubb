import Link from 'next/link';

/**
 * The Shrubb sprouting-b icon mark.
 * Recreated as inline SVG from the brand asset (b-icon-01.png).
 */
export function ShrubbIcon({ className = 'h-8 w-8', color = '#15803d' }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 120" fill="none">
      {/* Stem */}
      <line x1="38" y1="12" x2="38" y2="72" stroke={color} strokeWidth="6" strokeLinecap="round" />
      {/* Circle of the b */}
      <circle cx="58" cy="82" r="28" stroke={color} strokeWidth="6" fill="none" />
      {/* Connection from stem to circle */}
      <path d="M38 72 Q38 54 58 54" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* Left leaf */}
      <path d="M30 30 Q22 8 38 6 Q38 22 30 30Z" fill={color} />
      {/* Right leaf */}
      <path d="M42 24 Q48 2 60 10 Q50 26 42 24Z" fill={color} />
    </svg>
  );
}

/**
 * Full Shrubb logo — wordmark + icon.
 * Matches the original shrubb.com branding.
 */
export function ShrubbLogo({
  size = 'default',
  color = 'green',
  href = '/',
}: {
  size?: 'small' | 'default' | 'large';
  color?: 'green' | 'white';
  href?: string;
}) {
  const textColor = color === 'white' ? 'text-white' : 'text-brand-700';
  const iconColor = color === 'white' ? '#ffffff' : '#15803d';
  const textSizes = {
    small: 'text-lg',
    default: 'text-2xl',
    large: 'text-3xl',
  };
  const iconSizes = {
    small: 'h-5 w-5',
    default: 'h-6 w-6',
    large: 'h-8 w-8',
  };

  return (
    <Link href={href} className={`inline-flex items-end gap-0.5 ${textColor}`}>
      <span className={`${textSizes[size]} font-light tracking-wide`}>shrubb</span>
      <ShrubbIcon className={`${iconSizes[size]} mb-1`} color={iconColor} />
    </Link>
  );
}
