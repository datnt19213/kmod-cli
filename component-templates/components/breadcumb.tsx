// components/Breadcrumb.tsx
import React, { ReactNode } from 'react';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { cn } from '../lib/utils';

type BreadcrumbItem = {
  label: ReactNode;
  as?: "link" | "a";
  href?: string;
  isCurrent?: boolean;
};

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav className={cn("text-muted-foreground flex items-center space-x-1 text-sm", className)} aria-label="Breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index !== 0 && <ChevronRight className="text-muted-foreground h-4 w-4" />}
          {item.href && !item.isCurrent && item.as === "link" ? (
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </Link>
          ) : item.href && !item.isCurrent && item.as === "a" ? (
            <a href={item.href} className="hover:text-foreground transition-colors">
              {item.label}
            </a>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
