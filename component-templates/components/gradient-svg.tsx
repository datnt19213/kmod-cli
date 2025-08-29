// import React from 'react';

// import { ReactSVG } from 'react-svg';

// export type GradientSVGProps = {
//   image: string;
//   isActive?: boolean;
// };
// export const GradientSVG = ({ image, isActive }: GradientSVGProps) => {
//   return (
//     <ReactSVG
//       src={image}
//       beforeInjection={(svg) => {
//         const defs = document.createElementNS(
//           "http://www.w3.org/2000/svg",
//           "defs"
//         );
//         if (isActive) {
//           defs.innerHTML = `
//         <linearGradient id="customGradient" x1="0" y1="0" x2="0" y2="1">
//           <stop offset="0%" stop-color="#A079FC" />
//           <stop offset="100%" stop-color="#0D5BB5" />
//         </linearGradient>
//       `;
//         }
//         svg.prepend(defs);

//         svg.querySelectorAll("[stroke]").forEach((el) => {
//           el.setAttribute(
//             "stroke",
//             isActive ? "url(#customGradient)" : "#515158"
//           );
//         });
//         svg.querySelectorAll("[fill]").forEach((el) => {
//           el.setAttribute(
//             "fill",
//             isActive ? "url(#customGradient)" : "#515158"
//           );
//         });
//       }}
//       className="h-9 w-9"
//     />
//   );
// };

import React from 'react';

import { ReactSVG } from 'react-svg';

export type GradientStop = {
  offset: string; // "0%", "50%", ...
  color: string;  // "#hex" or "rgb(...)"
};

export type GradientSVGProps = {
  image: string;
  isActive?: boolean;
  gradientId?: string;
  gradientStops?: GradientStop[];
  stroke?: string | { gradient: true };
  fill?: string | { gradient: true };
  gradientType?: "linear" | "radial";
  angle?: number; // For linear gradients, if needed
  className?: string;
  style: React.CSSProperties;
};

export const GradientSVG = ({
  image,
  isActive = false,
  gradientId = "customGradient",
  gradientStops = [
    { offset: "0%", color: "#A079FC" },
    { offset: "100%", color: "#0D5BB5" },
  ],
  stroke = { gradient: true },
  fill = { gradient: true },
  gradientType = "linear",
  angle = 180, // it can be used for linear gradients
  className = "h-9 w-9",
  style = {},
  ...props
}: GradientSVGProps) => {
  return (
    <ReactSVG
      src={image}
      beforeInjection={(svg) => {
        if (isActive && ((stroke as any).gradient || (fill as any).gradient)) {
          if (!svg.querySelector(`#${gradientId}`)) {
            const defs = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "defs"
            );

            const gradient = document.createElementNS(
              "http://www.w3.org/2000/svg",
              gradientType === "linear" ? "linearGradient" : "radialGradient"
            );
            gradient.setAttribute("id", gradientId);

            if (gradientType === "linear") {
              const rad = (angle % 360) * (Math.PI / 180);
              const x1 = (Math.cos(rad) + 1) / 2;
              const y1 = (Math.sin(rad) + 1) / 2;
              const x2 = 1 - x1;
              const y2 = 1 - y1;

              gradient.setAttribute("x1", x1.toString());
              gradient.setAttribute("y1", y1.toString());
              gradient.setAttribute("x2", x2.toString());
              gradient.setAttribute("y2", y2.toString());
            } else {
              gradient.setAttribute("cx", "50%");
              gradient.setAttribute("cy", "50%");
              gradient.setAttribute("r", "50%");
            }

            gradientStops.forEach((stop) => {
              const stopEl = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "stop"
              );
              stopEl.setAttribute("offset", stop.offset);
              stopEl.setAttribute("stop-color", stop.color);
              gradient.appendChild(stopEl);
            });

            defs.appendChild(gradient);
            svg.prepend(defs);
          }
        }

        svg.querySelectorAll("[stroke]").forEach((el) => {
          let strokeVal = "#515158";
          if (isActive) {
            if (typeof stroke === "string") strokeVal = stroke;
            else if ((stroke as any).gradient) strokeVal = `url(#${gradientId})`;
          }
          el.setAttribute("stroke", strokeVal);
        });

        svg.querySelectorAll("[fill]").forEach((el) => {
          let fillVal = "#515158";
          if (isActive) {
            if (typeof fill === "string") fillVal = fill;
            else if ((fill as any).gradient) fillVal = `url(#${gradientId})`;
          }
          el.setAttribute("fill", fillVal);
        });
      }}
      className={className}
      style={style}
      {...props}
    />
  );
};

