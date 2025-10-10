/**
 * Image processing utilities for advanced photo editing
 */

/**
 * Apply temperature adjustment to image data
 * Warm (positive) adds red, cool (negative) adds blue
 */
export const applyTemperature = (
  data: Uint8ClampedArray,
  value: number
): void => {
  if (value === 0) return;

  const factor = value / 100;

  for (let i = 0; i < data.length; i += 4) {
    if (factor > 0) {
      // Warm: increase red, decrease blue
      data[i] = Math.min(255, data[i] + factor * 30);
      data[i + 2] = Math.max(0, data[i + 2] - factor * 30);
    } else {
      // Cool: decrease red, increase blue
      data[i] = Math.max(0, data[i] + factor * 30);
      data[i + 2] = Math.min(255, data[i + 2] - factor * 30);
    }
  }
};

/**
 * Convert RGB to HSL
 */
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return [h, s, l];
};

/**
 * Convert HSL to RGB
 */
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
};

/**
 * Apply hue rotation
 */
export const applyHue = (
  data: Uint8ClampedArray,
  value: number
): void => {
  if (value === 0) return;

  const shift = value / 360;

  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    let newH = (h + shift) % 1;
    if (newH < 0) newH += 1;

    const [r, g, b] = hslToRgb(newH, s, l);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
};

/**
 * Apply exposure adjustment
 */
export const applyExposure = (
  data: Uint8ClampedArray,
  value: number
): void => {
  if (value === 0) return;

  const factor = 1 + value / 100;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, data[i] * factor);
    data[i + 1] = Math.min(255, data[i + 1] * factor);
    data[i + 2] = Math.min(255, data[i + 2] * factor);
  }
};

/**
 * Apply shadows adjustment (only affects dark pixels)
 */
export const applyShadows = (
  data: Uint8ClampedArray,
  value: number
): void => {
  if (value === 0) return;

  const factor = value / 100;

  for (let i = 0; i < data.length; i += 4) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    // Only affect pixels that are in shadow range (luminance < 128)
    if (luminance < 128) {
      const shadowFactor = (128 - luminance) / 128; // More effect on darker pixels
      const adjustment = factor * shadowFactor * 50;

      data[i] = Math.max(0, Math.min(255, data[i] + adjustment));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment));
    }
  }
};

/**
 * Apply highlights adjustment (only affects bright pixels)
 */
export const applyHighlights = (
  data: Uint8ClampedArray,
  value: number
): void => {
  if (value === 0) return;

  const factor = value / 100;

  for (let i = 0; i < data.length; i += 4) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

    // Only affect pixels that are in highlight range (luminance > 128)
    if (luminance > 128) {
      const highlightFactor = (luminance - 128) / 127; // More effect on brighter pixels
      const adjustment = factor * highlightFactor * 50;

      data[i] = Math.max(0, Math.min(255, data[i] + adjustment));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment));
    }
  }
};

/**
 * Apply vibrance adjustment (increases saturation of less saturated colors)
 */
export const applyVibrance = (
  data: Uint8ClampedArray,
  value: number
): void => {
  if (value === 0) return;

  const factor = value / 100;

  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);

    // Vibrance affects less saturated colors more
    const vibranceEffect = (1 - s) * factor;
    const newS = Math.max(0, Math.min(1, s + vibranceEffect));

    const [r, g, b] = hslToRgb(h, newS, l);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
};

/**
 * Apply clarity adjustment (local contrast enhancement)
 */
export const applyClarity = (
  imageData: ImageData,
  value: number
): void => {
  if (value === 0) return;

  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const factor = value / 100;

  // Create a copy of the original data
  const original = new Uint8ClampedArray(data);

  // Simple unsharp mask for clarity
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const center = original[idx + c];

        // Calculate average of surrounding pixels
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nidx = ((y + dy) * width + (x + dx)) * 4;
            sum += original[nidx + c];
          }
        }
        const avg = sum / 9;

        // Enhance the difference
        const diff = center - avg;
        data[idx + c] = Math.max(0, Math.min(255, center + diff * factor * 2));
      }
    }
  }
};

/**
 * Apply sharpness using convolution matrix
 */
export const applySharpness = (
  imageData: ImageData,
  value: number
): void => {
  if (value === 0) return;

  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const factor = value / 100;

  // Sharpening kernel
  const kernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ];

  // Create a copy of the original data
  const original = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        let sum = 0;

        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            const py = y + ky - 1;
            const px = x + kx - 1;
            const pidx = (py * width + px) * 4;
            sum += original[pidx + c] * kernel[ky][kx];
          }
        }

        // Blend original with sharpened
        const sharpened = sum;
        const blended = original[idx + c] * (1 - factor) + sharpened * factor;
        data[idx + c] = Math.max(0, Math.min(255, blended));
      }
    }
  }
};

/**
 * Apply Gaussian blur
 */
export const applyBlur = (
  imageData: ImageData,
  value: number
): void => {
  if (value === 0) return;

  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const radius = Math.floor(value / 10) + 1;

  // Simplified box blur (faster than Gaussian)
  const original = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let r = 0, g = 0, b = 0, count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy;
          const nx = x + dx;

          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const nidx = (ny * width + nx) * 4;
            r += original[nidx];
            g += original[nidx + 1];
            b += original[nidx + 2];
            count++;
          }
        }
      }

      data[idx] = r / count;
      data[idx + 1] = g / count;
      data[idx + 2] = b / count;
    }
  }
};

/**
 * Apply noise/grain effect
 */
export const applyNoise = (
  data: Uint8ClampedArray,
  value: number
): void => {
  if (value === 0) return;

  const intensity = value / 100 * 50;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * intensity;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
};

/**
 * Apply vignette effect (darkening from edges)
 */
export const applyVignette = (
  imageData: ImageData,
  value: number
): void => {
  if (value === 0) return;

  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const intensity = value / 100;

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Calculate distance from center
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate vignette factor (0 at center, 1 at edges)
      const vignetteFactor = Math.pow(distance / maxDistance, 2);
      const darkening = 1 - (vignetteFactor * intensity);

      data[idx] = data[idx] * darkening;
      data[idx + 1] = data[idx + 1] * darkening;
      data[idx + 2] = data[idx + 2] * darkening;
    }
  }
};

