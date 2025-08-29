import React from 'react';

export type CircleStrokeProps = {
  radius?: number;
  strokeColor?: string;
  strokeWidth?: number;
  dashCount?: number; // dash count
  gapLength?: number; // dash gap length 
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "miter" | "round" | "bevel";
  fill?: string;
  className?: string;
  style?: React.CSSProperties;
  cx?: number;
  cy?: number;
} & React.HTMLAttributes<SVGElement>;

export const CircleStroke: React.FC<CircleStrokeProps> = ({
  radius = 40,
  strokeWidth = 5,
  strokeColor = "black",
  dashCount = 12,
  gapLength = 5,
  strokeLinecap = "round",
  strokeLinejoin = "round",
  fill = "transparent",
  cx = 50,
  cy = 50,
  className,
  style,
  ...props
}) => {
  const circumference = 2 * Math.PI * radius;
  const dashLength = (circumference - dashCount * gapLength) / dashCount;

  return (
    <svg
      height={(radius + strokeWidth) * 2}
      width={(radius + strokeWidth) * 2}
      className={className}
      style={style}
      {...props}
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill={fill}
        strokeDasharray={`${dashLength} ${gapLength}`}
        strokeLinecap={strokeLinecap}
        strokeLinejoin={strokeLinejoin}
      />
    </svg>
  );
};
