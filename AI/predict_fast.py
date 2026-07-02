import sys
from pathlib import Path

import joblib

from text_utils import clean_text, PHISHING_THRESHOLD

CANDIDATE_PATHS = ["models/phish_model.joblib", "phish_model.joblib"]


def load_model():
    for path in CANDIDATE_PATHS:
        if Path(path).exists():
            print(f"Loading model from {path}...")
            model = joblib.load(path)
            print("Model successfully loaded!\n")
            return model
    print(f"Error: could not find a model at any of {CANDIDATE_PATHS}.")
    print("Run train.py first to produce phish_model.joblib.")
    sys.exit(1)


model = load_model()


def analyze_email(email_text):
    cleaned_text = clean_text(email_text)
    print(f"\n[Debug] What the model sees: {cleaned_text}")

    phishing_proba = model.predict_proba([cleaned_text])[0][1]
    phishing_score = phishing_proba * 100

    prediction = 1 if phishing_proba >= PHISHING_THRESHOLD else 0
    return prediction, phishing_score


if __name__ == "__main__":
    print("-" * 50)
    print(f"FAST PHISHING SCANNER ({int(PHISHING_THRESHOLD * 100)}% SCAM THRESHOLD)")
    print("Type 'exit' to quit.")
    print("-" * 50)

    while True:
        print("\n" + "=" * 50)
        print("Paste the email body (Press Enter twice to submit):")

        lines = []
        while True:
            try:
                line = input()
                if not line and lines:
                    break
                if line.strip().lower() == "exit":
                    sys.exit(0)
                lines.append(line)
            except EOFError:
                sys.exit(0)

        user_input = " ".join(lines)

        if not user_input.strip():
            continue

        label, phishing_score = analyze_email(user_input)

        if label == 1:
            print(f"\n🚨 SCAM ALERT: Phishing Detected!")
            print(f"Phishing Probability: {phishing_score:.2f}% (>= {int(PHISHING_THRESHOLD * 100)}% Threshold)")
        else:
            print(f"\n✅ CLEAR: Normal Email")
            print(f"Phishing Probability: {phishing_score:.2f}% (Below {int(PHISHING_THRESHOLD * 100)}% Threshold)")
