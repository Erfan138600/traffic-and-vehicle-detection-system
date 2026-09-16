import { CLASS_MAP, faNum } from "./traffic";
import type { Track } from "./tracker";

export interface DrawOptions {
  trails: boolean;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/**
 * Renders detection boxes, Persian label chips, center markers and
 * motion trails on top of the video frame.
 * Coordinates are mapped with the same math as CSS `object-fit: cover`.
 */
export function drawOverlay(
  canvas: HTMLCanvasElement,
  videoW: number,
  videoH: number,
  tracks: Track[],
  opts: DrawOptions,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const cw = canvas.width;
  const ch = canvas.height;
  ctx.clearRect(0, 0, cw, ch);
  if (videoW === 0 || videoH === 0 || cw === 0 || ch === 0) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = rect.width > 0 ? cw / rect.width : 1;

  const scale = Math.max(cw / videoW, ch / videoH);
  const offX = (cw - videoW * scale) / 2;
  const offY = (ch - videoH * scale) / 2;

  /* motion trails (drawn under boxes) */
  if (opts.trails) {
    ctx.lineCap = "round";
    for (const t of tracks) {
      const meta = CLASS_MAP[t.cls];
      if (!meta || t.trail.length < 2) continue;
      for (let i = 1; i < t.trail.length; i++) {
        const a = i / t.trail.length;
        ctx.strokeStyle = hexToRgba(meta.color, a * 0.5);
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(t.trail[i - 1].x * scale + offX, t.trail[i - 1].y * scale + offY);
        ctx.lineTo(t.trail[i].x * scale + offX, t.trail[i].y * scale + offY);
        ctx.stroke();
      }
    }
  }

  for (const t of tracks) {
    const meta = CLASS_MAP[t.cls];
    if (!meta) continue;
    const color = meta.color;

    const x = t.bbox.x * scale + offX;
    const y = t.bbox.y * scale + offY;
    const w = t.bbox.w * scale;
    const h = t.bbox.h * scale;

    /* body */
    ctx.fillStyle = hexToRgba(color, 0.07);
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = hexToRgba(color, 0.3);
    ctx.lineWidth = 1 * dpr;
    ctx.strokeRect(x, y, w, h);

    /* corner brackets */
    const cap = Math.min(Math.max(Math.min(w, h) * 0.34, 6 * dpr), 15 * dpr);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2 * dpr;
    ctx.lineCap = "round";
    ctx.shadowColor = hexToRgba(color, 0.9);
    ctx.shadowBlur = 7 * dpr;
    const seg = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };
    seg(x, y + cap, x, y);
    seg(x, y, x + cap, y);
    seg(x + w - cap, y, x + w, y);
    seg(x + w, y, x + w, y + cap);
    seg(x + w, y + h - cap, x + w, y + h);
    seg(x + w, y + h, x + w - cap, y + h);
    seg(x + cap, y + h, x, y + h);
    seg(x, y + h, x, y + h - cap);
    ctx.shadowBlur = 0;

    /* label chip */
    const label = `${meta.fa} · #${faNum(t.id)} · ${faNum(Math.round(t.score * 100))}٪`;
    ctx.font = `700 ${11.5 * dpr}px Vazirmatn, sans-serif`;
    ctx.direction = "ltr";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const padX = 7 * dpr;
    const chipH = 19 * dpr;
    const chipW = ctx.measureText(label).width + padX * 2;
    let chipY = y - chipH - 5 * dpr;
    if (chipY < 4 * dpr) chipY = y + 5 * dpr;
    roundRect(ctx, x - 0.5 * dpr, chipY, chipW, chipH, 5 * dpr);
    ctx.fillStyle = hexToRgba(color, 0.92);
    ctx.fill();
    ctx.fillStyle = "#031419";
    ctx.fillText(label, x - 0.5 * dpr + padX, chipY + chipH / 2 + 0.5 * dpr);

    /* center marker */
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, 2.1 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(color, 0.95);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, 5.5 * dpr, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(color, 0.5);
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();
  }
}
