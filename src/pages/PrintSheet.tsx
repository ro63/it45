/**
 * ============================================================
 * قالب چاپ A4 فرم کنترل روزانه (بندهای ۱۵، ۱۶ و ۱۰۱-د)
 * سربرگ رسمی NIPCO + جداول نتایج + کادر امضای سه‌مرحله‌ای:
 *   ۱) تکنسین انجام‌دهنده  ۲) کارشناس نت  ۳) مدیر واحد نت
 * فقط هنگام چاپ (@media print) نمایش داده می‌شود.
 * ============================================================
 */
import { createPortal } from "react-dom";
import { fa, faDateLong, faTimeShort, faNum } from "../lib/util";
import { type AppState, type ControlRec } from "../lib/types";
import { sectionAllowed } from "../lib/store";

export interface PrintData {
  rec: ControlRec | null;         // رکورد ثبت‌شده
  preview?: boolean;              // چاپ پیش‌نویس (قبل از ثبت نهایی)
}

export function PrintSheet({ st, data, meName }: { st: AppState; data: PrintData | null; meName: string }) {
  if (!data || !data.rec) return null;
  const rec = data.rec;
  const eq = st.equipment.find((e) => e.id === rec.equipmentId);
  const cl = st.checklists.find((c) => c.id === rec.checklistId);
  const tech = st.users.find((u) => u.id === rec.techId);
  const group = eq ? st.groups.find((g) => g.id === eq.groupId) : null;
  if (!eq || !cl) return null;

  const statusFa = data.preview ? "پیش‌نویس (ثبت نشده)" : rec.status === "NOK" ? "نامنطبق — NOK" : "تأیید شد — سالم";

  const sheet = (
    <div id="print-sheet" dir="rtl">
      {/* ---------- سربرگ رسمی ---------- */}
      <div className="print-card" style={{ padding: "10px 14px" }}>
        <table style={{ width: "100%" }}>
          <tbody>
            <tr>
              <td style={{ width: 60, verticalAlign: "middle" }}>
                <svg width="46" height="46" viewBox="0 0 32 32">
                  <path d="M16 2 28 9v14L16 30 4 23V9z" fill="#1a1a1a" />
                  <path d="M11 22V10l4.5 7L20 10v12" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </td>
              <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>شرکت قطعه‌سازی NIPCO</div>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>فرم کنترل روزانه تجهیزات — Daily Equipment Control</div>
              </td>
              <td style={{ width: 150, fontSize: 9, textAlign: "left", verticalAlign: "middle", color: "#333" }}>
                کد سند: NIPCO-DC-FRM-01<br />نگارش: ۱.۴ · صفحه ۱ از ۱<br />تاریخ صدور: {faDateLong(rec.date)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ---------- اطلاعات تجهیز و کنترل ---------- */}
      <table className="print-table" style={{ marginTop: 8 }}>
        <tbody>
          <tr>
            <th style={{ width: "12%" }}>تجهیز</th><td style={{ width: "21%" }}>{eq.name}</td>
            <th style={{ width: "12%" }}>کد تجهیز</th><td style={{ width: "14%" }}>{eq.code}</td>
            <th style={{ width: "12%" }}>گروه</th><td>{group?.name ?? "—"}</td>
          </tr>
          <tr>
            <th>محل استقرار</th><td>{eq.hall} / {eq.line} / {eq.area}</td>
            <th>نام کنترل</th><td colSpan={3}>{cl.title}</td>
          </tr>
          <tr>
            <th>تاریخ (شمسی)</th><td>{faDateLong(rec.date)}</td>
            <th>ساعت</th><td>{faTimeShort(new Date(rec.timeISO))}</td>
            <th>شیفت</th><td>شیفت {fa(rec.shift)}</td>
          </tr>
          <tr>
            <th>تکنسین</th><td>{tech?.name ?? meName}</td>
            <th>وضعیت نهایی</th><td colSpan={3} style={{ fontWeight: 800, color: rec.status === "NOK" ? "#b00020" : "#0a5c36" }}>{statusFa}</td>
          </tr>
        </tbody>
      </table>

      {/* ---------- بخش‌ها و آیتم‌ها ---------- */}
      {cl.sections.filter((s) => sectionAllowed(s.depts, tech?.dept, true)).map((s) => (
        <table className="print-table" key={s.id} style={{ marginTop: 8 }}>
          <thead>
            <tr><th colSpan={4} style={{ background: "#1a1a1a", color: "#fff", fontSize: 11 }}>{s.title}</th></tr>
            <tr><th style={{ width: "5%" }}>ردیف</th><th>شرح کنترل</th><th style={{ width: "18%" }}>نتیجه</th><th style={{ width: "22%" }}>محدوده مجاز / واحد</th></tr>
          </thead>
          <tbody>
            {s.items.map((it, i) => {
              const a = rec.answers[it.id];
              let res = "—";
              if (it.kind === "oknok") res = a?.ok === true ? "OK ✓" : a?.ok === false ? "NOK ✗" : "—";
              else res = a?.num !== undefined && a?.num !== null ? `${faNum(a.num, it.prec ?? 0)} ${it.unit ?? ""}` : "—";
              const oor = it.kind === "numeric" && a?.num != null && (a.num < (it.min ?? -Infinity) || a.num > (it.max ?? Infinity));
              const bad = a?.ok === false || oor;
              return (
                <tr key={it.id} style={bad ? { background: "#fdecec" } : undefined}>
                  <td>{fa(i + 1)}</td>
                  <td>{it.title}</td>
                  <td style={{ fontWeight: 800, color: bad ? "#b00020" : "#0a5c36" }}>{res}{oor ? " (خارج از محدوده)" : ""}</td>
                  <td style={{ color: "#444" }}>{it.kind === "numeric" ? `${it.min} تا ${it.max} ${it.unit ?? ""}` : "سالم / ناسالم"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ))}

      {/* ---------- ساعت کارکرد ---------- */}
      {rec.opHours && (
        <table className="print-table" style={{ marginTop: 8 }}>
          <thead><tr><th colSpan={4} style={{ background: "#1a1a1a", color: "#fff", fontSize: 11 }}>ساعت کارکرد تجهیز</th></tr></thead>
          <tbody>
            <tr>
              <th style={{ width: "20%" }}>مقدار فعلی</th><td style={{ width: "30%" }}>{faNum(rec.opHours.value, 1)} ساعت</td>
              <th style={{ width: "20%" }}>قرائت قبلی</th><td>{rec.opHours.prev !== null ? `${faNum(rec.opHours.prev, 1)} ساعت` : "—"}</td>
            </tr>
            <tr>
              <th>منبع ثبت</th><td>{rec.opHours.source === "AUTO" ? "خودکار (PLC/Modbus)" : rec.opHours.source === "MANUAL" ? "دستی" : "اصلاحی"}</td>
              <th>توضیح</th><td>{rec.opHours.reason || "—"}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* ---------- توضیحات ---------- */}
      <table className="print-table" style={{ marginTop: 8 }}>
        <tbody>
          <tr>
            <th style={{ width: "15%" }}>توضیحات</th>
            <td style={{ minHeight: 40, height: 40 }}>{rec.notes || (rec.failLoc ? `محل خرابی: ${rec.failLoc}` : "—")}{rec.failLoc && rec.notes ? ` — محل خرابی: ${rec.failLoc}` : ""}</td>
          </tr>
        </tbody>
      </table>

      {/* ---------- کادر امضای سه‌مرحله‌ای (بند ۱۵) ---------- */}
      <table style={{ width: "100%", marginTop: 14, textAlign: "center" }}>
        <tbody>
          <tr>
            {["امضای تکنسین انجام‌دهنده", "تأیید و امضای کارشناس نگهداری و تعمیرات", "تأیید و امضای مدیر واحد نگهداری و تعمیرات"].map((t, i) => (
              <td key={i} style={{ width: "33%", padding: "0 6px" }}>
                <div className="print-card" style={{ height: 74, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6 }}>
                  <span style={{ fontSize: 9, color: "#555" }}>{i === 0 ? (tech?.name ?? "____________") : "نام و امضا: ____________"}</span>
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 700, marginTop: 5 }}>{fa(i + 1)}. {t}</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 8.5, color: "#666" }}>
        <span>این فرم توسط سامانه کنترل روزانه تجهیزات NIPCO تولید شده است — طراح و تحلیلگر سیستم: محمد روشندل</span>
        <span>چاپ در تاریخ {faDateLong(rec.date)} ساعت {faTimeShort(new Date(rec.timeISO))}</span>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
