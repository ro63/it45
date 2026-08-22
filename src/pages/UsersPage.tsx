/**
 * مدیریت کاربران، نقش‌ها و ماتریس دسترسی دقیق (بندهای ۳۰ تا ۳۲)
 * Module ──> Form ──> Section ──> Item برای عملیات مختلف
 */
import { useState } from "react";
import { useApp } from "../lib/store";
import { ROLE_NAMES, type Role, type User } from "../lib/types";
import { SHIFTS } from "../lib/jalali";
import { DEPTS } from "../lib/types";
import { fa, uid } from "../lib/util";
import { Icon, Badge, Modal, Toggle } from "../components/ui";

const emptyUser = (): User => ({ id: uid(), username: "", name: "", role: "technician", shift: 1, dept: "نت", active: true, pass: "1234" });

const MATRIX: { module: string; ops: Partial<Record<Role, string>> }[] = [
  { module: "داشبورد", ops: { admin: "کامل", supervisor: "مشاهده + شخصی‌سازی", engineer: "مشاهده", technician: "مشاهده", viewer: "مشاهده" } },
  { module: "کنترل روزانه", ops: { admin: "کامل", supervisor: "ثبت + تأیید", engineer: "ثبت", technician: "ثبت", viewer: "—" } },
  { module: "پیش‌نویس‌ها", ops: { admin: "همه", supervisor: "مالک", engineer: "مالک", technician: "مالک", viewer: "—" } },
  { module: "گزارشات و خروجی", ops: { admin: "کامل", supervisor: "کامل", engineer: "مشاهده + Excel", technician: "محدود", viewer: "فقط مشاهده" } },
  { module: "تجهیزات و گروه‌ها", ops: { admin: "کامل", supervisor: "مدیریت", engineer: "مشاهده", technician: "مشاهده", viewer: "مشاهده" } },
  { module: "چک‌لیست‌ساز", ops: { admin: "کامل", supervisor: "مدیریت", engineer: "مشاهده", technician: "—", viewer: "—" } },
  { module: "کاربران و نقش‌ها", ops: { admin: "کامل", supervisor: "مشاهده", engineer: "—", technician: "—", viewer: "—" } },
  { module: "بکاپ / بازیابی / آرشیو سال", ops: { admin: "کامل", supervisor: "—", engineer: "—", technician: "—", viewer: "—" } },
];

export function UsersPage() {
  const { st, me, patch, toast, addLog } = useApp();
  const isAdmin = me?.role === "admin";
  const [edit, setEdit] = useState<User | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [resetPw, setResetPw] = useState<User | null>(null);
  const [pw, setPw] = useState("");

  const save = () => {
    if (!edit) return;
    if (!edit.username.trim() || !edit.name.trim()) { toast("err", "نام و نام کاربری الزامی است"); return; }
    if (st.users.some((u) => u.username === edit.username.trim() && u.id !== edit.id)) { toast("err", "نام کاربری تکراری است"); return; }
    patch((s) => ({ ...s, users: isNew ? [...s.users, edit] : s.users.map((u) => u.id === edit.id ? edit : u) }));
    addLog("کاربران", `${isNew ? "افزودن" : "ویرایش"} کاربر ${edit.name} (${ROLE_NAMES[edit.role]})`);
    toast("ok", "کاربر ذخیره شد");
    setEdit(null);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <p className="text-[12px]" style={{ color: "var(--soft)" }}>تخصیص نقش، شیفت و دپارتمان — دسترسی‌ها در سطح Section نیز اعمال می‌شوند.</p>
        {isAdmin && <button className="btn btn-primary btn-sm mr-auto" onClick={() => { setEdit(emptyUser()); setIsNew(true); }}><Icon name="plus" size={13} /> کاربر جدید</button>}
      </div>

      <div className="card overflow-auto mb-6">
        <table className="tbl">
          <thead><tr><th>کاربر</th><th>نام کاربری</th><th>نقش</th><th>دپارتمان</th><th>شیفت</th><th>وضعیت</th>{isAdmin && <th>عملیات</th>}</tr></thead>
          <tbody>
            {st.users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center font-display text-[13px]" style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)", color: "var(--primary)" }}>{u.name.slice(0, 1)}</span>
                    <span className="font-bold">{u.name}{u.id === me?.id && <span className="text-[9.5px] mr-1.5" style={{ color: "var(--muted)" }}>(شما)</span>}</span>
                  </div>
                </td>
                <td className="num" dir="ltr">{u.username}</td>
                <td><Badge kind={u.role === "admin" ? "primary" : u.role === "viewer" ? "neutral" : "info"}>{ROLE_NAMES[u.role]}</Badge></td>
                <td>{u.dept}</td>
                <td className="num">{fa(u.shift)} — {SHIFTS.find((s) => s.id === u.shift)?.range}</td>
                <td>{u.active ? <Badge kind="ok">فعال</Badge> : <Badge kind="neutral">غیرفعال</Badge>}</td>
                {isAdmin && (
                  <td>
                    <div className="flex gap-1.5">
                      <button className="btn btn-ghost btn-sm !px-2.5" onClick={() => { setEdit({ ...u }); setIsNew(false); }}><Icon name="edit" size={13} /></button>
                      <button className="btn btn-ghost btn-sm !px-2.5" title="تغییر رمز عبور" onClick={() => { setResetPw(u); setPw(""); }}><Icon name="lock" size={13} /></button>
                      <button className="btn btn-ghost btn-sm !px-2.5" disabled={u.id === me?.id} onClick={() => {
                        patch((s) => ({ ...s, users: s.users.map((x) => x.id === u.id ? { ...x, active: !x.active } : x) }));
                        toast("info", u.active ? "کاربر غیرفعال شد" : "کاربر فعال شد");
                      }}><Icon name={u.active ? "eye-off" : "eye"} size={13} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="font-bold text-[13.5px] mb-3 flex items-center gap-2"><Icon name="shield" size={15} /> ماتریس دسترسی نقش‌ها</h3>
      <div className="card overflow-auto">
        <table className="tbl">
          <thead><tr><th>ماژول</th>{Object.keys(ROLE_NAMES).map((r) => <th key={r}>{ROLE_NAMES[r as Role]}</th>)}</tr></thead>
          <tbody>
            {MATRIX.map((m) => (
              <tr key={m.module}>
                <td className="font-bold">{m.module}</td>
                {(Object.keys(ROLE_NAMES) as Role[]).map((r) => (
                  <td key={r}>
                    <span className="text-[11px] font-semibold" style={{ color: m.ops[r] === "—" ? "var(--muted)" : m.ops[r] === "کامل" ? "var(--ok)" : "var(--soft)" }}>{m.ops[r]}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={isNew ? "افزودن کاربر" : `ویرایش ${edit?.name}`} icon="users" width={480}>
        {edit && (
          <div className="grid grid-cols-2 gap-3.5">
            <div><label className="label">نام و نام خانوادگی *</label><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
            <div><label className="label">نام کاربری *</label><input className="input" dir="ltr" value={edit.username} onChange={(e) => setEdit({ ...edit, username: e.target.value })} /></div>
            <div>
              <label className="label">نقش</label>
              <select className="select" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value as Role })}>
                {(Object.keys(ROLE_NAMES) as Role[]).map((r) => <option key={r} value={r}>{ROLE_NAMES[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">دپارتمان</label>
              <select className="select" value={edit.dept} onChange={(e) => setEdit({ ...edit, dept: e.target.value })}>
                {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">شیفت</label>
              <select className="select" value={edit.shift} onChange={(e) => setEdit({ ...edit, shift: +e.target.value })}>
                {SHIFTS.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.range})</option>)}
              </select>
            </div>
            <div><label className="label">رمز عبور اولیه</label><input className="input" dir="ltr" value={edit.pass} onChange={(e) => setEdit({ ...edit, pass: e.target.value })} /></div>
            <div className="col-span-2"><Toggle on={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label="حساب فعال" /></div>
            <div className="col-span-2 flex justify-end gap-2 mt-1">
              <button className="btn btn-ghost" onClick={() => setEdit(null)}>انصراف</button>
              <button className="btn btn-primary" onClick={save}><Icon name="check" size={14} /> ذخیره</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!resetPw} onClose={() => setResetPw(null)} title={`تغییر رمز عبور ${resetPw?.name}`} icon="lock" width={380}>
        <label className="label">رمز عبور جدید</label>
        <input className="input" dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="حداقل ۴ کاراکتر" />
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-ghost" onClick={() => setResetPw(null)}>انصراف</button>
          <button className="btn btn-primary" disabled={pw.length < 4} onClick={() => {
            if (resetPw) {
              patch((s) => ({ ...s, users: s.users.map((u) => u.id === resetPw.id ? { ...u, pass: pw } : u) }));
              addLog("کاربران", `رمز عبور ${resetPw.name} تغییر کرد`);
              toast("ok", "رمز عبور تغییر یافت");
            }
            setResetPw(null);
          }}><Icon name="check" size={14} /> ذخیره رمز</button>
        </div>
      </Modal>
    </div>
  );
}
