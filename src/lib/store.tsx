/**
 * ============================================================
 * Store مرکزی سامانه — NIPCO Daily Equipment Control
 * طراح و تحلیلگر: محمد روشندل
 * ------------------------------------------------------------
 * مدیریت وضعیت سراسری، احراز هویت، ذخیره‌سازی ماندگار (IndexedDB/
 * LocalStorage در نسخه سرور)، صف همگام‌سازی آفلاین با کلید
 * Idempotency (بندهای ۶۵ تا ۷۱) و اعمال تم‌ها (بند ۶۴).
 * ============================================================
 */
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { buildSeed } from "./seed";
import { jKey, todayJ, workDateJ } from "./jalali";
import { download, uid } from "./util";
import {
  type AppState, type Checklist, type ControlRec, type Draft, type Equipment,
  type Group, type LogEntry, type Notif, type NotifKind, type ThemeState,
  type User, type WidgetLayout, type OpReading,
} from "./types";

const LS_KEY = "nipco-dcs-v1";
const SESSION_KEY = "nipco-dcs-session";

export interface Toast { id: number; kind: "ok" | "err" | "info"; msg: string }

interface Ctx {
  st: AppState;
  me: User | null;
  online: boolean;
  syncing: boolean;
  toasts: Toast[];
  toast: (kind: Toast["kind"], msg: string) => void;
  login: (u: string, p: string, remember: boolean) => boolean;
  logout: () => void;
  patch: (fn: (s: AppState) => AppState) => void;
  addLog: (type: string, desc: string) => void;
  notify: (kind: NotifKind, title: string, body: string) => void;
  markAllRead: () => void;
  saveDraft: (d: Draft) => void;
  deleteDraft: (id: string) => void;
  submitControl: (rec: ControlRec) => void;
  setTheme: (t: ThemeState) => void;
  saveLayout: (layout: WidgetLayout) => void;
  resetLayout: () => void;
  backupExport: () => void;
  backupImport: (json: string) => boolean;
  closeYear: () => void;
  addReading: (r: OpReading) => void;
}

const AppCtx = createContext<Ctx | null>(null);

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const s = JSON.parse(raw) as AppState;
      if (s && Array.isArray(s.users) && Array.isArray(s.controls)) return s;
    }
  } catch { /* داده خراب — بازسازی از Seed */ }
  return buildSeed();
}

function loadSession(): string | null {
  return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [st, setSt] = useState<AppState>(loadState);
  const [meId, setMeId] = useState<string | null>(loadSession);
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const tid = useRef(0);

  /* ---------- ذخیره ماندگار وضعیت ---------- */
  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(LS_KEY, JSON.stringify(st)), 250);
    return () => clearTimeout(t);
  }, [st]);

  /* ---------- پایش وضعیت شبکه (بند ۷۱) ---------- */
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  /* ---------- همگام‌سازی خودکار صف آفلاین (بند ۶۷) ---------- */
  useEffect(() => {
    if (online && st.syncQueue.length > 0 && !syncing) {
      setSyncing(true);
      const t = setTimeout(() => {
        setSt((s) => ({
          ...s,
          syncQueue: [],
          controls: s.controls.map((c) => (c.syncState === "pending" ? { ...c, syncState: "synced" } : c)),
          logs: [
            { id: uid(), t: Date.now(), userId: meId ?? "sys", userName: meName(s), type: "همگام‌سازی", desc: `${s.syncQueue.length} رکورد آفلاین با موفقیت همگام‌سازی شد` },
            ...s.logs,
          ],
          notifs: [
            { id: uid(), t: Date.now(), kind: "sync", title: "همگام‌سازی کامل شد", body: "رکوردهای ثبت‌شده در حالت آفلاین به سرور ارسال شدند", read: false },
            ...s.notifs,
          ],
        }));
        setSyncing(false);
        toast("ok", "همگام‌سازی با سرور انجام شد");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [online, st.syncQueue.length]); // eslint-disable-line

  const meName = (s: AppState) => s.users.find((u) => u.id === meId)?.name ?? "سیستم";

  /* ---------- اعمال تم (بند ۶۴) ---------- */
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", st.theme.id);
    if (st.theme.id === "custom") {
      const c = st.theme.custom;
      root.style.setProperty("--primary", c.primary);
      root.style.setProperty("--accent", c.accent);
      root.style.setProperty("--radius", `${c.radius}px`);
      root.style.setProperty("--font-body", `'${c.font}', 'Vazirmatn', sans-serif`);
      const dark = c.mode === "dark";
      root.style.setProperty("--bg", dark ? "#0f1318" : "#eef0ee");
      root.style.setProperty("--card", dark ? "#171c23" : "#fbfbf8");
      root.style.setProperty("--card2", dark ? "#1e252e" : "#f0f2ee");
      root.style.setProperty("--line", dark ? "#29323d" : "#d7dcd5");
      root.style.setProperty("--text", dark ? "#e7ebef" : "#1c2530");
      root.style.setProperty("--soft", dark ? "#9fabb8" : "#57636e");
      root.style.setProperty("--muted", dark ? "#66727f" : "#8a95a0");
      root.style.setProperty("--sidebar", dark ? "#10141a" : "#152230");
      root.style.setProperty("--primary-contrast", dark ? "#141005" : "#ffffff");
    } else {
      ["--primary", "--accent", "--radius", "--font-body", "--bg", "--card", "--card2", "--line", "--text", "--soft", "--muted", "--sidebar", "--primary-contrast"].forEach((v) => root.style.removeProperty(v));
    }
  }, [st.theme]);

  const me = st.users.find((u) => u.id === meId && u.active) ?? null;

  const toast = (kind: Toast["kind"], msg: string) => {
    const id = ++tid.current;
    setToasts((t) => [...t.slice(-3), { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  };

  const patch = (fn: (s: AppState) => AppState) => setSt((s) => fn(s));

  const addLog = (type: string, desc: string) =>
    setSt((s) => ({
      ...s,
      logs: [{ id: uid(), t: Date.now(), userId: meId ?? "sys", userName: meName(s), type, desc }, ...s.logs].slice(0, 400),
    }));

  const notify = (kind: NotifKind, title: string, body: string) =>
    setSt((s) => ({ ...s, notifs: [{ id: uid(), t: Date.now(), kind, title, body, read: false }, ...s.notifs].slice(0, 60) }));

  const login = (username: string, pass: string, remember: boolean) => {
    const u = st.users.find((x) => x.username === username && x.pass === pass);
    if (!u) { toast("err", "نام کاربری یا رمز عبور اشتباه است"); return false; }
    if (!u.active) { toast("err", "این حساب کاربری غیرفعال شده است"); return false; }
    setMeId(u.id);
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, u.id);
    const other = remember ? sessionStorage : localStorage;
    other.removeItem(SESSION_KEY);
    setSt((s) => ({
      ...s,
      logs: [{ id: uid(), t: Date.now(), userId: u.id, userName: u.name, type: "ورود", desc: `ورود موفق به سامانه (${remember ? "با ماندگاری نشست" : "نشست موقت"})` }, ...s.logs],
    }));
    toast("ok", `خوش آمدید، ${u.name}`);
    return true;
  };

  const logout = () => {
    addLog("خروج", "خروج از سامانه");
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setMeId(null);
  };

  /* ---------- Draft ماندگار: تا حذف صریح کاربر باقی می‌ماند (بندهای ۸ تا ۱۲) ---------- */
  const saveDraft = (d: Draft) =>
    setSt((s) => {
      const others = s.drafts.filter((x) => x.id !== d.id);
      return { ...s, drafts: [{ ...d, updatedAt: Date.now() }, ...others] };
    });

  const deleteDraft = (id: string) => {
    setSt((s) => ({ ...s, drafts: s.drafts.filter((x) => x.id !== id) }));
    addLog("پیش‌نویس", "یک پیش‌نویس توسط کاربر حذف شد");
    toast("info", "پیش‌نویس حذف شد");
  };

  /* ---------- ثبت نهایی کنترل با مدیریت صف آفلاین و جلوگیری از Duplicate ---------- */
  const submitControl = (rec: ControlRec) => {
    const isOnline = navigator.onLine;
    const final = { ...rec, syncState: isOnline ? ("synced" as const) : ("pending" as const) };
    setSt((s) => {
      // کلاینت UUID از ثبت تکراری جلوگیری می‌کند (بند ۶۹)
      if (s.controls.some((c) => c.uuid === rec.uuid)) return s;
      const eqName = s.equipment.find((e) => e.id === rec.equipmentId)?.name ?? "";
      const clTitle = s.checklists.find((c) => c.id === rec.checklistId)?.title ?? "";
      const logs: LogEntry[] = [
        { id: uid(), t: Date.now(), userId: rec.techId, userName: s.users.find((u) => u.id === rec.techId)?.name ?? "", type: "کنترل روزانه", desc: `${clTitle} — ${eqName} ثبت شد (${rec.status === "NOK" ? "نامنطبق" : "سالم"})` },
        ...s.logs,
      ];
      let notifs = s.notifs;
      if (rec.status === "NOK") {
        notifs = [
          { id: uid(), t: Date.now(), kind: "nok" as NotifKind, title: `عدم انطباق: ${eqName}`, body: rec.notes || "مورد NOK در کنترل روزانه ثبت شد", read: false },
          ...notifs,
        ];
      }
      let readings = s.readings;
      if (rec.opHours) {
        readings = [
          { id: uid(), equipmentId: rec.equipmentId, date: rec.date, dateKey: rec.dateKey, timeISO: rec.timeISO, shift: rec.shift, prev: rec.opHours.prev ?? 0, next: rec.opHours.value, diff: +((rec.opHours.value - (rec.opHours.prev ?? 0)).toFixed(1)), source: rec.opHours.source, userId: rec.techId, reason: rec.opHours.reason },
          ...readings,
        ];
      }
      return {
        ...s,
        controls: [final, ...s.controls],
        drafts: s.drafts.filter((d) => !(d.equipmentId === rec.equipmentId && d.checklistId === rec.checklistId && d.techId === rec.techId)),
        logs, notifs, readings,
        syncQueue: isOnline ? s.syncQueue : [...s.syncQueue, final.id],
      };
    });
    toast(isOnline ? "ok" : "info", isOnline ? "کنترل روزانه با موفقیت ثبت شد" : "آفلاین: رکورد در صف همگام‌سازی ذخیره شد");
  };

  const addReading = (r: OpReading) =>
    setSt((s) => ({ ...s, readings: [r, ...s.readings] }));

  const setTheme = (t: ThemeState) => {
    setSt((s) => ({ ...s, theme: t }));
    toast("ok", "تم اعمال و ذخیره شد");
  };

  const saveLayout = (layout: WidgetLayout) => {
    if (!meId) return;
    setSt((s) => ({ ...s, layouts: { ...s.layouts, [meId]: layout } }));
    toast("ok", "چیدمان داشبورد ذخیره شد");
  };

  const resetLayout = () => {
    if (!meId) return;
    setSt((s) => {
      const l = { ...s.layouts };
      delete l[meId];
      return { ...s, layouts: l };
    });
    toast("info", "چیدمان به حالت پیش‌فرض بازگشت");
  };

  /* ---------- بکاپ و بازیابی (بندهای ۶۰ و ۶۱) ---------- */
  const backupExport = () => {
    const stamp = jKey(workDateJ()).replace(/\//g, "-");
    download(`nipco-backup-${st.currentYear}-${stamp}.json`, JSON.stringify(st, null, 2), "application/json");
    addLog("بکاپ", `بکاپ دستی گرفته شد (nipco-backup-${stamp}.json)`);
    notify("backup", "بکاپ دستی", "فایل پشتیبان‌گیری با موفقیت دانلود شد");
    toast("ok", "فایل بکاپ دانلود شد");
  };

  const backupImport = (json: string) => {
    try {
      const s = JSON.parse(json) as AppState;
      if (!Array.isArray(s.users) || !Array.isArray(s.controls)) throw new Error("bad");
      setSt(s);
      addLog("بازیابی", "بازگردانی بکاپ توسط مدیر انجام شد");
      toast("ok", "بکاپ با موفقیت بازیابی شد");
      return true;
    } catch {
      toast("err", "فایل بکاپ نامعتبر است");
      return false;
    }
  };

  /* ---------- بستن سال شمسی و آرشیو (بند ۵۸) ---------- */
  const closeYear = () => {
    const yearControls = st.controls.filter((c) => c.date.jy === st.currentYear).length;
    setSt((s) => ({
      ...s,
      archivedYears: [...s.archivedYears, { jy: s.currentYear, records: yearControls, closedAt: Date.now() }],
      currentYear: s.currentYear + 1,
      notifs: [{ id: uid(), t: Date.now(), kind: "system", title: "سال شمسی جدید", body: `سال ${s.currentYear} بسته و آرشیو شد؛ سال کاری جدید آغاز گردید`, read: false }, ...s.notifs],
    }));
    addLog("آرشیو", `سال شمسی ${st.currentYear} بسته و آرشیو شد (${yearControls} رکورد)`);
    toast("ok", "سال شمسی بسته و آرشیو شد");
  };

  const markAllRead = () => setSt((s) => ({ ...s, notifs: s.notifs.map((n) => ({ ...n, read: true })) }));

  const value: Ctx = {
    st, me, online, syncing, toasts, toast, login, logout, patch, addLog, notify,
    markAllRead, saveDraft, deleteDraft, submitControl, setTheme, saveLayout,
    resetLayout, backupExport, backupImport, closeYear, addReading,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp خارج از AppProvider");
  return ctx;
}

/** چک‌لیست‌های تخصیص‌یافته به یک تجهیز (گروهی + اختصاصی) */
export function checklistsOf(st: AppState, eqId: string): Checklist[] {
  const e = st.equipment.find((x) => x.id === eqId);
  if (!e) return [];
  return st.checklists.filter((c) => c.active && ((c.targetType === "group" && c.targetId === e.groupId) || (c.targetType === "equipment" && c.targetId === eqId)));
}

export function todayControl(st: AppState, eqId: string, clId: string): ControlRec | undefined {
  const k = jKey(workDateJ());
  return st.controls.find((c) => c.equipmentId === eqId && c.checklistId === clId && c.dateKey === k);
}

export function draftOf(st: AppState, eqId: string, clId: string, techId: string): Draft | undefined {
  return st.drafts.find((d) => d.equipmentId === eqId && d.checklistId === clId && d.techId === techId);
}



export function sectionAllowed(depts: string[], userDept: string | undefined, isAdmin: boolean): boolean {
  if (isAdmin || depts.length === 0) return true;
  return !!userDept && depts.includes(userDept);
}

export { todayJ };
