from pathlib import Path

import joblib
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from text_utils import clean_text, LABELS, PHISHING_THRESHOLD

app = FastAPI(title="Phishing Detection API")

CANDIDATE_PATHS = ["models/phish_model.joblib", "phish_model.joblib"]

print("Loading AI model into memory...")
model = None
for _path in CANDIDATE_PATHS:
    if Path(_path).exists():
        model = joblib.load(_path)
        print(f"Model successfully loaded from '{_path}' and ready for requests!")
        break
if model is None:
    print(f"Error loading model: none of {CANDIDATE_PATHS} exist.")
    print("Run train.py first to produce phish_model.joblib.")


class EmailRequest(BaseModel):
    email_body: str


@app.post("/analyze")
async def analyze_email_endpoint(request: EmailRequest):

    if model is None:
        raise HTTPException(status_code=500, detail="AI Model not loaded on server.")

    if not request.email_body.strip():
        raise HTTPException(status_code=400, detail="Email body cannot be empty.")

    cleaned = clean_text(request.email_body)
    phishing_proba = float(model.predict_proba([cleaned])[0][1])

    label_id = int(phishing_proba >= PHISHING_THRESHOLD)
    label = LABELS[label_id]
    confidence = round(
        phishing_proba * 100 if label_id == 1 else (1 - phishing_proba) * 100, 2
    )

    # JSON response
    return {
        "status": "success",
        "email_analyzed": True,
        "result": {
            "classification": label,
            "confidence_percentage": confidence,
            "phishing_probability_percentage": round(phishing_proba * 100, 2),
        },
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
