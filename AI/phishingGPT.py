import os
import json
import argparse
import uvicorn
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

# تحميل المتغيرات
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

# إعداد التطبيق وتفعيل CORS للسماح للواجهات بالاتصال
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

class MessageInput(BaseModel):
    message_text: str = Field(..., description="نص الرسالة المراد فحصها")

# ==========================================
# 2. وظيفة التصحيح (Helper Function)
# ==========================================
def handle_debug_output(data: dict | BaseModel, endpoint_name: str):
    """يطبع ويحفظ الرد بصيغة JSON مقروءة للباك إند إذا كان الـ debug مفعلاً"""
    if not DEBUG_MODE:
        return
        
    # تحويل البيانات إلى قاموس (Dict) إذا كانت Pydantic Model
    if isinstance(data, BaseModel):
        data_dict = data.model_dump()
    else:
        data_dict = data

    # ensure_ascii=False يحافظ على اللغة العربية بدون تشفير
    json_output = json.dumps(data_dict, indent=4, ensure_ascii=False)
    
    print(f"\n--- [DEBUG] Output for {endpoint_name} ---")
    print(json_output)
    
    filename = "debug_response.json"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(json_output)
    print(f"--- [DEBUG] Saved to {filename} ---\n")

# ==========================================
# 3. مسارات الـ APIs
# ==========================================

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
        handle_debug_output(result, "/analyze")
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
        handle_debug_output(fallback_result, "/analyze (Fallback)")
        return fallback_result

@app.post("/analyze-transaction")
async def mock_transaction():
    mock_data = {
        "risk_score": 90,
        "risk_level": "Critical", # تم تعديلها لتطابق نموذج البيانات
        "recommended_action": "HOLD_TRANSACTION",
        "reasons": ["تحليل محاكي: متجر جديد ووقت متأخر"]
    }
    
    handle_debug_output(mock_data, "/analyze-transaction")
    return mock_data

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)