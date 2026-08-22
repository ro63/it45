/**
 * صفحه ورود — فوق‌العاده شیک و مدرن (بند ۶۲)
 * پس‌زمینه صنعتی، نشانگر زنده اتصال به سرور، Toast و ورود سریع آزمایشی
 */
import { useEffect, useState } from "react";
import { useApp } from "../lib/store";
import { fa, faTime } from "../lib/util";
import { Icon, useNow } from "../components/ui";

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
