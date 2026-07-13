# AmanGuard AI Engine

A small FastAPI service that uses an LLM (via the OpenAI API) to analyze text messages and flag phishing.

The project has three files:

| File | Role |
|---|---|
| `phishingGPT.py` | The API server receives a message, asks the LLM to classify it, returns a structured risk analysis |
| `run_api_tests.py` | A test client — sends 10 sample messages (5 Arabic, 5 English) to the running server and prints the results |
| `requirements.txt` | The libraries and framworks thats used here |
---
## 2. Core Endpoints

### A. URL Analysis (`POST /analyze-url`)
Analyzes a given URL for potential threats, domain age, and visual deception (Typosquatting).
*   **Input Body:** `{ "url": "https://example.com", "is_cross_domain": false }`.
*   **How it works:** 
    1. Extracts the domain and safely handles local/virtual URLs (e.g., `file://`, `about:`).
    2. Checks if the domain is in the trusted whitelist (e.g., `amazon.com`, `noon.com`).
    3. If whitelisted or local, it bypasses WHOIS and assigns a safe default age of **90 days** (since the suspicious threshold is set to 30 days).
    4. If not whitelisted, it fetches the domain's creation date using the WHOIS protocol to flag newly created suspicious sites.
    5. Passes the unknown domain to the AI to check if it is imitating known brands.
*   **Returns:** A `URLAnalysisResponse` object containing the domain age, cross-domain status, whitelist status, and structured AI findings.

### B. Message Analysis (`POST /analyze-message`)
Analyzes SMS or email text to classify if it is a phishing attempt or a legitimate notification.
*   **Input Body:** `{ "message_text": "..." }`.
*   **How it works:** Sends the text to `gpt-4o-mini` with a strict system prompt acting as a financial security analyst. Uses OpenAI's structured outputs to guarantee a typed JSON response.
*   **Returns:** A `PhishingAnalysis` object containing:
    *   `is_phishing` (bool): Whether the message is malicious.
    *   `risk_score` (int): 0-100 severity score.
    *   `risk_level` (str): `Low`, `Medium`, `High`, or `Critical`.
    *   `recommended_action` (str): Actionable backend commands (`PROCEED`, `WARN`, `HOLD_TRANSACTION`, `FREEZE_ACCOUNT`).
    *   `reasons` & `red_flags` (list): Detailed justifications in Arabic.

---

## 3. Fail-Safe & Error Handling
The engine is designed to never crash the client extension:
*   **OpenAI Failures:** If the OpenAI API key is missing or the connection fails, the `/analyze-message` endpoint returns a cautious fallback response (High risk, WARN action) to keep the user safe.
*   **WHOIS Failures:** The backend supports both `whois` and `python-whois` wrappers to prevent OS-level crashes. If domain age extraction fails, it defaults to `-1` (suspicious age). 

---
### Two ways to run it
```bash
# Normal mode
python phishingGPT.py

# Debug mode — also prints the parsed response and saves it to debug_response.json
python phishingGPT.py -debug
```
In debug mode, every response from `/analyze-message` or `/analyze-transaction` is pretty-printed to the console (Arabic-safe, `ensure_ascii=False`) and written to `debug_response.json` in the working directory — handy for inspecting exactly what the model/endpoint returned without digging through logs.

The server runs on **`http://127.0.0.1:8000`** via Uvicorn. CORS is wide open (`allow_origins=["*"]`), which is convenient for local frontend testing but should be locked down before any real deployment.

### Setup required
1. Create a `.env` file in the same directory:
   ```
   OPENAI_API_KEY=sk-...
   ```
2. Install dependencies:
   ```bash
   pip install fastapi uvicorn openai python-dotenv pydantic whois
   ```
   or
   ```bash
   pip install -r requirements.txt
   ```
   
   If `OPENAI_API_KEY` isn't found, the server still starts but every `/analyze-message` call will return `500 OPENAI_API_KEY is missing`.

---

## 2. `run_api_tests.py` — The Test Client

### What it does
A simple script (no test framework, just plain `requests` calls) that posts **10 predefined messages** to `POST /analyze-message` and prints whether the API's verdict looks right:

- 5 Arabic messages, 5 English messages
- A mix of `Phishing` (fake bank alerts, fake prizes, fake customs/shipping fees, fake IT helpdesk password resets) and `Safe` (real purchase notifications, casual reminders, real shipping confirmations) examples
- Each case has an `expected` label so you can eyeball whether the model agrees

### What it produces
- Console output per message: language, expected label, the message text, and the API's actual verdict (🔴 Phishing / 🟢 Safe) with confidence and the first reason
- A `test_messages.json` file containing all 10 test cases (so they can also be tested manually via Postman or similar tools without re-reading the script)

### How to run it
```bash
# Terminal 1
python phishingGPT.py

python run_api_tests.py
```

---

## Quick Start
```bash
pip install -r requirements.txt
echo "OPENAI_API_KEY=sk-your-key-here" > .env

python phishingGPT.py -debug      # Terminal 1: start the server in debug mod
python run_api_tests.py           # Terminal 2: run the 10-message test suite
```

## Notes / possible next steps
- `/analyze-transaction` is currently mocked wiring it to a real model (or the same LLM with a transaction-specific prompt).