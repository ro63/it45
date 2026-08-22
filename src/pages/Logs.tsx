/**
 * لاگ فعالیت کامل سامانه با تاریخ و زمان شمسی (بند ۵۷)
 */
import { useMemo, useState } from "react";
import { useApp } from "../lib/store";
import { toJalaali } from "../lib/jalali";
import { download, fa, faDate, faTimeShort, toCSV } from "../lib/util";
import { Icon, Empty } from "../components/ui";

export function LogsPage() {
  const { st, toast } = useApp();
  const [q, setQ] = useState("");
  const [user, setUser] = useState("");
  const [type, setType] = useState("");

  const types = Array.from(new Set(st.logs.map((l) => l.type)));

  const list = useMemo(() => st.logs.filter((l) =>
    (!user || l.userId === user) &&
    (!type || l.type === type) &&
    (!q || l.desc.includes(q) || l.userName.includes(q))
  ), [st.logs, q, user, type]);

  const jOf = (t: number) => {
    const d = new Date(t);
    return toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  };

  return (
    <div>
      <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-2.5">
        <Icon name="filter" size={15} />
        <div className="relative flex-1 min-w-[180px] max-w-[280px]">
          <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}><Icon name="search" size={14} /></span>
          <input className="input !pr-9" placeholder="جستجو در شرح لاگ…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select !w-auto" value={user} onChange={(e) => setUser(e.target.value)}>
          <option value="">همه کاربران</option>
          {st.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select className="select !w-auto" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">همه انواع</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm mr-auto" onClick={() => {
          download("nipco-logs.csv", toCSV(["تاریخ", "ساعت", "کاربر", "نوع", "شرح"], list.map((l) => [faDate(jOf(l.t)), faTimeShort(new Date(l.t)), l.userName, l.type, l.desc])));
          toast("ok", "خروجی لاگ‌ها دانلود شد");
        }}><Icon name="download" size={13} /> خروجی Excel</button>
      </div>

      <div className="card overflow-auto">
        {list.length === 0 ? <Empty icon="logs" title="لاگی یافت نشد" /> : (
          <table className="tbl">
            <thead><tr><th>تاریخ شمسی</th><th>ساعت</th><th>کاربر</th><th>نوع</th><th>شرح فعالیت</th></tr></thead>
            <tbody>
              {list.slice(0, 120).map((l) => (
                <tr key={l.id}>
                  <td className="num">{faDate(jOf(l.t))}</td>
                  <td className="num">{faTimeShort(new Date(l.t))}</td>
                  <td className="font-bold">{l.userName}</td>
                  <td><span className="chip">{l.type}</span></td>
                  <td style={{ color: "var(--soft)" }}>{l.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-[11px] mt-2" style={{ color: "var(--muted)" }}>{fa(list.length)} رویداد ثبت‌شده — {fa(Math.min(120, list.length))} مورد نمایش داده شد · زمان‌ها به تقویم شمسی</p>
    </div>
  );
}
