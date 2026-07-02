import re

PHISHING_THRESHOLD = 0.60

LABELS = {0: "Safe Email", 1: "Phishing Email"}


def clean_text(text: str) -> str:
    """Light normalization — must match what train.py used to fit the vectorizer."""
    text = str(text).lower()
    text = re.sub(r"http\S+|www\.\S+", " <url> ", text)   
    text = re.sub(r"\S+@\S+", " <email> ", text)
    text = re.sub(r"\d+", " <num> ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text
