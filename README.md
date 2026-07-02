---

## 🎥 عرض توضيحي للمشروع (Demo Video)
للاطلاع على كيفية عمل **AmanGuard** بشكل مباشر، يمكنك مشاهدة العرض التقديمي من خلال الرابط التالي:

[▶️ شاهد فيديو العرض التقديمي](https://drive.google.com/file/d/1_FFxq7MaQK564Yu2h_aqJZX4F978thZI/view?usp=sharing) 


# AmanGuard — واجهة العميل وموظف البنك (Frontend)

واجهة React + Tailwind CSS لتطبيق **AmanGuard**: نظام وقاية استباقية من الاحتيال المالي. يتضمن واجهتين:

- **واجهة العميل**: التحقق من مكالمات البنك، فحص الرسائل/الروابط المشبوهة بالذكاء الاصطناعي، أسئلة تحقق إلزامية، وزر تجميد طارئ للحساب.
- **لوحة موظف البنك**: إحصائيات حية، وجدول الحالات النشطة مع مستوى الخطورة وإجراءات الموظف.

هذا المشروع يغطي الجزء الأمامي (Frontend) فقط، وفق هيكلية المهام في مستند الـ MVP (CUST-001 إلى CUST-006, BANK-001, BANK-002).

## التقنيات

- React 19 + Vite
- Tailwind CSS v4
- lucide-react للأيقونات

## الإعداد

```bash
npm install
cp .env.example .env
npm run dev
```

## الاتصال بالخادم (Backend)

طبقة الخدمات في `src/api/fraudService.js` مبنية لتطابق نقاط النهاية المتوقعة من خادم Spring Boot:

| Endpoint | الاستخدام |
|---|---|
| `GET /call-status` | التحقق من حالة الاتصال البنكي الرسمي (CUST-002) |
| `POST /analyze` | تحليل النص/الرابط وإرجاع درجة الخطورة وأسئلة التحقق (CUST-003/004, BACK-SB-004) |
| `POST /freeze` | تجميد الحساب طارئاً وإرجاع رقم البلاغ (CUST-006, BACK-SB-004) |
| `GET /cases/active` | جلب إحصائيات وجدول الحالات الحية للوحة البنك (BANK-001/002, BACK-SB-004) |

ضبط الرابط الأساسي للخادم عبر متغير البيئة `VITE_API_BASE_URL`.

### وضع المحاكاة (Mock Mode)

إلى حين جاهزية الخادم، تعمل جميع الاستدعاءات تلقائياً بواسطة بيانات وهمية (`src/api/mockData.js`) عندما تكون `VITE_USE_MOCKS=true` (الافتراضي)، أو عند فشل الاتصال الفعلي بالخادم. لتفعيل الاتصال الحقيقي بالكامل، عيّن `VITE_USE_MOCKS=false` في ملف `.env`.

## البنية

```
src/
  api/            طبقة الاتصال بالخادم + بيانات المحاكاة
  components/
    layout/       Navbar, Modal
    customer/     Hero, CallVerification, ScamChecker, RiskReport
    bank/         StatsCards, CasesTable
  views/          CustomerView, BankView
  App.jsx         إدارة الحالة العامة والتنقل بين الواجهتين
```

## أوامر متاحة

```bash
npm run dev       # بيئة التطوير
npm run build     # بناء نسخة الإنتاج
npm run lint      # فحص الكود
npm run preview   # معاينة نسخة الإنتاج
```
# Aman-Guard-
