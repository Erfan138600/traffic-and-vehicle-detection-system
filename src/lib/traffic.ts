export type ClassGroup = "vehicle" | "person" | "signal";

export interface ClassMeta {
  fa: string;
  en: string;
  color: string;
  group: ClassGroup;
}

export const CLASS_MAP: Record<string, ClassMeta> = {
  car: { fa: "خودرو", en: "CAR", color: "#22d3ee", group: "vehicle" },
  truck: { fa: "کامیون", en: "TRUCK", color: "#f59e0b", group: "vehicle" },
  bus: { fa: "اتوبوس", en: "BUS", color: "#a78bfa", group: "vehicle" },
  motorcycle: {
    fa: "موتورسیکلت",
    en: "MOTO",
    color: "#34d399",
    group: "vehicle",
  },
  bicycle: { fa: "دوچرخه", en: "BICYCLE", color: "#bef264", group: "vehicle" },
  person: {
    fa: "عابر پیاده",
    en: "PEDESTRIAN",
    color: "#fb7185",
    group: "person",
  },
  "traffic light": {
    fa: "چراغ راهنما",
    en: "SIG",
    color: "#facc15",
    group: "signal",
  },
  "stop sign": {
    fa: "تابلوی توقف",
    en: "STOP",
    color: "#f87171",
    group: "signal",
  },
};

export const BREAKDOWN_ORDER = [
  "car",
  "truck",
  "bus",
  "motorcycle",
  "bicycle",
  "person",
] as const;

export interface TrafficLevelMeta {
  fa: string;
  en: string;
  color: string;
  desc: string;
}

export const TRAFFIC_LEVELS: TrafficLevelMeta[] = [
  {
    fa: "روان",
    en: "FREE FLOW",
    color: "#34d399",
    desc: "جریان ترافیک عادی و بدون اختلال است.",
  },
  {
    fa: "نیمه‌سنگین",
    en: "MODERATE",
    color: "#fbbf24",
    desc: "حجم خودروها در حال افزایش است.",
  },
  {
    fa: "سنگین",
    en: "HEAVY",
    color: "#fb923c",
    desc: "تراکم بالا؛ احتمال کندی و توقف‌های مقطعی.",
  },
  {
    fa: "قفل ترافیکی",
    en: "GRIDLOCK",
    color: "#f43f5e",
    desc: "اشباع شدید ظرفیت معبر؛ مداخله پیشنهاد می‌شود.",
  },
];

export function trafficLevel(vehicles: number, occupancy: number): number {
  const d = vehicles + occupancy * 26;
  if (d >= 17) return 3;
  if (d >= 11) return 2;
  if (d >= 5.5) return 1;
  return 0;
}

export function densityPercent(vehicles: number, occupancy: number): number {
  const est = Math.max(vehicles / 20, Math.min(1, occupancy * 2.6));
  return Math.round(Math.min(1, est) * 100);
}

export const faNum = (n: number, fd = 0): string => {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString("fa-IR", {
    minimumFractionDigits: fd,
    maximumFractionDigits: fd,
  });
};

export const faTime = (): string =>
  new Date().toLocaleTimeString("fa-IR", { hour12: false });

export interface VideoSource {
  id: string;
  cam: string;
  title: string;
  tag: string;
  url: string;
}

export const SOURCES: VideoSource[] = [
  {
    id: "cam-01",
    cam: "CAM-01",
    title: "بزرگراه شمالی",
    tag: "AERIAL · HIGHWAY",
    url: "https://videos.pexels.com/video-files/29538541/12715281_3840_2160_30fps.mp4",
  },
  {
    id: "cam-02",
    cam: "CAM-02",
    title: "بزرگراه چندخطه",
    tag: "AERIAL · EXPRESSWAY",
    url: "https://videos.pexels.com/video-files/2818521/2818521-uhd_3840_2160_24fps.mp4",
  },
  {
    id: "cam-03",
    cam: "CAM-03",
    title: "تقاطع مرکزی شهر",
    tag: "URBAN · INTERSECTION",
    url: "https://videos.pexels.com/video-files/33810501/14350708_3840_2160_60fps.mp4",
  },
];
