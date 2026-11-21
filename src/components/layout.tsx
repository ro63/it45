/**
 * پوسته اصلی سامانه: سایدبار، هدر با نشانگر زنده شبکه/همگام‌سازی
 * (بند ۱۰۱-هـ)، مرکز اعلان‌ها و لوگوی NIPCO
 */
import React, { useState } from "react";
import { useApp } from "../lib/store";
import { can, type Role } from "../lib/types";
import { currentShift, SHIFTS, workDateJ } from "../lib/jalali";
import { cx, fa, faDateLong, faTime, faTimeShort } from "../lib/util";
import { Icon, Dot, useNow, Badge } from "./ui";

export type Page = "dashboard" | "control" | "reports" | "equipment" | "checklists" | "users" | "logs" | "settings";

export const NAV: { id: Page; label: string; icon: string; perm: string }[] = [
  { id: "dashboard", label: "داشبورد", icon: "dashboard", perm: "dashboard" },
  { id: "control", label: "کنترل روزانه", icon: "control", perm: "control" },
  { id: "reports", label: "گزارشات", icon: "reports", perm: "reports.view" },
  { id: "equipment", label: "تجهیزات", icon: "equipment", perm: "dashboard" },
  { id: "checklists", label: "چک‌لیست‌ساز", icon: "checklist", perm: "checklist.view" },
  { id: "users", label: "کاربران و دسترسی", icon: "users", perm: "users.view" },
  { id: "logs", label: "لاگ فعالیت", icon: "logs", perm: "logs" },
  { id: "settings", label: "تنظیمات", icon: "settings", perm: "settings.view" },
];

export function navAllowed(role: Role | undefined, perm: string): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  if (perm === "reports.view") return can(role, "reports.view") || can(role, "reports");
  if (perm === "dashboard") return true;
  return can(role, perm);
}

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width="36" height="36" viewBox="0 0 32 32">
        <path d="M16 2 28 9v14L16 30 4 23V9z" fill="var(--primary)" />
        <path d="M16 2 28 9v14L16 30z" fill="rgba(0,0,0,.22)" />
        <path d="M11 22V10l4.5 7L20 10v12" stroke="var(--primary-contrast)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-[19px] tracking-wide" style={{ color: "var(--primary)" }}>NIPCO</div>
          <div className="text-[9.5px] font-semibold mt-1" style={{ color: "var(--muted)" }}>کنترل روزانه تجهیزات</div>
        </div>
      )}
    </div>
  );
}

/* ---------- نشانگر وضعیت شبکه و صف Sync (بند ۷۱) ---------- */
function NetPill() {
  const { online, syncing, st } = useApp();
  const q = st.syncQueue.length;
  if (!online)
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11.5px] font-bold" style={{ background: "var(--nokbg)", color: "var(--nok)", border: "1px solid color-mix(in srgb, var(--nok) 35%, transparent)" }}>
        <Icon name="wifi-off" size={14} />
        آفلاین {q > 0 && <span className="num">({fa(q)} در صف)</span>}
      </div>
    );
  if (syncing)
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11.5px] font-bold" style={{ background: "var(--warnbg)", color: "var(--warn)", border: "1px solid color-mix(in srgb, var(--warn) 35%, transparent)" }}>
        <Icon name="sync" size={14} className="spin" />
        همگام‌سازی <span className="num">({fa(q)})</span>
      </div>
    );
  if (q > 0)
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11.5px] font-bold" style={{ background: "var(--warnbg)", color: "var(--warn)" }}>
        <Icon name="sync" size={14} />
        <span className="num">{fa(q)}</span> در صف ارسال
      </div>
    );
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11.5px] font-bold" style={{ background: "var(--okbg)", color: "var(--ok)", border: "1px solid color-mix(in srgb, var(--ok) 25%, transparent)" }}>
      <Dot color="var(--ok)" pulse />
      آنلاین
      <span className="hidden sm:inline font-semibold opacity-70">· سرور متصل</span>
    </div>
  );
}

function HeaderClock() {
  const now = useNow(1000);
  const shift = currentShift(now);
  const sh = SHIFTS.find((s) => s.id === shift)!;
  return (
    <div className="hidden lg:flex items-center gap-3">
      <div className="text-left leading-tight">
        <div className="text-[12px] font-bold num" style={{ color: "var(--text)" }}>{faTime(now)}</div>
        <div className="text-[10px]" style={{ color: "var(--muted)" }}>{faDateLong(workDateJ(now))}</div>
      </div>
      <div className="h-8 w-px" style={{ background: "var(--line)" }} />
      <div className="chip !py-1.5"><Icon name="clock" size={12} /> {sh.name} <span className="num opacity-70">{sh.range}</span></div>
    </div>
  );
}

function NotifDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { st, markAllRead } = useApp();
  const icons: Record<string, { i: string; c: string }> = {
    nok: { i: "alert", c: "var(--nok)" }, oor: { i: "gauge", c: "var(--warn)" },
    overdue: { i: "clock", c: "var(--warn)" }, backup: { i: "db", c: "var(--ok)" },
    system: { i: "info", c: "var(--info)" }, sync: { i: "sync", c: "var(--ok)" },
  };
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 anim-in lg:hidden" onClick={onClose} />}
      <aside className={cx(
        "fixed top-0 bottom-0 left-0 z-50 w-[330px] max-w-[90vw] flex flex-col transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full"
      )} style={{ background: "var(--card)", borderRight: "1px solid var(--line)", boxShadow: "var(--shadow)" }}>
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-2 font-bold text-[14px]"><Icon name="bell" size={17} /> مرکز اعلان‌ها</div>
          <div className="flex gap-1.5">
            <button className="btn btn-ghost btn-sm" onClick={markAllRead}>خواندن همه</button>
            <button className="btn btn-ghost btn-sm !px-2" onClick={onClose}><Icon name="x" size={14} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {st.notifs.length === 0 && <p className="text-center text-[12px] py-10" style={{ color: "var(--muted)" }}>اعلانی وجود ندارد</p>}
          {st.notifs.map((n) => {
            const ic = icons[n.kind] ?? icons.system;
            return (
              <div key={n.id} className="card p-3 flex gap-3 anim-in" style={{ opacity: n.read ? 0.62 : 1, borderRight: `3px solid ${ic.c}` }}>
                <span className="mt-0.5" style={{ color: ic.c }}><Icon name={ic.i} size={16} /></span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[12.5px] truncate">{n.title}</span>
                    <span className="text-[10px] num shrink-0" style={{ color: "var(--muted)" }}>{faTimeShort(new Date(n.t))}</span>
                  </div>
                  <p className="text-[11.5px] mt-1 leading-5" style={{ color: "var(--soft)" }}>{n.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}

export function Layout({ page, setPage, title, children }: { page: Page; setPage: (p: Page) => void; title: string; children: React.ReactNode }) {
  const { me, logout, st, online, syncing } = useApp();
  const [nav, setNav] = useState(false);
  const [notif, setNotif] = useState(false);
  const unread = st.notifs.filter((n) => !n.read).length;
  const items = NAV.filter((n) => navAllowed(me?.role, n.perm));
  const roleFa = { admin: "مدیر سیستم", supervisor: "سرپرست نت", engineer: "کارشناس نت", technician: "تکنسین", viewer: "ناظر" } as Record<string, string>;

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--line)" }}>
        <Logo />
        <button className="lg:hidden btn btn-ghost btn-sm !px-2" onClick={() => setNav(false)}><Icon name="x" size={16} /></button>
      </div>
      <nav className="flex-1 overflow-auto p-3 space-y-1">
        {items.map((n) => (
          <button key={n.id} onClick={() => { setPage(n.id); setNav(false); }}
            className={cx("w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer text-right")}
            style={page === n.id
              ? { background: "color-mix(in srgb, var(--primary) 15%, transparent)", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)" }
              : { color: "var(--soft)", border: "1px solid transparent" }}>
            <Icon name={n.icon} size={17} />
            {n.label}
            {n.id === "control" && st.drafts.length > 0 && me?.role === "technician" && (
              <span className="mr-auto num text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--warnbg)", color: "var(--warn)" }}>{fa(st.drafts.length)}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t space-y-2" style={{ borderColor: "var(--line)" }}>
        <div className="card p-3 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-display text-[15px]" style={{ background: "color-mix(in srgb, var(--primary) 18%, transparent)", color: "var(--primary)" }}>
            {me?.name.slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-[12.5px] font-bold truncate">{me?.name}</div>
            <div className="text-[10.5px]" style={{ color: "var(--muted)" }}>{roleFa[me?.role ?? ""]}</div>
          </div>
          <button className="btn btn-ghost btn-sm !px-2" title="خروج" onClick={logout}><Icon name="logout" size={15} /></button>
        </div>
        <p className="text-center text-[9.5px]" style={{ color: "var(--muted)" }}>NIPCO DCS — نسخه ۱.۴.۰ · طراحی: محمد روشندل</p>
      </div>
    </div>
  );

  return (
    <div className="h-full flex" style={{ background: "var(--bg)" }}>
      {/* سایدبار دسکتاپ */}
      <aside className="hidden lg:block w-[232px] shrink-0 h-full sticky top-0" style={{ background: "var(--sidebar)", borderLeft: "1px solid var(--line)" }}>
        {sidebar}
      </aside>
      {/* سایدبار موبایل */}
      {nav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 anim-in" onClick={() => setNav(false)} />
          <aside className="absolute top-0 bottom-0 right-0 w-[250px] anim-in" style={{ background: "var(--sidebar)", borderLeft: "1px solid var(--line)" }}>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 lg:px-6 py-3" style={{ background: "color-mix(in srgb, var(--bg) 88%, transparent)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--line)" }}>
          <button className="lg:hidden btn btn-ghost btn-sm !px-2.5" onClick={() => setNav(true)}><Icon name="menu" size={18} /></button>
          <h1 className="font-bold text-[15px] lg:text-[16px]">{title}</h1>
          <div className="mr-auto flex items-center gap-2.5">
            {!online && <Badge kind="nok"><Icon name="wifi-off" size={11} /> آفلاین</Badge>}
            <div className="hidden md:block"><NetPill /></div>
            <HeaderClock />
            <button className="relative btn btn-ghost btn-sm !px-2.5" onClick={() => setNotif(true)} aria-label="اعلان‌ها">
              <Icon name="bell" size={17} />
              {unread > 0 && (
                <span className="absolute -top-1 -left-1 min-w-[17px] h-[17px] px-1 rounded-full text-[9.5px] font-bold num flex items-center justify-center blink" style={{ background: "var(--nok)", color: "#fff" }}>
                  {fa(unread)}
                </span>
              )}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>

      <NotifDrawer open={notif} onClose={() => setNotif(false)} />
      {/* نشانگر آفلاین برای موبایل */}
      {(!online || syncing) && (
        <div className="md:hidden fixed bottom-4 right-4 z-40"><NetPill /></div>
      )}
    </div>
  );
}
