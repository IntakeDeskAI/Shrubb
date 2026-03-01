import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function ChevronSeparator() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm text-gray-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.label} className="flex items-center gap-2">
              {index > 0 && <ChevronSeparator />}
              {isLast ? (
                <span aria-current="page" className="text-gray-900">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href!}
                  className="transition-colors hover:text-brand-600"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
