import { useEffect, useRef } from "react";
import type { HistPoint } from "../lib/useTrafficVision";

interface Props {
  data: HistPoint[];
  color?: string;
  height?: number;
}

export default function DensityChart({
  data,
  color = "#22d3ee",
  height = 72,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.round(height * dpr);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    const padX = 6 * dpr;
    const padY = 8 * dpr;

    /* grid */
    ctx.strokeStyle = "rgba(148,197,255,.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const y = padY + ((h - padY * 2) / 3) * i;
      ctx.beginPath();
      ctx.setLineDash([3 * dpr, 4 * dpr]);
      ctx.moveTo(padX, y);
      ctx.lineTo(w - padX, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    if (data.length < 2) {
      ctx.fillStyle = "rgba(148,197,255,.25)";
      ctx.font = `${10 * dpr}px Vazirmatn, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("در انتظار داده…", w / 2, h / 2);
      return;
    }

    const maxV = Math.max(4, ...data.map((d) => d.v));
    const X = (i: number) => padX + ((w - padX * 2) * i) / (data.length - 1);
    const Y = (v: number) => h - padY - ((h - padY * 2) * v) / maxV;

    /* area */
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `${color}40`);
    grad.addColorStop(1, `${color}00`);
    ctx.beginPath();
    ctx.moveTo(X(0), Y(data[0].v));
    for (let i = 1; i < data.length; i++) ctx.lineTo(X(i), Y(data[i].v));
    ctx.lineTo(X(data.length - 1), h - padY + 2);
    ctx.lineTo(X(0), h - padY + 2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    /* line */
    ctx.beginPath();
    ctx.moveTo(X(0), Y(data[0].v));
    for (let i = 1; i < data.length; i++) ctx.lineTo(X(i), Y(data[i].v));
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8 * dpr;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 * dpr;
    ctx.stroke();
    ctx.shadowBlur = 0;

    /* last point */
    const lx = X(data.length - 1);
    const ly = Y(data[data.length - 1].v);
    ctx.beginPath();
    ctx.arc(lx, ly, 3 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx, ly, 6.5 * dpr, 0, Math.PI * 2);
    ctx.strokeStyle = `${color}55`;
    ctx.lineWidth = 1 * dpr;
    ctx.stroke();
  }, [data, color, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height }}
      className="w-full"
      aria-hidden
    />
  );
}
