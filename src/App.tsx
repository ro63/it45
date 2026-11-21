/**
 * ============================================================
 * NIPCO Daily Equipment Control System
 * سامانه کنترل روزانه تجهیزات NIPCO
 * طراح و تحلیلگر سیستم: محمد روشندل
 * ------------------------------------------------------------
 * نقطه ورود برنامه: احراز هویت ──> پوسته ──> صفحات ماژولار
 * ============================================================
 */
import { useState } from "react";
import { AppProvider, useApp } from "./lib/store";
import { Layout, navAllowed, NAV, type Page } from "./components/layout";
import { ToastHost, Empty } from "./components/ui";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Control } from "./pages/Control";
import { Reports } from "./pages/Reports";
import { EquipmentPage } from "./pages/Equipment";
import { ChecklistsPage } from "./pages/Checklists";
import { UsersPage } from "./pages/UsersPage";
import { SettingsPage } from "./pages/Settings";
import { LogsPage } from "./pages/Logs";

const TITLES: Record<Page, string> = {
  dashboard: "داشبورد",
  control: "کنترل روزانه تجهیزات",
  reports: "گزارشات",
  equipment: "تجهیزات",
  checklists: "چک‌لیست‌ساز",
  users: "کاربران و سطح دسترسی",
  logs: "لاگ فعالیت",
  settings: "تنظیمات سامانه",
};

function Shell() {
  const { me, toasts } = useApp();
  const [page, setPage] = useState<Page>("dashboard");

  if (!me) {
    return (
      <>
        <Login />
        <ToastHost toasts={toasts} />
      </>
    );
  }

  const allowed = navAllowed(me.role, NAV.find((n) => n.id === page)?.perm ?? "dashboard");

  return (
    <>
      <Layout page={page} setPage={setPage} title={TITLES[page]}>
        {!allowed ? (
          <Empty icon="shield" title="دسترسی به این بخش مجاز نیست" sub="نقش کاربری شما اجازه مشاهده این ماژول را ندارد — در صورت نیاز با مدیر سیستم هماهنگ کنید" />
        ) : (
          <>
            {page === "dashboard" && <Dashboard goControl={() => setPage("control")} />}
            {page === "control" && <Control goDashboard={() => setPage("dashboard")} />}
            {page === "reports" && <Reports />}
            {page === "equipment" && <EquipmentPage />}
            {page === "checklists" && <ChecklistsPage />}
            {page === "users" && <UsersPage />}
            {page === "logs" && <LogsPage />}
            {page === "settings" && <SettingsPage />}
          </>
        )}
      </Layout>
      <ToastHost toasts={toasts} />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
