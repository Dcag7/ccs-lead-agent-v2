'use client';

import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  /** Maximum width of the container. Defaults to "95rem" to match Companies page. */
  maxWidth?: string;
  /** Additional className for customization */
  className?: string;
}

/**
 * Shared page container component for consistent max-width across pages.
 * Matches the Companies page layout (max-w-[95rem]).
 */
export default function PageContainer({
  children,
  maxWidth = '95rem',
  className = '',
}: PageContainerProps) {
  return (
    <div className={`p-6 lg:p-8 ${className}`}>
      <div className="mx-auto" style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}
