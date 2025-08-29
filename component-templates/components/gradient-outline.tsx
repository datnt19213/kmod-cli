// "use client";
// import React, {FC, HTMLAttributes, useState, useEffect, useRef} from "react";

// type GradientOutlineProps = {
//   children: React.ReactNode;
//   strokeWidth?: number;
//   borderRadius?: number;
//   gradientColors?: string[];
//   hoverGradientColors?: string[];
//   gradientAngle?: number;
//   allowHover?: boolean;
//   className?: string;
//   id: string;
//   onClick?: () => void;
// } & HTMLAttributes<HTMLDivElement>;

// const GradientOutline: FC<GradientOutlineProps> = ({
//   children,
//   id,
//   allowHover = true,
//   strokeWidth = 1,
//   borderRadius = 16,
//   hoverGradientColors = ["#E6CAA4", "#E9B84E"],
//   gradientColors = [
//     "rgba(255, 255, 255, 0.08)",
//     "rgba(255, 255, 255, 0.4)",
//     "rgba(255, 255, 255, 0)",
//     "rgba(255, 255, 255, 0)",
//     "rgba(255, 255, 255, 0.1)",
//   ],
//   gradientAngle = 45,
//   className = "",
//   onClick,
//   ...props
// }) => {
//   const [isHovered, setIsHovered] = useState(false);
//   const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [dimensions, setDimensions] = useState({width: 100, height: 100});

//   useEffect(() => {
//     if (containerRef.current) {
//       const {width, height} = containerRef.current.getBoundingClientRect();
//       setDimensions({width, height});
//     }
//   }, []);

//   const colors = isHovered ? hoverGradientColors : gradientColors;

//   return (
//     <div
//       ref={containerRef}
//       id={id}
//       onClick={onClick}
//       onMouseEnter={() => allowHover && setIsHovered(true)}
//       onMouseLeave={() => allowHover && setIsHovered(false)}
//       className={`relative inline-block overflow-hidden p-2 ${className}`}
//       style={{borderRadius}}
//       {...props}
//     >
//       {children}
//       <svg
//         width="100%"
//         height="100%"
//         className="absolute top-0 left-0"
//         viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
//         preserveAspectRatio="none"
//       >
//         <defs>
//           <linearGradient
//             id={gradientId}
//             x1={Math.cos((gradientAngle * Math.PI) / 180)}
//             y1={Math.sin((gradientAngle * Math.PI) / 180)}
//             x2={1 - Math.cos((gradientAngle * Math.PI) / 180)}
//             y2={1 - Math.sin((gradientAngle * Math.PI) / 180)}
//           >
//             {colors.map((color, index) => (
//               <stop
//                 key={index}
//                 offset={`${(index / (colors.length - 1)) * 100}%`}
//                 stopColor={color}
//               />
//             ))}
//           </linearGradient>
//         </defs>
//         <rect
//           x={strokeWidth / 2}
//           y={strokeWidth / 2}
//           width={dimensions.width - strokeWidth}
//           height={dimensions.height - strokeWidth}
//           rx={borderRadius}
//           ry={borderRadius}
//           stroke={`url(#${gradientId})`}
//           strokeWidth={strokeWidth}
//           fill="none"
//         />
//       </svg>
//     </div>
//   );
// };

// export default GradientOutline;

// // GradientOutline id="gc-1" className="w-full h-fit">
// //     <div className="w-full text-white bg-black">
// //     <span>abc cbac</span>
// //     <span>abc cbac</span>
// //     <span>abc cbac</span>
// //     <span>abc cbac</span>
// //     </div>
// // </GradientOutline>

"use client";
import React, {
  FC,
  HTMLAttributes,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

export type GradientOutlineProps = {
  children: React.ReactNode;
  strokeWidth?: number;
  borderRadius?: number;
  gradientColors?: string[];
  hoverGradientColors?: string[];
  gradientAngle?: number;
  allowHover?: boolean;
  className?: string;
  onClick?: () => void;
} & HTMLAttributes<HTMLDivElement>;

export const GradientOutline: FC<GradientOutlineProps> = ({
  children,
  allowHover = true,
  strokeWidth = 1,
  borderRadius = 16,
  gradientColors = [
    "rgba(255, 255, 255, 0.08)",
    "rgba(255, 255, 255, 0.4)",
    "rgba(255, 255, 255, 0)",
    "rgba(255, 255, 255, 0)",
    "rgba(255, 255, 255, 0.1)",
  ],
  hoverGradientColors = ["#E6CAA4", "#E9B84E"],
  gradientAngle = 45,
  className = "",
  onClick,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 100, height: 100 });
  const gradientId = `gradient-${useId()}`; // SSR-safe ID

  // Resize observer để responsive
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    window.addEventListener("resize", updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  const colors = isHovered ? hoverGradientColors : gradientColors;

  // Gradient angle helper
  const rad = (gradientAngle % 360) * (Math.PI / 180);
  const x1 = 0.5 - 0.5 * Math.cos(rad);
  const y1 = 0.5 - 0.5 * Math.sin(rad);
  const x2 = 0.5 + 0.5 * Math.cos(rad);
  const y2 = 0.5 + 0.5 * Math.sin(rad);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      onMouseEnter={() => allowHover && setIsHovered(true)}
      onMouseLeave={() => allowHover && setIsHovered(false)}
      className={`relative inline-block overflow-hidden ${className}`}
      style={{ borderRadius }}
      {...props}
    >
      {children}
      <svg
        width="100%"
        height="100%"
        className="absolute top-0 left-0 pointer-events-none"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1={x1} y1={y1} x2={x2} y2={y2}>
            {colors.map((color, index) => (
              <stop
                key={index}
                offset={`${(index / (colors.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
        </defs>
        <rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={dimensions.width - strokeWidth}
          height={dimensions.height - strokeWidth}
          rx={borderRadius}
          ry={borderRadius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
        />
      </svg>
    </div>
  );
};
