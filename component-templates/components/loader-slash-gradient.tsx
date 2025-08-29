import React, {
  HTMLAttributes,
  JSX,
  ReactNode,
} from 'react';

import { cn } from '../lib/utils';

export type LoadSlashBarProps = {
  slashSize?: {
    x: number;
    y: number;
  };
  slashColors?: {
    primary: string;
    secondary: string;
  };
  rotate?: number;
  className?: string;
  containerClass?: string;
  progressClass?: string;
  elementClass?: string;
  value?: number;
  children?: ReactNode;
  slashWidth?: number;
} & HTMLAttributes<HTMLDivElement>;
/**
 * LoadSlashBar component renders a progress bar with a slash effect.
 * It accepts various props to customize the appearance and behavior of the bar.
 * @param {LoadSlashBarProps} props - Properties for customizing the LoadSlashBar component.
 * @returns {JSX.Element} Rendered LoadSlashBar component.
 */
export const LoaderSlashGradient: React.FC<LoadSlashBarProps> = ({
  slashColors = {primary: "#ffffff", secondary: "transparent"},
  slashSize = {x: 20, y: 10},
  className,
  containerClass = "bg-black",
  progressClass,
  elementClass,
  value = 0,
  rotate = 45,
  slashWidth = 100,
  children,
  ...props
}):JSX.Element => {
  return (
    <div
      {...props}
      className={cn("w-full h-2 relative rounded-full", containerClass)}
    >
      <div
        style={{
          width: `${value}%`,
        }}
        className={cn(
          "absolute z-[1] top-0 left-0 w-1/2 rounded-full h-full",
          progressClass
        )}
      ></div>
      <div
        style={{
          width: `${value}%`,
        }}
        className={cn(
          "absolute z-[3] top-0 left-0 w-1/2 flex items-center justify-end bg-transparent rounded-full h-full",
          elementClass
        )}
      >
        {children}
      </div>
      <div
        style={{
          width: `${slashWidth}%`,
          backgroundSize: `${slashSize?.x}px ${slashSize?.y}px`,
          backgroundImage: `linear-gradient(${rotate}deg, ${slashColors?.primary} 35%, ${slashColors?.secondary} 10%, ${slashColors?.secondary} 75%, ${slashColors?.primary} 75%, ${slashColors?.primary})`,
        }}
        className={cn(
          "absolute z-[2] top-0 left-0 h-full",
          !slashWidth && "w-full",
          className
        )}
      ></div>
    </div>
  );
};
