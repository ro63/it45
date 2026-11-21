/**
 * ============================================================
 * کتابخانه اجزای رابط کاربری + نمودارها + آیکون‌های SVG
 * سامانه کنترل روزانه تجهیزات NIPCO — طراح: محمد روشندل
 * ============================================================
 */
import React, { useEffect, useRef, useState } from "react";
import { J_MONTHS, J_WEEKDAYS, jMonthLength, jWeekday, jAddDays, todayJ, jKey, type JDate } from "../lib/jalali";
import { cx, fa, faDate, qrMatrix, barcodeBars } from "../lib/util";

/* ---------------- آیکون‌ها (SVG درون‌خط، بدون ایموجی) ---------------- */
const PATHS: Record<string, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7.5" height="9" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5" /><rect x="13.5" y="12" width="7.5" height="9" rx="1.5" /><rect x="3" y="15.5" width="7.5" height="5.5" rx="1.5" /></>,
  control: <><path d="M9 5h6" /><rect x="4" y="3.5" width="16" height="17" rx="2" /><path d="m8.5 12.5 2.4 2.4L15.5 10" /><path d="M8.5 16.8h7" /></>,
  reports: <><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M7 15v-4" /><path d="M11.5 15V7" /><path d="M16 15v-6.5" /><path d="M20.5 15V5" /></>,
  equipment: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" /></>,
  checklist: <><path d="M4 6.5h9M4 12h9M4 17.5h9" /><path d="m16.5 5.5 2 2 3-3" /><path d="m16.5 11 2 2 3-3" /><path d="m16.5 16.5 2 2 3-3" /></>,
  users: <><circle cx="9" cy="8" r="3.4" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 4.8a3.4 3.4 0 0 1 0 6.4" /><path d="M17.8 14.6c2 .9 3.2 2.9 3.2 5.4" /></>,
  settings: <><circle cx="12" cy="12" r="3.4" /><path d="M19.2 13.9a7.6 7.6 0 0 0 0-3.8l2-1.5-2-3.4-2.4 1a7.6 7.6 0 0 0-3.3-1.9L13 2h-2l-.5 2.3a7.6 7.6 0 0 0-3.3 1.9l-2.4-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3.8l-2 1.5 2 3.4 2.4-1a7.6 7.6 0 0 0 3.3 1.9L11 22h2l.5-2.3a7.6 7.6 0 0 0 3.3-1.9l2.4 1 2-3.4z" /></>,
  logs: <><path d="M4 5h16M4 10h16M4 15h10M4 20h7" /><circle cx="19" cy="18.5" r="2.6" /><path d="m18 18.5.8.8 1.4-1.5" /></>,
  bell: <><path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" /><path d="M10 19a2.2 2.2 0 0 0 4 0" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m20.5 20.5-4.8-4.8" /></>,
  scan: <><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" /><path d="M4 12h16" /></>,
  list: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 12.5h8M8 16h5" /></>,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  "chev-d": <path d="m6 9.5 6 6 6-6" />,
  "chev-s": <path d="m9.5 6 6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <><path d="M4.5 7h15" /><path d="M9 7V4.5h6V7" /><path d="M6.5 7 7.5 20h9L17.5 7" /><path d="M10 11v5M14 11v5" /></>,
  edit: <><path d="M4 20h4.5L20 8.5a2.1 2.1 0 0 0-3-3L5.5 17z" /><path d="m14.5 8 1.5 1.5" /></>,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  print: <><path d="M7 8V3h10v5" /><rect x="3" y="8" width="18" height="9" rx="2" /><path d="M7 14h10v7H7z" /></>,
  download: <><path d="M12 3v11" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M4 20h16" /></>,
  upload: <><path d="M12 14V3" /><path d="M7.5 6.5 12 2l4.5 4.5" /><path d="M4 20h16" /></>,
  logout: <><path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" /><path d="m17 8 4 4-4 4" /><path d="M21 12H10" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  wifi: <><path d="M2.5 9a15 15 0 0 1 19 0" /><path d="M5.5 12.5a10.5 10.5 0 0 1 13 0" /><path d="M8.6 16a6 6 0 0 1 6.8 0" /><circle cx="12" cy="19.4" r="1.1" fill="currentColor" /></>,
  "wifi-off": <><path d="m3 3 18 18" /><path d="M8.6 16a6 6 0 0 1 6.8 0" /><path d="M5.5 12.5a10.5 10.5 0 0 1 4.2-2.3M16 11a10.5 10.5 0 0 1 2.5 1.5" /><path d="M2.5 9a15 15 0 0 1 6.6-3.4M13.6 5.4A15 15 0 0 1 21.5 9" /><circle cx="12" cy="19.4" r="1.1" fill="currentColor" /></>,
  sync: <><path d="M20 5v5h-5" /><path d="M4 19v-5h5" /><path d="M19.4 13.5A7.6 7.6 0 0 1 6.2 17L4 14M4.6 10.5A7.6 7.6 0 0 1 17.8 7L20 10" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.4 2" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
  alert: <><path d="M12 3.5 1.8 20.5h20.4z" /><path d="M12 9.5v5" /><circle cx="12" cy="17.3" r=".4" fill="currentColor" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5" /><circle cx="12" cy="7.8" r=".5" fill="currentColor" /></>,
  lock: <><rect x="5" y="11" width="14" height="9.5" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  "eye-off": <><path d="m3 3 18 18" /><path d="M10.3 5.8A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-3 3.7M6.4 6.9A16.7 16.7 0 0 0 2.5 12S6 18.5 12 18.5a9.7 9.7 0 0 0 4.2-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.8-3.6 3.6-5.8 7-5.8s6.2 2.2 7 5.8" /></>,
  grip: <><circle cx="9" cy="6" r="1" fill="currentColor" /><circle cx="15" cy="6" r="1" fill="currentColor" /><circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" /><circle cx="9" cy="18" r="1" fill="currentColor" /><circle cx="15" cy="18" r="1" fill="currentColor" /></>,
  expand: <><path d="M9 3H4v5M15 3h5v5M9 21H4v-5M15 21h5v-5" /></>,
  reset: <><path d="M3.5 8A9 9 0 1 1 3 13.5" /><path d="M3 4v4.5h4.5" /></>,
  gauge: <><path d="M4.5 18a8.5 8.5 0 1 1 15 0" /><path d="m12 14 3.5-5" /><circle cx="12" cy="14.5" r="1.3" /></>,
  qr: <><rect x="3.5" y="3.5" width="7" height="7" rx="1" /><rect x="13.5" y="3.5" width="7" height="7" rx="1" /><rect x="3.5" y="13.5" width="7" height="7" rx="1" /><path d="M13.5 13.5h3v3h-3zM20.5 13.5v.01M17 20.5h3.5M13.5 20.5h.01" /></>,
  barcode: <><path d="M4 5v14M8 5v14M11 5v14M14 5v10M17 5v14M20 5v14" /><path d="M14 19h.01" /></>,
  filter: <path d="M4 5h16l-6.2 7.4V19l-3.6 2v-8.6z" />,
  palette: <><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-.9 2-2 0-1.5-1.3-1.7-1.3-3 0-1.2 1-2 2.3-2H17a4 4 0 0 0 4-4c0-4-4.5-7-9-7z" /><circle cx="7.5" cy="10.5" r="1" fill="currentColor" /><circle cx="10.5" cy="6.8" r="1" fill="currentColor" /><circle cx="15" cy="7" r="1" fill="currentColor" /></>,
  archive: <><rect x="3" y="4" width="18" height="5" rx="1" /><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" /><path d="M10 13h4" /></>,
  db: <><ellipse cx="12" cy="5.5" rx="8" ry="2.8" /><path d="M4 5.5v13c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-13" /><path d="M4 12c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8" /></>,
  shield: <><path d="M12 2.8 4.5 5.5v6c0 4.6 3.2 8 7.5 9.7 4.3-1.7 7.5-5.1 7.5-9.7v-6z" /><path d="m8.8 11.8 2.3 2.3 4.1-4.6" /></>,
  bolt: <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H13z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
  sms: <><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></>,
  history: <><path d="M3.5 8A9 9 0 1 1 3 13.5" /><path d="M3 4v4.5h4.5" /><path d="M12 8v4.5l3 1.8" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3.5 12.5 8.5 4.7 8.5-4.7" /><path d="m3.5 16.5 8.5 4.7 8.5-4.7" /></>,
  box: <><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5 12 12l8.5-4.5" /><path d="M12 12v9" /></>,
  factory: <><path d="M3 21V9l5 3V9l5 3V9l5 3V4h3v17z" /><path d="M7 17h2M12 17h2M17 17h2" /></>,
};

export function Icon({ name, size = 18, className, sw }: { name: string; size?: number; className?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw ?? 1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {PATHS[name] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}

/* ---------------- مدال ---------------- */
export function Modal({ open, onClose, title, children, width = 460, icon }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number; icon?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
      <div className="absolute inset-0 bg-black/60 anim-in" onClick={onClose} />
      <div className="relative card anim-pop w-full max-h-[88vh] overflow-auto" style={{ maxWidth: width, boxShadow: "var(--shadow)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
          <h3 className="font-bold text-[14px] flex items-center gap-2">
            {icon && <span style={{ color: "var(--primary)" }}><Icon name={icon} size={17} /></span>}
            {title}
          </h3>
          <button className="btn btn-ghost btn-sm !px-2" onClick={onClose} aria-label="بستن"><Icon name="x" size={15} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- مودال تایید (بند ۱۲: حذف Draft فقط با تایید صریح) ---------------- */
export function Confirm({ open, onClose, onYes, title, body, yesLabel = "بله، انجام شود", danger = true }: { open: boolean; onClose: () => void; onYes: () => void; title: string; body: string; yesLabel?: string; danger?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={400} icon={danger ? "alert" : "info"}>
      <p className="text-[13px] leading-6" style={{ color: "var(--soft)" }}>{body}</p>
      <div className="flex gap-2 mt-5 justify-end">
        <button className="btn btn-ghost" onClick={onClose}>انصراف</button>
        <button className={cx("btn", danger ? "btn-danger" : "btn-primary")} onClick={() => { onYes(); onClose(); }}>{yesLabel}</button>
      </div>
    </Modal>
  );
}

/* ---------------- نشان‌ها ---------------- */
export function Badge({ kind, children }: { kind: "ok" | "nok" | "warn" | "info" | "neutral" | "primary"; children: React.ReactNode }) {
  const map: Record<string, { bg: string; fg: string }> = {
    ok: { bg: "var(--okbg)", fg: "var(--ok)" },
    nok: { bg: "var(--nokbg)", fg: "var(--nok)" },
    warn: { bg: "var(--warnbg)", fg: "var(--warn)" },
    info: { bg: "var(--infobg)", fg: "var(--info)" },
    neutral: { bg: "var(--card2)", fg: "var(--soft)" },
    primary: { bg: "color-mix(in srgb, var(--primary) 14%, transparent)", fg: "var(--primary)" },
  };
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-md text-[11px] font-bold" style={{ background: map[kind].bg, color: map[kind].fg }}>
      {children}
    </span>
  );
}

export function Dot({ color, pulse }: { color: string; pulse?: boolean }) {
  return <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: color, animation: pulse ? "pulseDot 1.8s ease infinite" : undefined }} />;
}

/* ---------------- سوییچ ---------------- */
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex items-center gap-2.5 cursor-pointer select-none" aria-pressed={on}>
      <span className="relative w-10 h-[22px] rounded-full transition-colors duration-200" style={{ background: on ? "var(--ok)" : "var(--line2)" }}>
        <span className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all duration-200" style={{ right: on ? 3 : 21, boxShadow: "0 1px 4px rgba(0,0,0,.4)" }} />
      </span>
      {label && <span className="text-[12.5px] font-semibold" style={{ color: "var(--soft)" }}>{label}</span>}
    </button>
  );
}

/* ---------------- حالت خالی ---------------- */
export function Empty({ icon = "box", title, sub }: { icon?: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center anim-in">
      <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--card2)", color: "var(--muted)", border: "1px dashed var(--line2)" }}>
        <Icon name={icon} size={26} />
      </div>
      <p className="font-bold text-[13.5px]">{title}</p>
      {sub && <p className="text-[12px] mt-1 max-w-[300px] leading-5" style={{ color: "var(--muted)" }}>{sub}</p>}
    </div>
  );
}

/* ---------------- تقویم شمسی (Date Picker) — بند ۲ ---------------- */
export function JDatePicker({ value, onChange, placeholder = "انتخاب تاریخ" }: { value: JDate | null; onChange: (j: JDate) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<JDate>(value ?? todayJ());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const len = jMonthLength(view.jy, view.jm);
  const startWd = jWeekday(view.jy, view.jm, 1);
  const today = todayJ();
  const cells: (number | null)[] = [...Array(startWd).fill(null), ...Array.from({ length: len }, (_, i) => i + 1)];

  return (
    <div className="relative" ref={ref}>
      <button type="button" className="input flex items-center gap-2 text-right cursor-pointer" onClick={() => setOpen(!open)}>
        <span style={{ color: "var(--primary)" }}><Icon name="calendar" size={15} /></span>
        <span className={value ? "" : "opacity-50"}>{value ? faDate(value) : placeholder}</span>
      </button>
      {open && (
        <div className="absolute z-40 top-[calc(100%+6px)] right-0 card p-3 w-[262px] anim-pop" style={{ boxShadow: "var(--shadow)" }}>
          <div className="flex items-center justify-between mb-2">
            <button className="btn btn-ghost btn-sm !px-2" onClick={() => setView((v) => (v.jm === 1 ? { jy: v.jy - 1, jm: 12, jd: 1 } : { ...v, jm: v.jm - 1 }))}><Icon name="chev-s" size={14} className="rotate-180" /></button>
            <div className="flex items-center gap-1.5 font-bold text-[12.5px]">
              <span>{J_MONTHS[view.jm - 1]}</span>
              <span className="num text-[13px]" style={{ color: "var(--primary)" }}>{fa(view.jy)}</span>
            </div>
            <button className="btn btn-ghost btn-sm !px-2" onClick={() => setView((v) => (v.jm === 12 ? { jy: v.jy + 1, jm: 1, jd: 1 } : { ...v, jm: v.jm + 1 }))}><Icon name="chev-s" size={14} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {J_WEEKDAYS.map((w) => <div key={w} className="text-center text-[10px] font-bold py-1" style={{ color: "var(--muted)" }}>{w.slice(0, 3)}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              const isSel = value && d && value.jy === view.jy && value.jm === view.jm && value.jd === d;
              const isToday = d && today.jy === view.jy && today.jm === view.jm && today.jd === d;
              return d ? (
                <button key={i} onClick={() => { onChange({ jy: view.jy, jm: view.jm, jd: d }); setOpen(false); }}
                  className="h-8 rounded-md text-[12px] font-semibold transition-all num cursor-pointer"
                  style={{
                    background: isSel ? "var(--primary)" : "transparent",
                    color: isSel ? "var(--primary-contrast)" : isToday ? "var(--primary)" : "var(--text)",
                    border: isToday && !isSel ? "1px solid var(--primary)" : "1px solid transparent",
                  }}>
                  {fa(d)}
                </button>
              ) : <span key={i} />;
            })}
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t" style={{ borderColor: "var(--line)" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { const t = todayJ(); onChange(t); setOpen(false); }}>امروز</button>
            <div className="flex gap-1 items-center text-[11px]" style={{ color: "var(--muted)" }}>
              <button className="btn btn-ghost btn-sm !px-2 !py-1" onClick={() => setView((v) => ({ ...v, jy: v.jy - 1 }))}>−۱ سال</button>
              <button className="btn btn-ghost btn-sm !px-2 !py-1" onClick={() => setView((v) => ({ ...v, jy: v.jy + 1 }))}>+۱ سال</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- QR و بارکد تجهیز (بند ۲۴) ---------------- */
export function QRBox({ code, size = 132 }: { code: string; size?: number }) {
  const m = qrMatrix(code);
  const cell = size / m.length;
  return (
    <svg width={size} height={size} className="rounded-lg" style={{ background: "#fff" }}>
      {m.map((row, y) => row.map((v, x) => v ? <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#101317" /> : null))}
    </svg>
  );
}

export function BarcodeBox({ code, w = 190, h = 54 }: { code: string; w?: number; h?: number }) {
  const bars = barcodeBars(code);
  const total = bars.reduce((a, b) => a + b, 0);
  let x = 0;
  return (
    <svg width={w} height={h} style={{ background: "#fff" }} className="rounded-md">
      {bars.map((b, i) => {
        const bw = (b / total) * w;
        const el = i % 2 === 0 ? <rect key={i} x={x} y={0} width={bw} height={h} fill="#101317" /> : null;
        x += bw;
        return el;
      })}
    </svg>
  );
}

/* ---------------- نمودارها (SVG خالص با تقویم شمسی) ---------------- */
export function Bars({ data, color = "var(--primary)", h = 130, highlight }: { data: { label: string; value: number }[]; color?: string; h?: number; highlight?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      <div className="flex items-end gap-[6px]" style={{ height: h }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
            <div className="absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold num px-1.5 py-0.5 rounded" style={{ background: "var(--card2)", border: "1px solid var(--line)", color: "var(--text)", transform: "translateY(-100%)" }}>
              {fa(d.value)}
            </div>
            <div className="w-full rounded-t-[4px] transition-all duration-500 group-hover:opacity-80" style={{
              height: `${Math.max(4, (d.value / max) * 100)}%`,
              background: highlight === i ? "var(--nok)" : color,
              minHeight: 4,
            }} />
          </div>
        ))}
      </div>
      <div className="flex gap-[6px] mt-1.5">
        {data.map((d, i) => <div key={i} className="flex-1 text-center text-[9.5px] num" style={{ color: "var(--muted)" }}>{d.label}</div>)}
      </div>
    </div>
  );
}

export function LineArea({ data, labels, color = "var(--accent)", h = 140 }: { data: number[]; labels: string[]; color?: string; h?: number }) {
  const w = 320;
  const max = Math.max(1, ...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [(i / Math.max(1, data.length - 1)) * (w - 16) + 8, h - 14 - ((v - min) / span) * (h - 34)]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${h - 12} L${pts[0][0]},${h - 12} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="8" x2={w - 8} y1={h - 14 - g * (h - 34)} y2={h - 14 - g * (h - 34)} stroke="var(--line)" strokeDasharray="3 4" strokeWidth="1" />)}
        <path d={area} fill={color} opacity="0.13" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.6" fill="var(--card)" stroke={color} strokeWidth="1.8" />)}
      </svg>
      <div className="flex justify-between px-1 mt-1">
        {labels.map((l, i) => <span key={i} className="text-[9.5px] num" style={{ color: "var(--muted)" }}>{l}</span>)}
      </div>
    </div>
  );
}

export function Donut({ segs, size = 128, thick = 15, center, sub }: { segs: { value: number; color: string; label: string }[]; size?: number; thick?: number; center?: string; sub?: string }) {
  const total = Math.max(1, segs.reduce((a, s) => a + s.value, 0));
  const r = (size - thick) / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--card2)" strokeWidth={thick} />
        {segs.map((s, i) => {
          const frac = s.value / total;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thick}
              strokeDasharray={`${frac * C} ${C}`} strokeDashoffset={-acc * C} strokeLinecap="butt" className="transition-all duration-700" />
          );
          acc += frac;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {center && <span className="num text-[22px] leading-none">{center}</span>}
        {sub && <span className="text-[10px] mt-1 font-semibold" style={{ color: "var(--muted)" }}>{sub}</span>}
      </div>
    </div>
  );
}

/* ---------------- اعلان‌های Toast (بند ۶۲) ---------------- */
export function ToastHost({ toasts }: { toasts: { id: number; kind: "ok" | "err" | "info"; msg: string }[] }) {
  const style = { ok: { c: "var(--ok)", i: "check" }, err: { c: "var(--nok)", i: "alert" }, info: { c: "var(--info)", i: "info" } };
  return (
    <div className="fixed bottom-5 left-5 z-[70] flex flex-col gap-2 max-w-[340px]" dir="rtl">
      {toasts.map((t) => (
        <div key={t.id} className="card flex items-center gap-3 px-4 py-3 anim-pop" style={{ boxShadow: "var(--shadow)", borderRight: `3px solid ${style[t.kind].c}` }}>
          <span style={{ color: style[t.kind].c }}><Icon name={style[t.kind].i} size={17} /></span>
          <span className="text-[12.5px] font-semibold leading-5">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- شمارنده زنده ---------------- */
export function useNow(interval = 1000): Date {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

/* ---------------- برچسب وضعیت تجهیزات/کنترل ---------------- */
export function StatusBadge({ s }: { s: string }) {
  if (s === "Completed" || s === "active") return <Badge kind="ok">{s === "Completed" ? "تکمیل‌شده" : "فعال"}</Badge>;
  if (s === "NOK") return <Badge kind="nok">نامنطبق NOK</Badge>;
  if (s === "Draft" || s === "pending") return <Badge kind="warn">پیش‌نویس</Badge>;
  if (s === "synced") return <Badge kind="ok">همگام‌شده</Badge>;
  if (s === "inactive") return <Badge kind="neutral">غیرفعال</Badge>;
  return <Badge kind="info">{s}</Badge>;
}

export { jAddDays, todayJ, jKey, faDate, cx, fa };
