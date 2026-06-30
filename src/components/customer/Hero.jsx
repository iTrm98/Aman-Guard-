import { Fingerprint } from "lucide-react";

export default function Hero() {
  return (
    <div className="bg-gradient-to-l from-brand-dark to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
        <Fingerprint className="w-32 h-32 -mt-4 -mr-4" />
      </div>
      <h2 className="text-3xl font-bold mb-2">مرحباً بك في أمان‌جارد</h2>
      <p className="text-gray-300 max-w-2xl text-lg">
        نحميك من الاحتيال المالي قبل وقوعه. افحص مكالماتك ورسائلك واستمتع بتجربة مالية آمنة.
      </p>
    </div>
  );
}
