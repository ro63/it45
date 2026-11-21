/**
 * ============================================================
 * موتور تقویم شمسی (جلالی) — سامانه کنترل روزانه تجهیزات NIPCO
 * طراحی و تحلیل: محمد روشندل
 * ------------------------------------------------------------
 * مطابق بند ۲ سند تحلیل: تمامی تقویم‌ها، Date Pickerها، گزارش‌ها
 * و لاگ‌ها باید ۱۰۰٪ بر پایه تقویم شمسی باشند. این ماژول تبدیل‌های
 * دقیق میلادی <-> شمسی را بدون وابستگی خارجی پیاده‌سازی می‌کند.
 * ============================================================
 */

export interface JDate { jy: number; jm: number; jd: number }

const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
  2192, 2262, 2324, 2394, 2456, 3178,
];

const div = (a: number, b: number) => ~~(a / b);
const mod = (a: number, b: number) => a - ~~(a / b) * b;

function jalCal(jy: number) {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number) {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): JDate {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

/** میلادی به شمسی */
export function toJalaali(gy: number, gm: number, gd: number): JDate {
  return d2j(g2d(gy, gm, gd));
}

/** شمسی به میلادی */
export function fromJalaali(jy: number, jm: number, jd: number) {
  return d2g(j2d(jy, jm, jd));
}

export function isLeapJalaali(jy: number) {
  return jalCal(jy).leap === 0;
}

export function jMonthLength(jy: number, jm: number) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaali(jy) ? 30 : 29;
}

/** تاریخ شمسی امروز */
export function todayJ(): JDate {
  const n = new Date();
  return toJalaali(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

/** امروز شمسی با احتساب شیفت شب (بند ۳۳: شیفت ۲۲ تا ۶ به روز قبل تعلق دارد) */
export function workDateJ(d = new Date()): JDate {
  const base = new Date(d);
  if (base.getHours() < 6) base.setDate(base.getDate() - 1);
  return toJalaali(base.getFullYear(), base.getMonth() + 1, base.getDate());
}

export const J_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

export const J_WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

/** شماره روز هفته شمسی با شروع از شنبه (۰ = شنبه) */
export function jWeekday(jy: number, jm: number, jd: number) {
  const g = fromJalaali(jy, jm, jd);
  const d = new Date(g.gy, g.gm - 1, g.gd);
  return (d.getDay() + 1) % 7;
}

export function jToDate(j: JDate): Date {
  const g = fromJalaali(j.jy, j.jm, j.jd);
  return new Date(g.gy, g.gm - 1, g.gd);
}

export function jKey(j: JDate) {
  return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
}

export function jAddDays(j: JDate, days: number): JDate {
  const d = jToDate(j);
  d.setDate(d.getDate() + days);
  return toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** اختلاف روز بین دو تاریخ شمسی */
export function jDiffDays(a: JDate, b: JDate) {
  return Math.round((jToDate(a).getTime() - jToDate(b).getTime()) / 86400000);
}

/* ---------- شیفت‌ها (بند ۳۳) ---------- */
export interface ShiftInfo { id: number; name: string; range: string }
export const SHIFTS: ShiftInfo[] = [
  { id: 1, name: "شیفت ۱", range: "۰۶:۰۰ تا ۱۴:۰۰" },
  { id: 2, name: "شیفت ۲", range: "۱۴:۰۰ تا ۲۲:۰۰" },
  { id: 3, name: "شیفت ۳", range: "۲۲:۰۰ تا ۰۶:۰۰" },
];

/** تشخیص شیفت جاری بر اساس ساعت — شیفت ۳ پس از نیمه‌شب به همان شیفت شب قبل تعلق دارد */
export function currentShift(d = new Date()): number {
  const h = d.getHours();
  if (h >= 6 && h < 14) return 1;
  if (h >= 14 && h < 22) return 2;
  return 3;
}
