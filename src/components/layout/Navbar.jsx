import { ShieldHalf } from "lucide-react";

export default function Navbar({ view, onSwitchView }) {
  return (
    <nav className="bg-brand-dark text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <div className="bg-brand-gold p-2 rounded-lg">
              <ShieldHalf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-wide">
                Aman<span className="text-brand-gold">Guard</span>
              </h1>
              <p className="text-xs text-gray-400">مسار التشريعات المالية - هاكاثون أمد</p>
            </div>
          </div>
          <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => onSwitchView("customer")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === "customer"
                  ? "bg-brand-gold text-white shadow"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              العميل
            </button>
            <button
              onClick={() => onSwitchView("bank")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === "bank"
                  ? "bg-brand-gold text-white shadow"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              لوحة البنك
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
