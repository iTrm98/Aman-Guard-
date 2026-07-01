import { Bell, Search } from "lucide-react";

export default function Topbar({ view }) {
  const titles = {
    customer: { main: "بوابة الحماية الآمنة",   sub: "فحص ومراقبة العمليات المالية في الوقت الفعلي" },
    bank:     { main: "مركز عمليات مكافحة الاحتيال", sub: "رصد التهديدات وإدارة الحالات الحرجة — مباشر" },
  };
  const { main, sub } = titles[view] ?? titles.customer;

  return (
    <header
      className="flex items-center justify-between px-6 shrink-0"
      style={{ height: 64, background: "#fff", borderBottom: "1px solid #e1e5eb" }}
    >
      <div>
        <h1 className="text-lg font-black" style={{ color: "#0d1b2a", lineHeight: 1.2 }}>{main}</h1>
        <p className="text-xs mt-0.5" style={{ color: "#8090a0" }}>{sub}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#a0aab4" }} />
          <input
            placeholder="بحث سريع..."
            className="input-field pr-9"
            style={{ width: 200, paddingTop: 7, paddingBottom: 7 }}
          />
        </div>

        <button
          className="relative flex items-center justify-center rounded-xl"
          style={{ width: 38, height: 38, background: "#f5f7fa", border: "1.5px solid #e1e5eb" }}
        >
          <Bell className="w-4 h-4" style={{ color: "#5a6a7a" }} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "#c0392b", border: "1.5px solid #fff" }}
          />
        </button>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: "#eaf7ee", color: "#1a7a4a", border: "1px solid #b2dfc0" }}
        >
          <span className="live-dot" />
          نظام فعال
        </div>
      </div>
    </header>
  );
}
