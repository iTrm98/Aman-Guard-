/**
 * خلفية الإضافة (Service Worker)
 * تعمل كوسيط دائم للاتصال بـ
 *  API
 *  الخادم وتمرير الرسائل بين الإطارات
 * (Iframes) لتجاوز قيود الـ CORS.
 */

const AMANGUARD_API = "http://localhost:8000/api";

// فكّ ترميز حمولة الـ JWT (base64url) لاستخراج بيانات المستخدم (الاسم/الدور).
// أفضل جهد فقط — أي فشل يُرجِع null دون تسجيل أي شيء في الـ console.
function decodeUserFromToken(token) {
    try {
        const part = token.split('.')[1];
        // JWT يستخدم base64url؛ نحوّله إلى base64 قياسي قبل فكّ الترميز.
        const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        return { name: payload.name, nameEn: payload.nameEn, role: payload.role };
    } catch (e) {
        return null;
    }
}

// تخزين التوكن + بيانات المستخدم في chrome.storage.local (التوكن لا يُسجَّل أبداً).
// نفضّل بيانات المستخدم المُمرَّرة مباشرةً من الصفحة (userJson) لتفادي مشاكل فكّ الـ JWT،
// وإلا نفكّ حمولة التوكن كحل احتياطي.
function storeToken(token, userJson) {
    let amanguardUser = userJson || null;
    if (!amanguardUser) {
        const decoded = decodeUserFromToken(token);
        amanguardUser = decoded ? JSON.stringify(decoded) : null;
    }
    chrome.storage.local.set({
        amanguard_token: token,
        amanguard_connected: true,
        amanguard_user: amanguardUser
    });
}

// قراءة التوكن المخزَّن (Promise).
function getStoredToken() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["amanguard_token"], (stored) => resolve(stored.amanguard_token || null));
    });
}

// إبلاغ مركز عمليات الأمن (SOC) فوراً عند اكتشاف خطر عالٍ/حرج، وانتظار الرد
// للحصول على رقم البلاغ. يفشل بصمت (يُرجِع null) إذا كان الخادم غير متاح.
async function reportToAmanGuard(riskLevel, reasons, metadata, token) {
    if (!token) return null;
    if (riskLevel !== "Critical" && riskLevel !== "High") return null;

    try {
        const res = await fetch(AMANGUARD_API + "/transactions/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                merchantName: (() => { try { return new URL(metadata.actionUrl).hostname; } catch { return metadata.actionUrl; } })(),
                merchantUrl: metadata.actionUrl,
                amount: 0,
                currency: "SAR",
                transactionType: "ONLINE_PURCHASE",
                source: "EXTENSION",
                riskLevel: riskLevel,
                reasons: reasons
            })
        });
        if (res.ok) {
            // نقرأ النص ثم نحاول تحليله — لا نستدعي .json() مباشرةً (رد غير JSON يُسقط المُحلّل)
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                return data.reportNumber ?? null;
            } catch (e) { return null; }
        }
    } catch (e) { /* fail silently — never block the UI */ }
    return null;
}

// كل عمل فحص الدفع غير المتزامن هنا، في دالة منفصلة عن الـ listener. تستدعي sendResponse
// دائماً (حتى عند الخطأ)، مع شبكة أمان زمنية (8 ثوانٍ) حتى لا تبقى الواجهة عالقة على شاشة
// التحميل إذا تعطّل أو تأخّر محرك الذكاء الاصطناعي. الـ listener يُرجِع true بشكل متزامن.
async function handleAnalyzePayment(request, sendResponse) {
    // حارس يمنع استدعاء sendResponse أكثر من مرة (المؤقّت مقابل الرد الحقيقي).
    let settled = false;
    const settle = (payload) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        sendResponse(payload);
    };

    // شبكة أمان: إن تجاوز التحليل 8 ثوانٍ نُرجِع رداً احتياطياً بدل ترك الواجهة معلّقة.
    const timeout = setTimeout(() => {
        settle({ risk_level: "Low", reasons: [], timedOut: true });
    }, 8000);

    try {
        // استخراج النطاق من رابط النموذج
        let domain = "";
        try { domain = new URL(request.data.actionUrl).hostname; } catch (e) {}

        // قراءة مُعرّف المستخدم من التخزين (لا يُسجَّل التوكن أبداً)
        const stored = await chrome.storage.local.get(["amanguard_user"]);
        let userId = "anonymous";
        try {
            const user = JSON.parse(stored.amanguard_user ?? "{}");
            userId = user.nationalId ?? user.sub ?? user.name ?? "anonymous";
        } catch (e) {}

        // القائمة الموثوقة لكل مستخدم — إن كان النطاق موثوقاً نتجاوز الفحص فوراً
        const trustedKey = "trusted_sites_" + userId;
        const trustedStored = await chrome.storage.local.get([trustedKey]);
        const trustedSites = trustedStored[trustedKey] ?? [];
        if (domain && trustedSites.includes(domain)) {
            settle({ risk_level: "Low", reasons: [], trusted: true, domain });
            return;
        }

        // استدعاء محرك الذكاء الاصطناعي — عند تعذّر الوصول نكمل بالقواعد المحلية فقط.
        const API_URL = "http://127.0.0.1:8000/analyze-url";
        let data = {};
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // إرسال الرابط وحالة اختطاف النطاق (Cross-Domain) للخادم
                body: JSON.stringify({
                    url: request.data.actionUrl,
                    is_cross_domain: request.data.isCrossDomain
                })
            });
            // حارس: نقرأ النص أولاً ثم نحاول تحليله — لا نستدعي .json() مباشرةً لأن جسم
            // خطأ 4xx/5xx (أو أي رد غير JSON حتى مع 200) نص عادي يُسقط المُحلّل.
            if (response.ok) {
                const text = await response.text();
                try { data = JSON.parse(text); } catch (e) { data = {}; }
            }
            // رد غير ناجح → نُبقي data = {} (تقييم بالقواعد المحلية)
        } catch (e) {
            data = {}; // المحرك غير متاح — تقييم بالقواعد المحلية فقط (Rule 4/5/6)
        }

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
                    reasons.push("تحذير: هذا المتجر تم إنشاؤه حديثاً جداً (عمره " + data.domain_age_days + " يوم فقط). المتاجر الموثوقة عادة تكون أقدم من ذلك بكثير.");
                }
            }

            // التقييم الثالث: الخداع البصري للروابط (Typosquatting via AI)
            // اكتشاف المهاجمين الذين يستخدمون روابط شبيهة (مثل arnazon بدلاً من amazon)
            if (data.ai_analysis && data.ai_analysis.is_typosquatting) {
                risk_level = "Critical";
                reasons.push("خداع بصري: " + data.ai_analysis.warning_message);
            }
        }

        // Rule 4: Typosquatting detection (client-side fast check)
        const knownBrands = [
            { brand: "amazon", variants: ["amaz0n", "arnazon", "amazoon", "amazon-secure"] },
            { brand: "noon", variants: ["no0n", "nooon", "noon-sa", "noon-secure"] },
            { brand: "paypal", variants: ["paypa1", "paypai", "paypal-secure", "paypa-l"] },
            { brand: "stcpay", variants: ["stc-pay", "stcpay-secure", "stc-payment"] },
            { brand: "rajhi", variants: ["alrajhi-secure", "rajhi-bank", "alrajhi-verify"] },
            { brand: "snb", variants: ["snb-secure", "snb-verify", "saudination-bank"] },
            { brand: "alinma", variants: ["alinma-secure", "alinma-verify"] },
        ];

        try {
            const urlObj = new URL(request.data.actionUrl);
            const hostname = urlObj.hostname.toLowerCase();

            for (const { brand, variants } of knownBrands) {
                if (variants.some(v => hostname.includes(v))) {
                    risk_level = "Critical";
                    reasons.push("خداع بصري: الموقع يتظاهر بأنه " + brand + " - تحقق من الرابط بعناية!");
                    reasons.push("Typosquatting: This site impersonates " + brand + " - check the URL carefully!");}}

                } catch(e) {}
        // Rule 5: Suspicious TLD detection
        const suspiciousTlds = [".ru", ".tk", ".xyz", ".pw", ".cc", ".top", ".work", ".click", ".link"];
        try {
            const hostname = new URL(request.data.actionUrl).hostname;
            if (suspiciousTlds.some(tld => hostname.endsWith(tld))) {
                if (risk_level !== "Critical") risk_level = "High";
                reasons.push("نطاق مشبوه: امتداد النطاق غير موثوق ويُستخدم كثيراً في مواقع الاحتيال.");
                reasons.push("Suspicious TLD: This domain extension is commonly used in fraud sites.");
            }
        } catch(e) {}

        // Rule 6: HTTP (not HTTPS) on payment page
        try {
            const protocol = new URL(request.data.actionUrl).protocol;
            if (protocol === "http:" && !request.data.actionUrl.includes("localhost")) {
                if (risk_level === "Low") risk_level = "High";
                reasons.push("اتصال غير مشفر: هذا الموقع لا يستخدم HTTPS — بياناتك غير محمية!");
                reasons.push("Unencrypted connection: This site uses HTTP, not HTTPS — your data is exposed!");
            }
        } catch(e) {}

        // حفظ آخر فحص محلياً ليعرضه الـ popup (لا يحتوي أي بيانات حسّاسة)
        chrome.storage.local.set({
            amanguard_last_scan: JSON.stringify({
                risk_level,
                domain: (() => { try { return new URL(request.data.actionUrl).hostname; } catch { return "—"; } })(),
                timestamp: Date.now()
            })
        });

        // إبلاغ مركز عمليات الأمن فوراً عند الخطر والحصول على رقم البلاغ
        const token = await getStoredToken();
        const reportNumber = await reportToAmanGuard(risk_level, reasons, request.data, token);

        // إرسال النتيجة النهائية للـ Content Script ليعرض الواجهة المناسبة
        settle({ risk_level, reasons, reportNumber });

    } catch (err) {
        // لا نترك sendResponse دون استدعاء أبداً
        console.error("[AmanGuard] API Error:", err);
        settle({ error: true, details: err.message });
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // 0. استلام توكن الجلسة المُمرَّر من الصفحة عبر الـ content script
    // (page → content → background). الـ background وحده يملك صلاحية chrome.storage.
    // نفكّ حمولة الـ JWT لاستخراج بيانات المستخدم. التوكن لا يُسجَّل أبداً.
    if (request.action === "STORE_TOKEN_FROM_PAGE") {
        storeToken(request.token, request.user);
        sendResponse({ success: true });
        return true;
    }

    // 1. معالجة طلب الفحص من الـ Content Script.
    // كل العمل غير المتزامن (fetch + storage + إبلاغ SOC) يجري داخل handleAnalyzePayment؛
    // هنا نُرجِع true بشكل متزامن فوراً حتى لا يُغلق Chrome قناة sendResponse قبل وصول الرد.
    if (request.action === "analyze_payment") {
        handleAnalyzePayment(request, sendResponse);
        return true; // ← يجب أن يبقى متزامناً (ليس داخل أي callback/async)
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
