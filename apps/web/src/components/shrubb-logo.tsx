import Link from 'next/link';

/**
 * Shrubb text wordmark logo.
 * The sprouting-b icon is used only as the favicon, not in the nav.
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
  const textSizes = {
    small: 'text-lg',
    default: 'text-2xl',
    large: 'text-3xl',
  };

  return (
    <Link href={href} className={`${textSizes[size]} font-light tracking-wide ${textColor}`}>
      shrubb
    </Link>
  );
}
