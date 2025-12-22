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
    classNames?: {
        container?: string;
        label?: string;
        indicator?: string;
    };
    indicator?: ReactNode;
}

export const Breadcrumbs: React.FC<BreadcrumbProps> = ({ items, indicator, classNames }) => {
    return (
        <nav className={cn("text-muted-foreground flex items-center space-x-1 text-sm", classNames?.container)} aria-label="Breadcrumb">
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {index !== 0 && indicator && <ChevronRight className={cn("text-muted-foreground h-4 w-4", classNames?.indicator)} />}
                    {item.href && !item.isCurrent && item.as === "link" ? (
                        <Link href={item.href} className={cn("hover:text-foreground transition-colors", classNames?.label)}>
                            {item.label}
                        </Link>
                    ) : item.href && !item.isCurrent && item.as === "a" ? (
                        <a href={item.href} className={cn("hover:text-foreground transition-colors", classNames?.label)}>
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