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
        chrome.runtime.sendMessage({ action: "trigger_ui_in_top_frame", data: metadata });
    } else {
        triggerAmanGuardFlow(metadata);
    }
}

// ==========================================
// 4. الاستماع لرسائل الـ Background (Iframe Communication)
// ==========================================
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

// ==========================================
// 5. بناء الواجهة المعزولة (Shadow DOM UI)
// ==========================================
let shadowRoot = null;

function triggerAmanGuardFlow(metadata) {
    injectShadowUI(); // عرض الشاشة كحالة انتظار أولاً
    chrome.runtime.sendMessage({ action: "analyze_payment", data: metadata }, (response) => {
        updateShadowUI(response); // تحديث الشاشة بالنتائج
    });
}

function injectShadowUI() {
    if (document.getElementById('amanguard-host')) return;

    // نستخدم Shadow DOM مغلق (Closed) لمنع سكربتات الموقع (والمخترقين) من إخفاء أو العبث بواجهة التحذير
    const host = document.createElement('div');
    host.id = 'amanguard-host';
    host.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 2147483647; pointer-events: auto;';
    
    shadowRoot = host.attachShadow({ mode: 'closed' });

    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('overlay.css');
    
    const wrapper = document.createElement('div');
    wrapper.id = 'amanguard-payment-overlay';
    
    // القالب المبدئي (حالة الانتظار/التحليل)
    wrapper.innerHTML = `
        <div class="amanguard-modal">
            <div class="amanguard-icon-loader" id="ag-loader">🛡️</div>
            <h2 id="ag-title">اعتراض أمني آلي <br><span style="font-size: 16px; color: #64748b;">Security Interception</span></h2>
            <p id="ag-message" style="margin-bottom: 5px;">يقوم النظام الآن بتحليل أمان عملية الدفع...</p>
            <p id="ag-message-en" style="font-size: 13px; color: #64748b; margin-top: 0;">Analyzing payment security, please wait...</p>
            
            <div id="ag-reasons-container" style="display: none; text-align: center;">
                <ul id="ag-reasons-list" style="list-style: none; padding: 0;"></ul>
            </div>

            <div class="amanguard-buttons">
                <button id="ag-cancel-btn">إلغاء العملية | Cancel Transaction</button>
                <button id="ag-details-btn" style="display: none;">التحليل الكامل | Full Analysis</button>
                <button id="ag-confirm-btn" style="display: none;">تأكيد على مسؤوليتي | Proceed Anyway</button>
            </div>
        </div>
    `;

    shadowRoot.appendChild(styleLink);
    shadowRoot.appendChild(wrapper);
    document.body.appendChild(host);

    // برمجة زر الإلغاء
    shadowRoot.getElementById('ag-cancel-btn').addEventListener('click', () => {
        document.getElementById('amanguard-host').remove();
        isProcessingTransaction = false; 
        chrome.runtime.sendMessage({ action: "cancel_all_frames" }); 
        alert("تم إلغاء عملية الدفع لحمايتك. \nTransaction cancelled for your safety.");
    });
}

function updateShadowUI(response) {
    if (!shadowRoot) return;

    const loader = shadowRoot.getElementById('ag-loader');
    const title = shadowRoot.getElementById('ag-title');
    const message = shadowRoot.getElementById('ag-message');
    const messageEn = shadowRoot.getElementById('ag-message-en');
    const reasonsContainer = shadowRoot.getElementById('ag-reasons-container');
    const reasonsList = shadowRoot.getElementById('ag-reasons-list');
    const confirmBtn = shadowRoot.getElementById('ag-confirm-btn');
    const detailsBtn = shadowRoot.getElementById('ag-details-btn');

    // معالجة الأخطاء (مثل تعطل الخادم)
    if (!response || response.error) {
        loader.textContent = "⚠️";
        title.innerHTML = "تعذر الفحص <br><span style='font-size:16px;'>Scan Failed</span>";
        title.style.color = "#ff9800";
        message.textContent = "حدث خطأ أثناء الاتصال بالخادم المركزي.";
        messageEn.textContent = "Error connecting to the central server.";
        confirmBtn.style.display = "block";
    } 
    // معالجة المخاطر (احتيال، نطاق خارجي، موقع جديد)
    else if (response.risk_level === "High" || response.risk_level === "Critical") {
        loader.textContent = "❌";
        title.innerHTML = "بوابة مشبوهة! <br><span style='font-size:16px;'>Suspicious Gateway!</span>";
        title.style.color = "#f44336";
        message.textContent = "تم إيقاف هذه العملية لخطورتها على بياناتك.";
        messageEn.textContent = "This transaction was blocked for your safety.";
        
        reasonsContainer.style.display = "block";
        response.reasons.forEach(reason => {
            const li = document.createElement('li');
            li.style.color = "#ef4444";
            li.style.fontSize = "13px";
            li.style.marginBottom = "5px";
            li.textContent = "• " + reason;
            reasonsList.appendChild(li);
        });

        detailsBtn.style.display = "block";
        confirmBtn.style.display = "block";
        
        detailsBtn.addEventListener('click', () => {
            const dashboardUrl = "http://127.0.0.1:5500/index.html"; 
            window.open(dashboardUrl, '_blank');
        });
    } 
    // معالجة الأمان (المرور بنجاح)
    else {
        loader.textContent = "✅";
        title.innerHTML = "عملية آمنة <br><span style='font-size:16px;'>Safe Transaction</span>";
        title.style.color = "#4CAF50";
        message.textContent = "تم فحص البوابة بنجاح. سيتم توجيهك الآن...";
        messageEn.textContent = "Gateway verified. Redirecting...";
        // استئناف تلقائي بعد ثانية ونصف
        setTimeout(() => triggerResumeAllFrames(), 1500);
    }

    // برمجة زر التأكيد على مسؤولية المستخدم
    confirmBtn.addEventListener('click', () => {
        triggerResumeAllFrames();
    });
}

// ==========================================
// 6. الاستئناف الآمن للعمليات (Safe Resumption)
// ==========================================

// إرسال إشعار للخلفية لكي تأمر جميع الإطارات بالاستئناف
function triggerResumeAllFrames() {
    const host = document.getElementById('amanguard-host');
    if (host) host.remove();
    chrome.runtime.sendMessage({ action: "resume_all_frames" });
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