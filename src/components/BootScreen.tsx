import {
  AlertTriangle,
  Cpu,
  Layers,
  Play,
  RefreshCw,
  ScanEye,
} from "lucide-react";
import type { BootPhase } from "../lib/useTrafficVision";
import { faNum } from "../lib/traffic";

interface Props {
  phase: BootPhase;
  progress: number;
  lines: string[];
  hidden: boolean;
  onStart: () => void;
}

export default function BootScreen({
  phase,
  progress,
  lines,
  hidden,
  onStart,
}: Props) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#020507] px-4 transition-all duration-700 ${
        hidden ? "pointer-events-none scale-[1.05] opacity-0" : "opacity-100"
      }`}
    >
      {/* ambient backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-teal-500/10 blur-[120px]" />
        <div className="hud-grid absolute inset-0 opacity-60" />
      </div>

      <div className="relative flex w-full max-w-lg flex-col items-center text-center">
        {/* radar */}
        <div className="relative mb-8 h-40 w-40">
          <div className="absolute inset-0 rounded-full border border-cyan-400/15" />
          <div className="absolute inset-4 rounded-full border border-cyan-400/20" />
          <div className="absolute inset-9 rounded-full border border-dashed border-cyan-400/25" />
          <div className="radar-sweep absolute inset-0 rounded-full" />
          <div className="absolute left-1/2 top-0 h-1/2 w-px bg-cyan-400/20" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-cyan-400/20" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-[0_0_40px_rgba(34,211,238,.45)]">
              <ScanEye className="h-8 w-8 text-slate-950" strokeWidth={2.2} />
            </div>
          </div>
          <div className="pulse-dot absolute right-8 top-10 h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <div className="blink absolute bottom-12 left-6 h-1.5 w-1.5 rounded-full bg-cyan-300" />
        </div>

        <h1 className="text-4xl font-black tracking-tight text-white glow-cyan">
          ترافیک‌نگار
        </h1>
        <p
          className="mt-2 font-jmono text-[10px] tracking-[0.45em] text-cyan-300/70"
          dir="ltr"
        >
          TRAFFIQ VISION · CV TRAFFIC MONITOR
        </p>
        <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
          سامانه تشخیص خودرو، ردیابی و تحلیل ترافیک با بینایی ماشین — پردازش
          کاملاً زنده و محلی در مرورگر، بدون ارسال داده به سرور.
        </p>

        {/* terminal */}
        <div
          dir="ltr"
          className="mt-7 w-full max-w-md rounded-xl border border-cyan-400/15 bg-black/60 p-3.5 text-left font-jmono text-[11px] leading-5 text-cyan-300/70 shadow-[inset_0_0_30px_rgba(34,211,238,.05)]"
        >
          {lines.map((l, i) => (
            <div key={i} className="fade-in flex items-center gap-2">
              <span className={i === lines.length - 1 && phase === "ready" ? "text-emerald-400" : ""}>
                {l}
              </span>
              {i === lines.length - 1 && phase === "boot" && (
                <span className="blink inline-block h-3 w-1.5 bg-cyan-300/80" />
              )}
            </div>
          ))}
        </div>

        {/* progress */}
        <div className="mt-5 flex w-full max-w-md items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-300 shadow-[0_0_12px_rgba(34,211,238,.8)] transition-[width] duration-150"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <span className="w-10 text-left font-bold text-cyan-300" dir="ltr">
            <span>{faNum(Math.round(progress))}</span>٪
          </span>
        </div>

        {/* chips */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {[
            { icon: Cpu, label: "TensorFlow.js" },
            { icon: Layers, label: "COCO-SSD" },
            { icon: ScanEye, label: "WebGL GPU" },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              dir="ltr"
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-jmono text-[10px] text-slate-400"
            >
              <Icon className="h-3 w-3 text-cyan-400/80" />
              {label}
            </span>
          ))}
        </div>

        {/* action */}
        <div className="mt-8 h-24">
          {phase === "ready" && (
            <div className="fade-in flex flex-col items-center gap-2.5">
              <button
                onClick={onStart}
                className="group relative flex items-center gap-3 rounded-2xl bg-cyan-400 px-8 py-3.5 text-base font-extrabold text-slate-950 shadow-[0_0_35px_rgba(34,211,238,.45)] transition-all hover:scale-[1.03] hover:bg-cyan-300 active:scale-95"
              >
                <Play className="h-5 w-5 fill-slate-950" />
                شروع پایش زنده
              </button>
              <span className="breathe text-[11px] text-slate-500">
                با کلیک، ویدیوی دوربین پخش و موتور تشخیص فعال می‌شود
              </span>
            </div>
          )}
          {phase === "error" && (
            <div className="fade-in flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-bold">
                  بارگذاری مدل شبکه عصبی ناموفق بود
                </span>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-5 py-2 text-sm font-bold text-rose-300 transition hover:bg-rose-400/20"
              >
                <RefreshCw className="h-4 w-4" />
                تلاش مجدد
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
