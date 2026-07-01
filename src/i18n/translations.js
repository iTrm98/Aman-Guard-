// AmanGuard — Bilingual translations (Arabic / English)
// Arabic reviewed for financial/security domain accuracy.

const T = {
  // ── Brand ───────────────────────────────────────────────────────────────
  brand_name:    { ar: "أمان‌جارد",            en: "AmanGuard" },
  brand_sub:     { ar: "ذكاء مكافحة الاحتيال المالي", en: "Financial Fraud Intelligence" },
  hackathon_tag: { ar: "مسار التشريعات المالية — هاكاثون أمد", en: "Financial Regulations Track — Amad Hackathon" },

  // ── Sidebar ──────────────────────────────────────────────────────────────
  nav_label:       { ar: "التنقل",                       en: "Navigation" },
  nav_customer:    { ar: "بوابة العميل الآمنة",           en: "Secure Client Portal" },
  nav_bank:        { ar: "لوحة عمليات الأمن",            en: "Security Operations" },
  demo_mode:       { ar: "نمط العرض التجريبي",           en: "Demo Mode" },
  demo_hint:       { ar: "بدّل بين واجهتَي العميل والبنك لأغراض العرض.", en: "Switch between client and bank views for demo purposes." },
  notifications:   { ar: "الإشعارات",                    en: "Notifications" },
  settings:        { ar: "الإعدادات",                    en: "Settings" },
  logout:          { ar: "تسجيل الخروج",                 en: "Sign Out" },
  premium_client:  { ar: "عميل مميز",                    en: "Premium Client" },
  close_menu:      { ar: "إغلاق القائمة",                 en: "Close menu" },
  open_menu:       { ar: "فتح القائمة",                   en: "Open menu" },

  // ── Topbar ───────────────────────────────────────────────────────────────
  topbar_customer_title: { ar: "بوابة الحماية الآمنة",                             en: "Secure Protection Portal" },
  topbar_customer_sub:   { ar: "فحص ومراقبة عملياتك المالية في الوقت الفعلي",     en: "Real-time monitoring and verification of your financial operations" },
  topbar_bank_title:     { ar: "مركز عمليات مكافحة الاحتيال",                    en: "Anti-Fraud Operations Center" },
  topbar_bank_sub:       { ar: "رصد التهديدات وإدارة الحالات الحرجة — مباشر",    en: "Live threat monitoring and critical case management" },
  quick_search:          { ar: "بحث سريع...",                                     en: "Quick search..." },
  system_active:         { ar: "نظام فعال",                                        en: "System Active" },
  theme_dark:            { ar: "الوضع الداكن",                                    en: "Dark Mode" },
  theme_light:           { ar: "الوضع الفاتح",                                    en: "Light Mode" },

  // ── Account Card ─────────────────────────────────────────────────────────
  account_main:       { ar: "الحساب الجاري الرئيسي",  en: "Primary Current Account" },
  balance_available:  { ar: "الرصيد المتاح",           en: "Available Balance" },
  account_protected:  { ar: "محمي",                    en: "Protected" },
  account_active:     { ar: "نشط",                     en: "Active" },
  ops_today:          { ar: "عمليات اليوم",             en: "Today's Operations" },
  security_checks:    { ar: "فحوصات الأمان",           en: "Security Checks" },
  threats_stopped:    { ar: "تهديدات مُوقفة",          en: "Threats Stopped" },
  ops_vs_yesterday:   { ar: "مقارنةً بالأمس",          en: "vs yesterday" },
  last_30d:           { ar: "آخر ٣٠ يوماً",            en: "Last 30 days" },
  this_month:         { ar: "هذا الشهر",               en: "This month" },
  transaction_detail: { ar: "تفاصيل العمليات",          en: "Transaction Details" },
  close:              { ar: "إغلاق",                   en: "Close" },

  // ── Call Verification ────────────────────────────────────────────────────
  call_title:        { ar: "التحقق من مكالمة البنك",                                    en: "Bank Call Verification" },
  call_desc:         { ar: "هل يتصل بك أحد ويدّعي أنه موظف البنك؟ تحقّق من صحة الاتصال فوراً.", en: "Is someone calling and claiming to be from the bank? Instantly verify the call's authenticity." },
  call_warning_title:{ ar: "تحذير: لا يوجد اتصال بنكي رسمي نشط",                       en: "Warning: No Active Official Bank Call" },
  call_ok_title:     { ar: "الاتصال مُعتمد رسمياً",                                     en: "Call Officially Authenticated" },
  verifying:         { ar: "جارٍ التحقق من السجلات...",                                  en: "Verifying records..." },
  re_verify:         { ar: "إعادة الفحص",                                              en: "Re-Verify" },
  verify_now:        { ar: "فحص الاتصال الآن",                                         en: "Verify Call Now" },
  verify_error:      { ar: "تعذّر التحقق من حالة الاتصال. يرجى المحاولة مجدداً.",       en: "Could not verify call status. Please try again." },

  // ── Scam Checker ─────────────────────────────────────────────────────────
  scam_title:        { ar: "افحص قبل أن تُنفّذ",                               en: "Verify Before You Act" },
  scam_desc:         { ar: "الصق رسالة مشبوهة، رابطاً، أو تفاصيل تحويل لتحليلها بالذكاء الاصطناعي.", en: "Paste a suspicious message, link, or transfer details for AI analysis." },
  scam_placeholder:  { ar: "مثال: عزيزي العميل، رُصد نشاط مريب على حسابك. أرسل رمز OTP لتأكيد هويتك...", en: "Example: Dear customer, suspicious activity was detected on your account. Send your OTP to confirm..." },
  analyzing:         { ar: "يعالج النموذج المدخلات ويحسب مؤشر الخطر...",         en: "Model processing input and computing risk score..." },
  analyze_ai:        { ar: "تحليل بواسطة الذكاء الاصطناعي",                       en: "Analyze with AI" },
  analyze_another:   { ar: "تحليل نص آخر",                                       en: "Analyze Another Text" },
  field_required_title:{ ar: "حقل مطلوب",                                         en: "Required Field" },
  field_required_msg:  { ar: "يرجى لصق نص الرسالة أو الرابط المراد فحصه أولاً.", en: "Please paste the message text or link to analyze first." },

  // ── Risk Report ───────────────────────────────────────────────────────────
  report_title:        { ar: "تقرير تحليل المخاطر",                               en: "Risk Analysis Report" },
  report_issued:       { ar: "صدر للتو • محرك الذكاء الاصطناعي v2.1",            en: "Just issued • AI Engine v2.1" },
  report_findings:     { ar: "مؤشرات الاحتيال المكتشفة",                          en: "Detected Fraud Indicators" },
  report_recommendation:{ ar: "توصية النظام",                                     en: "System Recommendation" },
  report_questions:    { ar: "أسئلة تحقق إلزامية قبل المتابعة",                  en: "Mandatory Verification Questions Before Proceeding" },
  freeze_btn:          { ar: "تجميد طارئ للحساب",                                 en: "Emergency Account Freeze" },
  freeze_hint:         { ar: "يُوقف جميع الحوالات الصادرة فوراً ويُرسل بلاغاً لفريق الأمن المالي.", en: "Immediately stops all outgoing transfers and files a report with the financial security team." },

  // ── Freeze flow ───────────────────────────────────────────────────────────
  freeze_confirm_title: { ar: "تأكيد التجميد الطارئ",                               en: "Confirm Emergency Freeze" },
  freeze_confirm_msg:   { ar: "سيتم إيقاف جميع الحوالات الصادرة وعمليات الشراء الإلكتروني فوراً، ورفع بلاغ رسمي لإدارة مكافحة الاحتيال. هل تؤكد؟", en: "All outgoing transfers and online purchases will be stopped immediately, and an official report will be filed with the fraud prevention team. Confirm?" },
  freeze_confirm_btn:   { ar: "نعم، جمّد الحساب الآن",                             en: "Yes, Freeze Account Now" },
  freeze_success_title: { ar: "تم تجميد الحساب بنجاح",                             en: "Account Successfully Frozen" },
  freeze_success_msg:   { ar: "تم تجميد حسابك احترازياً لحماية أموالك. البلاغ رقم #{n} قيد المعالجة من قِبل فريق الأمن المالي، وسيتواصلون معك خلال ساعة.", en: "Your account has been frozen as a precaution to protect your funds. Report #{n} is being processed by the financial security team, who will contact you within one hour." },
  goto_bank:            { ar: "الانتقال إلى لوحة البنك",                           en: "Go to Bank Dashboard" },
  cancel:               { ar: "إلغاء",                                             en: "Cancel" },
  ok:                   { ar: "حسناً",                                             en: "OK" },

  // ── Stats Cards ───────────────────────────────────────────────────────────
  stats_critical:       { ar: "حالات حرجة اليوم",             en: "Critical Cases Today" },
  stats_critical_sub:   { ar: "تتطلب استجابةً فورية",         en: "Require immediate response" },
  stats_critical_trend: { ar: "+٣ منذ الأمس",                en: "+3 since yesterday" },
  stats_suspected:      { ar: "حالات قيد المراقبة",           en: "Cases Under Monitoring" },
  stats_suspected_sub:  { ar: "مستوى الاشتباه متوسط إلى عالٍ", en: "Medium to high suspicion level" },
  stats_suspected_trend:{ ar: "+٧ هذا الأسبوع",              en: "+7 this week" },
  stats_frozen:         { ar: "حسابات مجمدة",                en: "Frozen Accounts" },
  stats_frozen_sub:     { ar: "إجراء احترازي نشط",           en: "Active precautionary measure" },
  stats_frozen_trend:   { ar: "٢ تم الإفراج عنهما",         en: "2 released" },
  stats_saved:          { ar: "مبالغ محميّة (ر.س)",           en: "Protected Amounts (SAR)" },
  stats_saved_sub:      { ar: "إجمالي الشهر الحالي",         en: "Current month total" },
  stats_saved_trend:    { ar: "↑ ٢٣٪ عن الشهر الماضي",      en: "↑ 23% vs last month" },

  // ── Cases Table ───────────────────────────────────────────────────────────
  cases_title:     { ar: "سجل الحالات المباشر",     en: "Live Case Log" },
  cases_count:     { ar: "حالة",                    en: "cases" },
  search_ph:       { ar: "بحث بالرقم أو العميل...", en: "Search by ID or client..." },
  export:          { ar: "تصدير",                   en: "Export" },
  col_report:      { ar: "رقم البلاغ",              en: "Report No." },
  col_client:      { ar: "العميل",                  en: "Client" },
  col_pattern:     { ar: "نمط الاحتيال",            en: "Fraud Pattern" },
  col_risk:        { ar: "درجة الخطر",              en: "Risk Score" },
  col_account:     { ar: "الحساب",                  en: "Account" },
  col_action:      { ar: "إجراء",                   en: "Action" },
  no_cases:        { ar: "لا توجد حالات تطابق البحث", en: "No matching cases found" },
  action_confirm:  { ar: "تأكيد التجميد والتواصل", en: "Confirm Freeze & Contact" },
  action_review:   { ar: "مراجعة الحالة",           en: "Review Case" },

  // ── Risk/Status labels ───────────────────────────────────────────────────
  risk_critical: { ar: "حرج",    en: "Critical" },
  risk_high:     { ar: "عالٍ",   en: "High" },
  risk_medium:   { ar: "متوسط",  en: "Medium" },
  status_active:   { ar: "نشط",          en: "Active" },
  status_frozen:   { ar: "مجمد",          en: "Frozen" },
  status_partial:  { ar: "مقيد جزئياً",  en: "Partial Hold" },

  // ── Bank View ────────────────────────────────────────────────────────────
  live_monitoring:    { ar: "مراقبة مباشرة",                         en: "Live Monitoring" },
  bank_page_title:    { ar: "مركز عمليات مكافحة الاحتيال",           en: "Anti-Fraud Operations Center" },
  export_report:      { ar: "تصدير التقرير",                          en: "Export Report" },
  refresh:            { ar: "تحديث",                                  en: "Refresh" },
  export_success_title:{ ar: "تم التصدير بنجاح",                     en: "Export Successful" },
  export_success_msg: { ar: "تم تنزيل ملف Excel يحتوي على جميع الحالات النشطة.", en: "An Excel file containing all active cases has been downloaded." },
  // ── Case Detail Panel ────────────────────────────────────────────────────
  case_detail_title:  { ar: "تفاصيل الحالة",                en: "Case Details" },
  case_id:            { ar: "رقم البلاغ",                   en: "Report ID" },
  case_reported_at:   { ar: "وقت الإبلاغ",                  en: "Reported At" },
  case_pattern:       { ar: "نمط الاحتيال",                 en: "Fraud Pattern" },
  case_risk:          { ar: "درجة الخطر",                   en: "Risk Score" },
  case_status:        { ar: "حالة الحساب",                  en: "Account Status" },
  case_timeline:      { ar: "مسار الحالة",                  en: "Case Timeline" },
  case_actions:       { ar: "إجراءات الموظف",               en: "Staff Actions" },
  case_freeze_action: { ar: "تجميد الحساب واستدعاء العميل", en: "Freeze Account & Call Client" },
  case_escalate:      { ar: "رفع الحالة لمدير الفرع",        en: "Escalate to Branch Manager" },
  case_dismiss:       { ar: "استبعاد الحالة (إيجابي كاذب)", en: "Dismiss Case (False Positive)" },
  timeline_flagged:   { ar: "تم رصد نشاط مشبوه بواسطة محرك الذكاء الاصطناعي", en: "Suspicious activity detected by AI engine" },
  timeline_analyzed:  { ar: "تم تحليل النص وتصنيفه ضمن مجموعة مخاطر عالية",   en: "Text analyzed and classified in high-risk group" },
  timeline_notified:  { ar: "تم إشعار فريق مكافحة الاحتيال تلقائياً",          en: "Anti-fraud team automatically notified" },
  escalate_title:     { ar: "رفع الحالة",                   en: "Escalate Case" },
  escalate_msg:       { ar: "سيتم إشعار مدير الفرع بالحالة وتحويلها لوحدة التحقيق المالي.", en: "The branch manager will be notified and the case will be transferred to the financial investigation unit." },
  escalate_btn:       { ar: "نعم، رفع الحالة",             en: "Yes, Escalate" },
  dismiss_title:      { ar: "استبعاد الحالة",               en: "Dismiss Case" },
  dismiss_msg:        { ar: "هل أنت متأكد أن هذا الكشف غير صحيح؟ سيُرسَل التغذية الراجعة لتحسين النموذج.", en: "Are you sure this detection is incorrect? Feedback will be sent to improve the model." },
  dismiss_btn:        { ar: "نعم، استبعاد",                 en: "Yes, Dismiss" },

  // ── Notifications ────────────────────────────────────────────────────────
  notif_title:    { ar: "الإشعارات",               en: "Notifications" },
  mark_all_read:  { ar: "تحديد الكل كمقروء",       en: "Mark all as read" },
  no_notifs:      { ar: "لا توجد إشعارات جديدة",   en: "No new notifications" },

  // ── Settings ─────────────────────────────────────────────────────────────
  settings_title:      { ar: "إعدادات التطبيق",        en: "App Settings" },
  appearance:          { ar: "المظهر",                  en: "Appearance" },
  language:            { ar: "اللغة",                   en: "Language" },
  lang_arabic:         { ar: "العربية",                 en: "Arabic" },
  lang_english:        { ar: "الإنجليزية",              en: "English" },
  mode_light:          { ar: "فاتح",                    en: "Light" },
  mode_dark:           { ar: "داكن",                    en: "Dark" },

  // ── Logout ───────────────────────────────────────────────────────────────
  logout_title:  { ar: "تسجيل الخروج",                          en: "Sign Out" },
  logout_msg:    { ar: "هل أنت متأكد من رغبتك في تسجيل الخروج من بوابة أمان‌جارد؟", en: "Are you sure you want to sign out of AmanGuard?" },
  logout_btn:    { ar: "نعم، تسجيل الخروج",                    en: "Yes, Sign Out" },
};

export default T;
