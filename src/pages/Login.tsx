/**
 * صفحه ورود — فوق‌العاده شیک و مدرن (بند ۶۲)
 * پس‌زمینه صنعتی، نشانگر زنده اتصال به سرور، Toast و ورود سریع آزمایشی
 */
import { useEffect, useState } from "react";
import { useApp } from "../lib/store";
import { fa, faTime } from "../lib/util";
import { Icon, useNow } from "../components/ui";
import type { ThemeCustom } from "../lib/types";

/* ---------- تم‌های قابل انتخاب از صفحه ورود (بند ۶۴) ---------- */
const LOGIN_THEMES = [
  { id: "industrial-dark", name: "صنعتی تاریک", colors: ["#0e1114", "#f5a524"] },
  { id: "corporate-light", name: "روشن اداری", colors: ["#eef0ee", "#2f6db3"] },
  { id: "high-contrast", name: "کنتراست بالا", colors: ["#000000", "#ffd60a"] },
  { id: "nipco", name: "سازمانی NIPCO", colors: ["#0a1626", "#ff7a1a"] },
];

/** پنل شناور شخصی‌سازی ظاهر — حتی پیش از ورود قابل استفاده است و در مرورگر ذخیره می‌شود */
function ThemeDock() {
  const { st, setTheme } = useApp();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState<ThemeCustom>(st.theme.custom);
  const lbl = { fontSize: 10, fontWeight: 700, color: "rgba(231,235,239,.55)", display: "block", marginBottom: 4 } as const;
  const darkCtl = { background: "rgba(255,255,255,.07)", borderColor: "rgba(255,255,255,.15)", color: "#e7ebef" };

  return (
    <>
      <button onClick={() => setOpen(!open)} title="شخصی‌سازی ظاهر سامانه" aria-label="شخصی‌سازی ظاهر"
        className="fixed top-5 left-5 z-[60] w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ background: "rgba(14,18,24,.78)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,.16)", color: "var(--primary)", boxShadow: "0 10px 30px rgba(0,0,0,.5)" }}>
        <Icon name="palette" size={19} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setOpen(false)} />
          <div className="fixed top-[72px] left-5 z-[60] glass rounded-xl p-4 w-[304px] anim-pop" style={{ boxShadow: "0 30px 80px rgba(0,0,0,.55)", color: "#e7ebef" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-extrabold text-[13px] flex items-center gap-2"><Icon name="palette" size={15} /> شخصی‌سازی ظاهر</span>
              <button className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity" onClick={() => setOpen(false)} aria-label="بستن"><Icon name="x" size={15} /></button>
            </div>

            {/* انتخاب تم آماده */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {LOGIN_THEMES.map((t) => (
                <button key={t.id} onClick={() => setTheme({ id: t.id, custom })}
                  className="rounded-lg px-2.5 py-2 text-right cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
                  style={{ background: st.theme.id === t.id ? "color-mix(in srgb, var(--primary) 14%, transparent)" : "rgba(255,255,255,.05)", border: `1px solid ${st.theme.id === t.id ? "var(--primary)" : "rgba(255,255,255,.12)"}` }}>
                  <span className="flex items-center gap-1.5">
                    {t.colors.map((c) => <span key={c} className="w-3 h-3 rounded-full border" style={{ background: c, borderColor: "rgba(255,255,255,.25)" }} />)}
                  </span>
                  <span className="block text-[10.5px] font-bold mt-1.5">{t.name}</span>
                </button>
              ))}
            </div>

            {/* رنگ‌ها */}
            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <div>
                <label style={lbl}>رنگ اصلی</label>
                <input type="color" value={custom.primary} onChange={(e) => setCustom({ ...custom, primary: e.target.value })}
                  className="w-full h-9 rounded-lg cursor-pointer" style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.15)" }} />
              </div>
              <div>
                <label style={lbl}>رنگ ثانویه</label>
                <input type="color" value={custom.accent} onChange={(e) => setCustom({ ...custom, accent: e.target.value })}
                  className="w-full h-9 rounded-lg cursor-pointer" style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.15)" }} />
              </div>
            </div>

            {/* فونت و حالت */}
            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <div>
                <label style={lbl}>فونت سیستم</label>
                <select className="select !py-2 !text-[11.5px]" style={darkCtl} value={custom.font} onChange={(e) => setCustom({ ...custom, font: e.target.value as ThemeCustom["font"] })}>
                  <option value="Vazirmatn">وزیرمتن</option>
                  <option value="Lalezar">لاله‌زار</option>
                  <option value="Markazi Text">مرکزی</option>
                </select>
              </div>
              <div>
                <label style={lbl}>حالت</label>
                <select className="select !py-2 !text-[11.5px]" style={darkCtl} value={custom.mode} onChange={(e) => setCustom({ ...custom, mode: e.target.value as ThemeCustom["mode"] })}>
                  <option value="dark">تاریک</option>
                  <option value="light">روشن</option>
                </select>
              </div>
            </div>

            {/* گردی گوشه‌ها */}
            <div className="mb-3.5">
              <label style={lbl}>گردی گوشه‌ها: <span className="num">{fa(custom.radius)}</span> پیکسل</label>
              <input type="range" min={0} max={22} value={custom.radius} onChange={(e) => setCustom({ ...custom, radius: +e.target.value })} className="w-full" style={{ accentColor: "var(--primary)" }} />
            </div>

            <button className="btn btn-primary w-full" onClick={() => setTheme({ id: "custom", custom })}>
              <Icon name="check" size={14} /> اعمال تم سفارشی
            </button>
            <p className="text-[9.5px] text-center mt-2.5 leading-5" style={{ color: "rgba(231,235,239,.4)" }}>
              انتخاب شما در این مرورگر ذخیره می‌شود و بلافاصله در تمام صفحات اعمال خواهد شد
            </p>
          </div>
        </>
      )}
    </>
  );
}

const DEMOS = [
  { label: "مدیر سیستم", u: "admin", p: "admin123" },
  { label: "تکنسین", u: "tech1", p: "1234" },
  { label: "سرپرست نت", u: "supervisor", p: "1234" },
  { label: "ناظر", u: "viewer", p: "1234" },
];

export function Login() {
  const { login, toast } = useApp();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [show, setShow] = useState(false);
  const [rem, setRem] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const [ping, setPing] = useState(23);
  const now = useNow(1000);

  /* شبیه‌سازی پایش تأخیر سرور */
  useEffect(() => {
    const t = setInterval(() => setPing(14 + Math.floor(Math.random() * 34)), 2600);
    return () => clearInterval(t);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setTimeout(() => {
      const ok = login(u.trim(), p, rem);
      setBusy(false);
      if (!ok) { setErr(true); setTimeout(() => setErr(false), 650); }
    }, 750);
  };

  return (
    <div className="login-bg min-h-screen relative overflow-hidden" style={{ color: "#e7ebef" }}>
      <ThemeDock />
      <div className="grid-overlay absolute inset-0" />
      {/* نوار خطر صنعتی */}
      <div className="hazard absolute top-0 left-0 right-0 h-[6px] opacity-80" />
      <div className="hazard absolute bottom-0 left-0 right-0 h-[6px] opacity-80" />

      <div className="relative max-w-6xl mx-auto min-h-screen grid lg:grid-cols-2 gap-10 items-center px-6 py-12">
        {/* ---------- برندینگ ---------- */}
        <div className="anim-up order-2 lg:order-1">
          <div className="flex items-center gap-4">
            <svg width="72" height="72" viewBox="0 0 32 32">
              <path d="M16 2 28 9v14L16 30 4 23V9z" fill="var(--primary)" />
              <path d="M16 2 28 9v14L16 30z" fill="rgba(0,0,0,.25)" />
              <path d="M11 22V10l4.5 7L20 10v12" stroke="var(--primary-contrast)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <div className="font-display text-[44px] leading-none" style={{ color: "var(--primary)" }}>NIPCO</div>
              <div className="text-[12px] font-semibold mt-1.5 tracking-wide" style={{ color: "rgba(231,235,239,.7)" }}>DAILY EQUIPMENT CONTROL SYSTEM</div>
            </div>
          </div>

          <h1 className="text-[26px] lg:text-[32px] font-extrabold leading-[1.6] mt-7">
            سامانه <span style={{ color: "var(--primary)" }}>کنترل روزانه</span> تجهیزات
          </h1>
          <p className="text-[13.5px] leading-7 mt-3 max-w-[440px]" style={{ color: "rgba(231,235,239,.66)" }}>
            بازرسی روزانه تجهیزات کارخانه روی تبلت و گوشی — حتی در قطعی کامل اینترنت.
            پیش‌نویس‌ها هرگز پاک نمی‌شوند و پس از اتصال، بدون رکورد تکراری همگام‌سازی می‌شوند.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-8 max-w-[460px] stagger">
            {[
              { i: "calendar", t: "تقویم ۱۰۰٪ شمسی", d: "در تمام فرم‌ها و گزارش‌ها" },
              { i: "sync", t: "آفلاین‌اول", d: "صف Sync با کلید یکتا" },
              { i: "checklist", t: "چک‌لیست دیجیتال", d: "OK / NOK / مقادیر عددی" },
              { i: "print", t: "پرینت A4 رسمی", d: "با سه کادر امضای نت" },
            ].map((f) => (
              <div key={f.t} className="glass rounded-xl p-3.5 flex items-start gap-3 card-hover">
                <span className="mt-0.5" style={{ color: "var(--primary)" }}><Icon name={f.i} size={19} /></span>
                <div>
                  <div className="font-bold text-[12.5px]">{f.t}</div>
                  <div className="text-[10.5px] mt-0.5" style={{ color: "rgba(231,235,239,.55)" }}>{f.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-9 text-[11px]" style={{ color: "rgba(231,235,239,.5)" }}>
            <span className="chip" style={{ background: "rgba(255,255,255,.05)", borderColor: "rgba(255,255,255,.12)", color: "rgba(231,235,239,.75)" }}>
              <Icon name="shield" size={12} /> طراحی و تحلیل: محمد روشندل
            </span>
            <span className="num">v1.4.0</span>
          </div>
        </div>

        {/* ---------- فرم ورود ---------- */}
        <div className="order-1 lg:order-2 anim-up" style={{ animationDelay: ".1s" }}>
          <div className="glass rounded-2xl p-7 sm:p-8 max-w-[430px] mx-auto lg:ml-0 w-full" style={{ boxShadow: "0 30px 80px rgba(0,0,0,.55)" }}>
            {/* نشانگر وضعیت سرور */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-[11.5px] font-bold" style={{ color: "var(--ok)" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: "var(--ok)", animation: "pulseDot 1.8s ease infinite" }} />
                اتصال به سرور: برقرار
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] num" style={{ color: "rgba(231,235,239,.55)" }}>
                <Icon name="bolt" size={12} />
                تأخیر {fa(ping)} ms · {faTime(now)}
              </div>
            </div>

            <h2 className="text-[20px] font-extrabold">ورود به سامانه</h2>
            <p className="text-[12px] mt-1 mb-6" style={{ color: "rgba(231,235,239,.55)" }}>حساب کاربری سازمانی خود را وارد کنید</p>

            {err && (
              <div className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 mb-4 anim-pop text-[12px] font-bold" style={{ background: "rgba(229,72,77,.14)", color: "#ff8b8e", border: "1px solid rgba(229,72,77,.35)" }}>
                <Icon name="alert" size={15} /> نام کاربری یا رمز عبور اشتباه است
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label" style={{ color: "rgba(231,235,239,.7)" }}>نام کاربری</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(231,235,239,.4)" }}><Icon name="user" size={16} /></span>
                  <input className="input !pr-10 !py-3" style={{ background: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.13)", color: "#e7ebef" }}
                    dir="ltr" placeholder="username" value={u} onChange={(e) => setU(e.target.value)} autoFocus />
                </div>
              </div>
              <div>
                <label className="label" style={{ color: "rgba(231,235,239,.7)" }}>رمز عبور</label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(231,235,239,.4)" }}><Icon name="lock" size={16} /></span>
                  <input className="input !pr-10 !pl-10 !py-3" style={{ background: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.13)", color: "#e7ebef" }}
                    dir="ltr" type={show ? "text" : "password"} placeholder="••••••••" value={p} onChange={(e) => setP(e.target.value)} />
                  <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "rgba(231,235,239,.45)" }} onClick={() => setShow(!show)}>
                    <Icon name={show ? "eye-off" : "eye"} size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button type="button" className="flex items-center gap-2 cursor-pointer" onClick={() => setRem(!rem)}>
                  <span className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-all" style={{ background: rem ? "var(--primary)" : "transparent", border: `1.5px solid ${rem ? "var(--primary)" : "rgba(255,255,255,.3)"}` }}>
                    {rem && <Icon name="check" size={11} sw={3} className="text-black" />}
                  </span>
                  <span className="text-[12px] font-semibold" style={{ color: "rgba(231,235,239,.75)" }}>مرا به خاطر بسپار</span>
                </button>
                <button type="button" className="text-[12px] font-semibold cursor-pointer transition-colors hover:opacity-80" style={{ color: "var(--primary)" }}
                  onClick={() => toast("info", "بازیابی رمز عبور از طریق مدیر سیستم انجام می‌شود")}>
                  فراموشی رمز عبور
                </button>
              </div>

              <button type="submit" disabled={busy || !u || !p} className="btn btn-primary w-full !py-3 !text-[14px] !rounded-xl">
                {busy ? (<><Icon name="sync" size={16} className="spin" /> در حال احراز هویت…</>) : (<><Icon name="logout" size={16} className="rotate-180" /> ورود به سامانه</>)}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,.12)" }} />
              <span className="text-[10.5px] font-bold" style={{ color: "rgba(231,235,239,.4)" }}>ورود سریع آزمایشی</span>
              <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,.12)" }} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMOS.map((d) => (
                <button key={d.u} onClick={() => { setU(d.u); setP(d.p); }}
                  className="rounded-lg px-3 py-2 text-[11.5px] font-bold cursor-pointer transition-all hover:-translate-y-0.5"
                  style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(231,235,239,.8)" }}>
                  {d.label}
                  <span className="block text-[9.5px] font-medium mt-0.5 num" style={{ color: "rgba(231,235,239,.4)" }} dir="ltr">{d.u} / {d.p}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="text-center text-[10.5px] mt-5" style={{ color: "rgba(231,235,239,.38)" }}>
            © {fa(1404)} شرکت قطعه‌سازی NIPCO — تمامی حقوق محفوظ است
          </p>
        </div>
      </div>
    </div>
  );
}
