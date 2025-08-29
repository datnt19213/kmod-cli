// import {cn} from "@/lib/utils";
// import React from "react";

// type ProgressCircleProps = {
//   dashCount: number;
//   dashColor?: string;
//   dashBorderColor?: string;
//   dashBorderWidth?: number;
//   strokeWidth?: number;
//   radius?: number;
//   gapLength?: number;
//   dashColorList?: string[];
//   angle?: any;
//   className?: string;
//   pathClass?: string;
// };

// export const ProgressCircle: React.FC<ProgressCircleProps> = ({
//   dashCount,
//   dashColor = "black",
//   dashBorderColor = "white",
//   dashBorderWidth = 0,
//   strokeWidth = 4,
//   radius = 24,
//   gapLength = 7,
//   dashColorList = [],
//   angle = -83,
//   className,
//   pathClass,
// }) => {
//   const circumference = 2 * Math.PI * radius;

//   const totalGapLength = gapLength * dashCount;
//   const totalDashLength = circumference - totalGapLength;

//   const dashLength = totalDashLength / dashCount;
//   const anglePerDash = (dashLength / circumference) * 360;

//   const polarToCartesian = (
//     cx: number,
//     cy: number,
//     r: number,
//     angle: number
//   ) => {
//     const rad = (angle * Math.PI) / 180;
//     return {
//       x: cx + r * Math.cos(rad),
//       y: cy + r * Math.sin(rad),
//     };
//   };

//   const dashes = [];
//   let currentAngle = angle;

//   for (let i = 0; i < dashCount; i++) {
//     const startAngle = currentAngle;
//     const endAngle = startAngle + anglePerDash;

//     const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

//     const start = polarToCartesian(
//       radius + strokeWidth,
//       radius + strokeWidth,
//       radius,
//       startAngle
//     );
//     const end = polarToCartesian(
//       radius + strokeWidth,
//       radius + strokeWidth,
//       radius,
//       endAngle
//     );

//     dashes.push(
//       <path
//         className={cn(pathClass)}
//         key={i}
//         d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`}
//         fill="none"
//         stroke={dashColorList[i] || dashColor}
//         strokeWidth={strokeWidth}
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         style={{
//           strokeWidth: dashBorderWidth > 0 ? dashBorderWidth : strokeWidth,
//         }}
//       />
//     );

//     currentAngle = endAngle + (gapLength / circumference) * 360;
//   }

//   return (
//     <svg
//       className={cn(className)}
//       height={radius * 2 + strokeWidth * 2}
//       width={radius * 2 + strokeWidth * 2}
//     >
//       {dashes}
//     </svg>
//   );
// };

import React from 'react';

import { cn } from '../lib/utils';

export type SegmentCircleProps = {
  dashCount: number;
  colors?: string[]; // list of colors for each dash
  color?: string; // fallback color if colors array is not provided
  radius?: number;
  strokeWidth?: number;
  gapLength?: number;
  startAngle?: number;
  borderWidth?: number;
  borderColor?: string;
  className?: string;
  pathClass?: string;
  animate?: boolean; // animation rotation
  speed?: number; // animation speed (s)
};

/**
 * SegmentCircle component renders a circle with dashes (segments).
 * It accepts various props to customize the appearance and behavior of the circle.
 * @param {SegmentCircleProps} props - Properties for customizing the SegmentCircle component.
 * @returns {JSX.Element} Rendered SegmentCircle component.
 */
/**
 * SegmentCircleProps:
 * - dashCount: number of dashes (segments)
 * - colors: list of colors for each dash (fallbacks to color if not provided)
 * - color: fallback color if colors array is not provided
 * - radius: radius of the circle
 * - strokeWidth: stroke width of the dashes
 * - gapLength: length of the gap between dashes
 * - startAngle: starting angle of the first dash
 * - borderWidth: border width (if needed)
 * - borderColor: border color (if needed)
 * - className: class name for the container element
 * - pathClass: class name for each dash path
 * - animate: whether to animate the rotation of the circle
 * - speed: animation speed (seconds)
 */
export const SegmentCircle: React.FC<SegmentCircleProps> = ({
  dashCount,
  colors = [],
  color = "black",
  radius = 24,
  strokeWidth = 4,
  gapLength = 7,
  startAngle = -90,
  borderWidth = 0,
  borderColor = "white",
  className,
  pathClass,
  animate = false,
  speed = 2,
}) => {
  const circumference = 2 * Math.PI * radius;
  const totalGapLength = gapLength * dashCount;
  const totalDashLength = circumference - totalGapLength;
  const dashLength = totalDashLength / dashCount;
  const anglePerDash = (dashLength / circumference) * 360;

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const dashes: React.ReactNode[] = [];
  let currentAngle = startAngle;

  for (let i = 0; i < dashCount; i++) {
    const start = polarToCartesian(radius, radius, radius, currentAngle);
    const end = polarToCartesian(radius, radius, radius, currentAngle + anglePerDash);
    const largeArcFlag = anglePerDash > 180 ? 1 : 0;

    // border (if needed)
    if (borderWidth > 0) {
      dashes.push(
        <path
          key={`border-${i}`}
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`}
          fill="none"
          stroke={borderColor}
          strokeWidth={strokeWidth + borderWidth * 2}
          strokeLinecap="round"
        />
      );
    }

    // main dash
    dashes.push(
      <path
        className={cn(pathClass)}
        key={i}
        d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`}
        fill="none"
        stroke={colors[i] || color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    );

    currentAngle += anglePerDash + (gapLength / circumference) * 360;
  }

  return (
    <svg
      className={cn(className)}
      viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      width={radius * 2}
      height={radius * 2}
      style={
        animate
          ? { animation: `spin ${speed}s linear infinite` }
          : undefined
      }
    >
      {dashes}
      {animate && (
        <style>{`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}</style>
      )}
    </svg>
  );
};
