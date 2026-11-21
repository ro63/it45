/**
 * داده‌های اولیه (Seed) سامانه کنترل روزانه تجهیزات NIPCO
 * طراح و تحلیلگر: محمد روشندل
 * ------------------------------------------------------------
 * بندهای ۲۱ و ۲۲: پرس‌ها (بدون پرس شماره ۶)، ربات‌های ABB-01..07،
 * کمپرسورهای 01..04، لیفتراک‌های 01..05 و تجهیزات داینامیک موتورخانه.
 * تاریخچه ۲۱ روزه به‌صورت قطعی تولید می‌شود تا سامانه همیشه زنده باشد.
 */
import { jAddDays, todayJ, jKey, jToDate, type JDate } from "./jalali";
import { mulberry, uid } from "./util";
import {
  type AppState, type Checklist, type ControlRec, type Draft, type Equipment,
  type Group, type OpReading, type User, type Answer,
} from "./types";

const G = {
  press: "g-press", robot: "g-robot", comp: "g-comp",
  fork: "g-fork", engine: "g-engine", util: "g-util",
};

const groups: Group[] = [
  { id: G.press, name: "پرس هیدرولیک", active: true, icon: "press" },
  { id: G.robot, name: "ربات ABB", active: true, icon: "robot" },
  { id: G.comp, name: "کمپرسور", active: true, icon: "comp" },
  { id: G.fork, name: "لیفتراک", active: true, icon: "fork" },
  { id: G.engine, name: "موتورخانه", active: true, icon: "engine" },
  { id: G.util, name: "تأسیسات", active: true, icon: "util" },
];

function eq(id: string, code: string, name: string, groupId: string, brand: string, model: string, serial: string, capacity: string, hall: string, line: string, area: string, commission: JDate): Equipment {
  return { id, code, name, groupId, brand, model, serial, capacity, hall, line, area, status: "active", commission, desc: "" };
}

const c1398: JDate = { jy: 1398, jm: 4, jd: 12 };
const equipment: Equipment[] = [
  eq("e-prs1000", "PRS-1000", "پرس هیدرولیک ۱۰۰۰ تن", G.press, "Schuler", "HZ-1000", "SCH-88410", "۱۰۰۰ تن", "سالن ۱", "خط پرس", "ایستگاه A", c1398),
  eq("e-prs1200", "PRS-1200", "پرس هیدرولیک ۱۲۰۰ تن", G.press, "Schuler", "HZ-1200", "SCH-88411", "۱۲۰۰ تن", "سالن ۱", "خط پرس", "ایستگاه B", c1398),
  eq("e-prs1500", "PRS-1500", "پرس هیدرولیک ۱۵۰۰ تن", G.press, "AIDA", "NC-1500", "AID-30217", "۱۵۰۰ تن", "سالن ۱", "خط پرس", "ایستگاه C", { jy: 1399, jm: 2, jd: 3 }),
  eq("e-prs2000", "PRS-2000", "پرس هیدرولیک ۲۰۰۰ تن", G.press, "AIDA", "NC-2000", "AID-30218", "۲۰۰۰ تن", "سالن ۲", "خط پرس سنگین", "ایستگاه A", { jy: 1400, jm: 7, jd: 20 }),
  eq("e-prs1200a", "PRS-1200A", "پرس ۱۲۰۰ تن عابدی", G.press, "عابدی", "AB-1200", "ABD-1102", "۱۲۰۰ تن", "سالن ۲", "خط پرس", "ایستگاه D", { jy: 1395, jm: 11, jd: 1 }),
  ...Array.from({ length: 7 }, (_, i) =>
    eq(`e-rbt${i + 1}`, `RBT-0${i + 1}`, `ربات ABB-0${i + 1}`, G.robot, "ABB", "IRB 6700", `ABB-670${i + 10}`, "۲۳۵ کیلوگرم", "سالن ۳", "خط رباتیک", `سلول ${i + 1}`, { jy: 1401, jm: 3, jd: 15 })),
  ...Array.from({ length: 4 }, (_, i) =>
    eq(`e-cmp${i + 1}`, `CMP-0${i + 1}`, `کمپرسور 0${i + 1}`, G.comp, "Atlas Copco", "GA 75", `AC-75${i + 20}`, "۷۵ کیلووات", "موتورخانه", "هوای فشرده", `بی ${i + 1}`, { jy: 1397, jm: 5, jd: 10 })),
  ...Array.from({ length: 5 }, (_, i) =>
    eq(`e-flt${i + 1}`, `FLT-0${i + 1}`, `لیفتراک 0${i + 1}`, G.fork, "Toyota", "8FGU25", `TY-25${i + 30}`, "۲.۵ تن", "انبار", "ناحیه لجستیک", `دروازه ${i + 1}`, { jy: 1399, jm: 9, jd: 5 })),
  eq("e-enr1", "ENR-01", "بویلر موتورخانه", G.engine, "Bosch", "Uni 8000", "BOS-8801", "۸۰۰ کیلووات", "موتورخانه", "بخار", "بی ۱", c1398),
  eq("e-enr2", "ENR-02", "پمپ سیرکولاتور", G.engine, "Grundfos", "CR 95", "GF-9512", "۹۵ مترمکعب/ساعت", "موتورخانه", "آب گرم", "بی ۲", c1398),
  eq("e-enr3", "ENR-03", "چیلر تراکمی", G.util, "Carrier", "30XA", "CAR-3045", "۵۰۰ کیلووات", "پشت‌بام", "برودتی", "ناحیه ۱", { jy: 1400, jm: 1, jd: 18 }),
];

const checklists: Checklist[] = [
  {
    id: "cl-press", title: "کنترل روزانه پرس هیدرولیک", targetType: "group", targetId: G.press, active: true, opHours: false,
    sections: [
      {
        id: "s-p-mech", title: "مکانیک و هیدرولیک", depts: [],
        items: [
          { id: "i-p1", title: "سطح روغن هیدرولیک در محدوده مجاز", kind: "oknok", required: true },
          { id: "i-p2", title: "عدم نشتی روغن در شلنگ‌ها و اتصالات", kind: "oknok", required: true },
          { id: "i-p3", title: "فشار سیستم هیدرولیک", kind: "numeric", unit: "bar", min: 180, max: 220, prec: 0, required: true },
          { id: "i-p4", title: "سفت بودن قالب و گیره‌ها", kind: "oknok", required: true },
        ],
      },
      {
        id: "s-p-elec", title: "برق و ایمنی", depts: ["نت", "برق"],
        items: [
          { id: "i-p5", title: "عملکرد توقف اضطراری", kind: "oknok", required: true },
          { id: "i-p6", title: "پرده نوری ایمنی", kind: "oknok", required: true },
          { id: "i-p7", title: "ولتاژ تابلو اصلی", kind: "numeric", unit: "V", min: 380, max: 420, prec: 0, required: true },
        ],
      },
      {
        id: "s-p-op", title: "بازرسی اپراتوری", depts: [],
        items: [
          { id: "i-p8", title: "عدم صدای غیرعادی در سیکل کاری", kind: "oknok", required: true },
          { id: "i-p9", title: "نظافت محدوده کار و میز پرس", kind: "oknok", required: true },
        ],
      },
    ],
  },
  {
    id: "cl-robot", title: "کنترل روزانه ربات ABB", targetType: "group", targetId: G.robot, active: true, opHours: false,
    sections: [
      {
        id: "s-r-mech", title: "مکانیک", depts: [],
        items: [
          { id: "i-r1", title: "سفتی مفاصل و گیربکس‌ها", kind: "oknok", required: true },
          { id: "i-r2", title: "عدم نشتی گریس از مفاصل", kind: "oknok", required: true },
          { id: "i-r3", title: "خطای کالیبراسیون نقطه صفر", kind: "numeric", unit: "درجه", min: 0, max: 2, prec: 1, required: true },
        ],
      },
      {
        id: "s-r-elec", title: "برق و کنترل", depts: ["نت", "برق"],
        items: [
          { id: "i-r4", title: "سلامت کابل‌ها و کانکتورها", kind: "oknok", required: true },
          { id: "i-r5", title: "ولتاژ ورودی درایو", kind: "numeric", unit: "V", min: 380, max: 420, prec: 0, required: true },
          { id: "i-r6", title: "عدم آلارم فعال روی کنترلر", kind: "oknok", required: true },
        ],
      },
      {
        id: "s-r-safe", title: "ایمنی", depts: [],
        items: [
          { id: "i-r7", title: "فنس حفاظتی و اینترلاک درب‌ها", kind: "oknok", required: true },
          { id: "i-r8", title: "کلید توقف اضطراری", kind: "oknok", required: true },
        ],
      },
    ],
  },
  {
    id: "cl-comp", title: "کنترل روزانه کمپرسور", targetType: "group", targetId: G.comp, active: true, opHours: true,
    sections: [
      {
        id: "s-c-util", title: "تأسیسات و مکانیک", depts: [],
        items: [
          { id: "i-c1", title: "فشار هوای خروجی", kind: "numeric", unit: "bar", min: 7, max: 9.5, prec: 1, required: true },
          { id: "i-c2", title: "سطح روغن کمپرسور", kind: "oknok", required: true },
          { id: "i-c3", title: "عدم صدای غیرعادی و لرزش", kind: "oknok", required: true },
          { id: "i-c4", title: "تخلیه درین مخزن", kind: "oknok", required: true },
          { id: "i-c5", title: "دمای هوای خروجی", kind: "numeric", unit: "°C", min: 60, max: 95, prec: 0, required: true },
        ],
      },
      {
        id: "s-c-safe", title: "ایمنی و ابزار دقیق", depts: ["نت", "تأسیسات"],
        items: [
          { id: "i-c6", title: "سوپاپ اطمینان", kind: "oknok", required: true },
          { id: "i-c7", title: "صحت گیج‌ها و نشانگرها", kind: "oknok", required: true },
        ],
      },
    ],
  },
  {
    id: "cl-fork", title: "کنترل روزانه لیفتراک", targetType: "group", targetId: G.fork, active: true, opHours: true,
    sections: [
      {
        id: "s-f-mech", title: "مکانیک و هیدرولیک", depts: [],
        items: [
          { id: "i-f1", title: "عملکرد ترمزها", kind: "oknok", required: true },
          { id: "i-f2", title: "شاخک‌ها، زنجیر و دکل", kind: "oknok", required: true },
          { id: "i-f3", title: "عدم نشتی هیدرولیک", kind: "oknok", required: true },
          { id: "i-f4", title: "وضعیت لاستیک‌ها", kind: "oknok", required: true },
        ],
      },
      {
        id: "s-f-elec", title: "برق", depts: [],
        items: [
          { id: "i-f5", title: "باتری و سیستم شارژ", kind: "oknok", required: true },
          { id: "i-f6", title: "بوق، چراغ‌ها و آینه‌ها", kind: "oknok", required: true },
        ],
      },
      {
        id: "s-f-safe", title: "ایمنی", depts: [],
        items: [
          { id: "i-f7", title: "کمربند و حفاظ سقف راننده", kind: "oknok", required: true },
        ],
      },
    ],
  },
  {
    id: "cl-prs2000", title: "کنترل ویژه پرس ۲۰۰۰ تن (کوشن)", targetType: "equipment", targetId: "e-prs2000", active: true, opHours: false,
    sections: [
      {
        id: "s-k-cush", title: "یونیت کوشن", depts: [],
        items: [
          { id: "i-k1", title: "فشار کوشن", kind: "numeric", unit: "bar", min: 120, max: 160, prec: 0, required: true },
          { id: "i-k2", title: "پین‌های کوشن و صفحه حامل", kind: "oknok", required: true },
        ],
      },
    ],
  },
];

const users: User[] = [
  { id: "u-admin", username: "admin", name: "محمد روشندل", role: "admin", shift: 1, dept: "نت", active: true, pass: "admin123" },
  { id: "u-sup", username: "supervisor", name: "رضا کریمی", role: "supervisor", shift: 1, dept: "نت", active: true, pass: "1234" },
  { id: "u-eng", username: "engineer", name: "سارا محمدی", role: "engineer", shift: 1, dept: "نت", active: true, pass: "1234" },
  { id: "u-t1", username: "tech1", name: "علی رضایی", role: "technician", shift: 1, dept: "مکانیک", active: true, pass: "1234" },
  { id: "u-t2", username: "tech2", name: "حسین موسوی", role: "technician", shift: 2, dept: "برق", active: true, pass: "1234" },
  { id: "u-t3", username: "tech3", name: "مریم احمدی", role: "technician", shift: 3, dept: "تأسیسات", active: true, pass: "1234" },
  { id: "u-view", username: "viewer", name: "ناظر تولید", role: "viewer", shift: 1, dept: "تولید", active: true, pass: "1234" },
];

/** کنترل‌های مربوط به یک تجهیز (گروهی + اختصاصی) */
export function checklistsFor(eqId: string, cls: Checklist[]): Checklist[] {
  const e = equipment.find((x) => x.id === eqId);
  if (!e) return [];
  return cls.filter((c) => c.active && ((c.targetType === "group" && c.targetId === e.groupId) || (c.targetType === "equipment" && c.targetId === eqId)));
}

export function buildSeed(): AppState {
  const rnd = mulberry(1404);
  const today = todayJ();
  const controls: ControlRec[] = [];
  const readings: OpReading[] = [];
  const techs = ["u-t1", "u-t2", "u-t3"];
  const hours: Record<string, number> = {};
  equipment.forEach((e) => {
    if (e.groupId === G.comp) hours[e.id] = 11200 + Math.floor(rnd() * 3000);
    if (e.groupId === G.fork) hours[e.id] = 2800 + Math.floor(rnd() * 2500);
  });

  // تولید تاریخچه ۲۱ روزه (به جز امروز)
  for (let off = 21; off >= 1; off--) {
    const d = jAddDays(today, -off);
    const dayKey = jKey(d);
    const shiftTech = off % 3;
    // هر روز زیرمجموعه‌ای از تجهیزات کنترل می‌شوند
    const pool = equipment.filter((e) => e.status === "active" && checklistsFor(e.id, checklists).length > 0);
    pool.forEach((e, idx) => {
      if ((idx + off) % 3 === 2) return; // پوشش چرخشی
      const cl = checklistsFor(e.id, checklists)[0];
      const answers: Record<string, Answer> = {};
      let nok = false; let oor = false;
      cl.sections.forEach((s) =>
        s.items.forEach((it) => {
          if (it.kind === "oknok") {
            const ok = rnd() > (off % 7 === 0 ? 0.12 : 0.045);
            answers[it.id] = { ok };
            if (!ok) nok = true;
          } else {
            const span = (it.max! - it.min!);
            const out = rnd() < 0.05;
            let v = it.min! + span * (0.2 + rnd() * 0.6);
            if (out) v = it.max! + span * 0.1 * (rnd() + 0.3);
            v = +v.toFixed(it.prec ?? 0);
            answers[it.id] = { num: v };
            if (v < it.min! || v > it.max!) oor = true;
          }
        }));
      const tech = techs[(shiftTech + idx) % 3];
      const dt = jToDate(d); dt.setHours(7 + (idx % 8), 5 + Math.floor(rnd() * 50), 0, 0);
      const rec: ControlRec = {
        id: `c-${off}-${idx}`, uuid: uid(), equipmentId: e.id, checklistId: cl.id,
        date: d, dateKey: dayKey, timeISO: dt.toISOString(), shift: (idx % 3) + 1, techId: tech,
        answers, notes: nok || oor ? "مورد نامنطبق شناسایی شد؛ اقدام اصلاحی به واحد نت ارجاع گردید." : "",
        status: nok || oor ? "NOK" : "Completed",
        failLoc: nok ? ["یونیت هیدرولیک", "سنسور", "تابلو برق", "سیستم ایمنی"][Math.floor(rnd() * 4)] : undefined,
        syncState: "synced", createdAt: dt.getTime(),
      };
      controls.push(rec);
      // ساعت کارکرد فقط برای کمپرسور و لیفتراک (بند ۳۸)
      if (cl.opHours && hours[e.id] !== undefined) {
        const prev = hours[e.id];
        const next = prev + (e.groupId === G.comp ? 6 + rnd() * 3 : 4 + rnd() * 4);
        hours[e.id] = Math.round(next * 10) / 10;
        readings.push({
          id: `r-${off}-${idx}`, equipmentId: e.id, date: d, dateKey: dayKey,
          timeISO: dt.toISOString(), shift: rec.shift, prev, next: hours[e.id],
          diff: +(hours[e.id] - prev).toFixed(1), source: off % 4 === 0 ? "MANUAL" : "AUTO", userId: tech,
        });
        rec.opHours = { value: hours[e.id], prev, source: off % 4 === 0 ? "MANUAL" : "AUTO" };
      }
    });
  }

  // امروز: چند کنترل تکمیل‌شده + یک NOK + یک پیش‌نویس برای نمایش جریان کاری
  const controlsToday: ControlRec[] = [];
  const mkToday = (eqId: string, clId: string, tech: string, hour: number, forceNok?: string): ControlRec => {
    const cl = checklists.find((c) => c.id === clId)!;
    const answers: Record<string, Answer> = {};
    cl.sections.forEach((s) =>
      s.items.forEach((it) => {
        if (it.kind === "oknok") answers[it.id] = { ok: it.id !== forceNok };
        else {
          const span = it.max! - it.min!;
          answers[it.id] = { num: +(it.min! + span * (0.3 + rnd() * 0.4)).toFixed(it.prec ?? 0) };
        }
      }));
    const dt = new Date(); dt.setHours(hour, 12 + Math.floor(rnd() * 40), 0, 0);
    return {
      id: `c-today-${eqId}-${clId}`, uuid: uid(), equipmentId: eqId, checklistId: clId,
      date: today, dateKey: jKey(today), timeISO: dt.toISOString(), shift: hour < 14 ? 1 : 2, techId: tech,
      answers, notes: forceNok ? "نشتی روغن از شلنگ فشارقوی مشاهده شد؛ تجهیز تحت پایش و دستور کار صادر گردید." : "",
      status: forceNok ? "NOK" : "Completed",
      failLoc: forceNok ? "یونیت هیدرولیک" : undefined,
      syncState: "synced", createdAt: dt.getTime(),
    };
  };
  controlsToday.push(mkToday("e-cmp1", "cl-comp", "u-t1", 7));
  controlsToday.push(mkToday("e-flt1", "cl-fork", "u-t1", 7));
  controlsToday.push(mkToday("e-rbt1", "cl-robot", "u-t2", 8));
  controlsToday.push(mkToday("e-prs1500", "cl-press", "u-t1", 9, "i-p2"));
  controlsToday.forEach((c) => {
    controls.push(c);
    const e = equipment.find((x) => x.id === c.equipmentId)!;
    const cl = checklists.find((x) => x.id === c.checklistId)!;
    if (cl.opHours && hours[e.id] !== undefined) {
      const prev = hours[e.id];
      hours[e.id] = +(prev + (e.groupId === G.comp ? 7.2 : 5.4)).toFixed(1);
      readings.push({
        id: `r-today-${e.id}`, equipmentId: e.id, date: today, dateKey: jKey(today),
        timeISO: c.timeISO, shift: c.shift, prev, next: hours[e.id], diff: +(hours[e.id] - prev).toFixed(1),
        source: "AUTO", userId: c.techId,
      });
      c.opHours = { value: hours[e.id], prev, source: "AUTO" };
    }
  });

  // پیش‌نویس ناتمام تکنسین ۱ روی پرس ۱۰۰۰ تن (نمایش قابلیت ادامه Draft)
  const draftCl = checklists[0];
  const draftAnswers: Record<string, Answer> = {
    "i-p1": { ok: true }, "i-p2": { ok: true }, "i-p3": { num: 205 },
  };
  const drafts: Draft[] = [
    {
      id: "draft-1", uuid: uid(), equipmentId: "e-prs1000", checklistId: "cl-press",
      date: today, dateKey: jKey(today), shift: 1, techId: "u-t1",
      answers: draftAnswers, notes: "", updatedAt: Date.now() - 42 * 60000,
    },
  ];

  const t0 = Date.now();
  return {
    users, groups, equipment, checklists, controls, drafts, readings,
    logs: [
      { id: "lg1", t: t0 - 3600e3 * 5, userId: "u-admin", userName: "محمد روشندل", type: "سیستم", desc: "بکاپ خودکار روزانه با موفقیت انجام شد" },
      { id: "lg2", t: t0 - 3600e3 * 4, userId: "u-t1", userName: "علی رضایی", type: "کنترل روزانه", desc: "کنترل روزانه پرس ۱۵۰۰ تن ثبت شد — نتیجه NOK" },
      { id: "lg3", t: t0 - 3600e3 * 3, userId: "u-sup", userName: "رضا کریمی", type: "تجهیزات", desc: "وضعیت چیلر تراکمی به فعال تغییر یافت" },
      { id: "lg4", t: t0 - 3600e3 * 1.5, userId: "u-admin", userName: "محمد روشندل", type: "ورود", desc: "ورود به سامانه از آدرس ۱۹۲.۱۶۸.۱.۲۰" },
    ],
    notifs: [
      { id: "n1", t: t0 - 3600e3 * 3.9, kind: "nok", title: "عدم انطباق: پرس ۱۵۰۰ تن", body: "نشتی روغن از شلنگ فشارقوی — ارجاع به کارشناس نت", read: false },
      { id: "n2", t: t0 - 3600e3 * 6, kind: "oor", title: "خروج از محدوده: کمپرسور 02", body: "فشار هوای خروجی ۹.۸ بار (بیش از حد مجاز ۹.۵)", read: false },
      { id: "n3", t: t0 - 3600e3 * 5, kind: "backup", title: "بکاپ روزانه", body: "بکاپ خودکار ساعت ۰۲:۰۰ بامداد با موفقیت ذخیره شد", read: true },
      { id: "n4", t: t0 - 3600e3 * 26, kind: "system", title: "به‌روزرسانی سامانه", body: "نسخه ۱.۴.۰ با گزارش‌های شمسی جدید منتشر شد", read: true },
    ],
    theme: { id: "industrial-dark", custom: { mode: "dark", primary: "#f5a524", accent: "#53b8d8", radius: 10, font: "Vazirmatn" } },
    layouts: {},
    settings: {
      logo: null, notifEmail: true, notifSMS: false, autoBackup: true,
      conn: { protocol: "Modbus TCP", ip: "192.168.1.40", port: 502, deviceId: "PLC-01", register: "HR40001", polling: 30, timeout: 3, retry: 3, status: "Connected", lastRead: t0 - 28e3 },
    },
    syncQueue: [],
    archivedYears: [{ jy: 1403, records: 4182, closedAt: t0 - 86400e3 * 92 }],
    currentYear: today.jy,
  };
}
