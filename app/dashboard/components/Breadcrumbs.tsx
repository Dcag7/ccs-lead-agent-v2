'use client';

import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Shared breadcrumb component with consistent styling.
 * Uses chevron style "›" separator (same as Ops Portal).
 */
export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="text-sm text-gray-500 mb-2">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <span key={index}>
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-gray-700">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-gray-900 font-medium' : ''}>
                {item.label}
              </span>
            )}
            {!isLast && (
              <span className="mx-2" aria-hidden="true">›</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
