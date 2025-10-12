import { TextLayer } from '../types';

/**
 * Draws a text layer onto a canvas context
 * @param ctx - Canvas 2D context
 * @param layer - Text layer to render
 */
export function drawTextLayer(ctx: CanvasRenderingContext2D, layer: TextLayer): void {
  // Save the current context state
  ctx.save();

  // Set global opacity
  ctx.globalAlpha = layer.opacity;

  // Calculate center point for rotation (center of the FULL container)
  const centerX = layer.x + layer.width / 2;
  const centerY = layer.y + layer.height / 2;

  // Apply rotation around center point (matching CSS transform behavior)
  ctx.translate(centerX, centerY);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.translate(-centerX, -centerY);

  // Setup font
  let fontStyle = '';
  if (layer.italic) fontStyle += 'italic ';
  if (layer.bold) fontStyle += 'bold ';
  ctx.font = `${fontStyle}${layer.fontSize}px "${layer.fontFamily}", sans-serif`;

  // Padding is INSIDE the container (matching CSS px-2 py-1)
  const paddingX = 8; // px-2 = 8px
  const paddingY = 4; // py-1 = 4px

  // In CSS, text-align works within the content box (after padding)
  // The content area is: layer.x + paddingX to layer.x + layer.width - paddingX
  const contentLeft = layer.x + paddingX;
  const contentRight = layer.x + layer.width - paddingX;
  const contentCenter = layer.x + layer.width / 2; // Center of full container

  // Setup text alignment and position based on layer.align
  let textX: number;
  if (layer.align === 'left') {
    ctx.textAlign = 'left';
    textX = contentLeft;
  } else if (layer.align === 'center') {
    ctx.textAlign = 'center';
    textX = contentCenter;
  } else if (layer.align === 'right') {
    ctx.textAlign = 'right';
    textX = contentRight;
  } else {
    // Default to left
    ctx.textAlign = 'left';
    textX = contentLeft;
  }

  ctx.textBaseline = 'top'; // Use 'top' for consistency with CSS

  // Setup shadow
  if (layer.shadowBlur > 0 || layer.shadowX !== 0 || layer.shadowY !== 0) {
    ctx.shadowOffsetX = layer.shadowX;
    ctx.shadowOffsetY = layer.shadowY;
    ctx.shadowBlur = layer.shadowBlur;
    ctx.shadowColor = layer.shadowColor;
  }

  // Split text into lines and render each line
  const lines = layer.content.split('\n');
  const lineHeight = layer.fontSize * 1.2; // 120% of font size for line height

  lines.forEach((line, index) => {
    const textY = layer.y + paddingY + (index * lineHeight); // Simplified Y calculation for 'top' baseline

    // Render stroke (outline) if strokeWidth > 0
    if (layer.strokeWidth > 0) {
      ctx.strokeStyle = layer.strokeColor;
      ctx.lineWidth = layer.strokeWidth * 2; // Double because stroke is centered on path
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(line, textX, textY);
    }

    // Render fill text
    ctx.fillStyle = layer.color;
    ctx.fillText(line, textX, textY);

    // Render underline if needed
    if (layer.underline) {
      const metrics = ctx.measureText(line);
      const underlineY = textY + layer.fontSize + 2; // Adjusted for top baseline
      let underlineX = textX;
      let underlineWidth = metrics.width;

      // Adjust underline position based on alignment
      if (layer.align === 'center') {
        underlineX = textX - metrics.width / 2;
      } else if (layer.align === 'right') {
        underlineX = textX - metrics.width;
      }

      ctx.beginPath();
      ctx.strokeStyle = layer.color;
      ctx.lineWidth = Math.max(1, layer.fontSize / 16);
      ctx.moveTo(underlineX, underlineY);
      ctx.lineTo(underlineX + underlineWidth, underlineY);
      ctx.stroke();
    }
  });

  // Restore the context state
  ctx.restore();
}

/**
 * Draws all text layers onto a canvas
 * @param ctx - Canvas 2D context
 * @param layers - Array of text layers to render
 */
export function drawAllTextLayers(ctx: CanvasRenderingContext2D, layers: TextLayer[]): void {
  layers.forEach(layer => {
    drawTextLayer(ctx, layer);
  });
}

/**
 * Pre-loads a Google Font to ensure it's available for canvas rendering
 * @param fontFamily - Name of the font family
 * @returns Promise that resolves when font is loaded
 */
export async function loadGoogleFont(fontFamily: string): Promise<void> {
  // Check if font is already loaded
  if (document.fonts.check(`16px "${fontFamily}"`)) {
    return Promise.resolve();
  }

  // Create link element for Google Fonts
  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@400;700&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);

  // Wait for font to load
  try {
    await document.fonts.load(`16px "${fontFamily}"`);
  } catch (error) {
    console.warn(`Failed to load font: ${fontFamily}`, error);
  }
}

/**
 * Pre-loads multiple Google Fonts
 * @param fontFamilies - Array of font family names
 */
export async function loadGoogleFonts(fontFamilies: string[]): Promise<void> {
  await Promise.all(fontFamilies.map(font => loadGoogleFont(font)));
}
