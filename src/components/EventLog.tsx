import { Radio } from "lucide-react";
import type { LogEvent } from "../lib/useTrafficVision";

interface Props {
  events: LogEvent[];
}

export default function EventLog({ events }: Props) {
  return (
    <div className="custom-scroll h-full min-h-0 space-y-1.5 overflow-y-auto pl-1">
      {events.length === 0 && (
        <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-3 text-center">
          <Radio className="h-7 w-7 animate-pulse text-slate-600" />
          <p className="text-xs leading-6 text-slate-500">
            هنوز رخدادی ثبت نشده است
            <br />
            پایش زنده را آغاز کنید
          </p>
        </div>
      )}
      {events.map((e) => (
        <div
          key={e.id}
          className="fade-in flex items-start gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-2.5 py-2"
        >
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: e.color, boxShadow: `0 0 8px ${e.color}` }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] leading-5 text-slate-300">{e.text}</p>
            <p className="mt-0.5 text-[10px] text-slate-600">
              {e.kind === "traffic"
                ? "تحلیل ترافیک"
                : e.kind === "system"
                  ? "سامانه"
                  : "تشخیص"}{" "}
              · {e.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
