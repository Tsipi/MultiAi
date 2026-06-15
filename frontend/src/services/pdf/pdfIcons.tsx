import { renderToStaticMarkup } from "react-dom/server";
import type { LucideIcon } from "lucide-react";

/** Renders a Lucide icon to a PNG data URL (via an inline SVG) for use with jsPDF's addImage. */
export function loadIconDataUrl(Icon: LucideIcon, color: string, sizePx: number): Promise<string | null> {
  const svg = renderToStaticMarkup(<Icon color={color} size={sizePx} strokeWidth={2} />);
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
