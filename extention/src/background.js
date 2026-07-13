/**
 * خلفية الإضافة (Service Worker)
 * تعمل كوسيط دائم للاتصال بـ 
 *  API
 *  الخادم وتمرير الرسائل بين الإطارات 
 * (Iframes) لتجاوز قيود الـ CORS.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    // 1. معالجة طلب الفحص من الـ Content Script وإرساله للـ AI Engine
    if (request.action === "analyze_payment") {
        const API_URL = "http://127.0.0.1:8000/analyze-url";

        fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // إرسال الرابط وحالة اختطاف النطاق (Cross-Domain) للخادم
            body: JSON.stringify({ 
                url: request.data.actionUrl,
                is_cross_domain: request.data.isCrossDomain 
            }) 
        })
        .then(response => response.json())
        .then(data => {
            let risk_level = "Low";
            let reasons = [];

            // تقييم المخاطر إذا لم يكن الموقع ضمن القائمة البيضاء
            if (!data.is_whitelisted) {
                
                // التقييم الأول: اختطاف النماذج (Form Hijacking)
                // إذا كان النموذج يرسل بيانات لموقع خارجي غير موثوق، فهو خطر حرج
                if (data.is_cross_domain) {
                    risk_level = "Critical";
                    reasons.push("تحذير أمني خطير: هذا النموذج مخترق! بيانات بطاقتك تُرسل سراً إلى موقع خارجي غير معروف (" + data.domain + ").");
                }
                
                // التقييم الثاني: عمر النطاق (Domain Age)
                // المتاجر الجديدة جداً أو مجهولة المصدر تعتبر عالية الخطورة
                if (data.is_suspicious_age && !data.is_cross_domain) {
                    risk_level = "High";
                    if (data.domain_age_days === -1) {
                        reasons.push("تحذير: لم نتمكن من التحقق من تاريخ إنشاء هذا المتجر، مما يجعله مجهول المصدر وعالي الخطورة.");
                    } else {
                        reasons.push(`تحذير: هذا المتجر تم إنشاؤه حديثاً جداً (عمره ${data.domain_age_days} يوم فقط). المتاجر الموثوقة عادة تكون أقدم من ذلك بكثير.`);
                    }
                }
                
                // التقييم الثالث: الخداع البصري للروابط (Typosquatting via AI)
                // اكتشاف المهاجمين الذين يستخدمون روابط شبيهة (مثل arnazon بدلاً من amazon)
                if (data.ai_analysis && data.ai_analysis.is_typosquatting) {
                    risk_level = "Critical"; 
                    reasons.push(`خداع بصري: ${data.ai_analysis.warning_message}`);
                }
            }

            // إرسال النتيجة النهائية للـ Content Script ليعرض الواجهة المناسبة
            sendResponse({ risk_level: risk_level, reasons: reasons });
        })
        .catch(error => {
            console.error("[AmanGuard] API Error:", error);
            sendResponse({ error: true, details: error.message });
        });

        return true; // إبقاء قناة الاتصال مفتوحة لأن عملية Fetch هي عمل غير متزامن (Asynchronous)
    }

    // ==========================================
    // 2. وسيط الرسائل بين الإطارات (Iframe Message Broker)
    // ==========================================
    // لا يمكن لـ Iframe التواصل مباشرة مع Top Frame في نطاقات مختلفة بسبب سياسات CORS
    // لذلك نستخدم الخلفية (Background) كجهاز توجيه (Router) يمرر الأوامر بينها
    
    // عندما يطلب إطار فرعي إظهار الشاشة، نأمر الإطار الرئيسي بذلك لضمان تغطية الشاشة بالكامل
    if (request.action === "trigger_ui_in_top_frame") {
        chrome.tabs.sendMessage(sender.tab.id, {
            action: "show_amanguard_ui",
            data: request.data
        });
    }

    // عندما يوافق المستخدم أو يلغي، نرسل الأمر لجميع الإطارات (والإطار الذي يملك النموذج هو من سينفذ)
    if (request.action === "resume_all_frames" || request.action === "cancel_all_frames") {
        chrome.tabs.sendMessage(sender.tab.id, { action: request.action });
    }
});