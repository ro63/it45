/**
 * تنظیمات سامانه (بندهای ۶۰ تا ۶۴ و ۴۴)
 * تم‌ها و شخصی‌سازی، برندینگ، اعلان‌های ایمیل/پیامک،
 * ارتباط صنعتی، بکاپ/بازیابی و مدیریت سال شمسی
 */
import { useRef, useState } from "react";
import { useApp } from "../lib/store";
import { todayJ, J_MONTHS } from "../lib/jalali";
import { cx, fa, faDateLong, faNum } from "../lib/util";
import { Icon, Badge, Toggle, Modal, Dot } from "../components/ui";
import { can, type ThemeCustom } from "../lib/types";

const THEMES = [
  { id: "industrial-dark", name: "صنعتی تاریک", desc: "پیش‌فرض — مناسب سالن تولید", colors: ["#0e1114", "#161b21", "#f5a524"] },
  { id: "corporate-light", name: "روشن اداری", desc: "مناسب اتاق نت و اداری", colors: ["#eef0ee", "#fbfbf8", "#2f6db3"] },
  { id: "high-contrast", name: "کنتراست بالا", desc: "محیط‌های کم‌نور کارخانه", colors: ["#000000", "#0c0c0c", "#ffd60a"] },
  { id: "nipco", name: "سازمانی NIPCO", desc: "رنگ‌های رسمی شرکت", colors: ["#0a1626", "#102036", "#ff7a1a"] },
];

export function SettingsPage() {
  const { st, me, patch, setTheme, toast, addLog, backupExport, backupImport, closeYear, notify } = useApp();
  const isAdmin = me?.role === "admin";
  const [custom, setCustom] = useState<ThemeCustom>(st.theme.custom);
  const [confirmYear, setConfirmYear] = useState(false);
  const [viewYear, setViewYear] = useState<{ jy: number; records: number; closedAt: number } | null>(null);
  const [testing, setTesting] = useState(false);
  /* دسترسی‌های آرشیو بر اساس نقش کاربر (بندهای ۵۸ و ۵۹) */
  const canClose = can(me?.role, "archive.close");
  const canView = can(me?.role, "archive.view");
  const today = todayJ();
  const isEsfand = today.jm === 12;
  const fileRef = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);

  const applyCustom = () => {
    setTheme({ id: "custom", custom });
    addLog("تم", "تم سفارشی ذخیره و اعمال شد");
  };

  const importFile = (f: File) => {
    const r = new FileReader();
    r.onload = () => backupImport(String(r.result));
    r.readAsText(f);
  };

  return (
    <div className="grid xl:grid-cols-2 gap-5">
      {/* ---------- تم‌ها (بند ۶۴) ---------- */}
      <section className="card p-5">
        <h3 className="font-bold text-[14px] mb-1 flex items-center gap-2"><Icon name="palette" size={16} /> تم‌ها و شخصی‌سازی</h3>
        <p className="text-[11.5px] mb-4" style={{ color: "var(--muted)" }}>تم انتخابی برای حساب شما ذخیره می‌شود و در ورود بعدی هم اعمال خواهد شد.</p>
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {THEMES.map((t) => (
            <button key={t.id} onClick={() => setTheme({ id: t.id, custom: st.theme.custom })}
              className={cx("card card-hover p-3.5 text-right cursor-pointer")}
              style={st.theme.id === t.id ? { borderColor: "var(--primary)", boxShadow: "0 0 0 1px var(--primary)" } : undefined}>
              <div className="flex gap-1.5 mb-2.5">
                {t.colors.map((c) => <span key={c} className="w-5 h-5 rounded-md border" style={{ background: c, borderColor: "var(--line)" }} />)}
              </div>
              <div className="font-bold text-[12.5px]">{t.name}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{t.desc}</div>
              {st.theme.id === t.id && <Badge kind="primary"><Icon name="check" size={10} /> فعال</Badge>}
            </button>
          ))}
        </div>

        <div className="card p-4" style={{ background: "var(--card2)", border: st.theme.id === "custom" ? "1px solid var(--primary)" : undefined }}>
          <div className="font-bold text-[12.5px] mb-3 flex items-center gap-2">
            <Icon name="settings" size={14} /> سازنده تم سفارشی
            {st.theme.id === "custom" && <Badge kind="primary">فعال</Badge>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">رنگ اصلی</label>
              <input type="color" className="input !p-1 h-[38px] cursor-pointer" value={custom.primary} onChange={(e) => setCustom({ ...custom, primary: e.target.value })} />
            </div>
            <div>
              <label className="label">رنگ ثانویه</label>
              <input type="color" className="input !p-1 h-[38px] cursor-pointer" value={custom.accent} onChange={(e) => setCustom({ ...custom, accent: e.target.value })} />
            </div>
            <div>
              <label className="label">حالت</label>
              <select className="select" value={custom.mode} onChange={(e) => setCustom({ ...custom, mode: e.target.value as never })}>
                <option value="dark">تاریک</option>
                <option value="light">روشن</option>
              </select>
            </div>
            <div>
              <label className="label">فونت سیستم</label>
              <select className="select" value={custom.font} onChange={(e) => setCustom({ ...custom, font: e.target.value as never })}>
                <option value="Vazirmatn">وزیرمتن</option>
                <option value="Lalezar">لاله‌زار</option>
                <option value="Markazi Text">مرکزی</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">گردی گوشه‌ها: <span className="num">{fa(custom.radius)}</span> پیکسل</label>
              <input type="range" min={0} max={22} className="w-full" value={custom.radius} onChange={(e) => setCustom({ ...custom, radius: +e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary btn-sm mt-4" onClick={applyCustom}><Icon name="check" size={13} /> اعمال و ذخیره تم سفارشی</button>
        </div>
      </section>

      <div className="space-y-5">
        {/* ---------- برندینگ (بند ۶۳) ---------- */}
        <section className="card p-5">
          <h3 className="font-bold text-[14px] mb-3 flex items-center gap-2"><Icon name="factory" size={16} /> برندینگ و لوگو</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: "var(--card2)", border: "1px dashed var(--line2)" }}>
              {st.settings.logo ? <img src={st.settings.logo} alt="logo" className="w-full h-full object-contain" /> : <Icon name="factory" size={26} className="opacity-40" />}
            </div>
            <div className="space-y-1.5">
              <p className="text-[11.5px]" style={{ color: "var(--soft)" }}>لوگو در صفحه ورود، سربرگ، گزارش‌ها و فرم چاپی نمایش داده می‌شود.</p>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}><Icon name="upload" size={13} /> بارگذاری لوگو</button>
                {st.settings.logo && <button className="btn btn-ghost btn-sm" style={{ color: "var(--nok)" }} onClick={() => { patch((s) => ({ ...s, settings: { ...s.settings, logo: null } })); toast("info", "لوگو حذف شد"); }}><Icon name="trash" size={13} /> حذف</button>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => { patch((s) => ({ ...s, settings: { ...s.settings, logo: String(r.result) } })); toast("ok", "لوگو ذخیره شد"); };
                r.readAsDataURL(f);
              }} />
            </div>
          </div>
        </section>

        {/* ---------- اعلان‌ها (بند ۵۵ و ۵۶) ---------- */}
        <section className="card p-5">
          <h3 className="font-bold text-[14px] mb-3 flex items-center gap-2"><Icon name="bell" size={16} /> اعلان‌ها</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold flex items-center gap-2"><Icon name="mail" size={14} /> ارسال ایمیل هنگام NOK و Overdue</span>
              <Toggle on={st.settings.notifEmail} onChange={(v) => { patch((s) => ({ ...s, settings: { ...s.settings, notifEmail: v } })); toast("ok", v ? "اعلان ایمیلی فعال شد" : "اعلان ایمیلی غیرفعال شد"); }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold flex items-center gap-2"><Icon name="sms" size={14} /> ارسال پیامک به سرپرست شیفت</span>
              <Toggle on={st.settings.notifSMS} onChange={(v) => { patch((s) => ({ ...s, settings: { ...s.settings, notifSMS: v } })); toast("ok", v ? "اعلان پیامکی فعال شد" : "اعلان پیامکی غیرفعال شد"); }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-semibold flex items-center gap-2"><Icon name="db" size={14} /> بکاپ خودکار روزانه (ساعت ۰۲:۰۰)</span>
              <Toggle on={st.settings.autoBackup} onChange={(v) => { patch((s) => ({ ...s, settings: { ...s.settings, autoBackup: v } })); toast("ok", v ? "بکاپ خودکار فعال شد" : "بکاپ خودکار غیرفعال شد"); }} />
            </div>
          </div>
        </section>

        {/* ---------- ارتباط صنعتی (بندهای ۴۱ تا ۴۵) ---------- */}
        <section className="card p-5">
          <h3 className="font-bold text-[14px] mb-1 flex items-center gap-2"><Icon name="bolt" size={16} /> ارتباط صنعتی (PLC / Gateway)</h3>
          <p className="text-[10.5px] mb-3" style={{ color: "var(--muted)" }}>
            مسیر: Equipment ← PLC/HMI ← Industrial Gateway ← NIPCO Backend — اتصال مستقیم تبلت به PLC ممنوع است.
          </p>
          <div className="flex items-center gap-2 mb-3">
            <Badge kind={st.settings.conn.status === "Connected" ? "ok" : "nok"}><Dot color={st.settings.conn.status === "Connected" ? "var(--ok)" : "var(--nok)"} pulse /> {st.settings.conn.status}</Badge>
            <span className="text-[10.5px] num" style={{ color: "var(--muted)" }}>آخرین قرائت: {st.settings.conn.lastRead ? new Date(st.settings.conn.lastRead).toLocaleTimeString("fa-IR") : "—"}</span>
            <button className="btn btn-ghost btn-sm mr-auto" disabled={testing} onClick={() => {
              setTesting(true);
              setTimeout(() => {
                patch((s) => ({ ...s, settings: { ...s.settings, conn: { ...s.settings.conn, status: "Connected", lastRead: Date.now() } } }));
                notify("system", "تست ارتباط صنعتی", "اتصال به Gateway با موفقیت برقرار شد");
                setTesting(false);
                toast("ok", "ارتباط با Gateway برقرار است");
              }, 1200);
            }}><Icon name={testing ? "sync" : "bolt"} size={13} className={testing ? "spin" : ""} /> تست ارتباط</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><label className="label">پروتکل</label>
              <select className="select" value={st.settings.conn.protocol} onChange={(e) => patch((s) => ({ ...s, settings: { ...s.settings, conn: { ...s.settings.conn, protocol: e.target.value as never } } }))}>
                {["OPC UA", "Modbus TCP", "API", "Gateway"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="label">آدرس IP</label><input className="input num" dir="ltr" value={st.settings.conn.ip} onChange={(e) => patch((s) => ({ ...s, settings: { ...s.settings, conn: { ...s.settings.conn, ip: e.target.value } } }))} /></div>
            <div><label className="label">پورت</label><input className="input num" dir="ltr" value={st.settings.conn.port} onChange={(e) => patch((s) => ({ ...s, settings: { ...s.settings, conn: { ...s.settings.conn, port: +e.target.value } } }))} /></div>
            <div><label className="label">Polling (ثانیه)</label><input className="input num" dir="ltr" value={st.settings.conn.polling} onChange={(e) => patch((s) => ({ ...s, settings: { ...s.settings, conn: { ...s.settings.conn, polling: +e.target.value } } }))} /></div>
            <div><label className="label">Device ID</label><input className="input" dir="ltr" value={st.settings.conn.deviceId} onChange={(e) => patch((s) => ({ ...s, settings: { ...s.settings, conn: { ...s.settings.conn, deviceId: e.target.value } } }))} /></div>
            <div><label className="label">Register / Tag</label><input className="input" dir="ltr" value={st.settings.conn.register} onChange={(e) => patch((s) => ({ ...s, settings: { ...s.settings, conn: { ...s.settings.conn, register: e.target.value } } }))} /></div>
            <div><label className="label">Timeout (ثانیه)</label><input className="input num" dir="ltr" value={st.settings.conn.timeout} onChange={(e) => patch((s) => ({ ...s, settings: { ...s.settings, conn: { ...s.settings.conn, timeout: +e.target.value } } }))} /></div>
            <div><label className="label">Retry</label><input className="input num" dir="ltr" value={st.settings.conn.retry} onChange={(e) => patch((s) => ({ ...s, settings: { ...s.settings, conn: { ...s.settings.conn, retry: +e.target.value } } }))} /></div>
          </div>
        </section>
      </div>

      {/* ---------- بکاپ و بازیابی (بندهای ۶۰ و ۶۱) ---------- */}
      <section className="card p-5">
        <h3 className="font-bold text-[14px] mb-3 flex items-center gap-2"><Icon name="db" size={16} /> بکاپ و بازیابی</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <button className="btn btn-primary btn-sm" onClick={backupExport}><Icon name="download" size={13} /> بکاپ دستی (دانلود فایل)</button>
          {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => fileRef2.current?.click()}><Icon name="upload" size={13} /> بازیابی از فایل بکاپ</button>}
          <input ref={fileRef2} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ""; }} />
        </div>
        <p className="text-[10.5px] leading-5" style={{ color: "var(--muted)" }}>
          بکاپ شامل دیتابیس، چک‌لیست‌ها، پیش‌نویس‌ها، تاریخچه ساعت کارکرد، لاگ‌ها و تنظیمات است. بازیابی فقط توسط مدیر مجاز و با ثبت در لاگ انجام می‌شود.
        </p>
      </section>

      {/* ---------- سال شمسی و آرشیو (بندهای ۵۸ و ۵۹) ---------- */}
      <section className="card p-5">
        <h3 className="font-bold text-[14px] mb-3 flex items-center gap-2"><Icon name="archive" size={16} /> مدیریت سال شمسی</h3>
        <p className="text-[11px] mb-4 -mt-1 leading-6" style={{ color: "var(--muted)" }}>
          بستن هر سال <b>در پایان سال (اسفند ماه)</b> و فقط توسط دارندگان دسترسی «بستن سال» انجام می‌شود؛
          دسترسی به آرشیو سال‌های قبل نیز منوط به مجوز «مشاهده آرشیو» است و همواره فقط‌خواندنی خواهد بود.
        </p>

        {/* نمایش دسترسی کاربر جاری */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="text-[11px] font-bold" style={{ color: "var(--soft)" }}>دسترسی‌های شما:</span>
          <Badge kind={canClose ? "ok" : "neutral"}><Icon name={canClose ? "check" : "lock"} size={10} /> بستن سال شمسی</Badge>
          <Badge kind={canView ? "ok" : "neutral"}><Icon name={canView ? "check" : "lock"} size={10} /> مشاهده آرشیو سال‌های قبل</Badge>
          {!canClose && !canView && <span className="text-[10.5px]" style={{ color: "var(--muted)" }}>برای دریافت دسترسی با مدیر سیستم هماهنگ کنید</span>}
        </div>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="card px-4 py-3" style={{ background: "var(--card2)" }}>
            <div className="text-[10.5px]" style={{ color: "var(--muted)" }}>سال کاری جاری</div>
            <div className="num text-[24px] font-bold" style={{ color: "var(--primary)" }}>{fa(st.currentYear)}</div>
          </div>
          <div className="card px-4 py-3" style={{ background: "var(--card2)" }}>
            <div className="text-[10.5px]" style={{ color: "var(--muted)" }}>تاریخ شمسی امروز</div>
            <div className="text-[14px] font-bold">{J_MONTHS[today.jm - 1]} <span className="num text-[16px]" style={{ color: isEsfand ? "var(--ok)" : "var(--warn)" }}>{fa(today.jd)}</span></div>
          </div>
          <div className="flex-1 min-w-[190px] text-[11.5px] leading-6" style={{ color: "var(--soft)" }}>
            جریان پایان سال: <b>Close Shamsi Year ← Archive ← Backup ← Create New Year</b>
          </div>
          {canClose && (
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmYear(true)}>
              <Icon name="archive" size={13} /> بستن سال {fa(st.currentYear)}
            </button>
          )}
        </div>
        {st.archivedYears.length > 0 ? (
          <table className="tbl">
            <thead><tr><th>سال آرشیوشده</th><th>تعداد رکورد</th><th>تاریخ بسته شدن</th><th>دسترسی</th><th></th></tr></thead>
            <tbody>
              {st.archivedYears.map((a) => (
                <tr key={a.jy}>
                  <td className="num font-bold">{fa(a.jy)}</td>
                  <td className="num">{faNum(a.records)}</td>
                  <td className="num">{new Date(a.closedAt).toLocaleDateString("fa-IR")}</td>
                  <td><Badge kind="info">فقط خواندنی</Badge></td>
                  <td>
                    {canView ? (
                      <button className="btn btn-ghost btn-sm" onClick={() => setViewYear(a)}><Icon name="eye" size={13} /> مشاهده آرشیو</button>
                    ) : (
                      <span className="chip"><Icon name="lock" size={11} /> بدون دسترسی</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[11.5px] rounded-lg p-3" style={{ background: "var(--card2)", color: "var(--muted)" }}>
            هنوز سالی آرشیو نشده است — پس از بستن اولین سال، آرشیو آن در این فهرست قرار می‌گیرد.
          </p>
        )}
      </section>

      {/* ---------- درباره ---------- */}
      <section className="card p-5">
        <h3 className="font-bold text-[14px] mb-2 flex items-center gap-2"><Icon name="info" size={16} /> درباره سامانه</h3>
        <div className="text-[12px] leading-7" style={{ color: "var(--soft)" }}>
          <b>NIPCO Daily Equipment Control System</b> — نسخه {fa("1.4.0")}<br />
          طراح و تحلیلگر سیستم: <b style={{ color: "var(--primary)" }}>محمد روشندل</b><br />
          اسناد فنی: README · ARCHITECTURE · DATABASE · API · PERMISSIONS · OFFLINE-SYNC · OPERATING-HOURS · USER-MANUAL · DEPLOYMENT · SECURITY
        </div>
      </section>

      {/* مودال بستن سال — منوط به اسفند ماه و سطح دسترسی (بندهای ۵۸ و ۵۹) */}
      <Modal open={confirmYear} onClose={() => setConfirmYear(false)} title={`بستن سال شمسی ${fa(st.currentYear)}`} icon="archive" width={490}>
        <div className="space-y-3.5">
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {["بستن سال", "آرشیو", "بکاپ کامل", "سال جدید"].map((s, i) => (
              <div key={s} className="rounded-lg py-2.5 text-[10.5px] font-bold" style={{ background: "var(--card2)", border: "1px solid var(--line)" }}>
                <span className="block num text-[14px] mb-1" style={{ color: "var(--primary)" }}>{fa(i + 1)}</span>{s}
              </div>
            ))}
          </div>
          {isEsfand ? (
            <div className="rounded-lg p-3 text-[11.5px] font-bold flex items-center gap-2" style={{ background: "var(--okbg)", color: "var(--ok)" }}>
              <Icon name="check" size={14} /> اکنون در اسفند ماه هستید — موعد استاندارد پایان سال شمسی
            </div>
          ) : (
            <div className="rounded-lg p-3 text-[11.5px] leading-6" style={{ background: "var(--warnbg)", color: "var(--warn)", border: "1px solid color-mix(in srgb, var(--warn) 32%, transparent)" }}>
              <b className="flex items-center gap-1.5 mb-1"><Icon name="alert" size={13} /> خارج از موعد پایان سال</b>
              امروز {faDateLong(today)} است ({J_MONTHS[today.jm - 1]} ماه). بستن سال به‌طور استاندارد فقط در <b>اسفند ماه</b> انجام می‌شود
              {isAdmin ? " — با اختیارات مدیر سیستم می‌توانید ادامه دهید." : " — ادامه این عملیات در ماه‌های دیگر فقط برای مدیر سیستم مجاز است."}
            </div>
          )}
          <p className="text-[12px] leading-6" style={{ color: "var(--soft)" }}>
            رکوردهای سال {fa(st.currentYear)} آرشیو و برای کاربران دارای مجوز به‌صورت <b>فقط‌خواندنی</b> در دسترس قرار می‌گیرند،
            بکاپ کامل گرفته شده و سال کاری جدید آغاز می‌گردد.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button className="btn btn-ghost" onClick={() => setConfirmYear(false)}>انصراف</button>
            <button className="btn btn-primary" disabled={!isEsfand && !isAdmin} onClick={() => { closeYear(); setConfirmYear(false); }}>
              <Icon name="archive" size={14} />
              {isEsfand ? "بله، سال بسته شود" : isAdmin ? "بستن با اختیارات مدیر" : "غیرمجاز در این ماه"}
            </button>
          </div>
        </div>
      </Modal>

      {/* مودال مشاهده آرشیو سال قبل — فقط‌خواندنی و منوط به مجوز (بند ۵۹) */}
      <Modal open={!!viewYear} onClose={() => setViewYear(null)} title={`آرشیو سال شمسی ${fa(viewYear?.jy ?? 0)}`} icon="archive" width={460}>
        {viewYear && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              <Badge kind="info"><Icon name="lock" size={10} /> دسترسی فقط خواندنی</Badge>
              <Badge kind="primary">سال {fa(viewYear.jy)}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="card p-4 text-center" style={{ background: "var(--card2)" }}>
                <div className="num text-[24px] font-bold" style={{ color: "var(--primary)" }}>{faNum(viewYear.records)}</div>
                <div className="text-[10.5px] font-bold mt-1" style={{ color: "var(--muted)" }}>رکورد آرشیوشده</div>
              </div>
              <div className="card p-4 text-center" style={{ background: "var(--card2)" }}>
                <div className="num text-[17px] font-bold mt-1.5">{new Date(viewYear.closedAt).toLocaleDateString("fa-IR")}</div>
                <div className="text-[10.5px] font-bold mt-1" style={{ color: "var(--muted)" }}>تاریخ بسته شدن</div>
              </div>
            </div>
            <p className="text-[11.5px] leading-6 rounded-lg p-3" style={{ background: "var(--card2)", color: "var(--soft)" }}>
              رکوردهای این سال قابل ویرایش یا حذف نیستند. برای گزارش‌گیری از داده‌های سال {fa(viewYear.jy)}،
              بازه تاریخ فیلترها را در تب‌های <b>گزارشات</b> روی این سال تنظیم کنید.
            </p>
            <div className="flex justify-end"><button className="btn btn-ghost" onClick={() => setViewYear(null)}>بستن</button></div>
          </div>
        )}
      </Modal>
    </div>
  );
}


