/**
 * ============================================================
 * ماژول کنترل روزانه — مهم‌ترین بخش سامانه (بندهای ۵ تا ۱۸)
 * جریان: انتخاب تجهیز (اسکن/فهرست/جستجو) ──> نمایش کنترل‌ها ──>
 *       باز شدن مستقیم فرم تک‌صفحه‌ای (بدون دکمه «شروع» اضافه)
 * - ذخیره خودکار پیش‌نویس + ماندگاری تا حذف صریح کاربر
 * - توضیحات اجباری هنگام NOK / خروج از محدوده
 * - ساعت کارکرد فقط برای لیفتراک و کمپرسور، با قرائت شبیه‌سازی PLC
 * ============================================================
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp, checklistsOf, draftOf, todayControl, sectionAllowed } from "../lib/store";
import { currentShift, workDateJ, jKey, SHIFTS } from "../lib/jalali";
import { cx, fa, faDate, faDateLong, faTime, faTimeShort, faNum, uid } from "../lib/util";
import { Icon, Badge, Confirm, Empty, Toggle, Dot } from "../components/ui";
import { PrintSheet, type PrintData } from "./PrintSheet";
import { FAILURE_LOCS, OP_HOURS_GROUPS, type Answer, type Checklist, type ControlRec, type Draft, type Equipment } from "../lib/types";

type View =
  | { mode: "pick"; tab?: string }
  | { mode: "controls"; eqId: string }
  | { mode: "form"; eqId: string; clId: string; draftId?: string; recId?: string };

export function Control({ goDashboard }: { goDashboard: () => void }) {
  const { st } = useApp();
  const [view, setView] = useState<View>({ mode: "pick" });
  const [print, setPrint] = useState<PrintData | null>(null);
  const me = useApp().me!;

  const eq = "eqId" in view ? st.equipment.find((e) => e.id === view.eqId) : undefined;

  return (
    <div>
      {view.mode === "pick" && <PickView tab={view.tab} setView={setView} />}
      {view.mode === "controls" && eq && <ControlsView eq={eq} setView={setView} />}
      {view.mode === "form" && eq && (
        <ControlForm key={`${view.eqId}-${view.clId}-${view.draftId ?? view.recId ?? "new"}`}
          eq={eq} clId={view.clId} draftId={view.draftId} recId={view.recId}
          back={() => setView({ mode: "controls", eqId: view.eqId })}
          pick={() => setView({ mode: "pick" })}
          goDashboard={goDashboard}
          onPrint={(d) => { setPrint(d); setTimeout(() => window.print(), 250); }}
          nextEq={() => setView({ mode: "controls", eqId: view.eqId })}
        />
      )}
      <PrintSheet st={st} data={print} meName={me.name} />
    </div>
  );
}

/* ================= انتخاب تجهیز: اسکن / فهرست / جستجو / پیش‌نویس‌ها (بند ۲۵) ================= */
function PickView({ tab, setView }: { tab?: string; setView: (v: View) => void }) {
  const { st, me, deleteDraft, toast } = useApp();
  const [t, setT] = useState(tab ?? "scan");
  const [q, setQ] = useState("");
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [delDraft, setDelDraft] = useState<Draft | null>(null);
  const meUser = me!;

  const active = st.equipment.filter((e) => e.status === "active" && checklistsOf(st, e.id).length > 0);

  const eqStatus = (e: Equipment): "done" | "draft" | "todo" => {
    const k = jKey(workDateJ());
    if (st.controls.some((c) => c.equipmentId === e.id && c.dateKey === k)) return "done";
    if (st.drafts.some((d) => d.equipmentId === e.id)) return "draft";
    return "todo";
  };

  const scan = () => {
    setScanning(true);
    setTimeout(() => {
      const pick = active[Math.floor(Math.random() * active.length)];
      setScanning(false);
      toast("ok", `تجهیز شناسایی شد: ${pick.name} (${pick.code})`);
      setView({ mode: "controls", eqId: pick.id });
    }, 1600);
  };

  const byCode = () => {
    const e = st.equipment.find((x) => x.code.toLowerCase() === code.trim().toLowerCase());
    if (!e) { toast("err", "تجهیزی با این کد پیدا نشد"); return; }
    if (e.status !== "active") { toast("err", "این تجهیز غیرفعال است"); return; }
    setView({ mode: "controls", eqId: e.id });
  };

  const results = active.filter((e) => !q || e.name.includes(q) || e.code.toLowerCase().includes(q.toLowerCase()) || st.groups.find((g) => g.id === e.groupId)?.name.includes(q));
  const myDrafts = st.drafts.filter((d) => meUser.role === "admin" || d.techId === meUser.id);

  const EqRow = ({ e }: { e: Equipment }) => {
    const s = eqStatus(e);
    const g = st.groups.find((x) => x.id === e.groupId);
    return (
      <button onClick={() => setView({ mode: "controls", eqId: e.id })}
        className="w-full card card-hover p-3.5 flex items-center gap-3 text-right cursor-pointer">
        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--accent) 14%, transparent)", color: "var(--accent)" }}>
          <Icon name="equipment" size={17} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2 font-bold text-[13px] truncate">{e.name}
            <Badge kind={s === "done" ? "ok" : s === "draft" ? "warn" : "neutral"}>{s === "done" ? "تکمیل امروز" : s === "draft" ? "پیش‌نویس دارد" : "انجام نشده"}</Badge>
          </span>
          <span className="block text-[10.5px] mt-0.5 num" style={{ color: "var(--muted)" }}>{e.code} · {g?.name} · {e.hall}</span>
        </span>
        <Icon name="chev-s" size={16} className="rotate-180" />
      </button>
    );
  };

  return (
    <div>
      <div className="tabs mb-5">
        {[{ id: "scan", l: "اسکن QR / بارکد", i: "scan" }, { id: "list", l: "فهرست تجهیزات", i: "list" }, { id: "search", l: "جستجو", i: "search" }, { id: "drafts", l: `پیش‌نویس‌ها${myDrafts.length ? ` (${fa(myDrafts.length)})` : ""}`, i: "edit" }].map((x) => (
          <button key={x.id} className={cx("tab", t === x.id && "on")} onClick={() => setT(x.id)}>
            <Icon name={x.i} size={14} /> {x.l}
          </button>
        ))}
      </div>

      {t === "scan" && (
        <div className="max-w-[560px] mx-auto anim-up">
          <div className="card p-6">
            <div className="scanner-frame rounded-xl flex items-center justify-center mx-auto" style={{ width: 250, height: 250, background: "#0a0d11", border: "1px solid var(--line)" }}>
              {/* گوشه‌های کادر اسکن */}
              {["top-2 right-2 border-t-2 border-r-2", "top-2 left-2 border-t-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2", "bottom-2 left-2 border-b-2 border-l-2"].map((c) => (
                <span key={c} className={cx("absolute w-7 h-7 rounded-sm", c)} style={{ borderColor: "var(--primary)" }} />
              ))}
              {scanning && <span className="scanner-line" />}
              <span style={{ color: scanning ? "var(--primary)" : "var(--muted)" }}>
                <Icon name={scanning ? "sync" : "qr"} size={scanning ? 34 : 54} className={scanning ? "spin" : ""} />
              </span>
            </div>
            <p className="text-center text-[12px] mt-4 font-semibold" style={{ color: scanning ? "var(--primary)" : "var(--soft)" }}>
              {scanning ? "در حال خواندن کد تجهیز…" : "کد QR یا بارکد تجهیز را مقابل دوربین تبلت/گوشی قرار دهید"}
            </p>
            <div className="flex gap-2 mt-5">
              <button className="btn btn-primary flex-1" onClick={scan} disabled={scanning}><Icon name="scan" size={15} /> {scanning ? "در حال اسکن…" : "شبیه‌سازی اسکن با دوربین"}</button>
            </div>
            <div className="flex gap-2 mt-3">
              <input className="input flex-1" dir="ltr" placeholder="یا کد تجهیز را وارد کنید… مثل PRS-1000" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && byCode()} />
              <button className="btn btn-ghost" onClick={byCode}><Icon name="barcode" size={15} /> ورود کد</button>
            </div>
            <p className="text-[10.5px] mt-4 leading-5" style={{ color: "var(--muted)" }}>
              در نسخه سرور، اسکن واقعی از طریق BarcodeDetector API مرورگر و اسکنرهای صنعتی USB انجام می‌شود.
            </p>
          </div>
        </div>
      )}

      {t === "list" && (
        <div className="space-y-5 anim-up">
          {st.groups.filter((g) => g.active).map((g) => {
            const list = active.filter((e) => e.groupId === g.id);
            if (!list.length) return null;
            return (
              <div key={g.id}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="num text-[15px] font-bold" style={{ color: "var(--primary)" }}>{g.name}</span>
                  <span className="chip">{fa(list.length)} تجهیز</span>
                  <span className="flex-1 h-px" style={{ background: "var(--line)" }} />
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {list.map((e) => <EqRow key={e.id} e={e} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {t === "search" && (
        <div className="anim-up">
          <div className="relative max-w-[520px] mb-4">
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}><Icon name="search" size={17} /></span>
            <input className="input !pr-10 !py-3" placeholder="جستجوی نام، کد یا گروه تجهیز…" autoFocus value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {results.length === 0
            ? <Empty icon="search" title="تجهیزی یافت نشد" sub="عبارت دیگری را امتحان کنید یا کد دقیق تجهیز را وارد کنید" />
            : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2.5">{results.map((e) => <EqRow key={e.id} e={e} />)}</div>}
        </div>
      )}

      {t === "drafts" && (
        <div className="anim-up max-w-[760px]">
          {myDrafts.length === 0 && <Empty icon="edit" title="پیش‌نویسی وجود ندارد" sub="هنگام تکمیل فرم کنترل، اطلاعات به‌صورت خودکار اینجا ذخیره می‌شود و تا حذف دستی باقی می‌ماند" />}
          <div className="space-y-2.5">
            {myDrafts.map((d) => {
              const e = st.equipment.find((x) => x.id === d.equipmentId);
              const cl = st.checklists.find((x) => x.id === d.checklistId);
              const tech = st.users.find((u) => u.id === d.techId);
              const total = cl?.sections.reduce((a, s) => a + s.items.length, 0) ?? 0;
              const done = Object.keys(d.answers).filter((k) => { const a = d.answers[k]; return a.ok !== undefined || (a.num !== undefined && a.num !== null); }).length;
              return (
                <div key={d.id} className="card p-4 anim-in">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--warnbg)", color: "var(--warn)" }}><Icon name="edit" size={16} /></span>
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-bold text-[13px]">{e?.name} — {cl?.title}</div>
                      <div className="text-[10.5px] mt-0.5" style={{ color: "var(--muted)" }}>
                        {tech?.name} · {faDate(d.date)} · آخرین ذخیره {faTimeShort(new Date(d.updatedAt))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-[110px]">
                        <div className="meter"><i style={{ width: `${total ? (done / total) * 100 : 0}%`, background: "var(--warn)" }} /></div>
                        <div className="text-[9.5px] mt-1 text-center num" style={{ color: "var(--muted)" }}>{fa(done)} از {fa(total)} آیتم</div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => setView({ mode: "form", eqId: d.equipmentId, clId: d.checklistId, draftId: d.id })}><Icon name="check" size={13} /> ادامه</button>
                      <button className="btn btn-ghost btn-sm !px-2.5" title="حذف پیش‌نویس" onClick={() => setDelDraft(d)}><Icon name="trash" size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Confirm open={!!delDraft} onClose={() => setDelDraft(null)}
        title="حذف پیش‌نویس" body="آیا از حذف این پیش‌نویس اطمینان دارید؟ اطلاعات ذخیره‌شده برای همیشه پاک خواهد شد."
        yesLabel="بله، حذف شود" onYes={() => delDraft && deleteDraft(delDraft.id)} />
    </div>
  );
}

/* ================= نمایش کنترل‌های روزانه یک تجهیز ================= */
function ControlsView({ eq, setView }: { eq: Equipment; setView: (v: View) => void }) {
  const { st, me } = useApp();
  const meUser = me!;
  const cls = checklistsOf(st, eq.id);
  const g = st.groups.find((x) => x.id === eq.groupId);

  return (
    <div className="max-w-[760px] anim-up">
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => setView({ mode: "pick" })}><Icon name="chev-s" size={13} /> بازگشت به انتخاب تجهیز</button>

      <div className="card p-5 mb-5 flex flex-wrap items-center gap-4" style={{ borderRight: "3px solid var(--primary)" }}>
        <span className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)", color: "var(--primary)" }}>
          <Icon name="factory" size={24} />
        </span>
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="font-extrabold text-[17px]">{eq.name}</h2>
            <Badge kind="primary">{eq.code}</Badge>
            {OP_HOURS_GROUPS.includes(eq.groupId) && <Badge kind="info"><Icon name="gauge" size={11} /> ساعت کارکرد فعال</Badge>}
          </div>
          <div className="text-[11.5px] mt-1.5" style={{ color: "var(--soft)" }}>
            {g?.name} · {eq.brand} {eq.model} · {eq.hall} / {eq.line} / {eq.area}
          </div>
        </div>
        <div className="text-left">
          <div className="text-[10.5px] font-bold" style={{ color: "var(--muted)" }}>تاریخ کاری (شمسی)</div>
          <div className="font-bold text-[13px] mt-0.5">{faDateLong(workDateJ())}</div>
        </div>
      </div>

      <h3 className="font-bold text-[13.5px] mb-3 flex items-center gap-2">
        <Icon name="checklist" size={15} /> کنترل‌های روزانه این تجهیز
        <span className="text-[10.5px] font-semibold" style={{ color: "var(--muted)" }}>— با انتخاب هر کنترل، فرم بلافاصله باز می‌شود</span>
      </h3>

      {cls.length === 0 && <Empty icon="checklist" title="کنترلی تعریف نشده" sub="مدیر سیستم باید چک‌لیست این گروه یا تجهیز را فعال کند" />}

      <div className="space-y-2.5">
        {cls.map((cl) => {
          const done = todayControl(st, eq.id, cl.id);
          const draft = draftOf(st, eq.id, cl.id, meUser.id);
          const items = cl.sections.reduce((a, s) => a + s.items.length, 0);
          return (
            <div key={cl.id} className="card card-hover p-4 flex items-center gap-3.5 flex-wrap">
              <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--card2)", color: "var(--accent)", border: "1px solid var(--line)" }}>
                <Icon name="checklist" size={19} />
              </span>
              <div className="flex-1 min-w-[210px]">
                <div className="font-bold text-[13.5px]">{cl.title}</div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="chip"><Icon name="layers" size={11} /> {fa(cl.sections.length)} بخش</span>
                  <span className="chip"><Icon name="check" size={11} /> {fa(items)} آیتم</span>
                  {cl.opHours && OP_HOURS_GROUPS.includes(eq.groupId) && <span className="chip" style={{ color: "var(--info)" }}><Icon name="gauge" size={11} /> ساعت کارکرد</span>}
                  {cl.targetType === "equipment" && <span className="chip" style={{ color: "var(--primary)" }}>اختصاصی تجهیز</span>}
                </div>
              </div>
              {done ? (
                <div className="flex items-center gap-2">
                  <Badge kind={done.status === "NOK" ? "nok" : "ok"}>{done.status === "NOK" ? "NOK ثبت شده" : "تکمیل امروز"}</Badge>
                  <button className="btn btn-ghost btn-sm" onClick={() => setView({ mode: "form", eqId: eq.id, clId: cl.id, recId: done.id })}><Icon name="eye" size={13} /> مشاهده</button>
                  <span className="text-[10px] num" style={{ color: "var(--muted)" }}>{faTimeShort(new Date(done.timeISO))}</span>
                </div>
              ) : draft ? (
                <div className="flex items-center gap-2">
                  <Badge kind="warn">پیش‌نویس</Badge>
                  <button className="btn btn-primary btn-sm" onClick={() => setView({ mode: "form", eqId: eq.id, clId: cl.id, draftId: draft.id })}><Icon name="edit" size={13} /> ادامه پیش‌نویس</button>
                </div>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => setView({ mode: "form", eqId: eq.id, clId: cl.id })}><Icon name="control" size={13} /> شروع کنترل</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= فرم کنترل روزانه — تک‌صفحه‌ای (بند ۶ و ۷) ================= */
function ControlForm({ eq, clId, draftId, recId, back, pick, goDashboard, onPrint, nextEq }: {
  eq: Equipment; clId: string; draftId?: string; recId?: string;
  back: () => void; pick: () => void; goDashboard: () => void;
  onPrint: (d: PrintData) => void; nextEq: () => void;
}) {
  const { st, me, saveDraft, deleteDraft, submitControl, toast } = useApp();
  const meUser = me!;
  const cl = st.checklists.find((c) => c.id === clId)!;
  const existingRec = recId ? st.controls.find((c) => c.id === recId) : undefined;
  const existingDraft = draftId ? st.drafts.find((d) => d.id === draftId) : draftOf(st, eq.id, cl.id, meUser.id);
  const readOnly = !!existingRec;

  const [answers, setAnswers] = useState<Record<string, Answer>>(existingRec?.answers ?? existingDraft?.answers ?? {});
  const [notes, setNotes] = useState(existingRec?.notes ?? existingDraft?.notes ?? "");
  const [failLoc, setFailLoc] = useState<string>(existingRec?.failLoc ?? "");
  const [shift, setShift] = useState<number>(existingRec?.shift ?? existingDraft?.shift ?? currentShift());
  const [opH, setOpH] = useState<{ value: number | null; source: "MANUAL" | "AUTO" | "ADJUSTED"; reason: string }>(
    existingRec?.opHours ? { value: existingRec.opHours.value, source: existingRec.opHours.source, reason: existingRec.opHours.reason ?? "" }
      : existingDraft?.opHours ? { value: existingDraft.opHours.value, source: existingDraft.opHours.source, reason: existingDraft.opHours.reason ?? "" }
        : { value: null, source: "MANUAL", reason: "" });
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [reading, setReading] = useState(false);
  const [done, setDone] = useState<ControlRec | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const firstRun = useRef(true);

  const wd = workDateJ();
  /* بخش‌های مجاز برای کاربر جاری — اعمال دسترسی در لایه داده (بند ۲۹) */
  const sections = useMemo(() => cl.sections.filter((s) => sectionAllowed(s.depts, meUser.dept, meUser.role === "admin")), [cl, meUser]);
  const allItems = sections.flatMap((s) => s.items);

  const prevReading = st.readings.find((r) => r.equipmentId === eq.id);
  const opHoursEnabled = cl.opHours && OP_HOURS_GROUPS.includes(eq.groupId);

  const answered = allItems.filter((it) => { const a = answers[it.id]; return a && (a.ok !== undefined || (a.num !== undefined && a.num !== null)); }).length;
  const pct = allItems.length ? Math.round((answered / allItems.length) * 100) : 0;

  const nokItems = allItems.filter((it) => answers[it.id]?.ok === false);
  const oorItems = allItems.filter((it) => {
    if (it.kind !== "numeric") return false;
    const v = answers[it.id]?.num;
    return v !== undefined && v !== null && (v < (it.min ?? -Infinity) || v > (it.max ?? Infinity));
  });
  const needsNotes = nokItems.length > 0 || oorItems.length > 0;
  const incomplete = allItems.filter((it) => {
    const a = answers[it.id];
    if (!a) return it.required;
    if (it.kind === "oknok") return a.ok === undefined && it.required;
    return (a.num === undefined || a.num === null) && it.required;
  });

  /* ---------- ذخیره خودکار پیش‌نویس (بندهای ۹ و ۱۰) ---------- */
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (readOnly || done) return;
    const t = setTimeout(() => {
      saveDraft({
        id: existingDraft?.id ?? `draft-${eq.id}-${cl.id}-${meUser.id}`,
        uuid: existingDraft?.uuid ?? uid(),
        equipmentId: eq.id, checklistId: cl.id,
        date: wd, dateKey: jKey(wd), shift, techId: meUser.id,
        answers, notes, opHours: opHoursEnabled && opH.value !== null ? { value: opH.value, prev: prevReading?.next ?? null, source: opH.source, reason: opH.reason || undefined } : undefined,
        updatedAt: Date.now(),
      });
      setSavedAt(new Date());
    }, 700);
    return () => clearTimeout(t);
  }, [answers, notes, failLoc, shift, opH]); // eslint-disable-line

  const setAns = (id: string, a: Answer) => setAnswers((prev) => ({ ...prev, [id]: a }));

  /* ---------- قرائت ساعت کارکرد از دستگاه (شبیه‌سازی PLC/Modbus — بندهای ۴۱ تا ۴۶) ---------- */
  const conn = st.settings.conn;
  const readFromDevice = () => {
    if (conn.status !== "Connected") { toast("err", "ارتباط با PLC برقرار نیست — مقدار را دستی ثبت کنید"); return; }
    setReading(true);
    setTimeout(() => {
      const base = prevReading?.next ?? 1000;
      const v = +(base + 0.2 + Math.random() * 1.2).toFixed(1);
      setOpH({ value: v, source: "AUTO", reason: "" });
      setReading(false);
      toast("ok", `قرائت از ${conn.protocol}: ${faNum(v, 1)} ساعت`);
    }, 950);
  };

  /* ---------- ثبت نهایی (بندهای ۱۳، ۱۴ و ۱۸) ---------- */
  const submit = () => {
    if (incomplete.length > 0) { toast("err", `${fa(incomplete.length)} آیتم الزامی تکمیل نشده است`); return; }
    if (needsNotes && !notes.trim()) { toast("err", "ثبت توضیحات برای موارد NOK / خارج از محدوده الزامی است"); return; }
    if (opHoursEnabled && opH.value === null) { toast("err", "ساعت کارکرد را وارد یا از دستگاه قرائت کنید"); return; }
    if (opHoursEnabled && opH.source === "ADJUSTED" && !opH.reason.trim()) { toast("err", "دلیل اصلاح ساعت کارکرد را بنویسید"); return; }
    const rec: ControlRec = {
      id: uid(), uuid: uid(), equipmentId: eq.id, checklistId: cl.id,
      date: wd, dateKey: jKey(wd), timeISO: new Date().toISOString(), shift, techId: meUser.id,
      answers, notes: notes.trim(), status: needsNotes ? "NOK" : "Completed",
      failLoc: needsNotes ? (failLoc || "سایر") : undefined,
      opHours: opHoursEnabled && opH.value !== null ? { value: opH.value, prev: prevReading?.next ?? null, source: opH.source, reason: opH.reason || undefined } : undefined,
      syncState: "synced", createdAt: Date.now(),
    };
    submitControl(rec);
    setDone(rec);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildPreviewRec = (): ControlRec => ({
    id: "preview", uuid: existingDraft?.uuid ?? "preview", equipmentId: eq.id, checklistId: cl.id,
    date: wd, dateKey: jKey(wd), timeISO: new Date().toISOString(), shift, techId: meUser.id,
    answers, notes, failLoc: failLoc || undefined, status: needsNotes ? "NOK" : "Completed",
    opHours: opHoursEnabled && opH.value !== null ? { value: opH.value, prev: prevReading?.next ?? null, source: opH.source, reason: opH.reason || undefined } : undefined,
    syncState: "pending", createdAt: Date.now(),
  });

  /* ---------- صفحه موفقیت پس از ثبت ---------- */
  if (done) {
    return (
      <div className="max-w-[560px] mx-auto anim-pop">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ background: "var(--okbg)", color: "var(--ok)", border: "2px solid var(--ok)" }}>
            <Icon name="check" size={30} sw={2.4} />
          </div>
          <h2 className="font-extrabold text-[19px] mt-4">کنترل روزانه ثبت شد</h2>
          <p className="text-[12px] mt-1.5" style={{ color: "var(--soft)" }}>{eq.name} — {cl.title}</p>
          <div className="flex justify-center gap-2 flex-wrap mt-4">
            <Badge kind={done.status === "NOK" ? "nok" : "ok"}>{done.status === "NOK" ? "نامنطبق NOK" : "سالم"}</Badge>
            <Badge kind="neutral">{faDateLong(done.date)}</Badge>
            <Badge kind="info">شیفت {fa(done.shift)}</Badge>
            <Badge kind={done.syncState === "pending" ? "warn" : "ok"}>{done.syncState === "pending" ? "در صف Sync" : "همگام‌شده"}</Badge>
          </div>
          {done.status === "NOK" && (
            <p className="text-[11.5px] mt-4 leading-6 rounded-lg p-3" style={{ background: "var(--nokbg)", color: "var(--nok)" }}>
              اعلان عدم انطباق برای سرپرست و کارشناس نت ارسال شد{st.settings.notifEmail ? " (ایمیل)" : ""}{st.settings.notifSMS ? " (پیامک)" : ""}.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 mt-6">
            <button className="btn btn-primary" onClick={() => onPrint({ rec: done })}><Icon name="print" size={15} /> چاپ فرم / PDF</button>
            <button className="btn btn-ghost" onClick={nextEq}><Icon name="control" size={15} /> کنترل بعدی</button>
            <button className="btn btn-ghost" onClick={pick}><Icon name="list" size={15} /> تجهیز دیگر</button>
            <button className="btn btn-ghost" onClick={goDashboard}><Icon name="dashboard" size={15} /> داشبورد</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[860px] anim-up pb-28">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button className="btn btn-ghost btn-sm" onClick={back}><Icon name="chev-s" size={13} /> بازگشت</button>
        {existingDraft && !readOnly && (
          <button className="btn btn-ghost btn-sm" style={{ color: "var(--nok)" }} onClick={() => setConfirmDel(true)}><Icon name="trash" size={13} /> حذف پیش‌نویس</button>
        )}
        {readOnly && <Badge kind={existingRec!.status === "NOK" ? "nok" : "ok"}>ثبت‌شده — فقط مشاهده</Badge>}
        <span className="mr-auto flex items-center gap-2 text-[11px] font-bold" style={{ color: savedAt ? "var(--ok)" : "var(--muted)" }}>
          {readOnly ? "" : savedAt ? (<><Icon name="check" size={13} /> ذخیره خودکار: {faTime(savedAt)}</>) : (<><Icon name="sync" size={13} /> ذخیره خودکار فعال</>)}
        </span>
      </div>

      {/* اطلاعات تجهیز */}
      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3" style={{ borderRight: "3px solid var(--primary)" }}>
        <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)", color: "var(--primary)" }}><Icon name="factory" size={22} /></span>
        <div className="flex-1 min-w-[200px]">
          <div className="font-extrabold text-[15px] flex items-center gap-2 flex-wrap">{eq.name} <Badge kind="primary">{eq.code}</Badge></div>
          <div className="text-[11px] mt-1" style={{ color: "var(--soft)" }}>{st.groups.find((g) => g.id === eq.groupId)?.name} · {eq.hall} / {eq.line} / {eq.area}</div>
        </div>
        <div className="text-left">
          <div className="font-bold text-[13.5px]">{cl.title}</div>
          <div className="text-[10.5px] mt-0.5 num" style={{ color: "var(--muted)" }}>{faDateLong(wd)}</div>
        </div>
      </div>

      {/* اطلاعات کنترل */}
      <div className="card p-4 mb-4 grid sm:grid-cols-3 gap-3.5">
        <div>
          <label className="label">تاریخ شمسی</label>
          <div className="input flex items-center gap-2 opacity-90"><Icon name="calendar" size={14} /> <span className="num">{faDate(wd)}</span></div>
        </div>
        <div>
          <label className="label">شیفت کاری</label>
          <select className="select" value={shift} disabled={readOnly} onChange={(e) => setShift(+e.target.value)}>
            {SHIFTS.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.range})</option>)}
          </select>
        </div>
        <div>
          <label className="label">تکنسین</label>
          <div className="input flex items-center gap-2"><Icon name="user" size={14} /> {meUser.name}</div>
        </div>
      </div>

      {/* نوار پیشرفت */}
      <div className="card p-4 mb-4 sticky top-[64px] z-20" style={{ boxShadow: "var(--shadow)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-[12.5px] flex items-center gap-2"><Icon name="target" size={14} /> وضعیت تکمیل آیتم‌ها</span>
          <span className="num text-[12.5px] font-bold" style={{ color: pct === 100 ? "var(--ok)" : "var(--primary)" }}>{fa(answered)} از {fa(allItems.length)} · {fa(pct)}٪</span>
        </div>
        <div className="meter"><i style={{ width: `${pct}%`, background: pct === 100 ? "var(--ok)" : "var(--primary)" }} /></div>
        {needsNotes && (
          <div className="flex items-center gap-2 mt-2.5 text-[11px] font-bold" style={{ color: "var(--nok)" }}>
            <Icon name="alert" size={13} /> {nokItems.length > 0 && `${fa(nokItems.length)} مورد NOK`}{nokItems.length > 0 && oorItems.length > 0 && " و "}{oorItems.length > 0 && `${fa(oorItems.length)} مورد خارج از محدوده`} — ثبت توضیحات الزامی است
          </div>
        )}
      </div>

      {/* بخش‌ها و آیتم‌ها */}
      <div className="space-y-4">
        {sections.map((s, si) => (
          <section key={s.id} className="card overflow-hidden">
            <header className="px-4 py-3 flex items-center gap-2.5" style={{ background: "var(--card2)", borderBottom: "1px solid var(--line)" }}>
              <span className="w-6 h-6 rounded-md flex items-center justify-center num text-[12px] font-bold" style={{ background: "color-mix(in srgb, var(--accent) 16%, transparent)", color: "var(--accent)" }}>{fa(si + 1)}</span>
              <h3 className="font-bold text-[13.5px]">{s.title}</h3>
              {s.depts.length > 0 && <span className="chip mr-auto"><Icon name="shield" size={11} /> {s.depts.join("، ")}</span>}
            </header>
            <div className="divide-y" style={{ borderColor: "var(--line)" }}>
              {s.items.map((it) => {
                const a = answers[it.id];
                const isNok = a?.ok === false;
                const v = a?.num;
                const oor = it.kind === "numeric" && v !== undefined && v !== null && (v < (it.min ?? -Infinity) || v > (it.max ?? Infinity));
                return (
                  <div key={it.id} className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3" style={{ borderColor: "var(--line)", background: isNok || oor ? "var(--nokbg)" : undefined }}>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px]">{it.title}</div>
                      {it.kind === "numeric" && (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="chip num">مجاز: {fa(it.min ?? 0)} تا {fa(it.max ?? 0)} {it.unit}</span>
                          {oor && <Badge kind="nok"><Icon name="alert" size={10} /> خارج از محدوده</Badge>}
                        </div>
                      )}
                    </div>
                    {it.kind === "oknok" ? (
                      <div className="flex gap-2 shrink-0" dir="ltr">
                        <button disabled={readOnly} onClick={() => setAns(it.id, { ok: true })}
                          className="px-5 py-2.5 rounded-lg font-extrabold text-[13px] transition-all cursor-pointer disabled:cursor-not-allowed"
                          style={a?.ok === true
                            ? { background: "var(--ok)", color: "#04150c", boxShadow: "0 4px 16px color-mix(in srgb, var(--ok) 40%, transparent)" }
                            : { background: "var(--card2)", color: "var(--soft)", border: "1px solid var(--line)" }}>
                          OK
                        </button>
                        <button disabled={readOnly} onClick={() => setAns(it.id, { ok: false })}
                          className="px-5 py-2.5 rounded-lg font-extrabold text-[13px] transition-all cursor-pointer disabled:cursor-not-allowed"
                          style={isNok
                            ? { background: "var(--nok)", color: "#fff", boxShadow: "0 4px 16px color-mix(in srgb, var(--nok) 40%, transparent)" }
                            : { background: "var(--card2)", color: "var(--soft)", border: "1px solid var(--line)" }}>
                          NOK
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0" dir="ltr">
                        <input type="number" step={1 / Math.pow(10, it.prec ?? 0)} disabled={readOnly}
                          className="input !w-[130px] text-center font-bold num !text-[15px]"
                          style={{ borderColor: oor ? "var(--nok)" : undefined, color: oor ? "var(--nok)" : undefined }}
                          value={v ?? ""} placeholder="—"
                          onChange={(e) => setAns(it.id, { num: e.target.value === "" ? null : +e.target.value })} />
                        <span className="text-[11.5px] font-bold w-9" style={{ color: "var(--muted)" }}>{it.unit}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* ساعت کارکرد — فقط لیفتراک و کمپرسور (بند ۳۸) */}
      {opHoursEnabled && (
        <section className="card p-4 mt-4" style={{ border: "1px solid color-mix(in srgb, var(--accent) 40%, var(--line))" }}>
          <header className="flex items-center gap-2.5 mb-4 flex-wrap">
            <span style={{ color: "var(--accent)" }}><Icon name="gauge" size={18} /></span>
            <h3 className="font-bold text-[13.5px]">ساعت کارکرد تجهیز</h3>
            <Badge kind={conn.status === "Connected" ? "ok" : "nok"}>
              <Dot color={conn.status === "Connected" ? "var(--ok)" : "var(--nok)"} pulse /> {conn.protocol} — {conn.deviceId} — {conn.status === "Connected" ? "متصل" : "قطع"}
            </Badge>
            {prevReading && <span className="text-[10.5px] num mr-auto" style={{ color: "var(--muted)" }}>آخرین قرائت: {faNum(prevReading.next, 1)} ساعت</span>}
          </header>
          <div className="grid sm:grid-cols-4 gap-3">
            <div>
              <label className="label">مقدار فعلی (ساعت)</label>
              <input type="number" step="0.1" disabled={readOnly} className="input num !text-[16px] font-bold text-center" dir="ltr"
                value={opH.value ?? ""} placeholder="مثلاً ۱۲۴۵۰.۵"
                onChange={(e) => setOpH((o) => ({ ...o, value: e.target.value === "" ? null : +e.target.value, source: o.source === "AUTO" ? "MANUAL" : o.source }))} />
            </div>
            <div>
              <label className="label">منبع ثبت</label>
              <select className="select" disabled={readOnly} value={opH.source} onChange={(e) => setOpH((o) => ({ ...o, source: e.target.value as never }))}>
                <option value="AUTO">خودکار (PLC / HMI)</option>
                <option value="MANUAL">دستی</option>
                <option value="ADJUSTED">اصلاحی</option>
              </select>
            </div>
            <div>
              <label className="label">قرائت قبلی / اختلاف</label>
              <div className="input num text-center" dir="ltr">
                {prevReading ? `${faNum(prevReading.next, 1)} ← ${opH.value !== null ? faNum(Math.max(0, opH.value - prevReading.next), 1) : "—"}` : "اولین قرائت"}
              </div>
            </div>
            <div>
              <label className="label">خواندن از دستگاه</label>
              <button className="btn btn-ghost w-full" disabled={readOnly || reading} onClick={readFromDevice}>
                <Icon name={reading ? "sync" : "bolt"} size={14} className={reading ? "spin" : ""} />
                {reading ? "در حال قرائت…" : "قرائت از PLC"}
              </button>
            </div>
          </div>
          {opH.source === "ADJUSTED" && (
            <div className="mt-3">
              <label className="label">دلیل اصلاح (الزامی)</label>
              <input className="input" disabled={readOnly} value={opH.reason} onChange={(e) => setOpH((o) => ({ ...o, reason: e.target.value }))} placeholder="مثلاً: تعویض ساعت کارکرد دستگاه" />
            </div>
          )}
        </section>
      )}

      {/* توضیحات نهایی (بند ۱۷ و ۱۸) */}
      <section className="card p-4 mt-4" style={needsNotes && !notes.trim() ? { border: "1px solid var(--nok)" } : undefined}>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-bold text-[13.5px]">توضیحات نهایی</h3>
          {needsNotes ? <Badge kind="nok">الزامی</Badge> : <span className="text-[10.5px]" style={{ color: "var(--muted)" }}>اختیاری</span>}
        </div>
        <textarea className="input" rows={3} disabled={readOnly} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder={needsNotes ? "شرح مورد نامنطبق، اقدام انجام‌شده و پیشنهاد پیگیری…" : "در صورت نیاز توضیحات تکمیلی را بنویسید…"} />
        {needsNotes && (
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">محل خرابی</label>
              <select className="select" disabled={readOnly} value={failLoc} onChange={(e) => setFailLoc(e.target.value)}>
                <option value="">انتخاب کنید…</option>
                {FAILURE_LOCS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        )}
      </section>

      {/* نوار اقدام — چسبان پایین */}
      {!readOnly && (
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:pr-[232px]" style={{ background: "color-mix(in srgb, var(--card) 92%, transparent)", backdropFilter: "blur(12px)", borderTop: "1px solid var(--line)" }}>
          <div className="max-w-[860px] mx-auto px-4 py-3 flex items-center gap-2 flex-wrap">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold" style={{ color: incomplete.length ? "var(--warn)" : "var(--ok)" }}>
              <Dot color={incomplete.length ? "var(--warn)" : "var(--ok)"} pulse />
              {incomplete.length ? `${fa(incomplete.length)} آیتم باقی‌مانده` : "همه آیتم‌ها تکمیل شد"}
            </div>
            <div className="mr-auto flex gap-2 flex-wrap">
              <button className="btn btn-ghost" onClick={() => { saveDraft({ id: existingDraft?.id ?? `draft-${eq.id}-${cl.id}-${meUser.id}`, uuid: existingDraft?.uuid ?? uid(), equipmentId: eq.id, checklistId: cl.id, date: wd, dateKey: jKey(wd), shift, techId: meUser.id, answers, notes, updatedAt: Date.now(), opHours: opHoursEnabled && opH.value !== null ? { value: opH.value, prev: prevReading?.next ?? null, source: opH.source, reason: opH.reason || undefined } : undefined }); setSavedAt(new Date()); toast("ok", "پیش‌نویس ذخیره شد"); }}>
                <Icon name="edit" size={14} /> ذخیره پیش‌نویس
              </button>
              <button className="btn btn-ghost" onClick={() => onPrint({ rec: buildPreviewRec(), preview: true })}><Icon name="print" size={14} /> چاپ فرم</button>
              <button className={cx("btn", needsNotes ? "btn-danger" : "btn-ok")} onClick={submit}
                disabled={incomplete.length > 0 || (needsNotes && !notes.trim())}>
                <Icon name="check" size={15} /> ثبت نهایی
              </button>
            </div>
          </div>
        </div>
      )}

      {readOnly && (
        <div className="flex gap-2 mt-5">
          <button className="btn btn-primary" onClick={() => onPrint({ rec: existingRec! })}><Icon name="print" size={15} /> چاپ / خروجی PDF</button>
          <button className="btn btn-ghost" onClick={back}><Icon name="chev-s" size={14} /> بازگشت</button>
        </div>
      )}

      <Confirm open={confirmDel} onClose={() => setConfirmDel(false)} title="حذف پیش‌نویس"
        body="آیا از حذف این پیش‌نویس اطمینان دارید؟ تمام اطلاعات واردشده پاک خواهد شد."
        yesLabel="بله، حذف شود"
        onYes={() => { if (existingDraft) deleteDraft(existingDraft.id); back(); }} />
    </div>
  );
}

export { PickView };
