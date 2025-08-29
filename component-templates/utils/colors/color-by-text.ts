import unidecode from 'unidecode';

export const colorHexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export type ColorAuto = "auto"
export type ColorType = "hex" | "rgb" | "hexa" | "rgba";
export type ColorFormat = ColorType | ColorAuto; 
export type ConvertedExport = string | { hex: string; hexa: string; rgb: string; rgba: string }
/**
 * The `convert` function converts a color string into different formats (hex, hexa, rgb, rgba).
 * It supports parsing hex colors, RGB/RGBA colors, and allows for alpha channel adjustment.
 * If the input is invalid, it returns the original input.
 *
 * @param {string} input - The color string to convert.
 * @param {ColorFormat} target - The target format to convert to (hex, hexa, rgb, rgba).
 * @param {number} [alpha] - Optional alpha value for rgba/hexa formats.
 * @returns {ConvertedExport} The converted color in the specified format.
 */
export const convert = (
  input: string,
  target: ColorFormat = "hex",
  alpha?: number
): ConvertedExport  => {
  input = input.trim().toLowerCase();

  let r = 0, g = 0, b = 0, a = 1;

  // Parse HEX / HEXA
  if (input.startsWith("#")) {
    let hex = input.slice(1);

    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 4) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
      a = parseInt(hex[3] + hex[3], 16) / 255;
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      a = parseInt(hex.slice(6, 8), 16) / 255;
    }
  }

  // Parse rgb / rgba
  else if (input.startsWith("rgb")) {
    const nums = input.match(/[\d.]+/g)?.map(Number) || [];
    [r, g, b] = nums;
    if (input.startsWith("rgba")) a = nums[3] ?? 1;
  }

  // If alpha is provided, ensure it's within bounds
  if (typeof alpha === "number") {
    a = Math.min(1, Math.max(0, alpha));
  }

  // Helper formatters
  const toHex = () =>
    "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");

  const toHexa = () =>
    "#" +
    [r, g, b, Math.round(a * 255)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");

  const toRgb = () => `rgb(${r}, ${g}, ${b})`;
  const toRgba = () => `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;

  if (target === "auto") {
    return {
      hex: toHex(),
      hexa: toHexa(),
      rgb: toRgb(),
      rgba: toRgba(),
    };
  }

  switch (target) {
    case "hex":
      return toHex();
    case "hexa":
      return toHexa();
    case "rgb":
      return toRgb();
    case "rgba":
      return toRgba();
    default:
      return input;
  }
}


/**
 * 
 * The `colorByText` function generates a color based on the input text.
 * @param text - The `text` parameter is a string that represents the input text used to generate a color.
 * It is used to create a unique color based on the characters in the text.
 * @param alpha - The `alpha` parameter is a number that represents the alpha channel of the color. It determines the opacity of the color, where 0 is fully transparent and 1 is fully opaque. The default value is 1.
 * @param type - The `type` parameter is a string that specifies the format of the color to be returned. It can be one of the following values: "hex", "rgb", "hexa", or "rgba". The default value is "hex".
 * @returns {string} The `colorByText` function returns a string representing a color in the specified format (hex, rgb, hexa, rgba) based on the input text. If the text is empty or invalid, it defaults to white (#ffffff).
 */
export const colorByText = (text: string, alpha: number = 1, type: "hex" | "rgb" | "hexa" | "rgba" = "hex"): string => {
  const latin = unidecode(text);
  let c = ""
  if(text.length === 0 || latin.length === 0) {
    c = "#ffffff"; // Default to white if text is empty
    return c;
  }
  if(type !== "hex" && type !== "rgb" && type !== "hexa" && type !== "rgba") {
    console.error("Type must be 'hex', 'rgb', 'hexa', or 'rgba'");
    c = "#ffffff"; // Default to white if type is invalid
    return c;
  }
  if (latin && latin.length > 0 && latin.match(/[aeiouyAEIOUY]/)) {
    const hash = Array.from(latin).reduce((acc, char) => {
      const code = char.charCodeAt(0);
      return (acc << 5) - acc + code;
    }, 0);

    const colorCode = (hash >>> 0).toString(16).padStart(6, "0").slice(0, 6);

    let r = parseInt(colorCode.slice(0, 2), 16);
    let g = parseInt(colorCode.slice(2, 4), 16);
    let b = parseInt(colorCode.slice(4, 6), 16);

    let pastelR = Math.min(255, Math.max(150, r + 55));
    let pastelG = Math.min(255, Math.max(150, g + 55));
    let pastelB = Math.min(255, Math.max(150, b + 55));

    const adjustToDesiredHue = (
      r: number,
      g: number,
      b: number
    ): [number, number, number] => {
      if (r > g && r > b) {
        return [0, Math.min(g, b), Math.max(g, b)]; // Green or purple
      } else if (g > r && g > b) {
        return [0, Math.max(0, g - 50), Math.min(b, g)]; // Green or blue
      } else if (b > r && b > g) {
        return [0, Math.min(r, g), Math.max(r, g)]; // Blue or purple
      } else {
        return [0, 0, Math.max(r, g, b)]; // Indigo
      }
    };

    // Function to avoid cyan
    const avoidCyan = (r: number, g: number, b: number): boolean => {
      return g > 150 && b > 150 && r < 100; // Check if it's cyan
    };

    let adjustedR = pastelR;
    let adjustedG = pastelG;
    let adjustedB = pastelB;

    while (avoidCyan(adjustedR, adjustedG, adjustedB)) {
      adjustedG = Math.max(0, adjustedG - 10);
      adjustedB = Math.max(0, adjustedB - 10);
    }

    const [finalR, finalG, finalB] = adjustToDesiredHue(
      adjustedR,
      adjustedG,
      adjustedB
    );

    const adjustedColor = `#${[finalR, finalG, finalB]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")}`;

    c = adjustedColor;
  }

  // Convert to the desired format
  return convert(c, type, alpha) as string;
};




/**
 * The `brightness` function adjusts the brightness of a given color by a specified factor.
 * It supports hex colors in the format #RRGGBB or #RGB, and returns the adjusted color in the same format.
 * If the input color is invalid or the factor is out of bounds, it defaults to black (#000000).
 * @param {string} color - The color to adjust, in hex format.
 * @param {number} factor - The factor by which to adjust the brightness. Should be between -1 and 1.
 * @param {number} [alpha=1] - Optional alpha value for rgba/hexa formats.
 * @param {ColorType} [type="hex"] - The desired output format (hex, rgb, hexa, rgba).
 * @returns {string} The adjusted color in the specified format.
 */
export const brightness = (
  color: string,
  factor: number,
  alpha: number = 1,
  type: ColorType = "hex"
): string => {
  if (!colorHexRegex.test(color)) {
    console.error("Only use hex colors in the format #RRGGBB or #RGB");
    return "#000000"; // Default to black if invalid color format
  };
  if(factor > 1 || factor < -1) {
    console.error("Factor must be between -1 and 1");
    return "#000000"; // Default to black if factor is out of bounds
  }
  if (color) {
    const hexToRgb = (hex: string): [number, number, number] => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };

    const rgbToHex = (r: number, g: number, b: number): string => {
      return `#${[r, g, b]
        .map((x) => Math.round(x).toString(16).padStart(2, "0"))
        .join("")}`;
    };

    const [r, g, b] = hexToRgb(color);

    const adjust = (value: number, factor: number): number => {
      return Math.min(255, Math.max(0, value + factor * 255));
    };

    const newR = adjust(r, factor);
    const newG = adjust(g, factor);
    const newB = adjust(b, factor);

    return rgbToHex(newR, newG, newB);
  }
  
  // convert color format if needed
  return convert(color, type, alpha) as string;
};


/**
 * The `gradientByAmount` function generates a radial gradient based on the provided amount.
 * It returns a string representing the CSS gradient, which can be used in styles.
 * @param {number} amount - The amount to determine the gradient. It should be a number.
 * @returns {string} A string representing the radial gradient based on the amount.
 */
export const gradientByAmount = (amount: number): string => {
  if(typeof amount !== 'number' || isNaN(amount)) {
    console.error("Amount must be a valid number");
    return "radial-gradient(circle at left top, #2a2a2a , #1a1a1a)";
  }
  let gradient: string;

  if (amount <= 0) {
    gradient = "radial-gradient(circle at left top, #2a2a2a , #1a1a1a)";
  } else if (amount <= 1000) {
    gradient = "radial-gradient(circle at left top, #f4ffa3 , #b28fff)";
  } else if (amount <= 10000) {
    gradient = "radial-gradient(circle at left top, #09d9e9 , #07c084)";
  } else if (amount <= 50000) {
    gradient = "radial-gradient(circle at left top, #85dbc2 , #e8e087)";
  } else if (amount <= 100000) {
    gradient = "radial-gradient(circle at left top, #fff58a , #ffa970)";
  } else if (amount <= 500000) {
    gradient = "radial-gradient(circle at left top, #ffe699 , #e594bb)";
  } else {
    gradient = "radial-gradient(circle at left top, #f0f0f0 , #bdbdbd)";
  }

  return gradient;
};



/**
 * The `intensity` function generates a color based on the danger level.
 * It returns a color string in the specified format (hex, rgb, hexa, rgba).
 * @param {number} level - The danger level, should be between 0 and 100.
 * @param {ColorType} type - The desired output format (hex, rgb, hexa, rgba).
 * @param {number} [alpha] - Optional alpha value for rgba/hexa formats.
 * @returns {string} The generated color string in the specified format.
 */
export const intensity = (
  level: number,
  type: ColorType = "hex",
  alpha?: number
): string => {
  if (level < 0 || level > 100) {
    console.error("Intensity level must be between 0 and 100");
    return "rgb(0, 0, 0)"; // Default to black if invalid
  }

  // Clamp 0-100
  const lv = Math.min(100, Math.max(0, level));
  const red = Math.round((lv / 100) * 255);
  const green = Math.round((1 - lv / 100) * 255);

  // Construct the base color
  const baseColor = `rgb(${red}, ${green}, 0)`;

  // convert to the specified type
  return convert(baseColor, type, alpha) as string;
};
