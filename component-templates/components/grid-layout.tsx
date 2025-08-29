"use client";
import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { twMerge } from 'tailwind-merge';

interface GridLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number;
  gap?: number;
  responsive?: boolean;
  className?: string;
  children?: React.ReactNode;
  breakpoints?: {
    minWidth: number;
    columns: number;
  }[];
  mode?: "window" | "container";
}

export const GridLayout: React.FC<GridLayoutProps> = ({
  columns = 3,
  gap = 4,
  responsive = true,
  breakpoints,
  className,
  children,
  mode = "window",
  ...props
}) => {
  const [currentColumns, setCurrentColumns] = useState(columns);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateColumns = () => {
      if (responsive && breakpoints) {
        const width =
          mode === "container" && contentRef.current
            ? contentRef.current.offsetWidth
            : window.innerWidth;

        const sorted = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth);
        const match = sorted.find((bp) => width >= bp.minWidth);
        setCurrentColumns(match ? match.columns : columns);
      }
    };

    updateColumns(); // initial
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, [responsive, breakpoints, columns, mode]);

  return (
    <div
      ref={contentRef}
      style={{
        gridTemplateColumns: `repeat(${currentColumns}, minmax(0, 1fr))`,
        display: "grid",
        gap: `${gap}px`,
      }}
      className={twMerge(`w-full`, className)}
      {...props}
    >
      {children}
    </div>
  );
};
