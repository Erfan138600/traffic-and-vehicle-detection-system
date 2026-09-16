export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Detection {
  cls: string;
  score: number;
  bbox: BBox;
}

export interface Track {
  id: number;
  cls: string;
  score: number;
  bbox: BBox;
  cx: number;
  cy: number;
  lastSeen: number;
  trail: { x: number; y: number }[];
}

const STALE_MS = 1400;
const TRAIL_MAX = 26;

/**
 * Simple greedy centroid tracker — assigns stable IDs across frames
 * so we can count unique vehicles passing through the view.
 */
export class CentroidTracker {
  tracks = new Map<number, Track>();
  maxDist: number;
  total = 0;
  totalsPerClass: Record<string, number> = {};
  private nextId = 1;

  constructor(maxDist = 96) {
    this.maxDist = maxDist;
  }

  update(dets: Detection[], now: number): Track[] {
    const created: Track[] = [];
    const used = new Set<number>();
    const pool = [...this.tracks.values()];

    for (const det of dets) {
      const cx = det.bbox.x + det.bbox.w / 2;
      const cy = det.bbox.y + det.bbox.h / 2;

      let best: Track | null = null;
      let bestD = this.maxDist;
      for (const t of pool) {
        if (used.has(t.id)) continue;
        const d = Math.hypot(t.cx - cx, t.cy - cy);
        if (d < bestD) {
          bestD = d;
          best = t;
        }
      }

      if (best) {
        best.cls = det.cls;
        best.score = det.score;
        best.bbox = det.bbox;
        best.cx = cx;
        best.cy = cy;
        best.lastSeen = now;
        const last = best.trail[best.trail.length - 1];
        if (!last || Math.hypot(last.x - cx, last.y - cy) > 6) {
          best.trail.push({ x: cx, y: cy });
          if (best.trail.length > TRAIL_MAX) best.trail.shift();
        }
        used.add(best.id);
      } else {
        const t: Track = {
          id: this.nextId++,
          cls: det.cls,
          score: det.score,
          bbox: det.bbox,
          cx,
          cy,
          lastSeen: now,
          trail: [{ x: cx, y: cy }],
        };
        this.tracks.set(t.id, t);
        created.push(t);
        this.total += 1;
        this.totalsPerClass[det.cls] = (this.totalsPerClass[det.cls] ?? 0) + 1;
      }
    }

    for (const [id, t] of this.tracks) {
      if (now - t.lastSeen > STALE_MS) this.tracks.delete(id);
    }

    return created;
  }

  active(): Track[] {
    return [...this.tracks.values()];
  }

  reset(): void {
    this.tracks.clear();
    this.total = 0;
    this.totalsPerClass = {};
    this.nextId = 1;
  }
}
