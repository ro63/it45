/**
 * مدیریت تجهیزات و گروه‌ها (بندهای ۱۹ تا ۲۴)
 * تعریف تجهیز، گروه داینامیک، محل استقرار، تولید QR/Barcode
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../lib/store";
import { can, OP_HOURS_GROUPS, type Equipment, type Group } from "../lib/types";
import { todayJ } from "../lib/jalali";
import { cx, fa, faDate, uid } from "../lib/util";
import { Icon, Badge, Modal, Confirm, JDatePicker, QRBox, BarcodeBox, Empty, Toggle } from "../components/ui";

const emptyEq = (): Equipment => ({
  id: uid(), code: "", name: "", groupId: "g-press", brand: "", model: "", serial: "",
  capacity: "", hall: "سالن ۱", line: "", area: "", status: "active", commission: todayJ(), desc: "",
});

export function EquipmentPage() {
  const { st, me, patch, toast, addLog } = useApp();
  const manage = me?.role === "admin" || can(me?.role, "equipment.manage");
  const [q, setQ] = useState("");
  const [gid, setGid] = useState("");
  const [edit, setEdit] = useState<Equipment | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [qr, setQr] = useState<Equipment | null>(null);
  const [del, setDel] = useState<Group | null>(null);
  const [newGroup, setNewGroup] = useState("");
  const [showGroups, setShowGroups] = useState(false);

  const list = st.equipment.filter((e) =>
    (!gid || e.groupId === gid) &&
    (!q || e.name.includes(q) || e.code.toLowerCase().includes(q.toLowerCase())));

  const save = () => {
    if (!edit) return;
    if (!edit.code.trim() || !edit.name.trim()) { toast("err", "کد و نام تجهیز الزامی است"); return; }
    if (st.equipment.some((e) => e.code.toLowerCase() === edit.code.trim().toLowerCase() && e.id !== edit.id)) { toast("err", "این کد تجهیز تکراری است"); return; }
    patch((s) => ({
      ...s,
      equipment: isNew ? [edit, ...s.equipment] : s.equipment.map((e) => (e.id === edit.id ? edit : e)),
    }));
    addLog("تجهیزات", `${isNew ? "افزودن" : "ویرایش"} تجهیز ${edit.name} (${edit.code})`);
    toast("ok", isNew ? "تجهیز جدید ایجاد شد" : "تغییرات ذخیره شد");
    setEdit(null);
  };

  const toggleStatus = (e: Equipment) => {
    patch((s) => ({ ...s, equipment: s.equipment.map((x) => x.id === e.id ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x) }));
    addLog("تجهیزات", `وضعیت ${e.name} به ${e.status === "active" ? "غیرفعال" : "فعال"} تغییر کرد`);
    toast("info", e.status === "active" ? "تجهیز غیرفعال شد" : "تجهیز فعال شد");
  };

  const addGroup = () => {
    if (!newGroup.trim()) return;
    patch((s) => ({ ...s, groups: [...s.groups, { id: uid(), name: newGroup.trim(), active: true, icon: "box" }] }));
    addLog("گروه‌ها", `گروه جدید «${newGroup.trim()}» ایجاد شد`);
    toast("ok", "گروه ایجاد شد");
    setNewGroup("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
          <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}><Icon name="search" size={15} /></span>
          <input className="input !pr-9" placeholder="جستجوی نام یا کد تجهیز…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button className={cx("chip cursor-pointer", !gid && "!border-[var(--primary)]")} style={!gid ? { color: "var(--primary)", borderColor: "var(--primary)" } : undefined} onClick={() => setGid("")}>همه</button>
          {st.groups.filter((g) => g.active).map((g) => (
            <button key={g.id} className="chip cursor-pointer" style={gid === g.id ? { color: "var(--primary)", borderColor: "var(--primary)" } : undefined} onClick={() => setGid(gid === g.id ? "" : g.id)}>{g.name}</button>
          ))}
        </div>
        <div className="mr-auto flex gap-2">
          {manage && <button className="btn btn-ghost btn-sm" onClick={() => setShowGroups(!showGroups)}><Icon name="layers" size={13} /> گروه‌ها</button>}
          {manage && <button className="btn btn-primary btn-sm" onClick={() => { setEdit(emptyEq()); setIsNew(true); }}><Icon name="plus" size={13} /> تجهیز جدید</button>}
        </div>
      </div>

      {/* مدیریت گروه‌های تجهیزات (بند ۲۰ — بدون Hard-Code) */}
      {showGroups && manage && (
        <div className="card p-4 mb-5 anim-up">
          <h3 className="font-bold text-[13px] mb-3 flex items-center gap-2"><Icon name="layers" size={15} /> گروه‌های تجهیزات</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {st.groups.map((g) => {
              const count = st.equipment.filter((e) => e.groupId === g.id).length;
              return (
                <div key={g.id} className="card p-2.5 flex items-center gap-2.5" style={{ background: "var(--card2)" }}>
                  <input className="input !w-[110px] !py-1.5 !text-[12px]" value={g.name}
                    onChange={(e) => patch((s) => ({ ...s, groups: s.groups.map((x) => x.id === g.id ? { ...x, name: e.target.value } : x) }))} />
                  <span className="chip num">{fa(count)}</span>
                  {OP_HOURS_GROUPS.includes(g.id) && <Badge kind="info">ساعت کارکرد</Badge>}
                  <Toggle on={g.active} onChange={() => patch((s) => ({ ...s, groups: s.groups.map((x) => x.id === g.id ? { ...x, active: !x.active } : x) }))} />
                  <button className="btn btn-ghost btn-sm !px-2" disabled={count > 0} title={count > 0 ? "گروه دارای تجهیز است" : "حذف گروه"} onClick={() => setDel(g)}><Icon name="trash" size={13} /></button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 max-w-[360px]">
            <input className="input" placeholder="نام گروه جدید…" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGroup()} />
            <button className="btn btn-primary btn-sm" onClick={addGroup}><Icon name="plus" size={13} /> افزودن</button>
          </div>
        </div>
      )}

      {list.length === 0 ? <Empty icon="equipment" title="تجهیزی یافت نشد" /> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 stagger">
          {list.map((e) => {
            const g = st.groups.find((x) => x.id === e.groupId);
            return (
              <div key={e.id} className="card card-hover p-4">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: e.status === "active" ? "color-mix(in srgb, var(--primary) 13%, transparent)" : "var(--card2)", color: e.status === "active" ? "var(--primary)" : "var(--muted)" }}>
                    <Icon name="factory" size={19} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13.5px] truncate">{e.name}</div>
                    <div className="text-[10.5px] num mt-0.5" style={{ color: "var(--muted)" }}>{e.code} · {e.brand} {e.model}</div>
                  </div>
                  <Badge kind={e.status === "active" ? "ok" : "neutral"}>{e.status === "active" ? "فعال" : "غیرفعال"}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3.5 text-[11px]">
                  <span style={{ color: "var(--muted)" }}>گروه: <b style={{ color: "var(--soft)" }}>{g?.name}</b></span>
                  <span style={{ color: "var(--muted)" }}>محل: <b style={{ color: "var(--soft)" }}>{e.hall} / {e.area}</b></span>
                  <span style={{ color: "var(--muted)" }}>ظرفیت: <b style={{ color: "var(--soft)" }}>{e.capacity || "—"}</b></span>
                  <span style={{ color: "var(--muted)" }}>راه‌اندازی: <b className="num" style={{ color: "var(--soft)" }}>{faDate(e.commission)}</b></span>
                </div>
                {OP_HOURS_GROUPS.includes(e.groupId) && <div className="mt-2"><Badge kind="info"><Icon name="gauge" size={11} /> ساعت کارکرد فعال</Badge></div>}
                <div className="flex gap-1.5 mt-4 pt-3 border-t" style={{ borderColor: "var(--line)" }}>
                  <button className="btn btn-ghost btn-sm flex-1" onClick={() => setQr(e)}><Icon name="qr" size={13} /> QR / بارکد</button>
                  {manage && <button className="btn btn-ghost btn-sm flex-1" onClick={() => { setEdit({ ...e }); setIsNew(false); }}><Icon name="edit" size={13} /> ویرایش</button>}
                  {manage && <button className="btn btn-ghost btn-sm !px-2.5" onClick={() => toggleStatus(e)} title={e.status === "active" ? "غیرفعال‌سازی" : "فعال‌سازی"}>
                    <Icon name={e.status === "active" ? "eye-off" : "eye"} size={13} />
                  </button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال ویرایش/افزودن تجهیز */}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={isNew ? "افزودن تجهیز جدید" : `ویرایش ${edit?.name}`} icon="equipment" width={560}>
        {edit && (
          <div className="grid grid-cols-2 gap-3.5">
            <div><label className="label">کد تجهیز *</label><input className="input" dir="ltr" value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase() })} placeholder="PRS-1000" /></div>
            <div><label className="label">نام تجهیز *</label><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
            <div>
              <label className="label">گروه</label>
              <select className="select" value={edit.groupId} onChange={(e) => setEdit({ ...edit, groupId: e.target.value })}>
                {st.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div><label className="label">برند</label><input className="input" value={edit.brand} onChange={(e) => setEdit({ ...edit, brand: e.target.value })} /></div>
            <div><label className="label">مدل</label><input className="input" value={edit.model} onChange={(e) => setEdit({ ...edit, model: e.target.value })} /></div>
            <div><label className="label">شماره سریال</label><input className="input" dir="ltr" value={edit.serial} onChange={(e) => setEdit({ ...edit, serial: e.target.value })} /></div>
            <div><label className="label">ظرفیت</label><input className="input" value={edit.capacity} onChange={(e) => setEdit({ ...edit, capacity: e.target.value })} placeholder="۱۰۰۰ تن" /></div>
            <div>
              <label className="label">تاریخ راه‌اندازی (شمسی)</label>
              <JDatePicker value={edit.commission} onChange={(j) => setEdit({ ...edit, commission: j })} />
            </div>
            <div><label className="label">سالن</label><input className="input" value={edit.hall} onChange={(e) => setEdit({ ...edit, hall: e.target.value })} /></div>
            <div><label className="label">خط</label><input className="input" value={edit.line} onChange={(e) => setEdit({ ...edit, line: e.target.value })} /></div>
            <div className="col-span-2"><label className="label">ناحیه</label><input className="input" value={edit.area} onChange={(e) => setEdit({ ...edit, area: e.target.value })} /></div>
            <div className="col-span-2"><label className="label">توضیحات</label><textarea className="input" rows={2} value={edit.desc} onChange={(e) => setEdit({ ...edit, desc: e.target.value })} /></div>
            <div className="col-span-2 flex justify-end gap-2 mt-1">
              <button className="btn btn-ghost" onClick={() => setEdit(null)}>انصراف</button>
              <button className="btn btn-primary" onClick={save}><Icon name="check" size={14} /> ذخیره</button>
            </div>
          </div>
        )}
      </Modal>

      {/* مودال QR / بارکد */}
      <Modal open={!!qr} onClose={() => setQr(null)} title={`کد اختصاصی ${qr?.name ?? ""}`} icon="qr" width={400}>
        {qr && (
          <div className="flex flex-col items-center gap-4">
            <QRBox code={qr.code} size={168} />
            <div className="text-center">
              <BarcodeBox code={qr.code} w={220} h={52} />
              <div className="num font-bold text-[15px] mt-2 tracking-widest" dir="ltr">{qr.code}</div>
              <div className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>{qr.name} — {st.groups.find((g) => g.id === qr.groupId)?.name}</div>
            </div>
            <button className="btn btn-primary w-full" onClick={() => {
              const p = document.getElementById("qr-print");
              if (p) { setTimeout(() => window.print(), 120); }
            }}><Icon name="print" size={14} /> چاپ برچسب تجهیز</button>
          </div>
        )}
      </Modal>
      {qr && createPortal(
        <div id="print-sheet" dir="rtl">
          <div id="qr-print" className="print-card" style={{ padding: 16, textAlign: "center", width: 300, margin: "0 auto" }}>
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>شرکت قطعه‌سازی NIPCO</div>
            <div style={{ display: "flex", justifyContent: "center" }}><QRBox code={qr.code} size={150} /></div>
            <div style={{ fontSize: 14, fontWeight: 800, marginTop: 8 }}>{qr.name}</div>
            <div style={{ fontFamily: "monospace", fontSize: 13, letterSpacing: 2, marginTop: 4 }}>{qr.code}</div>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}><BarcodeBox code={qr.code} w={200} h={40} /></div>
          </div>
        </div>, document.body)}

      <Confirm open={!!del} onClose={() => setDel(null)} title="حذف گروه" body={`آیا از حذف گروه «${del?.name}» اطمینان دارید؟`} onYes={() => {
        if (del) { patch((s) => ({ ...s, groups: s.groups.filter((g) => g.id !== del.id) })); toast("ok", "گروه حذف شد"); }
      }} />
    </div>
  );
}
