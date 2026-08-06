import { renderToStaticMarkup } from "react-dom/server";
import type { LucideIcon } from "lucide-react";

/** Converts an inline SVG string to a PNG data URL sized for jsPDF's addImage. */
function svgToPngDataUrl(svg: string, sizePx: number): Promise<string | null> {
  const svgUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = sizePx;
      canvas.height = sizePx;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0, sizePx, sizePx);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => resolve(null);
    img.src = svgUrl;
  });
}

/**
 * The TeamStoa app mark — the violet gradient tile with the white node graph, matching the
 * brand block on the landing and login pages. Redrawn as SVG here because the React
 * `TeamStoaIcon` renders only the white graph and relies on a CSS gradient for its tile.
 */
export function loadBrandMarkDataUrl(sizePx = 96): Promise<string | null> {
  const nodes = [
    [84, 50],
    [67, 20.6],
    [33, 20.6],
    [16, 50],
    [33, 79.4],
    [67, 79.4],
  ];
  const spokes = [
    "M84 50 Q69 39 50 50",
    "M67 20.6 Q50 28 50 50",
    "M33 20.6 Q31 39 50 50",
    "M16 50 Q31 61 50 50",
    "M33 79.4 Q50 72 50 50",
    "M67 79.4 Q69 61 50 50",
  ];

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">',
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
    '<stop offset="0%" stop-color="#6D28D9"/><stop offset="100%" stop-color="#A78BFA"/>',
    "</linearGradient></defs>",
    '<rect width="100" height="100" rx="22" fill="url(#g)"/>',
    '<g stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.5" fill="none">',
    ...spokes.map((d) => `<path d="${d}"/>`),
    "</g>",
    ...nodes.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="4.5" fill="#fff" opacity="0.85"/>`),
    '<circle cx="50" cy="50" r="10" fill="#fff"/>',
    "</svg>",
  ].join("");

  return svgToPngDataUrl(svg, sizePx);
}

/** Renders a Lucide icon to a PNG data URL (via an inline SVG) for use with jsPDF's addImage. */
export function loadIconDataUrl(Icon: LucideIcon, color: string, sizePx: number): Promise<string | null> {
  return svgToPngDataUrl(renderToStaticMarkup(<Icon color={color} size={sizePx} strokeWidth={2} />), sizePx);
}
