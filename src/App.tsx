import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Bike,
  Bus,
  Car,
  Crosshair,
  Cpu,
  Gauge as GaugeIcon,
  Layers,
  LayoutGrid,
  Play,
  Radio,
  Route,
  ScanEye,
  Square,
  Truck,
  Video,
  Waypoints,
  Zap,
  PersonStanding,
  type LucideIcon,
} from "lucide-react";
import BootScreen from "./components/BootScreen";
import Gauge from "./components/Gauge";
import DensityChart from "./components/DensityChart";
import EventLog from "./components/EventLog";
import { useTrafficVision } from "./lib/useTrafficVision";
import {
  BREAKDOWN_ORDER,
  CLASS_MAP,
  SOURCES,
  TRAFFIC_LEVELS,
  faNum,
} from "./lib/traffic";

const CLASS_ICONS: Record<string, LucideIcon> = {
  car: Car,
  truck: Truck,
  bus: Bus,
  motorcycle: Bike,
  bicycle: Bike,
  person: PersonStanding,
};

/* ── small building blocks ───────────────────────────────── */
function Panel({
  title,
  icon: Icon,
  children,
  className = "",
  actions,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a121a]/90 p-4 ${className}`}
    >
      <div className="panel-glow" />
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-cyan-300" />
          <h3 className="text-[13px] font-bold text-slate-200">{title}</h3>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  suffix?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span className="text-[10px] text-slate-500">{label}</span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-xl font-black text-slate-100">{value}</span>
        {suffix && <span className="text-[10px] text-slate-500">{suffix}</span>}
      </div>
    </div>
  );
}

/* ── main app ────────────────────────────────────────────── */
export default function App() {
  const vision = useTrafficVision();
  const [started, setStarted] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { stats, source } = vision;
  const levelMeta = TRAFFIC_LEVELS[stats.level];

  const timeStr = now.toLocaleTimeString("fa-IR", { hour12: false });
  const dateStr = now.toLocaleDateString("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const handleBootStart = () => {
    setStarted(true);
    void vision.start();
  };

  const maxLive = Math.max(1, ...Object.values(stats.livePerClass));

  const tickerItems: string[] = [
    `وضعیت ترافیک: ${levelMeta.fa}`,
    `خودروهای در کادر: ${faNum(stats.vehicles)}`,
    `عابران پیاده: ${faNum(stats.persons)}`,
    `مجموع عبوری: ${faNum(stats.totalPassed)}`,
    ...BREAKDOWN_ORDER.map(
      (c) => `${CLASS_MAP[c].fa}: ${faNum(stats.totalsPerClass[c] ?? 0)}`,
    ),
    `سرعت پردازش: ${faNum(Math.round(stats.fps))} فریم‌برثانیه`,
    `زمان استنتاج: ${faNum(Math.round(stats.inferMs))} میلی‌ثانیه`,
    `آستانه اطمینان: ${faNum(Math.round(vision.threshold * 100))}٪`,
  ];

  return (
    <div className="relative flex h-dvh flex-col bg-[#02060a] font-vazir text-slate-200">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 right-[12%] h-[420px] w-[420px] rounded-full bg-cyan-500/[0.07] blur-[130px]" />
        <div className="absolute -bottom-48 left-[8%] h-[420px] w-[420px] rounded-full bg-teal-500/[0.06] blur-[130px]" />
      </div>

      {/* ── header ── */}
      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-[#050b11]/90 px-4 backdrop-blur lg:px-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-[0_0_22px_rgba(34,211,238,.35)]">
            <ScanEye className="h-5 w-5 text-slate-950" strokeWidth={2.4} />
          </div>
          <div>
            <h1 className="text-base font-black leading-tight text-white sm:text-lg">
              ترافیک‌نگار
            </h1>
            <p
              dir="ltr"
              className="font-jmono text-[8.5px] tracking-[0.32em] text-cyan-300/60"
            >
              TRAFFIQ VISION · CV OS v2.4
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          <span
            dir="ltr"
            className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 font-jmono text-[10px] text-slate-400"
          >
            <Cpu className="h-3 w-3 text-cyan-400" /> COCO-SSD LITE
          </span>
          <span
            dir="ltr"
            className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 font-jmono text-[10px] text-slate-400"
          >
            <Layers className="h-3 w-3 text-teal-400" /> WEBGL BACKEND
          </span>
          <span className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-400">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {source.cam} · {source.title}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div
            dir="ltr"
            className="flex items-center gap-1.5 rounded-lg border border-cyan-400/15 bg-cyan-400/[0.06] px-2.5 py-1.5 font-jmono text-[11px] font-bold text-cyan-300"
            title="سرعت پردازش"
          >
            <Zap className="h-3.5 w-3.5" />
            {faNum(Math.round(stats.fps))}
            <span className="text-cyan-300/50">FPS</span>
          </div>
          <div className="hidden text-left sm:block" dir="ltr">
            <p className="text-sm font-bold leading-tight text-slate-200">
              {timeStr}
            </p>
            <p className="text-center text-[10px] text-slate-500">{dateStr}</p>
          </div>
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold ${
              vision.running
                ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
                : "border-white/10 bg-white/[0.03] text-slate-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                vision.running ? "rec-dot bg-rose-400" : "bg-slate-500"
              }`}
            />
            {vision.running ? "پایش زنده" : "آماده"}
          </div>
        </div>
      </header>

      {/* ── main ── */}
      <main className="relative z-10 grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 custom-scroll lg:grid-cols-[315px_minmax(0,1fr)_315px] lg:overflow-hidden">
        {/* right column (traffic status) */}
        <aside className="custom-scroll order-2 min-h-0 space-y-4 lg:order-1 lg:overflow-y-auto lg:pl-0.5">
          <Panel title="وضعیت ترافیک معبر" icon={GaugeIcon}>
            <Gauge pct={stats.densityPct} level={stats.level} />
            <p
              className="mt-3 rounded-lg border px-3 py-2 text-center text-[11px] leading-5 transition-colors duration-500"
              style={{
                color: levelMeta.color,
                borderColor: `${levelMeta.color}33`,
                background: `${levelMeta.color}0d`,
              }}
            >
              {levelMeta.desc}
            </p>
          </Panel>

          <div className="grid grid-cols-2 gap-3">
            <MiniStat
              icon={Car}
              label="خودرو در کادر"
              value={faNum(stats.vehicles)}
              suffix="دستگاه"
              color="#22d3ee"
            />
            <MiniStat
              icon={Waypoints}
              label="مجموع عبوری"
              value={faNum(stats.totalPassed)}
              suffix="شیء"
              color="#34d399"
            />
            <MiniStat
              icon={Crosshair}
              label="میانگین اطمینان"
              value={`${faNum(Math.round(stats.avgScore * 100))}٪`}
              color="#f59e0b"
            />
            <MiniStat
              icon={Zap}
              label="زمان استنتاج"
              value={faNum(Math.round(stats.inferMs))}
              suffix="میلی‌ثانیه"
              color="#a78bfa"
            />
          </div>

          <Panel title="آرایش خودروها" icon={LayoutGrid}>
            <div className="space-y-2.5">
              {BREAKDOWN_ORDER.map((cls) => {
                const meta = CLASS_MAP[cls];
                const Icon = CLASS_ICONS[cls];
                const live = stats.livePerClass[cls] ?? 0;
                const total = stats.totalsPerClass[cls] ?? 0;
                return (
                  <div key={cls} className="flex items-center gap-2.5">
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                      style={{ background: `${meta.color}14`, color: meta.color }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] text-slate-400">
                          {meta.fa}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          مجموع {faNum(total)}
                        </span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(live / maxLive) * 100}%`,
                            background: meta.color,
                            boxShadow: `0 0 8px ${meta.color}88`,
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className="w-7 shrink-0 text-center text-sm font-black"
                      style={{ color: live > 0 ? meta.color : "#475569" }}
                    >
                      {faNum(live)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel
            title="روند تراکم خودرو"
            icon={Activity}
            actions={
              <span dir="ltr" className="font-jmono text-[9px] text-slate-600">
                LIVE / 1s
              </span>
            }
          >
            <DensityChart data={vision.history} color={levelMeta.color} />
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
              <span>
                بیشترین:{" "}
                <b className="text-slate-300">
                  {faNum(Math.max(0, ...vision.history.map((h) => h.v)))}
                </b>
              </span>
              <span>بازه: ۹۰ ثانیه اخیر</span>
            </div>
          </Panel>
        </aside>

        {/* center stage */}
        <section className="order-1 min-h-0 lg:order-2">
          <div
            ref={vision.wrapRef}
            className="relative h-full min-h-[440px] overflow-hidden rounded-2xl border border-white/[0.07] bg-black shadow-[0_20px_60px_rgba(0,0,0,.5)] lg:min-h-0"
          >
            <video
              ref={vision.videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              loop
              playsInline
              preload="auto"
              crossOrigin="anonymous"
            />
            <canvas
              ref={vision.canvasRef}
              className="absolute inset-0 h-full w-full"
            />

            {/* fx layers */}
            <div className="hud-grid pointer-events-none absolute inset-0 opacity-50" />
            <div className="scanlines pointer-events-none absolute inset-0" />
            {vision.running && <div className="sweep pointer-events-none" />}
            <div className="vignette pointer-events-none absolute inset-0" />

            {/* HUD corners */}
            <span className="pointer-events-none absolute right-3 top-3 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-cyan-300/60" />
            <span className="pointer-events-none absolute left-3 top-3 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-cyan-300/60" />
            <span className="pointer-events-none absolute bottom-3 right-3 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-cyan-300/60" />
            <span className="pointer-events-none absolute bottom-3 left-3 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-cyan-300/60" />

            {/* crosshair */}
            <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px bg-cyan-300/[0.07]" />
            <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full bg-cyan-300/[0.07]" />

            {/* top overlay */}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                <span
                  className={`h-2 w-2 rounded-full ${
                    vision.running ? "rec-dot bg-rose-500" : "bg-slate-500"
                  }`}
                />
                <span className="text-[11px] font-bold text-slate-200">
                  {source.cam} · {source.title}
                </span>
                <span dir="ltr" className="font-jmono text-[9px] text-slate-500">
                  {source.tag}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  dir="ltr"
                  className="rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 font-jmono text-[10px] text-cyan-300/90 backdrop-blur-sm"
                >
                  OBJS {faNum(stats.vehicles + stats.persons)}
                </span>
                <span
                  dir="ltr"
                  className="hidden rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 font-jmono text-[10px] text-slate-400 backdrop-blur-sm sm:block"
                >
                  {vision.resolution}
                </span>
              </div>
            </div>

            {/* fatal error overlay */}
            {vision.fatal && (
              <div className="absolute inset-0 z-20 grid place-items-center bg-black/70 backdrop-blur-sm">
                <div className="fade-in mx-4 max-w-sm rounded-2xl border border-rose-400/25 bg-[#120a0d]/95 p-6 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-rose-400" />
                  <h4 className="mt-3 text-sm font-black text-rose-300">
                    {vision.fatal === "cors"
                      ? "محدودیت امنیتی مرورگر"
                      : "خطا در پخش ویدیو"}
                  </h4>
                  <p className="mt-2 text-xs leading-6 text-slate-400">
                    {vision.fatal === "cors"
                      ? "مرورگر اجازه خواندن پیکسل‌های این ویدیو را نداد. لطفاً دوربین دیگری را انتخاب کنید یا دوباره تلاش کنید."
                      : "اتصال به جریان ویدیو برقرار نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید."}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => vision.start()}
                      className="flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-cyan-300"
                    >
                      <Play className="h-3.5 w-3.5 fill-slate-950" />
                      تلاش مجدد
                    </button>
                    <button
                      onClick={() =>
                        vision.selectSource(
                          SOURCES[(SOURCES.findIndex((s) => s.id === source.id) + 1) % SOURCES.length].id,
                        )
                      }
                      className="rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
                    >
                      تعویض دوربین
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* bottom control bar */}
            <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4">
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#04090f]/85 p-3 backdrop-blur-md">
                <button
                  onClick={() =>
                    vision.running ? vision.stop() : vision.start()
                  }
                  disabled={vision.phase !== "ready"}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                    vision.running
                      ? "bg-rose-500/90 text-white shadow-[0_0_20px_rgba(244,63,94,.35)] hover:bg-rose-500"
                      : "bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,.35)] hover:bg-cyan-300"
                  }`}
                >
                  {vision.running ? (
                    <>
                      <Square className="h-3.5 w-3.5 fill-white" /> توقف پایش
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 fill-slate-950" /> شروع پایش
                    </>
                  )}
                </button>

                <div className="h-8 w-px bg-white/10" />

                <div className="flex items-center gap-1.5">
                  <Video className="ml-1 h-4 w-4 text-slate-500" />
                  {SOURCES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => vision.selectSource(s.id)}
                      title={s.title}
                      className={`rounded-lg px-2.5 py-1.5 font-jmono text-[10px] font-bold transition-all ${
                        s.id === source.id
                          ? "bg-cyan-400/15 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(34,211,238,.4)]"
                          : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
                      }`}
                    >
                      {s.cam}
                    </button>
                  ))}
                </div>

                <div className="hidden h-8 w-px bg-white/10 md:block" />

                <div className="flex min-w-[190px] flex-1 items-center gap-3">
                  <span className="whitespace-nowrap text-[10px] text-slate-500">
                    آستانه اطمینان
                  </span>
                  <input
                    dir="ltr"
                    type="range"
                    min={0.2}
                    max={0.9}
                    step={0.01}
                    value={vision.threshold}
                    onChange={(e) =>
                      vision.setThreshold(parseFloat(e.target.value))
                    }
                    className="cv-range flex-1"
                  />
                  <span
                    dir="ltr"
                    className="w-10 rounded-md border border-cyan-400/20 bg-cyan-400/[0.07] px-1.5 py-1 text-center font-jmono text-[10px] font-bold text-cyan-300"
                  >
                    {faNum(Math.round(vision.threshold * 100))}٪
                  </span>
                </div>

                <button
                  onClick={() => vision.setTrails(!vision.trails)}
                  title="نمایش مسیر حرکت"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-all ${
                    vision.trails
                      ? "bg-cyan-400/15 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(34,211,238,.4)]"
                      : "text-slate-500 hover:bg-white/[0.05]"
                  }`}
                >
                  <Route className="h-4 w-4" />
                  <span className="hidden sm:inline">مسیر حرکت</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* left column (feed) */}
        <aside className="custom-scroll order-3 min-h-0 space-y-4 lg:flex lg:flex-col lg:overflow-y-auto lg:pl-0.5">
          <Panel
            title="رخدادهای زنده"
            icon={Radio}
            className="flex min-h-[300px] flex-col lg:min-h-0 lg:flex-1"
            actions={
              <span className="rounded-md bg-white/[0.05] px-2 py-0.5 font-jmono text-[9px] text-slate-500">
                {faNum(vision.events.length)}
              </span>
            }
          >
            <div className="min-h-0 flex-1">
              <EventLog events={vision.events} />
            </div>
          </Panel>

          <Panel title="مشخصات مدل" icon={Cpu}>
            <div dir="ltr" className="space-y-1.5 font-jmono text-[10px] leading-4 text-slate-500">
              <div className="flex justify-between">
                <span>MODEL</span>
                <span className="text-slate-300">coco-ssd</span>
              </div>
              <div className="flex justify-between">
                <span>BACKBONE</span>
                <span className="text-slate-300">lite_mobilenet_v2</span>
              </div>
              <div className="flex justify-between">
                <span>CLASSES</span>
                <span className="text-slate-300">80 · COCO</span>
              </div>
              <div className="flex justify-between">
                <span>RUNTIME</span>
                <span className="text-cyan-300">tensorflow.js · webgl</span>
              </div>
              <div className="flex justify-between">
                <span>PRIVACY</span>
                <span className="text-emerald-400">100% on-device</span>
              </div>
            </div>
          </Panel>
        </aside>
      </main>

      {/* ── ticker ── */}
      <footer className="relative z-10 h-9 shrink-0 overflow-hidden border-t border-white/[0.05] bg-[#04090e]">
        <div
          dir="ltr"
          className="marquee flex h-full items-center gap-12 text-[11px] text-slate-500"
        >
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} dir="rtl" className="flex shrink-0 items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-cyan-400/50" />
              {item}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#04090e] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#04090e] to-transparent" />
      </footer>

      {/* ── boot overlay ── */}
      <BootScreen
        phase={vision.phase}
        progress={vision.progress}
        lines={vision.bootLines}
        hidden={started}
        onStart={handleBootStart}
      />
    </div>
  );
}
