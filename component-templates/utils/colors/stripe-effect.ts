export type MeshStop = {
  color: string;
  x: string; // example: "20%", "80%", "50%"
  y: string; // example: "30%", "70%", "50%"
  radius?: string; // example: "40%", "60%" (spread size)
};
export type GradientPatternType = "stripes" | "grid" | "checkerboard" | "mesh";
export type GradientPatternProps = {
  type?: GradientPatternType;
  angle?: number;
  primaryColor?: string;
  secondaryColor?: string;
  primaryThickness?: string;
  secondaryThickness?: string;
  /**
   * Optional mesh stops for "mesh" type gradients
   * Example: [{ color: "#ff0000", x: "50%", y: "50%", radius: "60%" }, ...]
   * This is only used when type is "mesh"
   */
  meshStops?: MeshStop[];
};

const buildMesh = (stops: MeshStop[] = []): string => {
  if (!stops.length) return "transparent";

  return stops
    .map(
      (s) => `
      radial-gradient(
        circle at ${s.x} ${s.y},
        ${s.color},
        transparent ${s.radius ?? "60%"}
      )`
    )
    .join(",");
};



/**
 * Generates a gradient pattern based on the provided props.
 * Supports "stripes", "grid", "checkerboard", and "mesh" types.
 * Returns a string representing the CSS gradient pattern.
 * @param {GradientPatternProps} props - Gradient pattern props (type, angle, primaryColor, secondaryColor, primaryThickness, secondaryThickness, meshStops)
 * @returns {string} CSS gradient pattern string
 */

export const gradientPattern = ({
  type = "stripes",
  angle = 135,
  primaryColor = "#a22215",
  secondaryColor = "#a22215aa",
  primaryThickness = "8px",
  secondaryThickness = "8px",
  meshStops = [],
}: GradientPatternProps): string => {
  const normalizeSize = (val: string | number) =>
    typeof val === "number" ? `${val}px` : val;

  const p = normalizeSize(primaryThickness);
  const s = normalizeSize(secondaryThickness);

  switch (type) {
    case "stripes":
      return `repeating-linear-gradient(${angle}deg,
        ${primaryColor} 0,
        ${primaryColor} ${p},
        ${secondaryColor} ${p},
        ${secondaryColor} calc(${p} + ${s}))`;

    case "grid":
      return `
        repeating-linear-gradient(
          0deg, ${primaryColor}, ${primaryColor} ${p}, transparent ${p}, transparent calc(${p} + ${s})
        ),
        repeating-linear-gradient(
          90deg, ${primaryColor}, ${primaryColor} ${p}, transparent ${p}, transparent calc(${p} + ${s})
        )
      `;

    case "checkerboard":
      return `
        repeating-linear-gradient(
          45deg, ${primaryColor} 0, ${primaryColor} ${p}, ${secondaryColor} ${p}, ${secondaryColor} calc(${p} + ${s})
        ),
        repeating-linear-gradient(
          -45deg, ${primaryColor} 0, ${primaryColor} ${p}, ${secondaryColor} ${p}, ${secondaryColor} calc(${p} + ${s})
        )
      `;

    case "mesh":
      // Mesh gradient (approx with multiple radial gradients)
      return buildMesh(meshStops);

    default:
      return "transparent";
  }

  //   const backgroundStyle = `repeating-linear-gradient(${angle}deg,${primaryColor} 0,${primaryColor} ${normalizeSize(primaryThickness)},${secondaryColor} ${normalizeSize(primaryThickness)},${secondaryColor} calc(${normalizeSize(primaryThickness)} + ${normalizeSize(secondaryThickness)}))`;
};
