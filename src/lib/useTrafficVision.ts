import { useCallback, useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { CentroidTracker, type Detection, type Track } from "./tracker";
import {
  CLASS_MAP,
  SOURCES,
  TRAFFIC_LEVELS,
  densityPercent,
  faNum,
  faTime,
  trafficLevel,
  type VideoSource,
} from "./traffic";
import { drawOverlay } from "./draw";

export type BootPhase = "boot" | "ready" | "error";

export interface LogEvent {
  id: number;
  time: string;
  text: string;
  color: string;
  kind: "system" | "detect" | "traffic";
}

export interface LiveStats {
  fps: number;
  inferMs: number;
  vehicles: number;
  persons: number;
  totalPassed: number;
  livePerClass: Record<string, number>;
  totalsPerClass: Record<string, number>;
  avgScore: number;
  occupancyPct: number;
  level: number;
  densityPct: number;
}

export interface HistPoint {
  t: number;
  v: number;
}

const ZERO: LiveStats = {
  fps: 0,
  inferMs: 0,
  vehicles: 0,
  persons: 0,
  totalPassed: 0,
  livePerClass: {},
  totalsPerClass: {},
  avgScore: 0,
  occupancyPct: 0,
  level: 0,
  densityPct: 0,
};

/* Module-level singleton so React StrictMode remounts never reload the model */
let modelPromise: Promise<cocoSsd.ObjectDetection> | null = null;
function getModel(): Promise<cocoSsd.ObjectDetection> {
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        await tf.setBackend("webgl");
      } catch {
        /* fall back to default (cpu) */
      }
      await tf.ready();
      const m = await cocoSsd.load({ base: "lite_mobilenet_v2" });
      /* gpu warm-up run */
      const warm = document.createElement("canvas");
      warm.width = 96;
      warm.height = 96;
      await m.detect(warm);
      return m;
    })();
  }
  return modelPromise;
}

export function useTrafficVision() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const trackerRef = useRef(new CentroidTracker());

  const runningRef = useRef(false);
  const thresholdRef = useRef(0.42);
  const trailsRef = useRef(true);
  const rafRef = useRef(0);
  const queueRef = useRef<LogEvent[]>([]);
  const eventIdRef = useRef(0);
  const fpsEmaRef = useRef(0);
  const inferEmaRef = useRef(0);
  const occEmaRef = useRef(0);
  const lastFrameTsRef = useRef(0);
  const lastLevelRef = useRef(0);
  const lastTracksRef = useRef<Track[]>([]);
  const lastHistTsRef = useRef(0);

  const [phase, setPhase] = useState<BootPhase>("boot");
  const [progress, setProgress] = useState(0);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [threshold, setThresholdState] = useState(0.42);
  const [trails, setTrailsState] = useState(true);
  const [sourceId, setSourceId] = useState(SOURCES[0].id);
  const [stats, setStats] = useState<LiveStats>(ZERO);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [history, setHistory] = useState<HistPoint[]>([]);
  const [fatal, setFatal] = useState<"cors" | "playback" | null>(null);
  const [resolution, setResolution] = useState("—");

  const source: VideoSource =
    SOURCES.find((s) => s.id === sourceId) ?? SOURCES[0];

  const pushEvent = useCallback(
    (text: string, color: string, kind: LogEvent["kind"]) => {
      queueRef.current.unshift({
        id: ++eventIdRef.current,
        time: faTime(),
        text,
        color,
        kind,
      });
    },
    [],
  );

  /* ── boot: load the neural model ─────────────────────────── */
  useEffect(() => {
    let alive = true;
    const lines = [
      "> initializing tfjs runtime",
      "> loading COCO-SSD [lite_mobilenet_v2] weights",
      "> compiling shaders · warming up gpu",
      "> 80 object classes armed — system ready",
    ];
    setBootLines([lines[0]]);
    const li = setInterval(() => {
      setBootLines((prev) =>
        prev.length < 3 ? [...prev, lines[prev.length]] : prev,
      );
    }, 850);
    const pi = setInterval(() => {
      setProgress((p) => (p < 88 ? p + (88 - p) * 0.05 + 0.15 : p));
    }, 90);

    getModel()
      .then((m) => {
        if (!alive) return;
        modelRef.current = m;
        setBootLines((prev) => [...prev.slice(0, 3), lines[3]]);
        setProgress(100);
        pushEvent("موتور بینایی ماشین بارگذاری و آماده به کار شد", "#34d399", "system");
        window.setTimeout(() => {
          if (alive) setPhase("ready");
        }, 500);
      })
      .catch(() => {
        if (!alive) return;
        setPhase("error");
      });

    return () => {
      alive = false;
      clearInterval(li);
      clearInterval(pi);
    };
  }, [pushEvent]);

  /* ── attach video source ─────────────────────────────────── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.src = source.url;
    v.load();
    if (runningRef.current) {
      v.play().catch(() => undefined);
    }
  }, [source.url]);

  /* ── resolution readout ──────────────────────────────────── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => setResolution(`${v.videoWidth}×${v.videoHeight}`);
    v.addEventListener("loadedmetadata", onMeta);
    return () => v.removeEventListener("loadedmetadata", onMeta);
  }, []);

  /* ── canvas sizing (device-pixel aware) ──────────────────── */
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      const v = videoRef.current;
      drawOverlay(
        canvas,
        v?.videoWidth ?? 0,
        v?.videoHeight ?? 0,
        lastTracksRef.current,
        { trails: trailsRef.current },
      );
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  /* ── the real-time detection loop ────────────────────────── */
  const loop = useCallback(
    async function tick(): Promise<void> {
      if (!runningRef.current) return;
      const v = videoRef.current;
      const canvas = canvasRef.current;
      const model = modelRef.current;

      if (
        v &&
        canvas &&
        model &&
        !v.paused &&
        !v.ended &&
        v.readyState >= 2 &&
        v.videoWidth > 0
      ) {
        try {
          const t0 = performance.now();
          const preds = await model.detect(
            v,
            24,
            Math.max(0.2, thresholdRef.current * 0.8),
          );
          const infer = performance.now() - t0;
          inferEmaRef.current =
            inferEmaRef.current === 0
              ? infer
              : inferEmaRef.current * 0.7 + infer * 0.3;

          const now = performance.now();
          if (lastFrameTsRef.current > 0) {
            const inst = 1000 / Math.max(1, now - lastFrameTsRef.current);
            fpsEmaRef.current =
              fpsEmaRef.current === 0
                ? inst
                : fpsEmaRef.current * 0.8 + inst * 0.2;
          }
          lastFrameTsRef.current = now;

          const thr = thresholdRef.current;
          const dets: Detection[] = preds
            .filter((p) => p.score >= thr && Boolean(CLASS_MAP[p.class]))
            .map((p) => ({
              cls: p.class,
              score: p.score,
              bbox: {
                x: p.bbox[0],
                y: p.bbox[1],
                w: p.bbox[2],
                h: p.bbox[3],
              },
            }));

          trackerRef.current.maxDist = Math.max(48, v.videoWidth * 0.05);
          const created = trackerRef.current.update(dets, performance.now());

          for (const tr of created) {
            const meta = CLASS_MAP[tr.cls];
            if (meta && meta.group !== "signal") {
              pushEvent(
                `شناسایی ${meta.fa} جدید · شناسه ${faNum(tr.id)} · اطمینان ${faNum(Math.round(tr.score * 100))}٪`,
                meta.color,
                "detect",
              );
            }
          }

          const area = v.videoWidth * v.videoHeight;
          const occ =
            dets.reduce(
              (s, d) =>
                s +
                (CLASS_MAP[d.cls].group === "signal"
                  ? 0
                  : d.bbox.w * d.bbox.h),
              0,
            ) / area;
          occEmaRef.current =
            occEmaRef.current === 0
              ? occ
              : occEmaRef.current * 0.7 + occ * 0.3;

          const tracks = trackerRef.current.active();
          lastTracksRef.current = tracks;
          drawOverlay(canvas, v.videoWidth, v.videoHeight, tracks, {
            trails: trailsRef.current,
          });
        } catch {
          /* most likely a CORS-tainted video frame */
          runningRef.current = false;
          setRunning(false);
          setFatal("cors");
          pushEvent(
            "دسترسی به پیکسل‌های ویدیو محدود شد — دوربین دیگری را امتحان کنید",
            "#f43f5e",
            "system",
          );
          return;
        }
      }
      rafRef.current = window.requestAnimationFrame(tick);
    },
    [pushEvent],
  );

  /* ── controls ────────────────────────────────────────────── */
  const start = useCallback(async () => {
    if (phase !== "ready") return;
    const v = videoRef.current;
    if (!v) {
      setFatal("playback");
      return;
    }
    try {
      v.muted = true;
      await v.play();
      setFatal(null);
      runningRef.current = true;
      lastFrameTsRef.current = 0;
      setRunning(true);
      pushEvent(
        `اتصال زنده به ${source.cam} · ${source.title} برقرار شد`,
        "#22d3ee",
        "system",
      );
      cancelAnimationFrame(rafRef.current);
      rafRef.current = window.requestAnimationFrame(loop);
    } catch {
      setFatal("playback");
    }
  }, [phase, loop, pushEvent, source]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    cancelAnimationFrame(rafRef.current);
    videoRef.current?.pause();
    pushEvent("پایش زنده متوقف شد", "#94a3b8", "system");
  }, [pushEvent]);

  const setThreshold = useCallback((val: number) => {
    thresholdRef.current = val;
    setThresholdState(val);
  }, []);

  const setTrails = useCallback((val: boolean) => {
    trailsRef.current = val;
    setTrailsState(val);
  }, []);

  const selectSource = useCallback(
    (id: string) => {
      if (id === sourceId) return;
      const src = SOURCES.find((s) => s.id === id) ?? SOURCES[0];
      trackerRef.current.reset();
      lastTracksRef.current = [];
      setHistory([]);
      setStats(ZERO);
      setResolution("—");
      lastLevelRef.current = 0;
      setSourceId(id);
      pushEvent(`تعویض دوربین → ${src.cam} · ${src.title}`, "#22d3ee", "system");
    },
    [sourceId, pushEvent],
  );

  /* ── live stats + event drain + history ──────────────────── */
  useEffect(() => {
    const id = setInterval(() => {
      if (queueRef.current.length) {
        const drained = queueRef.current.splice(0, 8);
        setEvents((prev) => [...drained, ...prev].slice(0, 30));
      }
      if (!runningRef.current) return;

      const tracker = trackerRef.current;
      const tracks = tracker.active();
      const livePerClass: Record<string, number> = {};
      let persons = 0;
      let vehicles = 0;
      let sumScore = 0;
      for (const t of tracks) {
        const meta = CLASS_MAP[t.cls];
        if (!meta) continue;
        livePerClass[t.cls] = (livePerClass[t.cls] ?? 0) + 1;
        if (meta.group === "person") persons += 1;
        else if (meta.group === "vehicle") {
          vehicles += 1;
          sumScore += t.score;
        }
      }
      const occ = occEmaRef.current;
      const level = trafficLevel(vehicles, occ);
      if (level !== lastLevelRef.current) {
        lastLevelRef.current = level;
        const lm = TRAFFIC_LEVELS[level];
        pushEvent(`تغییر وضعیت ترافیک → ${lm.fa}`, lm.color, "traffic");
      }
      setStats({
        fps: fpsEmaRef.current,
        inferMs: inferEmaRef.current,
        vehicles,
        persons,
        totalPassed: tracker.total,
        livePerClass,
        totalsPerClass: { ...tracker.totalsPerClass },
        avgScore: vehicles > 0 ? sumScore / vehicles : 0,
        occupancyPct: Math.min(100, Math.round(occ * 100)),
        level,
        densityPct: densityPercent(vehicles, occ),
      });
      const now = Date.now();
      if (now - lastHistTsRef.current >= 1000) {
        lastHistTsRef.current = now;
        setHistory((prev) => [...prev.slice(-89), { t: now, v: vehicles }]);
      }
    }, 420);
    return () => clearInterval(id);
  }, [pushEvent]);

  return {
    videoRef,
    canvasRef,
    wrapRef,
    phase,
    progress,
    bootLines,
    running,
    start,
    stop,
    threshold,
    setThreshold,
    trails,
    setTrails,
    source,
    selectSource,
    stats,
    events,
    history,
    fatal,
    resolution,
  };
}

export type TrafficVision = ReturnType<typeof useTrafficVision>;
