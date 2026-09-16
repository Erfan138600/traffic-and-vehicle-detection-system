import { TRAFFIC_LEVELS, faNum } from "../lib/traffic";

interface Props {
  pct: number; // 0..100
  level: number; // 0..3
}

const CX = 110;
const CY = 106;
const R = 82;
const LEN = Math.PI * R;

const polar = (a: number, r: number = R) =>
  `${(CX + r * Math.cos(a)).toFixed(1)},${(CY + r * Math.sin(a)).toFixed(1)}`;

export default function Gauge({ pct, level }: Props) {
  const meta = TRAFFIC_LEVELS[level];
  const p = Math.max(0, Math.min(100, pct));
  const ticks = [0, 1, 2, 3, 4];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 132" className="w-full max-w-[230px]">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="38%" stopColor="#fbbf24" />
            <stop offset="68%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>

        {/* track */}
        <path
          d={`M ${polar(Math.PI)} A ${R} ${R} 0 0 1 ${polar(2 * Math.PI)}`}
          stroke="rgba(148,197,255,.12)"
          strokeWidth="11"
          fill="none"
          strokeLinecap="round"
        />
        {/* active */}
        <path
          d={`M ${polar(Math.PI)} A ${R} ${R} 0 0 1 ${polar(2 * Math.PI)}`}
          stroke="url(#gaugeGrad)"
          strokeWidth="11"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${((p / 100) * LEN).toFixed(1)} ${LEN.toFixed(1)}`}
          style={{
            transition: "stroke-dasharray .6s cubic-bezier(.4,0,.2,1)",
            filter: `drop-shadow(0 0 6px ${meta.color}66)`,
          }}
        />
        {/* ticks */}
        {ticks.map((i) => {
          const a = Math.PI + (i / 4) * Math.PI;
          return (
            <line
              key={i}
              x1={CX + (R - 14) * Math.cos(a)}
              y1={CY + (R - 14) * Math.sin(a)}
              x2={CX + (R - 21) * Math.cos(a)}
              y2={CY + (R - 21) * Math.sin(a)}
              stroke="rgba(148,197,255,.25)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}
        {/* needle */}
        <g
          style={{
            transform: `rotate(${(p / 100) * 180}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: "transform .6s cubic-bezier(.34,1.35,.5,1)",
          }}
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX + R - 30}
            y2={CY}
            stroke={meta.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(180 ${CX} ${CY})`}
          />
        </g>
        <circle cx={CX} cy={CY} r="7" fill="#0a121a" stroke={meta.color} strokeWidth="2" />
        <circle cx={CX} cy={CY} r="2.5" fill={meta.color} />
      </svg>

      <div className="-mt-5 flex flex-col items-center">
        <span
          className="text-2xl font-black transition-colors duration-500"
          style={{ color: meta.color, textShadow: `0 0 24px ${meta.color}80` }}
        >
          {meta.fa}
        </span>
        <span
          dir="ltr"
          className="mt-0.5 font-jmono text-[9px] tracking-[0.35em] text-slate-500"
        >
          {meta.en}
        </span>
        <span className="mt-2 text-[11px] text-slate-400">
          تراکم معبر:{" "}
          <b className="text-slate-200">{faNum(p)}٪</b>
        </span>
      </div>
    </div>
  );
}
