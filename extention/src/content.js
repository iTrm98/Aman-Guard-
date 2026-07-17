// ==========================================
// 1. المتغيرات المرجعية وإدارة الحالة (State Management)
// ==========================================
// نحتفظ بالحدث والعنصر الأصليين هنا لكي نتمكن من استئناف عملية الدفع لاحقاً إذا وافق المستخدم
let interceptedEvent = null; 
let interceptedElement = null;  

// علامة (Flag) لتجاوز الفحص في المرة القادمة (تُستخدم بعد موافقة المستخدم)
let isAmanGuardApproved = false; 

// قفل (Mutex/Lock) لمنع تداخل الأحداث (Race Condition). يمنع الإضافة من إرسال أكثر من طلب للـ API في نفس اللحظة (مثلاً إذا تم إطلاق حدث click و submit معاً)
let isProcessingTransaction = false;

// هل الحماية مفعّلة؟ يتحكم بها المستخدم من التطبيق (تفعيل/تعطيل)، وتُخزَّن الحالة في
// chrome.storage.local لتبقى عبر تحديث الصفحة. عند التعطيل تمرّ المدفوعات دون اعتراض.
let isExtensionEnabled = true;

// عند تحميل الـ content script نقرأ الحالة المحفوظة (الافتراضي: مفعّلة).
chrome.storage.local.get(['amanguard_enabled'], (stored) => {
    if (stored.amanguard_enabled === false) {
        isExtensionEnabled = false;
    }
});

// Safe wrapper for chrome.runtime calls — handles "Extension context invalidated" gracefully
function safeSendMessage(message, callback) {
  try {
    if (!chrome?.runtime?.id) return; // extension context is gone
    chrome.runtime.sendMessage(message, callback);
  } catch(err) {
    // Extension was reloaded — fail silently, never crash the page
    if (!err.message?.includes('Extension context invalidated')) {
      console.error('[AmanGuard]', err);
    }
  }
}

// ==========================================
// جسر الرسائل مع تطبيق أمان‌جارد الويب (postMessage bridge)
// ==========================================
// لا نستخدم معرّف إضافة ثابتاً: التطبيق يبثّ رسالة للصفحة، وهذا الـ content script
// (الذي يعمل داخل الصفحة) يلتقطها ويمرّرها للـ background. نقبل رسائل نفس الأصل فقط.
window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.source !== "AMANGUARD_WEB") return;

    // ردّ الحضور: يخبر التطبيق أن الإضافة مثبتة (لواجهة ExtensionStatus)
    if (event.data.action === "PING_EXTENSION") {
        window.postMessage({ source: "AMANGUARD_EXTENSION", action: "PONG" }, "*");
    }

    // تفعيل/تعطيل الحماية من التطبيق — تُحفظ الحالة لتبقى عبر تحديث الصفحة
    if (event.data.action === "ENABLE_EXTENSION") {
        isExtensionEnabled = true;
        chrome.storage.local.set({ amanguard_enabled: true });
    }
    if (event.data.action === "DISABLE_EXTENSION") {
        isExtensionEnabled = false;
        chrome.storage.local.set({ amanguard_enabled: false });
    }

    // استلام توكن الجلسة (وبيانات المستخدم) وتمريرها للـ background (الذي يملك صلاحية chrome.storage)
    if (event.data.action === "SET_AMANGUARD_TOKEN") {
        safeSendMessage({
            action: "STORE_TOKEN_FROM_PAGE",
            token: event.data.token,
            user: event.data.user
        });
    }
});

// ==========================================
// 2. محرك التحليل السياقي للنماذج (Contextual Smart Heuristics)
// ==========================================
/**
 * هذه الدالة تفحص أي حاوية (Form أو Div) وتقرر ما إذا كانت تحتوي على عملية دفع.
 * تعمل بمبدأ المحركات المتعددة لاكتشاف البطاقات المباشرة أو الـ Tokens المخفية.
 * @param {HTMLElement} container - الحاوية المراد فحصها
 * @returns {boolean} - True إذا كانت الحاوية للدفع، False إذا كانت آمنة
 */
function isPaymentContext(container) {
    if (!container) return false;

    // 1. القاموس: كلمات برمجية (IDs/Names) وكلمات واجهة المستخدم (Placeholders/Labels)
    const strictCodeKeywords = ['card_num', 'card_number', 'cc-number', 'ccnum', 'cvv', 'cvc', 'exp', 'expiry', 'creditcard', 'card'];
    const uiRegex = /(رقم (ال)?بطاقة|بطاقة (مدى|ائتمانية|الصراف)|رمز الأمان|تاريخ الانتهاء|card number|security code|cvv|expiration)/i;

    // 2. فحص الحقول (Inputs)
    const inputs = container.querySelectorAll('input, select');
    for (let input of inputs) {
        const type = (input.type || "").toLowerCase();
        
        // استثناء حقول الإدخال العادية التي لا علاقة لها بالدفع لتسريع الفحص وتقليل الإنذارات الخاطئة
        if (['file', 'radio', 'checkbox', 'email', 'password'].includes(type)) continue; 

        const name = (input.name || "").toLowerCase();
        const id = (input.id || "").toLowerCase();
        const autocomplete = (input.getAttribute('autocomplete') || "").toLowerCase(); 
        const placeholder = (input.placeholder || "").toLowerCase();

        // فحص مباشر: هل الحقل مخصص للبطاقة؟
        const isExactCc = (name === 'cc' || id === 'cc');
        const matchCode = strictCodeKeywords.some(kw => name.includes(kw) || id.includes(kw) || autocomplete.includes(kw));
        
        if (matchCode || isExactCc || uiRegex.test(placeholder)) return true; 

        // 3. فحص المدفوعات المحفوظة (Tokenized Payments) مثل أمازون
        // المتاجر الكبرى تستخدم حقول مخفية (Hidden) أو أزرار Submit تحمل أسماء معينة بدلاً من أرقام البطاقات
        if (type === 'hidden' || type === 'submit') {
            const tokenKeywords = ['paymentinstrumentid', 'paymentmethodid', 'purchaseid', 'placeorder', 'placeyourorder'];
            if (tokenKeywords.some(kw => name.includes(kw) || id.includes(kw))) return true; 
        }
    }

    // 4. فحص نصوص العناوين (Labels) تحسباً للهجمات التي تخفي الـ Name وتعتمد على الـ Label
    const labels = container.querySelectorAll('label');
    for (let label of labels) {
        const labelText = (label.innerText || label.textContent || "").toLowerCase();
        if (uiRegex.test(labelText)) return true; 
    }

    // 5. تحليل بنية النموذج (Form Blueprint)
    // إذا كان مسار الإرسال (Action) أو معرف النموذج يدل على إتمام شراء
    if (container.tagName && container.tagName.toLowerCase() === 'form') {
        const formAction = (container.action || "").toLowerCase();
        const formId = (container.id || "").toLowerCase();
        const checkoutIndicators = ['place-order', 'spc-form', 'checkout-form', 'submit-order'];
        if (checkoutIndicators.some(kw => formAction.includes(kw) || formId.includes(kw))) return true;
    }

    return false;
}

// ==========================================
// 3. الاعتراض المزدوج (Event Interceptors)
// ==========================================

// أ) اعتراض النماذج التقليدية (Standard HTML Forms)
document.addEventListener('submit', function(e) {
    if (isAmanGuardApproved) { isAmanGuardApproved = false; return; }

    const form = e.target;
    const methodAttr = form.getAttribute('method');
    
    // القاعدة الذهبية: إذا كان المطور قد حدد طريقة الإرسال كـ GET صراحةً، ننسحب. (عمليات الدفع لا تستخدم GET)
    if (methodAttr && methodAttr.toLowerCase() === 'get') return; 
    
    if (isPaymentContext(form)) {
        freezeTransaction(e, form, 'submit');
    }
}, true); // نستخدم true (Capture Phase) لنكون أول من يلتقط الحدث قبل سكربتات الموقع

// ب) اعتراض النوافذ المنبثقة وأزرار الـ SPA (مثل React / Angular)
document.addEventListener('click', function(e) {
    if (isAmanGuardApproved) { isAmanGuardApproved = false; return; }

    // البحث عن العنصر القابل للنقر (قد ينقر المستخدم على أيقونة داخل الزر، فنبحث عن الزر الأب)
    const targetElement = e.target.closest('button, a, [role="button"], input, .a-button, [data-action]');
    if (!targetElement) return;

    // القاعدة الذهبية للـ GET: نتحقق من النموذج المرتبط بالزر
    const associatedForm = targetElement.form || targetElement.closest('form');
    if (associatedForm) {
        const methodAttr = associatedForm.getAttribute('method');
        if (methodAttr && methodAttr.toLowerCase() === 'get') return; 
    }

    // التقاط النص المدمج (نص العنصر المنقور + نص الحاوية الأبوية) للتأكد من أنه زر دفع
    const clickText = (e.target.innerText || e.target.textContent || e.target.value || e.target.getAttribute('aria-label') || "").toLowerCase();
    const parentText = targetElement ? (targetElement.innerText || targetElement.textContent || targetElement.value || targetElement.getAttribute('aria-label') || "").toLowerCase() : "";

    const combinedText = clickText + " " + parentText;
    const actionRegex = /(add|save|submit|continue|pay|place|confirm|إضافة|حفظ|متابعة|دفع|تأكيد|طلب)/i;
    
    if (!actionRegex.test(combinedText)) return; // ليس زر دفع، دعه يمر

    // تحديد النطاق (Context) للبحث داخله عن بيانات البطاقة
    const container = targetElement.closest('form, [role="presentation"], [role="dialog"], .modal') || document.body;

    if (isPaymentContext(container)) {
        freezeTransaction(e, targetElement, 'click');
    }
}, true);

/**
 * توقف عملية الدفع تماماً وتجمع البيانات لإرسالها للتحليل
 */
function freezeTransaction(event, element, type) {
    if (!isExtensionEnabled) return; // الحماية معطّلة — دع العملية تمرّ دون اعتراض
    // إيقاف الحدث الأصلي ومنع انتشاره في المتصفح
    event.preventDefault();
    event.stopImmediatePropagation(); 
    
    // قفل المعالجة لمنع الـ Race Conditions
    if (isProcessingTransaction) return; 
    isProcessingTransaction = true;
    
    // حفظ البيانات للاستئناف لاحقاً
    interceptedEvent = type;
    interceptedElement = element;
    
    // استخراج رابط الوجهة (Action URL) بشكل ذكي
    let actionUrl = window.location.href;
    const associatedForm = (element.tagName === 'FORM') ? element : (element.form || element.closest('form'));
    
    if (associatedForm && associatedForm.action) {
        actionUrl = associatedForm.action;
    }
    
    // اكتشاف اختطاف النماذج (Cross-Domain Hijacking)
    let isCrossDomain = false;
    try {
        const formOrigin = new URL(actionUrl).origin;
        const pageOrigin = window.location.origin;
        // نتجاهل الروابط الوهمية مثل about:srcdoc أو file:// من اعتبارها اختطاف خارجي
        if (formOrigin !== "null" && pageOrigin !== "null" && !actionUrl.startsWith('about:')) {
            if (formOrigin !== pageOrigin) isCrossDomain = true;
        }
    } catch(e) {}

    const metadata = {
        currentUrl: window.location.href,
        actionUrl: actionUrl,
        isCrossDomain: isCrossDomain,
        // التحقق مما إذا كان الموقع يعتمد على جافاسكربت مضمن (Inline JS)
        hasInlineScript: !!element.getAttribute('onsubmit') || !!element.getAttribute('onclick') || !!(associatedForm && associatedForm.getAttribute('onsubmit'))
    };

    // إذا كنا داخل Iframe، نطلب من الإطار الرئيسي (Top Frame) إظهار الواجهة
    if (window !== window.top) {
        safeSendMessage({ action: "trigger_ui_in_top_frame", data: metadata });
    } else {
        triggerAmanGuardFlow(metadata);
    }
}

// ==========================================
// 4. الاستماع لرسائل الـ Background (Iframe Communication)
// ==========================================
try {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // 1. الإطار الرئيسي يتلقى أمر إظهار واجهة التحذير
        if (request.action === "show_amanguard_ui" && window === window.top) {
            triggerAmanGuardFlow(request.data);
        }
        // 2. جميع الإطارات تتلقى أمر الاستئناف (والإطار المعني فقط هو من سينفذ)
        if (request.action === "resume_all_frames") {
            isProcessingTransaction = false; // فتح القفل
            safeResumeTransactionLocal();
        }
        // 3. جميع الإطارات تتلقى أمر الإلغاء لتنظيف الذاكرة
        if (request.action === "cancel_all_frames") {
            isProcessingTransaction = false; // فتح القفل
            interceptedElement = null;
            interceptedEvent = null;
        }
    });
} catch(err) {
    // Extension context invalidated — ignore
}

// ==========================================
// 5. بناء الواجهة المعزولة (Shadow DOM UI)
// ==========================================
let shadowRoot = null;

// AmanGuard brand system for the overlay — MUST stay identical to extention/src/overlay.css
// (that file is the canonical copy). Same colors / Tajawal font / card-button-badge-gauge styling
// as the web app (src/index.css).
const AMANGUARD_OVERLAY_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

/* AmanGuard payment-protection overlay — mirrors the web app brand system */
#amanguard-payment-overlay {
  position: fixed;
  inset: 0;
  width: 100vw; height: 100vh;
  background: rgba(13, 27, 42, 0.88);
  backdrop-filter: blur(8px);
  z-index: 2147483647;
  display: flex;
  justify-content: center;
  align-items: center;
  direction: rtl;
  font-family: 'Tajawal', 'Segoe UI', Arial, sans-serif;
}
#amanguard-payment-overlay *,
#amanguard-payment-overlay *::before,
#amanguard-payment-overlay *::after { box-sizing: border-box; }

.amanguard-modal {
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 20px;
  border-top: 3px solid #9784e2;
  box-shadow: 0 24px 64px rgba(13, 27, 42, 0.3);
}

/* Header — dark navy gradient like the AmanGuard sidebar */
.ag-modal-header {
  background: linear-gradient(135deg, #0d1b2a, #101e2e);
  border-bottom: 3px solid #9784e2;
  padding: 20px 24px;
  text-align: center;
}
.ag-brand { font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 0.02em; }
.ag-brand span { color: #9784e2; }
.ag-subtitle { font-size: 11px; color: #4a6070; margin-top: 4px; }

.ag-modal-body { padding: 22px 24px; }

/* Connection line — live dot like the web app */
.ag-connection {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-size: 11px; color: #8090a0; margin-bottom: 16px;
}
.ag-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: agPulseSoft 1.6s ease-in-out infinite; }
.ag-live-dot.disconnected { background: #f59e0b; animation: none; }

/* Risk icon */
.ag-icon { font-size: 46px; text-align: center; margin-bottom: 10px; line-height: 1; }
.ag-icon.pulse { animation: agPulse 1.4s ease-in-out infinite; }
.ag-icon.spin  { animation: agSpin 1.1s linear infinite; display: inline-block; width: 100%; }

.ag-title { font-size: 20px; font-weight: 900; color: #0d1b2a; text-align: center; margin-bottom: 4px; }
.ag-title-en { font-size: 13px; color: #8090a0; text-align: center; margin-bottom: 14px; }

/* Risk badge — matches the web app */
.ag-risk-wrap { text-align: center; }
.ag-risk-badge {
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  padding: 4px 12px; border-radius: 8px; font-size: 13px; font-weight: 700; margin-bottom: 14px;
}
.ag-risk-critical { background: #fdf0ef; color: #c0392b; border: 1px solid #f5c6c2; }
.ag-risk-high     { background: #fef5ec; color: #d35400; border: 1px solid #fad7b0; }
.ag-risk-low      { background: #eaf7ee; color: #1a7a4a; border: 1px solid #b2dfc0; }

/* Risk gauge */
.ag-gauge-container { display: flex; justify-content: center; margin: 4px 0 14px; }

.ag-message { color: #5a6a7a; font-size: 14px; text-align: center; margin-bottom: 4px; }
.ag-message-en { color: #8090a0; font-size: 12px; text-align: center; margin-bottom: 16px; }

/* Findings — red-tinted cards like RiskReport.jsx */
.ag-findings { margin-bottom: 14px; }
.ag-finding {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 12px; border-radius: 10px;
  background: rgba(192, 57, 43, 0.06);
  border: 1px solid rgba(192, 57, 43, 0.15);
  margin-bottom: 8px;
}
.ag-finding:last-child { margin-bottom: 0; }
.ag-finding-x { color: #c0392b; flex-shrink: 0; font-size: 13px; line-height: 1.5; }
.ag-finding-text { font-size: 13px; line-height: 1.5; color: #5a6a7a; }

/* Recommendation */
.ag-recommendation {
  background: rgba(26, 90, 154, 0.07);
  border-inline-start: 3px solid #1a5a9a;
  border-radius: 0 10px 10px 0;
  padding: 10px 14px;
  margin-bottom: 14px;
}
.ag-recommendation-title { font-size: 12px; font-weight: 700; color: #1a5a9a; margin-bottom: 3px; }
.ag-recommendation-text { font-size: 12px; line-height: 1.6; color: #5a6a7a; }

/* Report number */
.ag-report-num { font-size: 11px; color: #8090a0; text-align: center; margin-bottom: 14px; }

/* Buttons — mirror the web app button classes */
.ag-buttons { display: flex; flex-direction: column; gap: 10px; }
.ag-btn-primary {
  background: #9784e2; color: #fff; border: none; border-radius: 10px;
  padding: 12px 20px; font-weight: 700; font-size: 14px; cursor: pointer;
  width: 100%; font-family: inherit; transition: background 0.15s;
}
.ag-btn-primary:hover { background: #605C94; }
.ag-btn-danger {
  background: #c0392b; color: #fff; border: none; border-radius: 10px;
  padding: 12px 20px; font-weight: 700; font-size: 14px; cursor: pointer;
  width: 100%; font-family: inherit; transition: background 0.15s;
}
.ag-btn-danger:hover { background: #a93226; }
.ag-btn-ghost {
  background: transparent; color: #5a6a7a; border: 1.5px solid #e1e5eb;
  border-radius: 10px; padding: 11px 20px; font-weight: 600; font-size: 13px;
  cursor: pointer; width: 100%; font-family: inherit; transition: all 0.15s;
}
.ag-btn-ghost:hover { background: #f5f7fa; }
.ag-link {
  background: none; border: none; color: #8090a0; font-size: 12px;
  cursor: pointer; text-decoration: underline; font-family: inherit; padding: 4px;
}
.ag-link:hover { color: #5a6a7a; }

/* Footer — like the web app topbar */
.ag-modal-footer {
  background: #f8f9fb; border-top: 1px solid #e1e5eb;
  padding: 10px 24px; display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; color: #8090a0;
}
.ag-user-info { display: flex; align-items: center; gap: 7px; }
.ag-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  background: linear-gradient(135deg, #9784e2, #605C94);
  color: #fff; font-weight: 700; font-size: 11px;
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
}

/* Scrollbar — matches the web app */
.amanguard-modal::-webkit-scrollbar { width: 5px; }
.amanguard-modal::-webkit-scrollbar-thumb { background: #9784e255; border-radius: 99px; }
.amanguard-modal::-webkit-scrollbar-thumb:hover { background: #9784e2; }

@keyframes agPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.12); opacity: 0.85; } }
@keyframes agPulseSoft { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
@keyframes agSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

function triggerAmanGuardFlow(metadata) {
    injectShadowUI(); // عرض الشاشة كحالة انتظار أولاً
    safeSendMessage({ action: "analyze_payment", data: metadata }, (response) => {
        updateShadowUI(response); // تحديث الشاشة بالنتائج
    });
}

function injectShadowUI() {
  try {
    if (document.getElementById('amanguard-host')) return;

    // نستخدم Shadow DOM مغلق (Closed) لمنع سكربتات الموقع (والمخترقين) من إخفاء أو العبث بواجهة التحذير
    const host = document.createElement('div');
    host.id = 'amanguard-host';
    host.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 2147483647; pointer-events: auto;';

    shadowRoot = host.attachShadow({ mode: 'closed' });

    // نضمّن الـ CSS مباشرةً داخل <style> بدل تحميله عبر <link> + chrome.runtime.getURL —
    // تحميل الملف كثيراً ما يفشل على الصفحات التي ليست صفحة الإضافة نفسها (حتى مع
    // web_accessible_resources)، فالتضمين يزيل هذا الاعتماد ويضمن ظهور الأنماط دائماً.
    const style = document.createElement('style');
    style.textContent = AMANGUARD_OVERLAY_CSS;

    const wrapper = document.createElement('div');
    wrapper.id = 'amanguard-payment-overlay';
    
    // القالب المبدئي (حالة الانتظار/التحليل) — بهوية أمان‌جارد الكاملة
    wrapper.innerHTML = `
  <div class="amanguard-modal" id="ag-modal">

    <!-- Header with AmanGuard branding -->
    <div class="ag-modal-header">
      <div class="ag-brand">Aman<span>Guard</span></div>
      <div class="ag-subtitle">Financial Fraud Intelligence — حماية المدفوعات</div>
    </div>

    <div class="ag-modal-body">
      <!-- Connection status -->
      <div class="ag-connection">
        <span class="ag-live-dot" id="ag-conn-dot"></span>
        <span id="ag-conn-text">جارٍ التحقق من الاتصال...</span>
      </div>

      <!-- Risk icon (spinning shield while analyzing) -->
      <div class="ag-icon spin" id="ag-loader">🛡️</div>

      <!-- Title -->
      <div class="ag-title" id="ag-title">اعتراض أمني آلي</div>
      <div class="ag-title-en" id="ag-title-en">AI Security Interception</div>

      <!-- Risk badge -->
      <div class="ag-risk-wrap">
        <span class="ag-risk-badge" id="ag-risk-badge" style="display:none;"></span>
      </div>

      <!-- Risk gauge (SVG, identical geometry to RiskReport.jsx: r=44) -->
      <div class="ag-gauge-container" id="ag-gauge-container" style="display:none;">
        <svg width="112" height="72" viewBox="0 0 112 72" fill="none">
          <path d="M 12 58 A 44 44 0 0 1 100 58" stroke="#e1e5eb" stroke-width="8" stroke-linecap="round" fill="none"/>
          <path d="M 12 58 A 44 44 0 0 1 100 58" stroke="#9784e2" stroke-width="8" stroke-linecap="round" fill="none"
            id="ag-gauge-fill"
            stroke-dasharray="138.23"
            stroke-dashoffset="138.23"
            style="transition: stroke-dashoffset 0.8s ease, stroke 0.4s ease"/>
          <text x="56" y="54" text-anchor="middle" font-size="22" font-weight="900" fill="#0d1b2a" id="ag-score-text">0</text>
          <text x="56" y="66" text-anchor="middle" font-size="9" fill="#8090a0">/ 100</text>
        </svg>
      </div>

      <!-- Message -->
      <p class="ag-message" id="ag-message">يقوم الذكاء الاصطناعي بتحليل أمان المعاملة...</p>
      <p class="ag-message-en" id="ag-message-en">AI is analyzing transaction security...</p>

      <!-- Findings -->
      <div class="ag-findings" id="ag-findings" style="display:none;"></div>

      <!-- Recommendation -->
      <div class="ag-recommendation" id="ag-recommendation" style="display:none;"></div>

      <!-- Report number -->
      <div class="ag-report-num" id="ag-report-num" style="display:none;"></div>

      <!-- Buttons -->
      <div class="ag-buttons" id="ag-buttons">
        <button class="ag-btn-danger" id="ag-cancel-btn">🛑 إلغاء العملية | Cancel</button>
        <button class="ag-btn-ghost" id="ag-confirm-btn" style="display:none;">المتابعة على مسؤوليتي | Proceed anyway</button>
        <button class="ag-link" id="ag-details-btn" style="display:none;">التحليل الكامل | Full Analysis</button>
        <button class="ag-link" id="ag-report-btn" style="display:none;">الإبلاغ عن هذا الموقع | Report this site</button>
      </div>
    </div>

    <!-- Footer -->
    <div class="ag-modal-footer">
      <div class="ag-user-info">
        <span class="ag-avatar" id="ag-user-avatar">؟</span>
        <span id="ag-user-name">غير متصل</span>
      </div>
      <div class="ag-footer-text">AmanGuard v1.0 • Amad Hackathon 2026</div>
    </div>
  </div>
    `;

    shadowRoot.appendChild(style);
    shadowRoot.appendChild(wrapper);
    document.body.appendChild(host);

    // Listen for storage changes in real time — the moment amanguard_connected
    // is set from ANY tab, the overlay reflects it without waiting on a retry.
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        if (!shadowRoot) return;

        if (changes.amanguard_connected || changes.amanguard_user) {
            updateConnectionStatus(0);
        }
    });

    // برمجة زر الإلغاء
    shadowRoot.getElementById('ag-cancel-btn').addEventListener('click', () => {
        document.getElementById('amanguard-host').remove();
        isProcessingTransaction = false; 
        safeSendMessage({ action: "cancel_all_frames" });
        alert("تم إلغاء عملية الدفع لحمايتك. \nTransaction cancelled for your safety.");
    });
  } catch (err) {
    console.error('[AmanGuard] injectShadowUI failed:', err);
  }
}

function updateShadowUI(response) {
    if (!shadowRoot) return;

    const modal = shadowRoot.getElementById('ag-modal');
    const loader = shadowRoot.getElementById('ag-loader');
    const title = shadowRoot.getElementById('ag-title');
    const titleEn = shadowRoot.getElementById('ag-title-en');
    const message = shadowRoot.getElementById('ag-message');
    const messageEn = shadowRoot.getElementById('ag-message-en');
    const badge = shadowRoot.getElementById('ag-risk-badge');
    const findings = shadowRoot.getElementById('ag-findings');
    const recommendation = shadowRoot.getElementById('ag-recommendation');
    const reportNum = shadowRoot.getElementById('ag-report-num');
    const cancelBtn = shadowRoot.getElementById('ag-cancel-btn');
    const confirmBtn = shadowRoot.getElementById('ag-confirm-btn');
    const detailsBtn = shadowRoot.getElementById('ag-details-btn');
    const reportBtn = shadowRoot.getElementById('ag-report-btn');
    const gaugeContainer = shadowRoot.getElementById('ag-gauge-container');
    const gaugeFill = shadowRoot.getElementById('ag-gauge-fill');
    const scoreText = shadowRoot.getElementById('ag-score-text');

    // Stop the loading spinner.
    loader.classList.remove('spin');

    // Risk level → score/color (gauge identical to RiskReport.jsx: ≥80 red, ≥50 orange, else green-safe)
    const scoreMap = { "Critical": 95, "High": 82, "Low": 12 };
    const level = response && response.risk_level;
    const score = level ? (scoreMap[level] ?? 50) : 0;
    const color = score >= 80 ? "#c0392b" : score >= 50 ? "#d35400" : "#1a7a4a";

    // Gauge (r=44 → circumference = π·44)
    gaugeContainer.style.display = "flex";
    const C = Math.PI * 44;
    gaugeFill.style.strokeDasharray = C;
    gaugeFill.style.strokeDashoffset = C * (1 - score / 100);
    gaugeFill.style.stroke = color;
    scoreText.textContent = score;
    scoreText.style.fill = color;

    // Render findings as red-tinted cards (textContent — never innerHTML — for the reason text).
    function renderFindings(list) {
        findings.style.display = "block";
        findings.innerHTML = "";
        (list || []).forEach((reason) => {
            const item = document.createElement('div');
            item.className = 'ag-finding';
            const x = document.createElement('span');
            x.className = 'ag-finding-x';
            x.textContent = '❌';
            const txt = document.createElement('span');
            txt.className = 'ag-finding-text';
            txt.textContent = reason;
            item.appendChild(x);
            item.appendChild(txt);
            findings.appendChild(item);
        });
    }

    if (!response || response.error) {
        modal.style.borderTopColor = "#d35400";
        loader.textContent = "⚠️";
        title.textContent = "تعذّر الفحص";
        titleEn.textContent = "Scan Failed";
        message.textContent = "تعذر الاتصال بخادم AmanGuard.";
        messageEn.textContent = "Could not connect to the AmanGuard server.";
        gaugeContainer.style.display = "none";
        cancelBtn.className = "ag-btn-danger";
        confirmBtn.style.display = "block";

    } else if (level === "High" || level === "Critical") {
        modal.style.borderTopColor = "#c0392b";
        loader.textContent = level === "Critical" ? "🚫" : "⚠️";
        if (level === "Critical") loader.classList.add('pulse');
        title.textContent = level === "Critical" ? "بوابة دفع مخترقة!" : "موقع مشبوه!";
        titleEn.textContent = level === "Critical" ? "Compromised Payment Gateway!" : "Suspicious Site!";
        title.style.color = color;
        message.textContent = "تم إيقاف العملية لحماية بياناتك المالية.";
        messageEn.textContent = "Transaction stopped to protect your financial data.";

        badge.className = "ag-risk-badge " + (level === "Critical" ? "ag-risk-critical" : "ag-risk-high");
        badge.textContent = level === "Critical" ? "خطر حرج | Critical" : "مشبوه | High";
        badge.style.display = "inline-flex";

        renderFindings(response.reasons);

        recommendation.style.display = "block";
        recommendation.innerHTML =
            '<div class="ag-recommendation-title">توصية النظام | Recommendation</div>' +
            '<div class="ag-recommendation-text">لا تُكمل هذه العملية ولا تُدخل بيانات بطاقتك. Do not proceed or enter your card details.</div>';

        cancelBtn.className = "ag-btn-danger";
        cancelBtn.textContent = "🛑 إلغاء العملية | Cancel Transaction";
        confirmBtn.className = "ag-btn-ghost";
        confirmBtn.style.display = "block";
        detailsBtn.style.display = "block";
        reportBtn.style.display = "block";

    } else {
        modal.style.borderTopColor = "#1a7a4a";
        loader.textContent = "✅";
        title.textContent = "عملية آمنة";
        titleEn.textContent = "Safe Transaction";
        title.style.color = "#1a7a4a";
        message.textContent = "تم التحقق من بوابة الدفع. سيتم المتابعة تلقائياً...";
        messageEn.textContent = "Payment gateway verified. Proceeding automatically...";

        badge.className = "ag-risk-badge ag-risk-low";
        badge.textContent = "آمن | Safe";
        badge.style.display = "inline-flex";

        // Cancel becomes the gold primary button on the safe screen.
        cancelBtn.className = "ag-btn-primary";
        cancelBtn.textContent = "🛑 إلغاء العملية | Cancel";

        // 10-second countdown with a ghost "skip" button.
        let countdown = 10;
        const skipBtn = document.createElement('button');
        skipBtn.className = 'ag-btn-ghost';
        skipBtn.textContent = `متابعة الآن | Proceed Now (${countdown}s)`;
        shadowRoot.getElementById('ag-buttons').insertBefore(skipBtn, cancelBtn);

        skipBtn.addEventListener('click', () => {
          clearInterval(timer);
          triggerResumeAllFrames();
        });

        const timer = setInterval(() => {
          countdown--;
          skipBtn.textContent = `متابعة الآن | Proceed Now (${countdown}s)`;
          if (countdown <= 0) {
            clearInterval(timer);
            triggerResumeAllFrames();
          }
        }, 1000);
    }

    // رقم البلاغ (إن وُجد): يظهر أن الحالة سُجّلت في مركز عمليات الأمن
    if (response && response.reportNumber) {
        reportNum.style.display = "block";
        reportNum.textContent = `رقم البلاغ: #${response.reportNumber} | Report: #${response.reportNumber}`;
    }

    // برمجة الأزرار (متابعة على المسؤولية / التحليل الكامل / الإبلاغ)
    confirmBtn.addEventListener('click', () => {
        triggerResumeAllFrames();
    });
    detailsBtn.addEventListener('click', () => {
        window.open("http://localhost:5173", '_blank');
    });
    reportBtn.addEventListener('click', () => {
        // البلاغ أُرسل تلقائياً لمركز العمليات عند الفحص؛ هذا تأكيد للمستخدم.
        alert("تم إبلاغ فريق أمان‌جارد عن هذا الموقع.\nThis site has been reported to the AmanGuard security team.");
    });

    updateConnectionStatus(0);
    setTimeout(() => updateConnectionStatus(0), 500);
    setTimeout(() => updateConnectionStatus(0), 1500);
    setTimeout(() => updateConnectionStatus(0), 3000);
}

// Connection status + user info — read at module scope so both the overlay and
// the storage listener in injectShadowUI() can refresh it. Retries for up to
// 10s in case the token is still arriving from the web app.
function updateConnectionStatus(attempt = 0) {
    chrome.storage.local.get(["amanguard_connected", "amanguard_user"], (stored) => {
        const dot = shadowRoot?.getElementById('ag-conn-dot');
        const text = shadowRoot?.getElementById('ag-conn-text');
        const userAvatar = shadowRoot?.getElementById('ag-user-avatar');
        const userName = shadowRoot?.getElementById('ag-user-name');
        if (!dot || !text) return;

        if (stored.amanguard_connected) {
            dot.classList.remove('disconnected');
            dot.classList.add('connected');
            text.textContent = 'متصل بـ AmanGuard ✓ | Connected';

            if (stored.amanguard_user && userAvatar && userName) {
                try {
                    const user = JSON.parse(stored.amanguard_user);
                    const name = user.name || user.nameEn || "مستخدم";
                    userAvatar.textContent = name.charAt(0);
                    userName.textContent = name;
                } catch(e) {}
            }
        } else if (attempt < 10) {
            setTimeout(() => updateConnectionStatus(attempt + 1), 1000);
        } else {
            dot.classList.add('disconnected');
            text.textContent = 'غير متصل | Not connected';
        }
    });
}

// ==========================================
// 6. الاستئناف الآمن للعمليات (Safe Resumption)
// ==========================================

// إرسال إشعار للخلفية لكي تأمر جميع الإطارات بالاستئناف
function triggerResumeAllFrames() {
    const host = document.getElementById('amanguard-host');
    if (host) host.remove();
    safeSendMessage({ action: "resume_all_frames" });
}

// الدالة المسؤولة عن إعادة إطلاق الحدث في الإطار الذي يملك الذاكرة
function safeResumeTransactionLocal() {
    if (interceptedElement) {
        isAmanGuardApproved = true; // السماح للحدث بالمرور من حارسنا
        isProcessingTransaction = false; // فتح القفل للعمليات المستقبلية
        
        // [حيلة برمجية لتخطي حماية React و Angular]:
        // بدلاً من استخدام dispatchEvent(new Event) الذي يتم اكتشافه كحدث مصطنع (isTrusted: false)،
        // نقوم بمحاكاة النقر الأصلي للمتصفح عبر .click()، أو استدعاء دالة الإرسال الأصلية للـ Form.
        if (interceptedEvent === 'click') {
            interceptedElement.click(); 
        } else if (interceptedEvent === 'submit' && interceptedElement.tagName === 'FORM') {
            HTMLFormElement.prototype.submit.call(interceptedElement);
        }

        // تنظيف الذاكرة بعد الاستئناف
        interceptedElement = null;
        interceptedEvent = null;
    }
}