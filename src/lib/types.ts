/**
 * مدل داده سامانه کنترل روزانه تجهیزات NIPCO
 * طراح و تحلیلگر: محمد روشندل
 * ساختار نرمال‌شده مطابق بند ۸۹ سند تحلیل
 */
import type { JDate } from "./jalali";

export type Role = "admin" | "supervisor" | "engineer" | "technician" | "viewer";

export interface User {
  id: string; username: string; name: string; role: Role;
  shift: number; dept: string; active: boolean; pass: string;
}

export interface Group { id: string; name: string; active: boolean; icon: string }

export interface Equipment {
  id: string; code: string; name: string; groupId: string;
  brand: string; model: string; serial: string; capacity: string;
  hall: string; line: string; area: string;
  status: "active" | "inactive";
  commission: JDate; desc: string;
}

/** نوع آیتم چک‌لیست — فعلاً OK/NOK و عددی؛ معماری آماده برای Text/Dropdown/Photo/... (بند ۳۴) */
export type ItemKind = "oknok" | "numeric";

export interface ItemDef {
  id: string; title: string; kind: ItemKind;
  unit?: string; min?: number; max?: number; prec?: number; required: boolean;
}

/** بخش چک‌لیست با سطح دسترسی دپارتمانی (بند ۲۹ — enforce در Backend) */
export interface SectionDef {
  id: string; title: string; items: ItemDef[]; depts: string[];
}

export interface Checklist {
  id: string; title: string;
  targetType: "group" | "equipment"; targetId: string;
  active: boolean;
  /** ساعت کارکرد — در این نسخه فقط لیفتراک و کمپرسور (بند ۳۸) و قابل غیرفعال‌سازی (بند ۳۹) */
  opHours: boolean;
  sections: SectionDef[];
}

export interface Answer { ok?: boolean; num?: number | null }

export interface OpHoursEntry {
  value: number; prev: number | null;
  source: "MANUAL" | "AUTO" | "ADJUSTED"; reason?: string;
}

export interface ControlRec {
  id: string; uuid: string;
  equipmentId: string; checklistId: string;
  date: JDate; dateKey: string; timeISO: string; shift: number; techId: string;
  answers: Record<string, Answer>;
  opHours?: OpHoursEntry;
  notes: string;
  status: "Completed" | "NOK";
  failLoc?: string;
  syncState: "synced" | "pending";
  createdAt: number;
}

export interface Draft {
  id: string; uuid: string;
  equipmentId: string; checklistId: string;
  date: JDate; dateKey: string; shift: number; techId: string;
  answers: Record<string, Answer>;
  opHours?: OpHoursEntry;
  notes: string;
  updatedAt: number;
}

/** تاریخچه ساعت کارکرد (بند ۴۷) */
export interface OpReading {
  id: string; equipmentId: string;
  date: JDate; dateKey: string; timeISO: string; shift: number;
  prev: number; next: number; diff: number;
  source: "MANUAL" | "AUTO" | "ADJUSTED";
  userId: string; reason?: string;
}

export interface LogEntry {
  id: string; t: number; userId: string; userName: string; type: string; desc: string;
}

export type NotifKind = "nok" | "oor" | "overdue" | "backup" | "system" | "sync";

export interface Notif {
  id: string; t: number; kind: NotifKind; title: string; body: string; read: boolean;
}

export interface ThemeCustom {
  mode: "dark" | "light";
  primary: string; accent: string; radius: number;
  font: "Vazirmatn" | "Lalezar" | "Markazi Text";
}

export interface ThemeState { id: string; custom: ThemeCustom }

export interface WidgetLayout { order: string[]; sizes: Record<string, "sm" | "lg"> }

export interface AppSettings {
  logo: string | null;
  notifEmail: boolean; notifSMS: boolean; autoBackup: boolean;
  /** تنظیمات ارتباط صنعتی (بندهای ۴۱ تا ۴۵) */
  conn: {
    protocol: "OPC UA" | "Modbus TCP" | "API" | "Gateway";
    ip: string; port: number; deviceId: string; register: string;
    polling: number; timeout: number; retry: number;
    status: "Connected" | "Disconnected" | "Timeout" | "Error";
    lastRead: number | null;
  };
}

export interface AppState {
  users: User[]; groups: Group[]; equipment: Equipment[]; checklists: Checklist[];
  controls: ControlRec[]; drafts: Draft[]; readings: OpReading[];
  logs: LogEntry[]; notifs: Notif[];
  theme: ThemeState; layouts: Record<string, WidgetLayout>;
  settings: AppSettings;
  syncQueue: string[];
  archivedYears: { jy: number; records: number; closedAt: number }[];
  currentYear: number;
}

/* ---------- ماتریس دسترسی (بندهای ۳۱ و ۳۲) ---------- */
const PERMS: Record<Role, string[]> = {
  admin: ["*"],
  supervisor: ["control", "dashboard", "reports", "equipment.manage", "checklist.manage", "users.view", "print", "export", "logs", "settings.view", "approve", "archive.close", "archive.view"],
  engineer: ["control", "dashboard", "reports", "equipment.view", "checklist.view", "print", "export", "archive.view"],
  technician: ["control", "dashboard", "reports.view", "print"],
  viewer: ["dashboard", "reports.view"],
};

export function can(role: Role | undefined, key: string): boolean {
  if (!role) return false;
  const p = PERMS[role];
  return p.includes("*") || p.includes(key);
}

export const ROLE_NAMES: Record<Role, string> = {
  admin: "مدیر سیستم", supervisor: "سرپرست نت", engineer: "کارشناس نت",
  technician: "تکنسین", viewer: "ناظر (فقط مشاهده)",
};

export const DEPTS = ["نت", "برق", "تأسیسات", "مکانیک", "تولید"];

/** محل خرابی — داینامیک (بند ۲۳) */
export const FAILURE_LOCS = [
  "موتور", "پمپ", "تابلو برق", "سنسور", "شیر برقی",
  "یونیت هیدرولیک", "سیستم ایمنی", "سیستم خنک‌کاری", "سایر",
];

/** گروه‌های مجاز برای ساعت کارکرد در نسخه جاری (بند ۳۸) */
export const OP_HOURS_GROUPS = ["g-fork", "g-comp"];
