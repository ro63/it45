/**
 * چک‌لیست‌ساز داینامیک (بندهای ۲۶ تا ۲۹)
 * ساختار: Daily Control ──> Sections ──> Items
 * عملیات: ایجاد/ویرایش/حذف/فعال‌سازی/تکثیر/مرتب‌سازی + دسترسی سطح Section
 */
import { useState } from "react";
import { useApp } from "../lib/store";
import { can, DEPTS, OP_HOURS_GROUPS, type Checklist, type ItemDef, type SectionDef } from "../lib/types";
import { cx, fa, uid } from "../lib/util";
import { Icon, Badge, Modal, Confirm, Empty, Toggle } from "../components/ui";

const newSection = (): SectionDef => ({ id: uid(), title: "بخش جدید", depts: [], items: [{ id: uid(), title: "آیتم جدید", kind: "oknok", required: true }] });
const newItem = (): ItemDef => ({ id: uid(), title: "آیتم جدید", kind: "oknok", required: true });

export function ChecklistsPage() {
  const { st, me, patch, toast, addLog } = useApp();
  const manage = me?.role === "admin" || can(me?.role, "checklist.manage");
  const [edit, setEdit] = useState<Checklist | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [del, setDel] = useState<Checklist | null>(null);

  const targetName = (c: Checklist) =>
    c.targetType === "group" ? st.groups.find((g) => g.id === c.targetId)?.name ?? "—" : st.equipment.find((e) => e.id === c.targetId)?.name ?? "—";

  const opHoursAllowed = (c: Checklist) => {
    if (c.targetType === "group") return OP_HOURS_GROUPS.includes(c.targetId);
    const eq = st.equipment.find((e) => e.id === c.targetId);
    return !!eq && OP_HOURS_GROUPS.includes(eq.groupId);
  };

  const save = () => {
    if (!edit) return;
    if (!edit.title.trim()) { toast("err", "عنوان کنترل الزامی است"); return; }
    if (edit.sections.length === 0 || edit.sections.some((s) => s.items.length === 0)) { toast("err", "هر بخش باید حداقل یک آیتم داشته باشد"); return; }
    patch((s) => ({ ...s, checklists: isNew ? [...s.checklists, edit] : s.checklists.map((c) => c.id === edit.id ? edit : c) }));
    addLog("چک‌لیست", `${isNew ? "ایجاد" : "ویرایش"} کنترل «${edit.title}»`);
    toast("ok", "چک‌لیست ذخیره شد");
    setEdit(null);
  };

  const duplicate = (c: Checklist) => {
    const copy: Checklist = JSON.parse(JSON.stringify(c));
    copy.id = uid(); copy.title += " (کپی)";
    copy.sections = copy.sections.map((s) => ({ ...s, id: uid(), items: s.items.map((i) => ({ ...i, id: uid() })) }));
    patch((s) => ({ ...s, checklists: [...s.checklists, copy] }));
    toast("ok", "چک‌لیست تکثیر شد");
  };

  const move = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
    const a = [...arr]; const j = i + dir;
    if (j < 0 || j >= a.length) return a;
    [a[i], a[j]] = [a[j], a[i]];
    return a;
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <p className="text-[12px]" style={{ color: "var(--soft)" }}>
          چک‌لیست‌ها هم در سطح <b>گروه تجهیز</b> و هم برای <b>یک تجهیز خاص</b> قابل تعریف هستند.
        </p>
        {manage && (
          <button className="btn btn-primary btn-sm mr-auto" onClick={() => { setEdit({ id: uid(), title: "", targetType: "group", targetId: st.groups[0]?.id ?? "", active: true, opHours: false, sections: [newSection()] }); setIsNew(true); }}>
            <Icon name="plus" size={13} /> کنترل روزانه جدید
          </button>
        )}
      </div>

      {st.checklists.length === 0 && <Empty icon="checklist" title="چک‌لیستی تعریف نشده" />}
      <div className="space-y-3">
        {st.checklists.map((c) => (
          <div key={c.id} className="card p-4 flex flex-wrap items-center gap-3 anim-in" style={{ opacity: c.active ? 1 : 0.6 }}>
            <span className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}><Icon name="checklist" size={19} /></span>
            <div className="flex-1 min-w-[230px]">
              <div className="font-bold text-[13.5px] flex items-center gap-2 flex-wrap">
                {c.title}
                <Badge kind={c.targetType === "group" ? "info" : "primary"}>{c.targetType === "group" ? "گروهی" : "اختصاصی"}: {targetName(c)}</Badge>
                {c.opHours && <Badge kind="info"><Icon name="gauge" size={10} /> ساعت کارکرد</Badge>}
                {!c.active && <Badge kind="neutral">غیرفعال</Badge>}
              </div>
              <div className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>
                {fa(c.sections.length)} بخش · {fa(c.sections.reduce((a, s) => a + s.items.length, 0))} آیتم — {c.sections.map((s) => s.title).join("، ")}
              </div>
            </div>
            {manage ? (
              <div className="flex items-center gap-1.5">
                <Toggle on={c.active} onChange={() => patch((s) => ({ ...s, checklists: s.checklists.map((x) => x.id === c.id ? { ...x, active: !x.active } : x) }))} />
                <button className="btn btn-ghost btn-sm !px-2.5" title="ویرایش" onClick={() => { setEdit(JSON.parse(JSON.stringify(c))); setIsNew(false); }}><Icon name="edit" size={14} /></button>
                <button className="btn btn-ghost btn-sm !px-2.5" title="تکثیر" onClick={() => duplicate(c)}><Icon name="copy" size={14} /></button>
                <button className="btn btn-ghost btn-sm !px-2.5" title="حذف" style={{ color: "var(--nok)" }} onClick={() => setDel(c)}><Icon name="trash" size={14} /></button>
              </div>
            ) : <Badge kind="ok">فعال</Badge>}
          </div>
        ))}
      </div>

      {/* ---------- ویرایشگر چک‌لیست ---------- */}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={isNew ? "تعریف کنترل روزانه جدید" : `ویرایش: ${edit?.title}`} icon="checklist" width={720}>
        {edit && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1"><label className="label">عنوان کنترل *</label><input className="input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} placeholder="کنترل روزانه …" /></div>
              <div>
                <label className="label">نوع تخصیص</label>
                <select className="select" value={edit.targetType} onChange={(e) => setEdit({ ...edit, targetType: e.target.value as never, targetId: "" })}>
                  <option value="group">گروه تجهیز</option>
                  <option value="equipment">تجهیز خاص</option>
                </select>
              </div>
              <div>
                <label className="label">{edit.targetType === "group" ? "گروه" : "تجهیز"}</label>
                <select className="select" value={edit.targetId} onChange={(e) => setEdit({ ...edit, targetId: e.target.value })}>
                  <option value="">انتخاب…</option>
                  {edit.targetType === "group"
                    ? st.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)
                    : st.equipment.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            </div>

            <div className="card p-3 flex items-center gap-3 flex-wrap" style={{ background: "var(--card2)" }}>
              <Toggle on={edit.opHours && opHoursAllowed(edit)} onChange={(v) => setEdit({ ...edit, opHours: v && opHoursAllowed(edit) })} label="آیتم ساعت کارکرد" />
              <p className="text-[10.5px] flex-1 min-w-[220px]" style={{ color: opHoursAllowed(edit) ? "var(--muted)" : "var(--warn)" }}>
                {opHoursAllowed(edit)
                  ? "در صورت غیرفعال بودن، در فرم نمایش داده نمی‌شود (بند ۳۹). مقدار بدون سقف مصنوعی ثبت می‌شود."
                  : "در نسخه جاری فقط برای گروه لیفتراک و کمپرسور فعال است (بند ۳۸)."}
              </p>
            </div>

            {/* بخش‌ها */}
            <div className="space-y-3">
              {edit.sections.map((s, si) => (
                <div key={s.id} className="card p-3.5" style={{ border: "1px solid var(--line2)" }}>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="num w-6 h-6 rounded-md flex items-center justify-center text-[12px] font-bold" style={{ background: "var(--card2)", color: "var(--accent)" }}>{fa(si + 1)}</span>
                    <input className="input !w-[200px] !py-1.5 font-bold" value={s.title} onChange={(e) => setEdit({ ...edit, sections: edit.sections.map((x) => x.id === s.id ? { ...x, title: e.target.value } : x) })} />
                    <div className="flex items-center gap-1 text-[10.5px]" style={{ color: "var(--muted)" }}>
                      دسترسی:
                      {DEPTS.map((d) => (
                        <button key={d} className="chip cursor-pointer !py-0.5" style={s.depts.includes(d) ? { color: "var(--primary)", borderColor: "var(--primary)" } : undefined}
                          onClick={() => setEdit({ ...edit, sections: edit.sections.map((x) => x.id === s.id ? { ...x, depts: x.depts.includes(d) ? x.depts.filter((y) => y !== d) : [...x.depts, d] } : x) })}>
                          {d}
                        </button>
                      ))}
                      {s.depts.length === 0 && <span>(همه مجاز)</span>}
                    </div>
                    <span className="mr-auto flex gap-1">
                      <button className="btn btn-ghost btn-sm !px-2" onClick={() => setEdit({ ...edit, sections: move(edit.sections, si, -1) })}><Icon name="chev-d" size={12} className="rotate-180" /></button>
                      <button className="btn btn-ghost btn-sm !px-2" onClick={() => setEdit({ ...edit, sections: move(edit.sections, si, 1) })}><Icon name="chev-d" size={12} /></button>
                      <button className="btn btn-ghost btn-sm !px-2" style={{ color: "var(--nok)" }} onClick={() => setEdit({ ...edit, sections: edit.sections.filter((x) => x.id !== s.id) })}><Icon name="trash" size={13} /></button>
                    </span>
                  </div>
                  <div className="space-y-2">
                    {s.items.map((it, ii) => (
                      <div key={it.id} className="flex items-center gap-2 flex-wrap rounded-lg p-2" style={{ background: "var(--card2)" }}>
                        <input className="input !py-1.5 flex-1 min-w-[170px] !text-[12px]" value={it.title}
                          onChange={(e) => setEdit({ ...edit, sections: edit.sections.map((x) => x.id === s.id ? { ...x, items: x.items.map((y) => y.id === it.id ? { ...y, title: e.target.value } : y) } : x) })} />
                        <select className="select !w-auto !py-1.5 !text-[11.5px]" value={it.kind}
                          onChange={(e) => setEdit({ ...edit, sections: edit.sections.map((x) => x.id === s.id ? { ...x, items: x.items.map((y) => y.id === it.id ? { ...y, kind: e.target.value as never } : y) } : x) })}>
                          <option value="oknok">OK / NOK</option>
                          <option value="numeric">عدد Numeric</option>
                        </select>
                        {it.kind === "numeric" && (
                          <>
                            <input className="input !w-[64px] !py-1.5 !text-[11.5px] text-center num" dir="ltr" placeholder="واحد" value={it.unit ?? ""} onChange={(e) => setEdit({ ...edit, sections: edit.sections.map((x) => x.id === s.id ? { ...x, items: x.items.map((y) => y.id === it.id ? { ...y, unit: e.target.value } : y) } : x) })} />
                            <input type="number" className="input !w-[64px] !py-1.5 !text-[11.5px] text-center num" dir="ltr" placeholder="حداقل" value={it.min ?? ""} onChange={(e) => setEdit({ ...edit, sections: edit.sections.map((x) => x.id === s.id ? { ...x, items: x.items.map((y) => y.id === it.id ? { ...y, min: e.target.value === "" ? undefined : +e.target.value } : y) } : x) })} />
                            <input type="number" className="input !w-[64px] !py-1.5 !text-[11.5px] text-center num" dir="ltr" placeholder="حداکثر" value={it.max ?? ""} onChange={(e) => setEdit({ ...edit, sections: edit.sections.map((x) => x.id === s.id ? { ...x, items: x.items.map((y) => y.id === it.id ? { ...y, max: e.target.value === "" ? undefined : +e.target.value } : y) } : x) })} />
                          </>
                        )}
                        <label className="flex items-center gap-1.5 text-[10.5px] font-bold cursor-pointer" style={{ color: "var(--soft)" }}>
                          <input type="checkbox" checked={it.required} onChange={(e) => setEdit({ ...edit, sections: edit.sections.map((x) => x.id === s.id ? { ...x, items: x.items.map((y) => y.id === it.id ? { ...y, required: e.target.checked } : y) } : x) })} /> الزامی
                        </label>
                        <span className="flex gap-1">
                          <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => setEdit({ ...edit, sections: edit.sections.map((x) => x.id === s.id ? { ...x, items: move(x.items, ii, -1) } : x) })}><Icon name="chev-d" size={11} className="rotate-180" /></button>
                          <button className="btn btn-ghost btn-sm !px-1.5" onClick={() => setEdit({ ...edit, sections: edit.sections.map((x) => x.id === s.id ? { ...x, items: move(x.items, ii, 1) } : x) })}><Icon name="chev-d" size={11} /></button>
                          <button className="btn btn-ghost btn-sm !px-1.5" style={{ color: "var(--nok)" }} onClick={() => setEdit({ ...edit, sections: edit.sections.map((x) => x.id === s.id ? { ...x, items: x.items.filter((y) => y.id !== it.id) } : x) })}><Icon name="x" size={12} /></button>
                        </span>
                      </div>
                    ))}
                    <button className="btn btn-ghost btn-sm" onClick={() => setEdit({ ...edit, sections: edit.sections.map((x) => x.id === s.id ? { ...x, items: [...x.items, newItem()] } : x) })}><Icon name="plus" size={12} /> افزودن آیتم</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setEdit({ ...edit, sections: [...edit.sections, newSection()] })}><Icon name="plus" size={13} /> افزودن بخش</button>

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--line)" }}>
              <button className="btn btn-ghost" onClick={() => setEdit(null)}>انصراف</button>
              <button className="btn btn-primary" onClick={save}><Icon name="check" size={14} /> ذخیره چک‌لیست</button>
            </div>
          </div>
        )}
      </Modal>

      <Confirm open={!!del} onClose={() => setDel(null)} title="حذف چک‌لیست" body={`آیا از حذف «${del?.title}» اطمینان دارید؟ رکوردهای ثبت‌شده قبلی حفظ می‌شوند.`}
        onYes={() => { if (del) { patch((s) => ({ ...s, checklists: s.checklists.filter((c) => c.id !== del.id) })); addLog("چک‌لیست", `حذف کنترل «${del.title}»`); toast("ok", "چک‌لیست حذف شد"); } }} />
    </div>
  );
}
