/**
 * ============================================================
 * منوی واحد «گزارشات» با ۵ تب مجزا و فیلترهای اختصاصی هر تب
 * (بندهای ۵۱ تا ۵۴) + خروجی Excel(CSV) / PDF / چاپ
 * ============================================================
 */
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../lib/store";
import { jAddDays, jKey, workDateJ, type JDate } from "../lib/jalali";
import { cx, fa, faDate, download, toCSV, faNum } from "../lib/util";
import { Icon, Badge, JDatePicker, Bars, LineArea, Donut, Empty, StatusBadge } from "../components/ui";
import { PrintSheet, type PrintData } from "./PrintSheet";
import { FAILURE_LOCS, type ControlRec } from "../lib/types";

type Tab = "daily" | "nok" | "ophours" | "perf" | "charts";
const TABS: { id: Tab; l: string; i: string }[] = [
  { id: "daily", l: "گزارش کنترل‌های روزانه", i: "control" },
  { id: "nok", l: "عدم انطباق‌ها و خرابی‌ها", i: "alert" },
  { id: "ophours", l: "ساعت کارکرد", i: "gauge" },
  { id: "perf", l: "عملکرد تکنسین‌ها و شیفت‌ها", i: "users" },
  { id: "charts", l: "نمودارهای تحلیلی", i: "reports" },
];

interface Range { from: JDate | null; to: JDate | null }
const inRange = (d: JDate, r: Range) => {
  const k = jKey(d);
  if (r.from && k < jKey(r.from)) return false;
  if (r.to && k > jKey(r.to)) return false;
  return true;
};

/* سربرگ چاپ گزارش‌ها */
function ReportPrint({ title, cols, rows }: { title: string; cols: string[]; rows: (string | number)[][] }) {
  if (!title) return null;
  return createPortal(
    <div id="print-sheet" dir="rtl">
      <div className="print-card" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>شرکت قطعه‌سازی NIPCO — {title}</div>
        <div style={{ fontSize: 9, color: "#444" }}>سامانه کنترل روزانه تجهیزات · طراح: محمد روشندل</div>
      </div>
      <table className="print-table" style={{ marginTop: 8 }}>
        <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>, document.body);
}

export function Reports() {
  const { st, me, toast } = useApp();
  const [tab, setTab] = useState<Tab>("daily");
  const wd = workDateJ();
  const week: Range = { from: jAddDays(wd, -6), to: wd };

  /* ---------- فیلترهای اختصاصی هر تب ---------- */
  const [r1, setR1] = useState<Range>(week);
  const [f1, setF1] = useState({ eq: "", group: "", shift: 0, tech: "", status: "" });
  const [r2, setR2] = useState<Range>(week);
  const [f2, setF2] = useState({ group: "", tech: "", loc: "" });
  const [r3, setR3] = useState<Range>(week);
  const [f3, setF3] = useState({ group: "", source: "", tech: "" });
  const [r4, setR4] = useState<Range>(week);
  const [f4, setF4] = useState({ shift: 0 });
  const [r5, setR5] = useState<Range>(week);
  const [c5, setC5] = useState({ type: "bar", metric: "controls" });

  const [printRec, setPrintRec] = useState<PrintData | null>(null);
  const [printTbl, setPrintTbl] = useState<{ title: string; cols: string[]; rows: (string | number)[][] } | null>(null);

  const eqName = (id: string) => st.equipment.find((e) => e.id === id)?.name ?? id;
  const techName = (id: string) => st.users.find((u) => u.id === id)?.name ?? id;
  const groupName = (id: string) => st.groups.find((g) => g.id === id)?.name ?? id;

  /* ---------- تب ۱: کنترل‌های روزانه ---------- */
  const daily = useMemo(() => st.controls.filter((c) =>
    inRange(c.date, r1) &&
    (!f1.eq || c.equipmentId === f1.eq) &&
    (!f1.group || st.equipment.find((e) => e.id === c.equipmentId)?.groupId === f1.group) &&
    (!f1.shift || c.shift === f1.shift) &&
    (!f1.tech || c.techId === f1.tech) &&
    (!f1.status || c.status === f1.status)
  ), [st, r1.from, r1.to, f1]); // eslint-disable-line

  /* ---------- تب ۲: عدم انطباق‌ها ---------- */
  const nokRows = useMemo(() => {
    const out: { rec: ControlRec; item: string; result: string; oor: boolean }[] = [];
    st.controls.filter((c) => c.status === "NOK" && inRange(c.date, r2) &&
      (!f2.group || st.equipment.find((e) => e.id === c.equipmentId)?.groupId === f2.group) &&
      (!f2.tech || c.techId === f2.tech) &&
      (!f2.loc || c.failLoc === f2.loc)).forEach((rec) => {
        const cl = st.checklists.find((x) => x.id === rec.checklistId);
        cl?.sections.forEach((s) => s.items.forEach((it) => {
          const a = rec.answers[it.id];
          const oor = it.kind === "numeric" && a?.num != null && (a.num < (it.min ?? -Infinity) || a.num > (it.max ?? Infinity));
          if (a?.ok === false || oor) out.push({ rec, item: it.title, result: a?.ok === false ? "NOK" : `${faNum(a!.num!, it.prec ?? 0)} ${it.unit ?? ""}`, oor });
        }));
      });
    return out;
  }, [st, r2.from, r2.to, f2]); // eslint-disable-line

  /* ---------- تب ۳: ساعت کارکرد ---------- */
  const opRows = useMemo(() => st.readings.filter((r) =>
    inRange(r.date, r3) &&
    (!f3.group || st.equipment.find((e) => e.id === r.equipmentId)?.groupId === f3.group) &&
    (!f3.source || r.source === f3.source) &&
    (!f3.tech || r.userId === f3.tech)
  ), [st, r3.from, r3.to, f3]); // eslint-disable-line

  /* ---------- تب ۴: عملکرد ---------- */
  const perf = useMemo(() => {
    const recs = st.controls.filter((c) => inRange(c.date, r4) && (!f4.shift || c.shift === f4.shift));
    return st.users.filter((u) => (u.role === "technician" || u.role === "engineer") && u.active).map((u) => {
      const mine = recs.filter((c) => c.techId === u.id);
      const nok = mine.filter((c) => c.status === "NOK").length;
      return { u, total: mine.length, nok, ok: mine.length - nok, drafts: st.drafts.filter((d) => d.techId === u.id).length, pct: mine.length ? Math.round(((mine.length - nok) / mine.length) * 100) : 0 };
    }).filter((p) => p.total > 0 || p.drafts > 0);
  }, [st, r4.from, r4.to, f4]); // eslint-disable-line

  /* ---------- تب ۵: نمودارها ---------- */
  const chartData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => jAddDays(wd, i - 13)).filter((d) => inRange(d, r5));
    const series = days.map((d) => {
      const k = jKey(d);
      const recs = st.controls.filter((c) => c.dateKey === k);
      return {
        label: fa(d.jd),
        controls: recs.length,
        nok: recs.filter((c) => c.status === "NOK").length,
      };
    });
    const byGroup = st.groups.map((g) => ({
      label: g.name,
      value: st.controls.filter((c) => inRange(c.date, r5) && st.equipment.find((e) => e.id === c.equipmentId)?.groupId === g.id).length,
    })).filter((x) => x.value > 0);
    return { series, byGroup };
  }, [st, r5.from, r5.to]); // eslint-disable-line

  const presets = (set: (r: Range) => void) => (
    <div className="flex gap-1.5 flex-wrap">
      {[{ l: "امروز", r: { from: wd, to: wd } }, { l: "۷ روز", r: { from: jAddDays(wd, -6), to: wd } }, { l: "۳۰ روز", r: { from: jAddDays(wd, -29), to: wd } }, { l: "همه", r: { from: null, to: null } }].map((p) => (
        <button key={p.l} className="chip cursor-pointer hover:opacity-80" onClick={() => set(p.r)}>{p.l}</button>
      ))}
    </div>
  );

  const RangeFilter = ({ r, set }: { r: Range; set: (x: Range) => void }) => (
    <div className="flex items-center gap-2 flex-wrap">
      {presets(set)}
      <div className="w-[140px]"><JDatePicker value={r.from} onChange={(j) => set({ ...r, from: j })} placeholder="از تاریخ" /></div>
      <span className="text-[11px]" style={{ color: "var(--muted)" }}>تا</span>
      <div className="w-[140px]"><JDatePicker value={r.to} onChange={(j) => set({ ...r, to: j })} placeholder="تا تاریخ" /></div>
    </div>
  );

  const Sel = ({ v, set, opts, all }: { v: string; set: (x: string) => void; opts: { v: string; l: string }[]; all: string }) => (
    <select className="select !w-auto !py-2 text-[12px]" value={v} onChange={(e) => set(e.target.value)}>
      <option value="">{all}</option>
      {opts.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );

  const eqOpts = st.equipment.map((e) => ({ v: e.id, l: e.name }));
  const grpOpts = st.groups.map((g) => ({ v: g.id, l: g.name }));
  const techOpts = st.users.filter((u) => u.role !== "viewer").map((u) => ({ v: u.id, l: u.name }));

  const exportCSV = (name: string, cols: string[], rows: (string | number)[][]) => {
    download(`${name}.csv`, toCSV(cols, rows));
    toast("ok", "خروجی Excel دانلود شد");
  };

  const doPrint = () => setTimeout(() => window.print(), 200);

  return (
    <div>
      <div className="tabs mb-4 w-full">
        {TABS.map((t) => (
          <button key={t.id} className={cx("tab", tab === t.id && "on")} onClick={() => setTab(t.id)}>
            <Icon name={t.i} size={14} /> {t.l}
          </button>
        ))}
      </div>

      {/* ================= تب ۱ ================= */}
      {tab === "daily" && (
        <div className="anim-in">
          <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-2.5">
            <Icon name="filter" size={15} className="shrink-0" />
            <RangeFilter r={r1} set={setR1} />
            <Sel v={f1.eq} set={(x) => setF1({ ...f1, eq: x })} opts={eqOpts} all="همه تجهیزات" />
            <Sel v={f1.group} set={(x) => setF1({ ...f1, group: x })} opts={grpOpts} all="همه گروه‌ها" />
            <Sel v={String(f1.shift)} set={(x) => setF1({ ...f1, shift: +x })} opts={[{ v: "1", l: "شیفت ۱" }, { v: "2", l: "شیفت ۲" }, { v: "3", l: "شیفت ۳" }]} all="همه شیفت‌ها" />
            <Sel v={f1.tech} set={(x) => setF1({ ...f1, tech: x })} opts={techOpts} all="همه تکنسین‌ها" />
            <Sel v={f1.status} set={(x) => setF1({ ...f1, status: x })} opts={[{ v: "Completed", l: "تکمیل‌شده" }, { v: "NOK", l: "نامنطبق" }]} all="همه وضعیت‌ها" />
            <div className="mr-auto flex gap-1.5">
              <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(`nipco-daily-${jKey(wd).replace(/\//g, "")}`, ["تاریخ", "تجهیز", "کنترل", "تکنسین", "شیفت", "وضعیت", "همگام‌سازی"], daily.map((c) => [faDate(c.date), eqName(c.equipmentId), st.checklists.find((x) => x.id === c.checklistId)?.title ?? "", techName(c.techId), `شیفت ${c.shift}`, c.status === "NOK" ? "نامنطبق" : "تکمیل", c.syncState === "synced" ? "همگام" : "در صف"]))}><Icon name="download" size={13} /> Excel</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setPrintRec(null); setPrintTbl({ title: "گزارش کنترل‌های روزانه", cols: ["تاریخ", "تجهیز", "کنترل", "تکنسین", "شیفت", "وضعیت"], rows: daily.map((c) => [faDate(c.date), eqName(c.equipmentId), st.checklists.find((x) => x.id === c.checklistId)?.title ?? "", techName(c.techId), `شیفت ${c.shift}`, c.status === "NOK" ? "نامنطبق" : "تکمیل"]) }); doPrint(); }}><Icon name="print" size={13} /> چاپ</button>
            </div>
          </div>
          <div className="card overflow-auto">
            {daily.length === 0 ? <Empty icon="control" title="رکوردی با این فیلترها نیست" sub="بازه زمانی یا فیلترها را تغییر دهید" /> : (
              <table className="tbl">
                <thead><tr><th>تاریخ شمسی</th><th>تجهیز</th><th>کنترل</th><th>تکنسین</th><th>شیفت</th><th>وضعیت</th><th>Sync</th><th></th></tr></thead>
                <tbody>
                  {daily.slice(0, 60).map((c) => (
                    <tr key={c.id}>
                      <td className="num">{faDate(c.date)}</td>
                      <td className="font-bold">{eqName(c.equipmentId)}</td>
                      <td>{st.checklists.find((x) => x.id === c.checklistId)?.title}</td>
                      <td>{techName(c.techId)}</td>
                      <td className="num">{fa(c.shift)}</td>
                      <td><StatusBadge s={c.status} /></td>
                      <td><Badge kind={c.syncState === "synced" ? "ok" : "warn"}>{c.syncState === "synced" ? "همگام" : "در صف"}</Badge></td>
                      <td><button className="btn btn-ghost btn-sm !px-2" title="چاپ فرم" onClick={() => { setPrintTbl(null); setPrintRec({ rec: c }); doPrint(); }}><Icon name="print" size={13} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <p className="text-[11px] mt-2" style={{ color: "var(--muted)" }}>{fa(daily.length)} رکورد — نمایش {fa(Math.min(60, daily.length))} مورد</p>
        </div>
      )}

      {/* ================= تب ۲ ================= */}
      {tab === "nok" && (
        <div className="anim-in">
          <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-2.5">
            <Icon name="filter" size={15} />
            <RangeFilter r={r2} set={setR2} />
            <Sel v={f2.group} set={(x) => setF2({ ...f2, group: x })} opts={grpOpts} all="همه گروه‌ها" />
            <Sel v={f2.tech} set={(x) => setF2({ ...f2, tech: x })} opts={techOpts} all="همه تکنسین‌ها" />
            <Sel v={f2.loc} set={(x) => setF2({ ...f2, loc: x })} opts={FAILURE_LOCS.map((f) => ({ v: f, l: f }))} all="همه محل‌های خرابی" />
            <div className="mr-auto flex gap-1.5">
              <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(`nipco-nok-${jKey(wd).replace(/\//g, "")}`, ["تاریخ", "تجهیز", "آیتم نامنطبق", "نتیجه", "محل خرابی", "تکنسین", "توضیحات"], nokRows.map((n) => [faDate(n.rec.date), eqName(n.rec.equipmentId), n.item, n.result, n.rec.failLoc ?? "—", techName(n.rec.techId), n.rec.notes]))}><Icon name="download" size={13} /> Excel</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setPrintRec(null); setPrintTbl({ title: "گزارش عدم انطباق‌ها (NOK / خارج از محدوده)", cols: ["تاریخ", "تجهیز", "آیتم", "نتیجه", "محل خرابی", "تکنسین"], rows: nokRows.map((n) => [faDate(n.rec.date), eqName(n.rec.equipmentId), n.item, n.result, n.rec.failLoc ?? "—", techName(n.rec.techId)]) }); doPrint(); }}><Icon name="print" size={13} /> چاپ</button>
            </div>
          </div>
          <div className="card overflow-auto">
            {nokRows.length === 0 ? <Empty icon="check" title="عدم انطباقی یافت نشد" sub="در این بازه همه کنترل‌ها سالم ثبت شده‌اند" /> : (
              <table className="tbl">
                <thead><tr><th>تاریخ</th><th>تجهیز</th><th>آیتم نامنطبق</th><th>نتیجه</th><th>محل خرابی</th><th>تکنسین</th><th>توضیحات</th></tr></thead>
                <tbody>
                  {nokRows.map((n, i) => (
                    <tr key={i}>
                      <td className="num">{faDate(n.rec.date)}</td>
                      <td className="font-bold">{eqName(n.rec.equipmentId)}</td>
                      <td>{n.item}</td>
                      <td><Badge kind={n.oor ? "warn" : "nok"}>{n.result}</Badge></td>
                      <td>{n.rec.failLoc ?? "—"}</td>
                      <td>{techName(n.rec.techId)}</td>
                      <td className="max-w-[220px] truncate" title={n.rec.notes}>{n.rec.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ================= تب ۳ ================= */}
      {tab === "ophours" && (
        <div className="anim-in">
          <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-2.5">
            <Icon name="filter" size={15} />
            <RangeFilter r={r3} set={setR3} />
            <Sel v={f3.group} set={(x) => setF3({ ...f3, group: x })} opts={[{ v: "g-comp", l: "کمپرسور" }, { v: "g-fork", l: "لیفتراک" }]} all="کمپرسور و لیفتراک" />
            <Sel v={f3.source} set={(x) => setF3({ ...f3, source: x })} opts={[{ v: "AUTO", l: "خودکار (PLC)" }, { v: "MANUAL", l: "دستی" }, { v: "ADJUSTED", l: "اصلاحی" }]} all="همه منابع" />
            <Sel v={f3.tech} set={(x) => setF3({ ...f3, tech: x })} opts={techOpts} all="همه کاربران" />
            <div className="mr-auto flex gap-1.5">
              <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(`nipco-ophours-${jKey(wd).replace(/\//g, "")}`, ["تاریخ", "تجهیز", "قرائت قبلی", "قرائت جدید", "اختلاف", "منبع", "کاربر"], opRows.map((r) => [faDate(r.date), eqName(r.equipmentId), faNum(r.prev, 1), faNum(r.next, 1), faNum(r.diff, 1), r.source, techName(r.userId)]))}><Icon name="download" size={13} /> Excel</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setPrintRec(null); setPrintTbl({ title: "گزارش ساعت کارکرد (کمپرسور و لیفتراک)", cols: ["تاریخ", "تجهیز", "قبلی", "جدید", "اختلاف", "منبع", "کاربر"], rows: opRows.map((r) => [faDate(r.date), eqName(r.equipmentId), faNum(r.prev, 1), faNum(r.next, 1), faNum(r.diff, 1), r.source === "AUTO" ? "خودکار" : r.source === "MANUAL" ? "دستی" : "اصلاحی", techName(r.userId)]) }); doPrint(); }}><Icon name="print" size={13} /> چاپ</button>
            </div>
          </div>
          <div className="card overflow-auto">
            {opRows.length === 0 ? <Empty icon="gauge" title="قرائتی ثبت نشده" /> : (
              <table className="tbl">
                <thead><tr><th>تاریخ شمسی</th><th>تجهیز</th><th>قرائت قبلی</th><th>قرائت جدید</th><th>اختلاف</th><th>شیفت</th><th>منبع</th><th>کاربر</th></tr></thead>
                <tbody>
                  {opRows.slice(0, 60).map((r) => (
                    <tr key={r.id}>
                      <td className="num">{faDate(r.date)}</td>
                      <td className="font-bold">{eqName(r.equipmentId)}</td>
                      <td className="num">{faNum(r.prev, 1)}</td>
                      <td className="num font-bold" style={{ color: "var(--accent)" }}>{faNum(r.next, 1)}</td>
                      <td className="num">+{faNum(r.diff, 1)}</td>
                      <td className="num">{fa(r.shift)}</td>
                      <td><Badge kind={r.source === "AUTO" ? "info" : r.source === "MANUAL" ? "warn" : "nok"}>{r.source === "AUTO" ? "PLC" : r.source === "MANUAL" ? "دستی" : "اصلاحی"}</Badge></td>
                      <td>{techName(r.userId)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ================= تب ۴ ================= */}
      {tab === "perf" && (
        <div className="anim-in">
          <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-2.5">
            <Icon name="filter" size={15} />
            <RangeFilter r={r4} set={setR4} />
            <Sel v={String(f4.shift)} set={(x) => setF4({ shift: +x })} opts={[{ v: "1", l: "شیفت ۱" }, { v: "2", l: "شیفت ۲" }, { v: "3", l: "شیفت ۳" }]} all="همه شیفت‌ها" />
            <div className="mr-auto">
              <button className="btn btn-ghost btn-sm" onClick={() => exportCSV(`nipco-perf-${jKey(wd).replace(/\//g, "")}`, ["تکنسین", "شیفت", "کل کنترل‌ها", "سالم", "نامنطبق", "پیش‌نویس باز", "درصد سلامت"], perf.map((p) => [p.u.name, `شیفت ${p.u.shift}`, p.total, p.ok, p.nok, p.drafts, `${p.pct}%`]))}><Icon name="download" size={13} /> Excel</button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {perf.length === 0 && <div className="md:col-span-3"><Empty icon="users" title="عملکردی در این بازه ثبت نشده" /></div>}
            {perf.map((p) => (
              <div key={p.u.id} className="card card-hover p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-10 h-10 rounded-lg flex items-center justify-center font-display text-[16px]" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}>{p.u.name.slice(0, 1)}</span>
                  <div className="flex-1">
                    <div className="font-bold text-[13px]">{p.u.name}</div>
                    <div className="text-[10.5px]" style={{ color: "var(--muted)" }}>شیفت {fa(p.u.shift)} · {p.u.dept}</div>
                  </div>
                  <span className="num text-[20px] font-bold" style={{ color: p.pct >= 90 ? "var(--ok)" : p.pct >= 70 ? "var(--warn)" : "var(--nok)" }}>{fa(p.pct)}٪</span>
                </div>
                <div className="meter mb-3"><i style={{ width: `${p.pct}%`, background: p.pct >= 90 ? "var(--ok)" : "var(--warn)" }} /></div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[{ l: "کل", v: p.total, c: "var(--primary)" }, { l: "سالم", v: p.ok, c: "var(--ok)" }, { l: "NOK", v: p.nok, c: "var(--nok)" }, { l: "پیش‌نویس", v: p.drafts, c: "var(--warn)" }].map((x) => (
                    <div key={x.l} className="rounded-lg py-2" style={{ background: "var(--card2)" }}>
                      <div className="num text-[16px] font-bold" style={{ color: x.c }}>{fa(x.v)}</div>
                      <div className="text-[9.5px] font-bold mt-0.5" style={{ color: "var(--muted)" }}>{x.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= تب ۵: نمودارها ================= */}
      {tab === "charts" && (
        <div className="anim-in">
          <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-2.5">
            <Icon name="reports" size={15} />
            <RangeFilter r={r5} set={setR5} />
            <div className="tabs !w-auto">
              {[{ v: "bar", l: "میله‌ای" }, { v: "line", l: "خطی" }, { v: "area", l: "سطحی" }, { v: "pie", l: "دایره‌ای" }, { v: "donut", l: "دونات" }].map((x) => (
                <button key={x.v} className={cx("tab !py-1.5 !px-3 !text-[11px]", c5.type === x.v && "on")} onClick={() => setC5({ ...c5, type: x.v })}>{x.l}</button>
              ))}
            </div>
            <Sel v={c5.metric} set={(x) => setC5({ ...c5, metric: x })} opts={[{ v: "controls", l: "تعداد کنترل‌ها" }, { v: "nok", l: "موارد NOK" }, { v: "group", l: "تفکیک گروه‌ها" }]} all="" />
          </div>
          <div className="card p-5">
            {c5.metric === "group" ? (
              <div className="flex flex-wrap items-center justify-center gap-8">
                <Donut size={190} thick={c5.type === "donut" || c5.type === "pie" ? (c5.type === "pie" ? 60 : 26) : 26} center={fa(chartData.byGroup.reduce((a, b) => a + b.value, 0))} sub="کنترل"
                  segs={chartData.byGroup.map((g, i) => ({ value: g.value, color: ["var(--primary)", "var(--accent)", "var(--ok)", "var(--warn)", "var(--info)", "var(--nok)"][i % 6], label: g.label }))} />
                <div className="space-y-2">
                  {chartData.byGroup.map((g, i) => (
                    <div key={g.label} className="flex items-center gap-2.5 text-[12px] font-bold">
                      <span className="w-3 h-3 rounded-sm" style={{ background: ["var(--primary)", "var(--accent)", "var(--ok)", "var(--warn)", "var(--info)", "var(--nok)"][i % 6] }} />
                      {g.label} <span className="num" style={{ color: "var(--muted)" }}>{fa(g.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : c5.type === "bar" ? (
              <Bars data={chartData.series.map((s) => ({ label: s.label, value: c5.metric === "nok" ? s.nok : s.controls }))} h={200} />
            ) : (
              <LineArea data={chartData.series.map((s) => (c5.metric === "nok" ? s.nok : s.controls))} labels={chartData.series.map((s) => s.label)} h={210} color={c5.metric === "nok" ? "var(--nok)" : "var(--accent)"} />
            )}
            <p className="text-center text-[10.5px] mt-4" style={{ color: "var(--muted)" }}>محور افقی بر پایه روزهای تقویم شمسی — {me?.role === "viewer" ? "دسترسی فقط مشاهده" : ""}</p>
          </div>
        </div>
      )}

      <PrintSheet st={st} data={printRec} meName={me?.name ?? ""} />
      {printTbl && <ReportPrint {...printTbl} />}
    </div>
  );
}
