INSERT INTO accounts (
    iban,
    masked_iban,
    balance,
    currency,
    status,
    security_status
) VALUES
('SA0000000000000000004821', 'SA•• •••• •••• •••• 4821', 48321.50, 'SAR', 'active', 'protected'),
('SA4420000001234567891234', 'SA•• •••• •••• •••• 1234', 18500.00, 'SAR', 'active', 'protected'),
('SA4420000005678901234567', 'SA•• •••• •••• •••• 4567', 9500.75, 'SAR', 'active', 'protected'),
('SA4420000009012345678901', 'SA•• •••• •••• •••• 8901', 74000.00, 'SAR', 'partially_restricted', 'under_review');

INSERT INTO auth_users (
    national_id,
    account_number,
    phone,
    display_name,
    role,
    pin_hash,
    refresh_token_hash,
    enabled,
    created_at,
    updated_at
) VALUES
('3030303030', 'SA0000000000000000004821', '0555556666', 'نواف العتيبي', 'CUSTOMER', '$2y$10$dh9CIezSPWVtgZ13DRJ84eGPeFmoAj3mh7QCUlxsEGW7eWOvGZmCW', NULL, TRUE, NOW(6), NOW(6)),
('9999999999', 'OFFICER-001', '0500000000', 'SOC Officer', 'BANK_OFFICER', '$2y$10$dh9CIezSPWVtgZ13DRJ84eGPeFmoAj3mh7QCUlxsEGW7eWOvGZmCW', NULL, TRUE, NOW(6), NOW(6)),
('8888888888', 'OFFICER-002', '0501112222', 'Fraud Analyst', 'BANK_OFFICER', '$2y$10$dh9CIezSPWVtgZ13DRJ84eGPeFmoAj3mh7QCUlxsEGW7eWOvGZmCW', NULL, TRUE, NOW(6), NOW(6));

INSERT INTO customers (
    national_id,
    name,
    name_en,
    account_number,
    phone
) VALUES
('1010101010', 'تركي السفياني', 'Turki Al-Sufyani', 'SA4420000001234567891234', '0551112222'),
('2020202020', 'محمد الزهراني', 'Mohammed Al-Zahrani', 'SA4420000005678901234567', '0553334444'),
('3030303030', 'نواف العتيبي', 'Nawaf Al-Otaibi', 'SA0000000000000000004821', '0555556666'),
('4040404040', 'أحمد الحربي', 'Ahmed Al-Harbi', 'SA4420000009012345678901', '0557778888'),
('5050505050', 'عبدالله المطيري', 'Abdullah Al-Mutairi', 'SA4420000001111222233334', '0561112222'),
('6060606060', 'خالد القحطاني', 'Khaled Al-Qahtani', 'SA4420000002222333344445', '0563334444'),
('7070707070', 'سارة الغامدي', 'Sarah Al-Ghamdi', 'SA4420000003333444455556', '0565556666'),
('8080808080', 'ريم الشهري', 'Reem Al-Shehri', 'SA4420000004444555566667', '0567778888'),
('9090909090', 'فهد الدوسري', 'Fahad Al-Dosari', 'SA4420000005555666677778', '0571112222'),
('1111222233', 'مشعل العتيبي', 'Mishal Al-Otaibi', 'SA4420000006666777788889', '0573334444'),
('2222333344', 'عبدالعزيز المالكي', 'Abdulaziz Al-Maliki', 'SA4420000007777888899990', '0575556666'),
('3333444455', 'هند الحربي', 'Hind Al-Harbi', 'SA4420000008888999900001', '0577778888');

INSERT INTO fraud_cases (
    input_text,
    risk_score,
    risk_level,
    recommendation,
    customer_name,
    fraud_pattern,
    account_number,
    phone,
    notes,
    account_status_override,
    estimated_amount,
    created_at
) VALUES
('نحن من البنك. أرسل رمز OTP فوراً حتى لا يتم إيقاف حسابك.', 95, 'CRITICAL', 'أوقف التواصل فوراً ولا تشارك رمز التحقق.', 'نواف العتيبي', 'OTP_REQUEST_BANK_IMPERSONATION', 'SA0000000000000000004821', '0555556666', 'طلب رمز تحقق مع انتحال صفة موظف بنك.', 'frozen', 12500.00, NOW(6) - INTERVAL 10 MINUTE),
('لديك شحنة متوقفة. ادفع رسوم التوصيل الآن من خلال الرابط.', 82, 'HIGH', 'لا تفتح الرابط وتحقق من شركة التوصيل عبر قنواتها الرسمية.', 'محمد الزهراني', 'FAKE_SHIPPING_PAYMENT', 'SA4420000005678901234567', '0553334444', 'رابط دفع مزيف باسم شركة شحن.', NULL, 7500.00, NOW(6) - INTERVAL 40 MINUTE),
('تم تعليق حسابك البنكي. حدث بياناتك الآن عبر الرابط التالي.', 90, 'CRITICAL', 'لا تدخل بياناتك البنكية عبر روابط الرسائل.', 'تركي السفياني', 'ACCOUNT_UPDATE_PHISHING', 'SA4420000001234567891234', '0551112222', 'تهديد بإيقاف الحساب مع رابط مشبوه.', 'partially_restricted', 18400.00, NOW(6) - INTERVAL 1 HOUR),
('مبروك ربحت جائزة مالية، أرسل رقم البطاقة لتأكيد التحويل.', 78, 'HIGH', 'تجاهل الرسالة ولا تشارك بيانات البطاقة.', 'أحمد الحربي', 'PRIZE_CARD_THEFT', 'SA4420000009012345678901', '0557778888', 'احتيال جائزة وهمية للحصول على بيانات البطاقة.', NULL, 3200.00, NOW(6) - INTERVAL 2 HOUR),
('يرجى دفع غرامة حكومية عاجلة من خلال هذا الرابط خلال ساعة.', 86, 'HIGH', 'تحقق من الجهة الحكومية عبر التطبيق الرسمي فقط.', 'عبدالله المطيري', 'FAKE_GOVERNMENT_FINE', 'SA4420000001111222233334', '0561112222', 'استعجال وتهديد بغرامة وهمية.', NULL, 2100.00, NOW(6) - INTERVAL 4 HOUR),
('أنا موظف الدعم الفني للبنك، احتاج رمز التحقق لإلغاء عملية مشبوهة.', 97, 'CRITICAL', 'لا تشارك OTP مع أي شخص حتى لو ادعى أنه موظف بنك.', 'خالد القحطاني', 'BANK_SUPPORT_OTP', 'SA4420000002222333344445', '0563334444', 'انتحال دعم فني وطلب OTP.', 'frozen', 22500.00, NOW(6) - INTERVAL 6 HOUR),
('تم اختيارك للاستثمار بعائد يومي مضمون 30%. حول مبلغ البداية الآن.', 72, 'HIGH', 'تجنب عروض الاستثمار المضمونة وغير المرخصة.', 'سارة الغامدي', 'FAKE_INVESTMENT', 'SA4420000003333444455556', '0565556666', 'وعد بعائد مضمون مرتفع.', NULL, 15000.00, NOW(6) - INTERVAL 8 HOUR),
('رابط استرداد ضريبة القيمة المضافة، أدخل بيانات الحساب للاستلام.', 84, 'HIGH', 'استخدم المواقع الرسمية فقط ولا تدخل بياناتك عبر روابط مختصرة.', 'ريم الشهري', 'TAX_REFUND_PHISHING', 'SA4420000004444555566667', '0567778888', 'استرداد ضريبي مزيف.', NULL, 4300.00, NOW(6) - INTERVAL 12 HOUR),
('سيتم حظر بطاقتك خلال دقائق. اضغط الرابط لتأكيد الهوية.', 91, 'CRITICAL', 'لا تضغط الرابط واتصل بالبنك من الرقم الرسمي.', 'فهد الدوسري', 'CARD_BLOCK_THREAT', 'SA4420000005555666677778', '0571112222', 'تهديد عاجل بحظر البطاقة.', 'partially_restricted', 9800.00, NOW(6) - INTERVAL 1 DAY),
('تحويل دولي معلق يحتاج رسوم تفعيل بسيطة عبر الرابط.', 80, 'HIGH', 'لا تدفع أي رسوم قبل التحقق من البنك.', 'مشعل العتيبي', 'FAKE_TRANSFER_FEE', 'SA4420000006666777788889', '0573334444', 'رسوم تحويل وهمية.', NULL, 6200.00, NOW(6) - INTERVAL 1 DAY - INTERVAL 2 HOUR),
('عزيزي العميل، حدث كلمة المرور من هنا لتجنب إيقاف الحساب.', 88, 'HIGH', 'لا تستخدم روابط تحديث كلمة المرور من الرسائل.', 'عبدالعزيز المالكي', 'PASSWORD_RESET_PHISHING', 'SA4420000007777888899990', '0575556666', 'رابط تحديث كلمة مرور مزيف.', NULL, 5400.00, NOW(6) - INTERVAL 2 DAY),
('استلم حوالتك الآن بعد دفع رسوم التخليص.', 68, 'HIGH', 'تحقق من مصدر الحوالة ولا تدفع رسومًا مسبقة.', 'هند الحربي', 'FAKE_REMITTANCE_FEE', 'SA4420000008888999900001', '0577778888', 'رسوم تخليص حوالة وهمية.', NULL, 2900.00, NOW(6) - INTERVAL 2 DAY - INTERVAL 3 HOUR),
('طلب تسجيل دخول جديد من جهاز غير معروف. أرسل الرمز لإلغاء الطلب.', 94, 'CRITICAL', 'لا تشارك الرمز. غيّر كلمة المرور من التطبيق الرسمي.', 'نواف العتيبي', 'LOGIN_OTP_CANCEL', 'SA0000000000000000004821', '0555556666', 'احتيال إلغاء تسجيل دخول مزيف.', 'frozen', 11800.00, NOW(6) - INTERVAL 3 DAY),
('موقع متجر يقدم خصم 90% لفترة محدودة، الدفع عبر رابط خارجي.', 63, 'HIGH', 'تحقق من موثوقية المتجر والدفع داخل المنصة الرسمية.', 'محمد الزهراني', 'FAKE_MERCHANT_DISCOUNT', 'SA4420000005678901234567', '0553334444', 'متجر وهمي بخصم مبالغ فيه.', NULL, 1300.00, NOW(6) - INTERVAL 3 DAY - INTERVAL 5 HOUR),
('تم رصد عملية شراء من دولة خارجية، أرسل الرمز لإيقافها.', 96, 'CRITICAL', 'لا ترسل OTP واتصل بالبنك مباشرة.', 'تركي السفياني', 'FOREIGN_PURCHASE_OTP', 'SA4420000001234567891234', '0551112222', 'طلب OTP لإيقاف عملية مزعومة.', 'frozen', 25000.00, NOW(6) - INTERVAL 4 DAY),
('فاتورة كهرباء متأخرة، ادفع فوراً لتجنب الفصل.', 58, 'MEDIUM', 'تحقق من الفاتورة عبر تطبيق مزود الخدمة.', 'أحمد الحربي', 'UTILITY_BILL_PHISHING', 'SA4420000009012345678901', '0557778888', 'فاتورة مزيفة بضغط زمني.', NULL, 700.00, NOW(6) - INTERVAL 4 DAY - INTERVAL 4 HOUR),
('رسالة من منصة توظيف: ادفع رسوم فتح الملف لاستلام العرض.', 55, 'MEDIUM', 'لا تدفع رسوم توظيف قبل التحقق من جهة العمل.', 'عبدالله المطيري', 'JOB_OFFER_FEE', 'SA4420000001111222233334', '0561112222', 'عرض عمل وهمي برسوم.', NULL, 450.00, NOW(6) - INTERVAL 5 DAY),
('تأكيد عنوانك الوطني مطلوب عبر الرابط التالي.', 45, 'MEDIUM', 'ادخل فقط عبر التطبيق أو الموقع الرسمي.', 'خالد القحطاني', 'ADDRESS_UPDATE_LINK', 'SA4420000002222333344445', '0563334444', 'طلب تحديث بيانات عبر رابط.', NULL, 0.00, NOW(6) - INTERVAL 5 DAY - INTERVAL 6 HOUR),
('وصلتك حوالة من شخص مجهول، اضغط لاستلامها.', 62, 'HIGH', 'تجنب روابط استلام الأموال من جهات مجهولة.', 'سارة الغامدي', 'UNKNOWN_TRANSFER_LINK', 'SA4420000003333444455556', '0565556666', 'رابط حوالة مجهول المصدر.', NULL, 3600.00, NOW(6) - INTERVAL 6 DAY),
('رسالة تذكير بموعد بنكي رسمي بدون روابط أو طلب بيانات.', 15, 'LOW', 'لا توجد مؤشرات خطورة عالية، استمر بالحذر.', 'ريم الشهري', 'LOW_RISK_BANK_REMINDER', 'SA4420000004444555566667', '0567778888', 'رسالة منخفضة الخطورة.', NULL, 0.00, NOW(6) - INTERVAL 7 DAY),
('تنبيه عملية شراء عادية من متجر موثوق بدون رابط خارجي.', 20, 'LOW', 'عملية منخفضة الخطورة.', 'فهد الدوسري', 'LOW_RISK_PURCHASE_ALERT', 'SA4420000005555666677778', '0571112222', 'تنبيه عادي.', NULL, 230.00, NOW(6) - INTERVAL 8 DAY),
('اتصال يدعي أنه من البنك ويطلب تحديث رقم الجوال وكود التحقق.', 93, 'CRITICAL', 'أنهِ المكالمة فوراً وبلّغ البنك.', 'مشعل العتيبي', 'CALL_CENTER_IMPERSONATION', 'SA4420000006666777788889', '0573334444', 'مكالمة انتحال بنك.', 'frozen', 16200.00, NOW(6) - INTERVAL 9 DAY);

INSERT INTO freeze_requests (
    fraud_case_id,
    reason,
    status,
    report_number,
    created_at,
    updated_at
) VALUES
(1, 'critical_otp_case', 'APPROVED', 'FR-9020', NOW(6) - INTERVAL 10 MINUTE, NOW(6) - INTERVAL 8 MINUTE),
(6, 'bank_support_impersonation', 'APPROVED', 'FR-9021', NOW(6) - INTERVAL 6 HOUR, NOW(6) - INTERVAL 5 HOUR),
(13, 'login_otp_case', 'APPROVED', 'FR-9022', NOW(6) - INTERVAL 3 DAY, NOW(6) - INTERVAL 3 DAY),
(15, 'foreign_purchase_otp', 'PENDING', 'FR-9023', NOW(6) - INTERVAL 4 DAY, NOW(6) - INTERVAL 4 DAY),
(22, 'call_center_impersonation', 'APPROVED', 'FR-9024', NOW(6) - INTERVAL 9 DAY, NOW(6) - INTERVAL 9 DAY);

INSERT INTO notifications (
    icon,
    title_ar,
    title_en,
    body_ar,
    body_en,
    is_read,
    type,
    case_id,
    created_at
) VALUES
('🚨', 'حالة حرجة جديدة', 'New Critical Case', 'تم رصد محاولة طلب رمز تحقق — FR-9020', 'OTP fraud attempt detected — FR-9020', FALSE, 'warning', 1, NOW(6) - INTERVAL 2 MINUTE),
('❄️', 'تجميد حساب', 'Account Frozen', 'تم تجميد الحساب SA••4821 بناءً على درجة الخطورة', 'Account SA••4821 frozen based on risk score', FALSE, 'freeze', 1, NOW(6) - INTERVAL 8 MINUTE),
('⚠️', 'رابط دفع مشبوه', 'Suspicious Payment Link', 'تم رصد رابط دفع باسم شركة شحن', 'Suspicious shipping payment link detected', FALSE, 'warning', 2, NOW(6) - INTERVAL 35 MINUTE),
('📊', 'تقرير المخاطر', 'Risk Report', 'تقرير تحليل المخاطر الأسبوعي متاح الآن', 'Weekly risk analysis report is now available', TRUE, 'analysis', NULL, NOW(6) - INTERVAL 1 HOUR),
('✅', 'عملية منخفضة الخطورة', 'Low Risk Event', 'تم تصنيف عملية شراء كمنخفضة الخطورة', 'Purchase alert classified as low risk', TRUE, 'analysis', 21, NOW(6) - INTERVAL 8 DAY);

INSERT INTO bank_calls (
    caller_number,
    caller_name,
    official_call,
    active,
    started_at
) VALUES
('920000001', 'البنك', TRUE, TRUE, NOW(6) - INTERVAL 3 MINUTE),
('0551234567', 'جهة غير معروفة', FALSE, TRUE, NOW(6) - INTERVAL 5 MINUTE),
('8001248888', 'خدمة عملاء البنك', TRUE, FALSE, NOW(6) - INTERVAL 1 DAY),
('0509876543', 'متصل مشبوه', FALSE, TRUE, NOW(6) - INTERVAL 20 MINUTE);

INSERT INTO transaction_analyses (
    fraud_case_id,
    merchant_name,
    amount,
    currency,
    merchant_url,
    transaction_type,
    risk_score,
    risk_level,
    action,
    resolution,
    report_number,
    created_at
) VALUES
(NULL, 'Jarir Bookstore', 249.00, 'SAR', 'https://www.jarir.com', 'purchase', 12, 'LOW', 'allowed', NULL, NULL, NOW(6) - INTERVAL 1 HOUR),
(NULL, 'STC Pay', 120.00, 'SAR', 'https://stcpay.com.sa', 'wallet_topup', 18, 'LOW', 'allowed', NULL, NULL, NOW(6) - INTERVAL 2 HOUR),
(2, 'Fake Shipping Express', 7500.00, 'SAR', 'http://ship-pay-now.example', 'purchase', 82, 'HIGH', 'blocked', 'cancelled', 'TRX-7001', NOW(6) - INTERVAL 40 MINUTE),
(8, 'VAT Refund Portal', 4300.00, 'SAR', 'http://vat-refund-sa.example', 'purchase', 84, 'HIGH', 'blocked', 'cancelled', 'TRX-7002', NOW(6) - INTERVAL 12 HOUR),
(14, 'Flash Deal Store', 1300.00, 'SAR', 'http://flash-discount-90.example', 'purchase', 63, 'HIGH', 'suspended', NULL, 'TRX-7003', NOW(6) - INTERVAL 3 DAY),
(NULL, 'Amazon.sa', 349.50, 'SAR', 'https://www.amazon.sa', 'purchase', 10, 'LOW', 'allowed', NULL, NULL, NOW(6) - INTERVAL 5 HOUR),
(NULL, 'Noon', 89.00, 'SAR', 'https://www.noon.com', 'purchase', 8, 'LOW', 'allowed', NULL, NULL, NOW(6) - INTERVAL 7 HOUR),
(7, 'Guaranteed Investment', 15000.00, 'SAR', 'http://daily-profit.example', 'transfer', 72, 'HIGH', 'blocked', 'cancelled', 'TRX-7004', NOW(6) - INTERVAL 8 HOUR);

INSERT INTO verification_sessions (
    fraud_case_id,
    question_one_answer,
    question_two_answer,
    question_three_answer,
    previous_risk_score,
    added_risk_score,
    final_risk_score,
    risk_level,
    recommended_action,
    created_at
) VALUES
(1, TRUE, TRUE, TRUE, 75, 20, 95, 'CRITICAL', 'freeze_account', NOW(6) - INTERVAL 9 MINUTE),
(2, TRUE, FALSE, TRUE, 62, 20, 82, 'HIGH', 'block_transaction', NOW(6) - INTERVAL 38 MINUTE),
(6, TRUE, TRUE, TRUE, 77, 20, 97, 'CRITICAL', 'freeze_account', NOW(6) - INTERVAL 6 HOUR);