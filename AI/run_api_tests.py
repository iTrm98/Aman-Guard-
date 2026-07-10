import requests
import time
import json

API_URL = "http://127.0.0.1:8000/analyze-message"

# قائمة بـ 10 رسائل (5 عربي، 5 إنجليزي) تجمع بين رسائل احتيال ورسائل آمنة
test_cases = [
    # --- الرسائل العربية ---
    {
        "id": 1, 
        "language": "Arabic", 
        "expected": "Phishing", 
        "message_text": "عزيزي العميل، تم إيقاف حسابك البنكي مؤقتاً بسبب نشاط مشبوه. يرجى الضغط على الرابط التالي لتأكيد هويتك وتجنب الحظر النهائي: http://bank-update-secure.com"
    },
    {
        "id": 2, 
        "language": "Arabic", 
        "expected": "Phishing", 
        "message_text": "مبروك! لقد ربحت جائزة مالية قدرها 10,000 ريال من مسابقة الحلم. تواصل معنا عبر الواتساب لاستلام الجائزة وقم بتحويل رسوم الاستلام."
    },
    {
        "id": 3, 
        "language": "Arabic", 
        "expected": "Safe", 
        "message_text": "تمت عملية شراء بمبلغ 150 ريال من بطاقتك الائتمانية المنتهية بـ 1234 في متجر ستاربكس. الرصيد المتبقي 4500 ريال."
    },
    {
        "id": 4, 
        "language": "Arabic", 
        "expected": "Safe", 
        "message_text": "مرحباً أحمد، أذكرك بموعد اجتماعنا اليوم الساعة 3 عصراً لمناقشة تفاصيل المشروع. أراك لاحقاً!"
    },
    {
        "id": 5, 
        "language": "Arabic", 
        "expected": "Phishing", 
        "message_text": "شحنتك من سمسا محتجزة بسبب رسوم جمركية غير مدفوعة (15 ريال). يرجى الدفع فوراً عبر الرابط لتجنب إرجاع الشحنة: http://smsa-pay-fees.net"
    },
    
    # --- الرسائل الإنجليزية ---
    {
        "id": 6, 
        "language": "English", 
        "expected": "Phishing", 
        "message_text": "URGENT: Your PayPal account has been restricted due to unusual login attempts. Click here to verify your identity within 24 hours: http://paypal-security-alert-center.com"
    },
    {
        "id": 7, 
        "language": "English", 
        "expected": "Phishing", 
        "message_text": "You have a pending package from DHL. To schedule delivery, please pay the $2.99 shipping fee at this link: http://dhl-express-tracking-fees.com"
    },
    {
        "id": 8, 
        "language": "English", 
        "expected": "Safe", 
        "message_text": "Hi Sarah, just wanted to confirm our dinner plans for tomorrow at 7 PM. Let me know if you need to reschedule!"
    },
    {
        "id": 9, 
        "language": "English", 
        "expected": "Safe", 
        "message_text": "Your Amazon order #123-456789 has shipped and will arrive on Friday. Track your package on the Amazon app."
    },
    {
        "id": 10, 
        "language": "English", 
        "expected": "Phishing", 
        "message_text": "IT Helpdesk: All employees must update their Office 365 passwords by end of day to maintain access. Click here to login: http://office365-update-portal-login.com"
    }
]

print("=" * 60)
print("بدء اختبار نظام كشف الاحتيال الذكي (10 رسائل)")
print("=" * 60)

# حفظ الحالات في ملف JSON ليكون متاحاً للمستخدم
with open("test_messages.json", "w", encoding="utf-8") as f:
    json.dump(test_cases, f, ensure_ascii=False, indent=4)
print("✅ تم إنشاء ملف test_messages.json بنجاح لمن يفضل اختبار الرسائل عبر Postman أو يدوياً.\n")

for index, case in enumerate(test_cases, 1):
    print(f"[{index}/10] اللغة: {case['language']} | المتوقع: {case['expected']}")
    print(f"الرسالة: {case['message_text']}")
    
    try:
        # إرسال الطلب إلى الـ API الذي صممناه مسبقاً
        response = requests.post(API_URL, json={"message_text": case['message_text']})
        if response.status_code == 200:
            result = response.json()
            is_phishing = result.get('is_phishing')
            status = "🔴 احتيال (Phishing)" if is_phishing else "🟢 آمنة (Safe)"
            
            print(f"--> نتيجة الذكاء الاصطناعي: {status} (نسبة الثقة: {result.get('confidence_score')})")
            print(f"--> التبرير الأول: {result.get('reasons')[0] if result.get('reasons') else 'لا يوجد'}")
        else:
            print(f"--> ❌ خطأ من الخادم: الكود {response.status_code}")
            print(response.text)
    except requests.exceptions.ConnectionError:
        print("--> ❌ فشل الاتصال بالخادم. الرجاء التأكد من أن مشروع FastAPI يعمل حالياً في نافذة Terminal أخرى.")
        break
    except Exception as e:
        print(f"--> ❌ حدث خطأ غير متوقع: {e}")
    
    print("-" * 60)
    # توقف لمدة ثانيتين لتجنب استهلاك معدل الطلبات المجاني في Gemini API (Rate Limit)
    time.sleep(2)

print("تم الانتهاء من الاختبار!")
