/**
 * ابزارهای عمومی سامانه — NIPCO Daily Equipment Control
 * طراح و تحلیلگر: محمد روشندل
 */
import { J_MONTHS, J_WEEKDAYS, jWeekday, type JDate } from "./jalali";

const FA = "۰۱۲۳۴۵۶۷۸۹";

/** تبدیل ارقام لاتین به فارسی */
export function fa(v: string | number): string {
  return String(v).replace(/[0-9]/g, (d) => FA[+d]);
}

/** فرمت تاریخ شمسی کوتاه: ۱۴۰۴/۰۵/۲۰ */
export function faDate(j: JDate): string {
  return fa(`${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`);
}

/** فرمت تاریخ شمسی بلند: سه‌شنبه ۲۰ مرداد ۱۴۰۴ */
export function faDateLong(j: JDate): string {
  return `${J_WEEKDAYS[jWeekday(j.jy, j.jm, j.jd)]} ${fa(j.jd)} ${J_MONTHS[j.jm - 1]} ${fa(j.jy)}`;
}

/** فرمت ساعت: ۱۴:۳۲:۰۵ */
export function faTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return fa(`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`);
}

export function faTimeShort(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return fa(`${p(d.getHours())}:${p(d.getMinutes())}`);
}

export function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

/** شناسه یکتا — برای کلید Idempotency در همگام‌سازی آفلاین (بند ۶۹) */
export function uid(): string {
  return "xxxxxxxx-xxxx-4xxx".replace(/x/g, () => ((Math.random() * 16) | 0).toString(16)) + "-" + Date.now().toString(36);
}

/** مولد اعداد شبه‌تصادفی قطعی برای داده‌های نمونه */
export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** دانلود فایل (خروجی CSV/JSON گزارش‌ها — بند ۵۴) */
export function download(name: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["\uFEFF" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

export function toCSV(headers: string[], rows: (string | number)[][]): string {
  const esc = (c: string | number) => `"${String(c).replace(/"/g, '""')}"`;
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

/** ماتریس شبه‌QR قطعی بر اساس کد تجهیز (نمایش بصری کد تجهیز — بند ۲۴) */
export function qrMatrix(code: string, size = 21): boolean[][] {
  let h = 2166136261;
  for (let i = 0; i < code.length; i++) {
    h ^= code.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rnd = mulberry(h >>> 0);
  const m: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) row.push(rnd() > 0.52);
    m.push(row);
  }
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        m[oy + y][ox + x] = edge || core;
      }
  };
  finder(0, 0); finder(size - 7, 0); finder(0, size - 7);
  return m;
}

/** الگوی بارکد Code128-مانند بر اساس کد (نمایش بصری) */
export function barcodeBars(code: string): number[] {
  let h = 5381;
  for (let i = 0; i < code.length; i++) h = ((h << 5) + h + code.charCodeAt(i)) >>> 0;
  const rnd = mulberry(h);
  const bars: number[] = [2, 1, 1, 2];
  for (let i = 0; i < code.length * 3; i++) bars.push(1 + Math.floor(rnd() * 3));
  bars.push(2, 1, 1, 2);
  return bars;
}

/** فرمت عدد با جداکننده هزارگان فارسی */
export function faNum(n: number, decimals = 0): string {
  return fa(n.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }));
}
