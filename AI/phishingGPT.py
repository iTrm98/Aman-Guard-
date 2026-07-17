import os
import json
import argparse
import uvicorn
from datetime import datetime
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from openai import OpenAI

# ==========================================
# 0. إعداد وضع التصحيح (Debug Mode)
# ==========================================
parser = argparse.ArgumentParser(description="AmanGuard AI Engine")
parser.add_argument("-debug", action="store_true", help="Save the response to a JSON file and print it.")
args, unknown = parser.parse_known_args()
DEBUG_MODE = args.debug

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
app = FastAPI(title="AmanGuard AI Engine")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if api_key:
    client = OpenAI(api_key=api_key)
else:
    client = None
    print("⚠️ تحذير: OPENAI_API_KEY غير موجود.")

# ==========================================
# 1. هياكل البيانات
# ==========================================
class PhishingAnalysis(BaseModel):
    is_phishing: bool = Field(description="True إذا كانت احتيالية، و False إذا كانت آمنة.")
    risk_score: int = Field(description="مستوى الخطورة كرقم صحيح من 0 إلى 100.")
    risk_level: str = Field(description="مستوى الخطورة: Low، Medium، High، Critical.")
    recommended_action: str = Field(description="أمر برمجي للباك إند، قيمته يجب أن تكون إما: PROCEED, WARN, HOLD_TRANSACTION, FREEZE_ACCOUNT")
    reasons: list[str] = Field(description="قائمة بالأسباب والمبررات باللغة العربية.")
    red_flags: list[str] = Field(description="العلامات الحمراء المكتشفة باللغة العربية.")

# --- هياكل الروابط ---
class TyposquattingAnalysis(BaseModel):
    is_typosquatting: bool = Field(description="True إذا كان النطاق يحاول تقليد علامة تجارية معروفة.")
    imitated_brand: str | None = Field(description="اسم العلامة التجارية التي يتم تقليدها إن وجدت.")
    warning_message: str = Field(description="رسالة تحذيرية للمستخدم.")

class URLAnalysisResponse(BaseModel):
    domain: str
    is_whitelisted: bool
    domain_age_days: int
    is_suspicious_age: bool
    is_cross_domain: bool # أضفنا هذه
    ai_analysis: TyposquattingAnalysis

class URLRequest(BaseModel):
    url: str
    is_cross_domain: bool = False # الإضافة سترسل هذه المعلومة الآن

class MessageInput(BaseModel):
    message_text: str


# ==========================================
# 2. وظيفة التصحيح والوظائف المساعدة
# ==========================================
def handle_debug_output(data: dict | BaseModel, endpoint_name: str):
    """يطبع ويحفظ الرد بصيغة JSON مقروءة للباك إند إذا كان الـ debug مفعلاً"""
    if not DEBUG_MODE:
        return

    if isinstance(data, BaseModel):
        data_dict = data.model_dump()
    else:
        data_dict = data
    json_output = json.dumps(data_dict, indent=4, ensure_ascii=False)

    print(f"\n--- [DEBUG] Output for {endpoint_name} ---")
    print(json_output)

    filename = "debug_response.json"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(json_output)
    print(f"--- [DEBUG] Saved to {filename} ---\n")


TRUSTED_DOMAINS = {"amazon.com", "amazon.sa", "noon.com", "jarir.com", "extra.com", "apple.com" , "stripe.com"}

def extract_domain(url: str) -> str:
    if url.startswith("file://"): return "local_test_file"
    if url.startswith("about:"): return "virtual_browser_frame" # [الحل الجذري 1]
    
    if not url.startswith(("http://", "https://")):
        url = "http://" + url
    return urlparse(url).netloc.replace("www.", "")

def get_domain_age(domain: str) -> int:
    # الروابط المحلية والوهمية نعطيها عمر افتراضي آمن لتخطي WHOIS
    if domain in ["local_test_file", "virtual_browser_frame", "localhost", "127.0.0.1"]:
        return 90 
        
    try:
        import whois
        domain_info = None
        if hasattr(whois, 'whois'):
            domain_info = whois.whois(domain)
        elif hasattr(whois, 'query'):
            domain_info = whois.query(domain)
        
        if not domain_info: return -1
            
        creation_date = domain_info.creation_date
        if isinstance(creation_date, list): creation_date = creation_date[0]
        if isinstance(creation_date, str):
            from dateutil import parser
            creation_date = parser.parse(creation_date)
            
        if hasattr(creation_date, 'tzinfo') and creation_date.tzinfo is not None:
            creation_date = creation_date.replace(tzinfo=None)
            
        return (datetime.now() - creation_date).days
    except Exception as e:
        print(f"WHOIS Warning for {domain}: {str(e)}")
        return -1

# ==========================================
# 3. مسارات الـ APIs
# ==========================================

@app.post("/analyze-url", response_model=URLAnalysisResponse)
async def analyze_url(request: URLRequest):
    domain = extract_domain(request.url)

    is_whitelisted = domain in TRUSTED_DOMAINS

    # Compute domain age
    domain_age_days = get_domain_age(domain)
    is_suspicious_age = 0 < domain_age_days < 180  # less than 6 months is suspicious

    ai_result = TyposquattingAnalysis(is_typosquatting=False, imitated_brand=None, warning_message="آمن")

    skip_ai_domains = ["local_test_file", "virtual_browser_frame"]
    
    if not is_whitelisted and client and domain not in skip_ai_domains:
        try:
            trusted_list = ", ".join(TRUSTED_DOMAINS)
            system_prompt = f"""أنت محلل أمني مالي في نظام AmanGuard. افحص النطاق واكتشف ما إذا كان يستخدم Typosquatting لتقليد متجر معروف بهدف الاحتيال.
            استخدم هذه القائمة كمرجعية: [{trusted_list}]"""
            
            response = client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"حلل النطاق التالي بدقة: {domain}"}
                ],
                response_format=TyposquattingAnalysis
            )
            ai_result = response.choices[0].message.parsed
        except Exception as e:
            print(f"AI Typosquatting Error: {e}")

    result = URLAnalysisResponse(
        domain=domain,
        is_whitelisted=is_whitelisted,
        domain_age_days=domain_age_days,
        is_suspicious_age=is_suspicious_age,
        is_cross_domain=request.is_cross_domain,
        ai_analysis=ai_result
    )

    handle_debug_output(result, "/analyze-url")
    return result

@app.post("/analyze-message", response_model=PhishingAnalysis)
async def analyze_message(input_data: MessageInput):
    if not client:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is missing")

    try:
        system_prompt = """
        أنت محلل أمني مالي في نظام AmanGuard. قم بتحليل الرسائل بدقة.
        الشروط:
        1. اكتب التبريرات باللغة العربية الفصحى.
        2. ابحث عن الانتحال، الروابط، التهديد، طلبات OTP.
        3. إشعارات البنوك العادية بدون روابط تعتبر Safe.
        4. الـ recommended_action يجب أن يكون دقيقاً:
           - للمستوى Low اختر PROCEED.
           - للمستوى Medium اختر WARN.
           - للمستوى High و Critical اختر HOLD_TRANSACTION.
        """

        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"حلل هذه الرسالة: \n<message>\n{input_data.message_text}\n</message>"}
            ],
            response_format=PhishingAnalysis
        )

        result = response.choices[0].message.parsed
        handle_debug_output(result, "/analyze-message")
        return result

    except Exception as e:
        print(f"AI Error: {e}")
        fallback_result = PhishingAnalysis(
            is_phishing=True,
            risk_score=85,
            risk_level="High",
            recommended_action="WARN",
            reasons=["حدث خطأ في الاتصال بالذكاء الاصطناعي، يرجى الحذر من الرسالة."],
            red_flags=["غير معروف"]
        )
        handle_debug_output(fallback_result, "/analyze-message (Fallback)")
        return fallback_result

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)