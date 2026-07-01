import {
  ShieldCheck,
  LayoutDashboard,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";

const NAV = [
  { id: "customer", label: "بوابة العميل الآمنة", Icon: ShieldCheck },
  { id: "bank",     label: "لوحة عمليات الأمن",   Icon: LayoutDashboard },
];

const BOTTOM_ITEMS = [
  { Icon: Bell,     label: "الإشعارات" },
  { Icon: Settings, label: "الإعدادات" },
  { Icon: LogOut,   label: "تسجيل الخروج" },
];

export default function Sidebar({ view, onSwitchView }) {
  return (
    <aside
      className="flex flex-col shrink-0 h-full"
      style={{ width: 230, background: "#101e2e", borderLeft: "1px solid #1e2f42" }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid #1e2f42" }}>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: 40, height: 40, background: "linear-gradient(135deg,#c49a5a,#e8c27a)" }}
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-lg leading-none tracking-wide">
              Aman<span style={{ color: "#c49a5a" }}>Guard</span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#4a6070" }}>
              Financial Fraud Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#304050" }}>
          Navigation
        </p>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onSwitchView(id)}
            className={`sidebar-item w-full text-right${view === id ? " active" : ""}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
            {view === id && <ChevronLeft className="w-3 h-3 mr-auto shrink-0" style={{ color: "#c49a5a" }} />}
          </button>
        ))}

        {/* Demo hint */}
        <div
          className="mx-1 mt-4 rounded-xl p-3 text-xs leading-relaxed"
          style={{ background: "#0a1620", border: "1px solid #1e2f42", color: "#4a6070" }}
        >
          <span style={{ color: "#c49a5a" }} className="font-bold">نمط العرض التجريبي</span>
          <br />استخدم التبديل أعلاه للتنقل بين واجهتي العميل والبنك لأغراض العرض.
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5" style={{ borderTop: "1px solid #1e2f42", paddingTop: 12, marginTop: 8 }}>
        {BOTTOM_ITEMS.map(({ Icon, label }) => (
          <button key={label} className="sidebar-item w-full text-right">
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
        {/* User chip */}
        <div
          className="flex items-center gap-3 mt-3 px-3 py-2.5 rounded-xl"
          style={{ background: "#0a1620" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg,#c49a5a,#8a6030)" }}
          >
            م
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "#c8d8e8" }}>نواف العتيبي</p>
            <p className="text-xs truncate" style={{ color: "#4a6070" }}>عميل مميز</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
