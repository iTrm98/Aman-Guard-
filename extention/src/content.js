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
    style.textContent = `
/* AmanGuard Brand Colors */
:root {
  --ag-dark:    #0d1b2a;
  --ag-navy:    #101e2e;
  --ag-gold:    #9784e2;
  --ag-gold-hover: #605C94;
  --ag-red:     #c0392b;
  --ag-green:   #1a7a4a;
  --ag-surface: #ffffff;
  --ag-muted:   #8090a0;
}

#amanguard-payment-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(13, 27, 42, 0.92);
  z-index: 2147483647;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Tajawal', 'Segoe UI', Arial, sans-serif;
  backdrop-filter: blur(8px);
  direction: rtl;
}

.amanguard-modal {
  background: var(--ag-surface);
  width: 90%;
  max-width: 480px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(13,27,42,0.4);
}

.ag-modal-header {
  background: linear-gradient(135deg, var(--ag-dark), var(--ag-navy));
  padding: 24px;
  text-align: center;
  border-bottom: 3px solid var(--ag-gold);
}

.ag-brand {
  font-size: 22px;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: 0.02em;
  margin-bottom: 4px;
}

.ag-brand span { color: var(--ag-gold); }

.ag-subtitle {
  font-size: 12px;
  color: var(--ag-muted);
}

.ag-modal-body {
  padding: 24px;
}

.ag-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
  animation: agPulse 1.5s infinite;
}

.ag-title {
  font-size: 20px;
  font-weight: 900;
  color: var(--ag-dark);
  text-align: center;
  margin-bottom: 6px;
}

.ag-title-en {
  font-size: 13px;
  color: var(--ag-muted);
  text-align: center;
  margin-bottom: 16px;
}

/* Risk Score Gauge */
.ag-gauge-container {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

/* Connection status */
.ag-connection {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: var(--ag-muted);
  margin-bottom: 16px;
}

.ag-connection-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #9ca3af;
  flex-shrink: 0;
}

.ag-connection-dot.connected { background: #22c55e; }
.ag-connection-dot.disconnected { background: #f59e0b; }

/* Amount box */
.ag-amount-box {
  background: #fef9ec;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ag-amount-label { font-size: 13px; color: #555; }
.ag-amount-value { font-size: 18px; font-weight: 900; color: var(--ag-red); }

/* Reasons list */
.ag-reasons {
  background: #fdf0ef;
  border: 1px solid #f5c6c2;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
  display: none;
}

.ag-reason-item {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: #7a2020;
  margin-bottom: 8px;
  line-height: 1.5;
}

.ag-reason-item:last-child { margin-bottom: 0; }

/* Recommendation */
.ag-recommendation {
  background: #eaf3fb;
  border-inline-start: 3px solid #1a5a9a;
  border-radius: 0 8px 8px 0;
  padding: 10px 14px;
  font-size: 13px;
  color: #1a3a5a;
  margin-bottom: 16px;
  display: none;
}

/* Buttons */
.ag-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ag-btn-cancel {
  background: var(--ag-gold);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.ag-btn-cancel:hover { background: var(--ag-gold-hover); }

.ag-btn-details {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 11px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  display: none;
  transition: background 0.15s;
}

.ag-btn-details:hover { background: #e2e8f0; }

.ag-btn-confirm {
  background: transparent;
  color: var(--ag-red);
  border: 1px solid var(--ag-red);
  padding: 11px;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
  display: none;
  transition: all 0.15s;
}

.ag-btn-confirm:hover { background: #fdf0ef; }

/* Report button */
.ag-btn-report {
  background: transparent;
  color: var(--ag-muted);
  border: none;
  padding: 8px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  text-align: center;
  text-decoration: underline;
  display: none;
}

/* Modal footer */
.ag-modal-footer {
  background: #f8f9fb;
  border-top: 1px solid #edf0f4;
  padding: 10px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ag-footer-text {
  font-size: 10px;
  color: var(--ag-muted);
}

/* User info */
.ag-user-info {
  font-size: 11px;
  color: var(--ag-muted);
  display: flex;
  align-items: center;
  gap: 5px;
}

.ag-user-avatar {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: var(--ag-gold);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: 700;
}

@keyframes agPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes agSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ag-spinning { animation: agSpin 1s linear infinite; }
`;

    const wrapper = document.createElement('div');
    wrapper.id = 'amanguard-payment-overlay';
    
    // القالب المبدئي (حالة الانتظار/التحليل) — بهوية أمان‌جارد الكاملة
    wrapper.innerHTML = `
  <div class="amanguard-modal">

    <!-- Header with AmanGuard branding -->
    <div class="ag-modal-header">
      <div class="ag-brand">Aman<span>Guard</span></div>
      <div class="ag-subtitle">Financial Fraud Intelligence — حماية المدفوعات</div>
    </div>

    <div class="ag-modal-body">
      <!-- Connection status -->
      <div class="ag-connection">
        <span class="ag-connection-dot" id="ag-conn-dot"></span>
        <span id="ag-conn-text">جارٍ التحقق من الاتصال...</span>
      </div>

      <!-- Risk icon -->
      <div class="ag-icon" id="ag-loader">🛡️</div>

      <!-- Title -->
      <div class="ag-title" id="ag-title">اعتراض أمني آلي</div>
      <div class="ag-title-en" id="ag-title-en">Automatic Security Interception</div>

      <!-- Risk gauge (SVG) -->
      <div class="ag-gauge-container" id="ag-gauge-container" style="display:none;">
        <svg width="120" height="75" viewBox="0 0 120 75" id="ag-gauge-svg">
          <path d="M 15 62 A 48 48 0 0 1 105 62" stroke="#edf0f4" stroke-width="8" stroke-linecap="round" fill="none"/>
          <path d="M 15 62 A 48 48 0 0 1 105 62" stroke="#9784e2" stroke-width="8" stroke-linecap="round" fill="none"
            id="ag-gauge-fill"
            stroke-dasharray="150.796"
            stroke-dashoffset="150.796"
            style="transition: stroke-dashoffset 0.8s ease, stroke 0.5s ease"/>
          <text x="60" y="58" text-anchor="middle" font-size="22" font-weight="900" fill="#0d1b2a" id="ag-score-text">0</text>
          <text x="60" y="70" text-anchor="middle" font-size="9" fill="#8090a0">/100</text>
        </svg>
      </div>

      <!-- Amount detected -->
      <div class="ag-amount-box" id="ag-amount-box" style="display:none;">
        <span class="ag-amount-label">المبلغ المكتشف | Amount</span>
        <span class="ag-amount-value" id="ag-amount-value">—</span>
      </div>

      <!-- Message -->
      <p id="ag-message" style="color:#475569; font-size:14px; text-align:center; margin-bottom:6px;">يقوم النظام بتحليل أمان عملية الدفع...</p>
      <p id="ag-message-en" style="font-size:12px; color:#8090a0; text-align:center; margin-bottom:16px;">Analyzing payment security, please wait...</p>

      <!-- Reasons -->
      <div class="ag-reasons" id="ag-reasons">
        <ul id="ag-reasons-list" style="list-style:none; padding:0; margin:0;"></ul>
      </div>

      <!-- Recommendation -->
      <div class="ag-recommendation" id="ag-recommendation"></div>

      <!-- Triggered fields / report number -->
      <div id="ag-fields-info" style="display:none; font-size:11px; color:#8090a0; text-align:center; margin-bottom:12px;"></div>

      <!-- Buttons -->
      <div class="ag-buttons">
        <button class="ag-btn-cancel" id="ag-cancel-btn">🛑 إلغاء العملية | Cancel Transaction</button>
        <button class="ag-btn-report" id="ag-report-btn">الإبلاغ عن هذا الموقع | Report this site</button>
        <button class="ag-btn-details" id="ag-details-btn">📊 التحليل الكامل | Full Analysis</button>
        <button class="ag-btn-confirm" id="ag-confirm-btn">المتابعة على مسؤوليتي | Proceed at my own risk</button>
      </div>
    </div>

    <!-- Footer -->
    <div class="ag-modal-footer">
      <div class="ag-user-info">
        <span class="ag-user-avatar" id="ag-user-avatar">؟</span>
        <span id="ag-user-name">غير متصل</span>
      </div>
      <div class="ag-footer-text">AmanGuard v1.0 • Amad Hackathon 2026</div>
    </div>
  </div>
    `;

    shadowRoot.appendChild(style);
    shadowRoot.appendChild(wrapper);
    document.body.appendChild(host);

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

    const loader = shadowRoot.getElementById('ag-loader');
    const title = shadowRoot.getElementById('ag-title');
    const titleEn = shadowRoot.getElementById('ag-title-en');
    const message = shadowRoot.getElementById('ag-message');
    const messageEn = shadowRoot.getElementById('ag-message-en');
    const reasons = shadowRoot.getElementById('ag-reasons');
    const reasonsList = shadowRoot.getElementById('ag-reasons-list');
    const recommendation = shadowRoot.getElementById('ag-recommendation');
    const confirmBtn = shadowRoot.getElementById('ag-confirm-btn');
    const detailsBtn = shadowRoot.getElementById('ag-details-btn');
    const reportBtn = shadowRoot.getElementById('ag-report-btn');
    const gaugeContainer = shadowRoot.getElementById('ag-gauge-container');
    const gaugeFill = shadowRoot.getElementById('ag-gauge-fill');
    const scoreText = shadowRoot.getElementById('ag-score-text');

    // Map risk level to score
    const scoreMap = { "Critical": 95, "High": 82, "Low": 15 };
    const score = response && response.risk_level ? (scoreMap[response.risk_level] ?? 50) : 0;
    const colorMap = { "Critical": "#c0392b", "High": "#d35400", "Low": "#1a7a4a" };
    const color = (response && colorMap[response.risk_level]) ?? "#9784e2";

    // Update gauge
    gaugeContainer.style.display = "flex";
    const circumference = 150.796;
    const offset = circumference * (1 - score / 100);
    gaugeFill.style.strokeDashoffset = offset;
    gaugeFill.style.stroke = color;
    scoreText.textContent = score;
    scoreText.style.fill = color;

    if (!response || response.error) {
        loader.textContent = "⚠️";
        title.textContent = "تعذّر الفحص";
        titleEn.textContent = "Scan Failed";
        message.textContent = "تعذر الاتصال بخادم AmanGuard.";
        messageEn.textContent = "Could not connect to AmanGuard server.";
        confirmBtn.style.display = "block";

    } else if (response.risk_level === "High" || response.risk_level === "Critical") {
        loader.textContent = response.risk_level === "Critical" ? "🚫" : "⚠️";
        title.textContent = response.risk_level === "Critical" ? "بوابة دفع مخترقة!" : "موقع مشبوه!";
        titleEn.textContent = response.risk_level === "Critical" ? "Compromised Payment Gateway!" : "Suspicious Site!";
        title.style.color = color;
        message.textContent = "تم إيقاف العملية لحماية بياناتك المالية.";
        messageEn.textContent = "Transaction stopped to protect your financial data.";

        // Show reasons
        reasons.style.display = "block";
        response.reasons.forEach(reason => {
            const li = document.createElement('li');
            li.className = 'ag-reason-item';
            li.innerHTML = `<span>❌</span><span>${reason}</span>`;
            reasonsList.appendChild(li);
        });

        // Show recommendation
        recommendation.style.display = "block";
        recommendation.innerHTML = `<strong>توصية النظام:</strong> لا تُكمل هذه العملية ولا تُدخل بيانات بطاقتك.<br><strong>Recommendation:</strong> Do not proceed. Do not enter your card details.`;

        detailsBtn.style.display = "block";
        confirmBtn.style.display = "block";
        reportBtn.style.display = "block";

    } else {
        loader.textContent = "✅";
        title.textContent = "عملية آمنة";
        titleEn.textContent = "Safe Transaction";
        title.style.color = "#1a7a4a";
        message.textContent = "تم التحقق من بوابة الدفع. سيتم المتابعة تلقائياً...";
        messageEn.textContent = "Payment gateway verified. Proceeding automatically...";
        // Show countdown for 10 seconds with a skip button
        let countdown = 10;
        const cancelBtn = shadowRoot.getElementById('ag-cancel-btn');
        const skipBtn = document.createElement('button');
        skipBtn.className = 'ag-btn-details';
        skipBtn.style.display = 'block';
        skipBtn.textContent = `متابعة الآن | Proceed Now (${countdown}s)`;
        shadowRoot.querySelector('.ag-buttons').insertBefore(skipBtn, cancelBtn);

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
        const fieldsInfo = shadowRoot.getElementById('ag-fields-info');
        fieldsInfo.style.display = "block";
        fieldsInfo.textContent = `رقم البلاغ: #${response.reportNumber} | Report: #${response.reportNumber}`;
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

    // Load user info from storage
    chrome.storage.local.get(["amanguard_user"], (stored) => {
        const userAvatar = shadowRoot.getElementById('ag-user-avatar');
        const userName = shadowRoot.getElementById('ag-user-name');
        if (stored.amanguard_user && userAvatar && userName) {
            try {
                const user = JSON.parse(stored.amanguard_user);
                const name = user.name || user.nameEn || "مستخدم";
                userAvatar.textContent = name.charAt(0);
                userName.textContent = name;
            } catch(e) {}
        }
    });

    // Connection status
    chrome.storage.local.get(["amanguard_connected"], (stored) => {
        const dot = shadowRoot.getElementById('ag-conn-dot');
        const text = shadowRoot.getElementById('ag-conn-text');
        if (!dot || !text) return;
        if (stored.amanguard_connected) {
            dot.classList.add('connected');
            text.textContent = 'متصل بـ AmanGuard ✓ | Connected';
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