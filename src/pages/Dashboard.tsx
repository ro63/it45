/**
 * داشبورد ماژولار و ویجتی (بندهای ۴۹ و ۵۰)
 * افزودن/حذف/جابه‌جایی/تغییر اندازه ویجت‌ها + ذخیره چیدمان per-user
 */
import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { OP_HOURS_GROUPS } from "../lib/types";
import { jAddDays, jKey, workDateJ, todayJ, SHIFTS, currentShift } from "../lib/jalali";
import { cx, fa, faDateLong, faTimeShort, faNum } from "../lib/util";
import { Icon, Badge, Bars, Donut, Modal, Empty, Dot } from "../components/ui";

type WId = "equip" | "today" | "nok" | "shift" | "ophours" | "trend" | "feed";

const W_META: Record<WId, { title: string; icon: string; desc: string }> = {
  equip: { title: "وضعیت تجهیزات", icon: "equipment", desc: "فعال / غیرفعال / کل" },
  today: { title: "کنترل‌های امروز", icon: "control", desc: "تکمیل‌شده و در حال انجام" },
  nok: { title: "نامنطبقی‌ها و Overdue", icon: "alert", desc: "NOK، خروج از محدوده و عقب‌افتاده" },
  shift: { title: "شیفت جاری و تکنسین‌ها", icon: "users", desc: "عملکرد لحظه‌ای تیم نت" },
  ophours: { title: "ساعت کارکرد", icon: "gauge", desc: "فقط کمپرسورها و لیفتراک‌ها" },
  trend: { title: "روند ۷ روز اخیر", icon: "reports", desc: "تعداد کنترل‌های روزانه" },
  feed: { title: "رویدادهای اخیر", icon: "history", desc: "خلاصه لاگ‌های سیستم" },
};

const ALL_W: WId[] = ["today", "nok", "equip", "shift", "ophours", "trend", "feed"];

export function Dashboard({ goControl }: { goControl: () => void }) {
  const { st, me, saveLayout, resetLayout } = useApp();
  const saved = me ? st.layouts[me.id] : undefined;
  const [order, setOrder] = useState<WId[]>((saved?.order as WId[] | undefined) ?? ALL_W);
  const [sizes, setSizes] = useState<Record<string, "sm" | "lg">>(saved?.sizes ?? { trend: "lg", ophours: "lg" });
  const [edit, setEdit] = useState(false);
  const [palette, setPalette] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const wd = workDateJ();
  const wKey = jKey(wd);

  const stats = useMemo(() => {
    const active = st.equipment.filter((e) => e.status === "active");
    const withCl = active.filter((e) => st.checklists.some((c) => c.active && ((c.targetType === "group" && c.targetId === e.groupId) || (c.targetType === "equipment" && c.targetId === e.id))));
    const todayRecs = st.controls.filter((c) => c.dateKey === wKey);
    const doneEq = new Set(todayRecs.filter((c) => c.status === "Completed").map((c) => c.equipmentId));
    const nokRecs = st.controls.filter((c) => c.status === "NOK").slice(0, 5);
    const overdue = withCl.filter((e) => !todayRecs.some((c) => c.equipmentId === e.id));
    const oor = st.controls.filter((c) => c.opHours && c.opHours.prev !== null).length;
    const trend = Array.from({ length: 7 }, (_, i) => {
      const d = jAddDays(wd, i - 6);
      const k = jKey(d);
      return { label: fa(d.jd), value: st.controls.filter((c) => c.dateKey === k).length };
    });
    const techPerf = st.users.filter((u) => u.role === "technician" && u.active).map((u) => ({
      name: u.name, count: todayRecs.filter((c) => c.techId === u.id).length, shift: u.shift,
    }));
    return { active, withCl, todayRecs, doneEq, nokRecs, overdue, oor, trend, techPerf };
  }, [st, wKey]); // eslint-disable-line

  const latestOp = (eqId: string) => st.readings.find((r) => r.equipmentId === eqId);

  const widgets: Record<WId, React.ReactNode> = {
    equip: (
      <div className="flex items-center gap-5">
        <Donut center={fa(st.equipment.length)} sub="تجهیز" segs={[
          { value: stats.active.length, color: "var(--ok)", label: "فعال" },
          { value: st.equipment.length - stats.active.length, color: "var(--line2)", label: "غیرفعال" },
        ]} size={116} thick={13} />
        <div className="flex-1 space-y-2">
          <Row l="فعال" v={fa(stats.active.length)} c="var(--ok)" />
          <Row l="غیرفعال" v={fa(st.equipment.length - stats.active.length)} c="var(--muted)" />
          <Row l="گروه‌ها" v={fa(st.groups.filter((g) => g.active).length)} c="var(--accent)" />
          <Row l="دارای چک‌لیست" v={fa(stats.withCl.length)} c="var(--primary)" />
        </div>
      </div>
    ),
    today: (() => {
      const done = stats.todayRecs.filter((c) => c.status === "Completed").length;
      const total = stats.withCl.length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      return (
        <div>
          <div className="flex items-end justify-between">
            <div>
              <div className="num text-[34px] leading-none" style={{ color: "var(--primary)" }}>{fa(done)}<span className="text-[15px]" style={{ color: "var(--muted)" }}> از {fa(total)}</span></div>
              <div className="text-[11px] mt-1 font-semibold" style={{ color: "var(--soft)" }}>کنترل تکمیل‌شده امروز</div>
            </div>
            <div className="text-left space-y-1">
              <Badge kind="ok">{fa(done)} تکمیل</Badge><br />
              <Badge kind="warn">{fa(st.drafts.length)} پیش‌نویس</Badge>
            </div>
          </div>
          <div className="meter mt-4"><i style={{ width: `${pct}%`, background: pct === 100 ? "var(--ok)" : "var(--primary)" }} /></div>
          <div className="flex justify-between mt-1.5 text-[10.5px] font-bold">
            <span style={{ color: "var(--muted)" }}>پیشرفت روزانه</span>
            <span className="num" style={{ color: "var(--primary)" }}>{fa(pct)}٪</span>
          </div>
          <button className="btn btn-primary btn-sm w-full mt-4" onClick={goControl}><Icon name="control" size={14} /> شروع کنترل روزانه</button>
        </div>
      );
    })(),
    nok: (
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg p-2.5 text-center" style={{ background: "var(--nokbg)" }}>
            <div className="num text-[20px]" style={{ color: "var(--nok)" }}>{fa(stats.nokRecs.length)}</div>
            <div className="text-[10px] font-bold" style={{ color: "var(--nok)" }}>NOK اخیر</div>
          </div>
          <div className="flex-1 rounded-lg p-2.5 text-center" style={{ background: "var(--warnbg)" }}>
            <div className="num text-[20px]" style={{ color: "var(--warn)" }}>{fa(stats.overdue.length)}</div>
            <div className="text-[10px] font-bold" style={{ color: "var(--warn)" }}>Overdue امروز</div>
          </div>
        </div>
        {stats.nokRecs.slice(0, 3).map((c) => {
          const e = st.equipment.find((x) => x.id === c.equipmentId);
          return (
            <div key={c.id} className="flex items-center gap-2.5 rounded-lg px-3 py-2" style={{ background: "var(--card2)", border: "1px solid var(--line)" }}>
              <span style={{ color: "var(--nok)" }}><Icon name="alert" size={14} /></span>
              <span className="text-[11.5px] font-bold flex-1 truncate">{e?.name}</span>
              {c.failLoc && <Badge kind="nok">{c.failLoc}</Badge>}
            </div>
          );
        })}
        {stats.nokRecs.length === 0 && <p className="text-center text-[11px] py-3" style={{ color: "var(--muted)" }}>مورد نامنطبقی ثبت نشده — عالی</p>}
      </div>
    ),
    shift: (() => {
      const sh = SHIFTS.find((s) => s.id === currentShift())!;
      return (
        <div>
          <div className="flex items-center justify-between rounded-lg px-3.5 py-2.5 mb-3" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)" }}>
            <div className="flex items-center gap-2 font-bold text-[12.5px]"><Icon name="clock" size={15} /> {sh.name}</div>
            <span className="num text-[11.5px]" style={{ color: "var(--soft)" }}>{sh.range}</span>
          </div>
          <div className="space-y-2.5">
            {stats.techPerf.map((t) => (
              <div key={t.name}>
                <div className="flex justify-between text-[11px] font-bold mb-1">
                  <span>{t.name} <span className="chip !text-[9px] !py-0 mr-1">شیفت {fa(t.shift)}</span></span>
                  <span className="num" style={{ color: "var(--primary)" }}>{fa(t.count)} کنترل</span>
                </div>
                <div className="meter"><i style={{ width: `${Math.min(100, t.count * 25)}%`, background: "var(--accent)" }} /></div>
              </div>
            ))}
          </div>
        </div>
      );
    })(),
    ophours: (
      <div className="grid sm:grid-cols-2 gap-2.5">
        {st.equipment.filter((e) => OP_HOURS_GROUPS.includes(e.groupId) && e.status === "active").slice(0, 6).map((e) => {
          const r = latestOp(e.id);
          return (
            <div key={e.id} className="rounded-lg p-3 card-hover" style={{ background: "var(--card2)", border: "1px solid var(--line)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold truncate">{e.name}</span>
                <Badge kind={r?.source === "AUTO" ? "info" : "warn"}>{r?.source === "AUTO" ? "PLC" : "دستی"}</Badge>
              </div>
              <div className="num text-[22px] mt-1.5" style={{ color: "var(--accent)" }}>
                {r ? faNum(r.next, 1) : "—"} <span className="text-[10px]" style={{ color: "var(--muted)" }}>ساعت</span>
              </div>
              {r && <div className="text-[9.5px] mt-1" style={{ color: "var(--muted)" }}>آخرین قرائت: {faDateLong(r.date)} · {faTimeShort(new Date(r.timeISO))}</div>}
            </div>
          );
        })}
      </div>
    ),
    trend: <Bars data={stats.trend} h={150} />,
    feed: (
      <div className="space-y-1">
        {st.logs.slice(0, 6).map((l) => (
          <div key={l.id} className="flex items-start gap-2.5 py-2 border-b last:border-0" style={{ borderColor: "var(--line)" }}>
            <span className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }}><Dot color="var(--accent)" /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[11.5px] font-semibold leading-5 truncate">{l.desc}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>{l.userName} · {l.type} · {faTimeShort(new Date(l.t))}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  };

  const onDrop = (target: number) => {
    if (dragIdx === null || dragIdx === target) return;
    const o = [...order];
    const [m] = o.splice(dragIdx, 1);
    o.splice(target, 0, m);
    setOrder(o);
    setDragIdx(null); setOverIdx(null);
  };

  return (
    <div>
      {/* سرصفحه داشبورد */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div>
          <h2 className="text-[17px] font-extrabold">سلام، {me?.name.split(" ")[0]}</h2>
          <p className="text-[11.5px] mt-0.5" style={{ color: "var(--muted)" }}>{faDateLong(todayJ())} · نمای کلی کارخانه</p>
        </div>
        <div className="mr-auto flex gap-2 flex-wrap">
          <button className={cx("btn btn-sm", edit ? "btn-primary" : "btn-ghost")} onClick={() => setEdit(!edit)}>
            <Icon name={edit ? "check" : "edit"} size={13} /> {edit ? "پایان ویرایش" : "ویرایش چیدمان"}
          </button>
          {edit && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setPalette(true)}><Icon name="plus" size={13} /> افزودن ویجت</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { saveLayout({ order, sizes }); setEdit(false); }}><Icon name="check" size={13} /> ذخیره چیدمان</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { resetLayout(); setOrder(ALL_W); setSizes({ trend: "lg", ophours: "lg" }); }}><Icon name="reset" size={13} /> بازنشانی</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
        {order.map((id, idx) => (
          <section key={id}
            draggable={edit}
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => { if (edit) { e.preventDefault(); setOverIdx(idx); } }}
            onDrop={() => edit && onDrop(idx)}
            className={cx("card p-4 relative transition-all", sizes[id] === "lg" && "md:col-span-2", edit && "cursor-grab", overIdx === idx && edit && "ring-2")}
            style={overIdx === idx && edit ? { borderColor: "var(--primary)", borderStyle: "dashed" } : undefined}>
            <header className="flex items-center gap-2 mb-4">
              <span style={{ color: "var(--primary)" }}><Icon name={W_META[id].icon} size={16} /></span>
              <h3 className="font-bold text-[13px]">{W_META[id].title}</h3>
              <span className="text-[10px] font-semibold mr-auto hidden sm:block" style={{ color: "var(--muted)" }}>{W_META[id].desc}</span>
              {edit && (
                <span className="flex gap-1 mr-2">
                  <button className="btn btn-ghost btn-sm !px-1.5" title="تغییر اندازه" onClick={() => setSizes((s) => ({ ...s, [id]: s[id] === "lg" ? "sm" : "lg" }))}><Icon name="expand" size={13} /></button>
                  <button className="btn btn-ghost btn-sm !px-1.5" title="حذف ویجت" onClick={() => setOrder((o) => o.filter((x) => x !== id))}><Icon name="trash" size={13} /></button>
                  <span className="flex items-center px-1" style={{ color: "var(--muted)" }}><Icon name="grip" size={14} /></span>
                </span>
              )}
            </header>
            {widgets[id]}
          </section>
        ))}
      </div>

      {order.length === 0 && <Empty icon="dashboard" title="هیچ ویجتی روی داشبورد نیست" sub="از دکمه «افزودن ویجت» ویجت دلخواه خود را اضافه کنید" />}

      {/* پالت افزودن ویجت */}
      <Modal open={palette} onClose={() => setPalette(false)} title="افزودن ویجت به داشبورد" icon="plus" width={420}>
        <div className="space-y-2">
          {ALL_W.filter((w) => !order.includes(w)).map((w) => (
            <button key={w} className="w-full card card-hover p-3.5 flex items-center gap-3 text-right cursor-pointer"
              onClick={() => { setOrder((o) => [...o, w]); setPalette(false); }}>
              <span style={{ color: "var(--primary)" }}><Icon name={W_META[w].icon} size={18} /></span>
              <span className="flex-1">
                <span className="block font-bold text-[12.5px]">{W_META[w].title}</span>
                <span className="block text-[10.5px] mt-0.5" style={{ color: "var(--muted)" }}>{W_META[w].desc}</span>
              </span>
              <Icon name="plus" size={16} />
            </button>
          ))}
          {ALL_W.every((w) => order.includes(w)) && <p className="text-center text-[12px] py-6" style={{ color: "var(--muted)" }}>همه ویجت‌ها اضافه شده‌اند</p>}
        </div>
      </Modal>
    </div>
  );
}

function Row({ l, v, c }: { l: string; v: string; c: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="flex items-center gap-2 font-semibold" style={{ color: "var(--soft)" }}><Dot color={c} /> {l}</span>
      <span className="num font-bold text-[14px]">{v}</span>
    </div>
  );
}
