# AmanGuard AI Engine

A small FastAPI service that uses an LLM (via the OpenAI API) to analyze text messages and flag phishing.

The project has two files:

| File | Role |
|---|---|
| `phishingGPT.py` | The API server receives a message, asks the LLM to classify it, returns a structured risk analysis |
| `run_api_tests.py` | A test client — sends 10 sample messages (5 Arabic, 5 English) to the running server and prints the results |
| `requirements.txt` | The libraries and framworks thats used here |
---

## 1. `phishingGPT.py` — The API Server

### What it does
This spins up a FastAPI app (`AmanGuard AI Engine`) with two endpoints. The main one, `/analyze-message`, sends the message text to `gpt-4o-mini` with a system prompt instructing it to act as a financial security analyst. It uses OpenAI's **structured outputs** feature (`client.beta.chat.completions.parse`) with a Pydantic schema (`PhishingAnalysis`), so the model's reply is guaranteed to come back as valid, typed JSON rather than free-form text you'd have to parse yourself.


### Response schema (`PhishingAnalysis`)
| Field | Type | Meaning |
|---|---|---|
| `is_phishing` | bool | Whether the message is judged malicious |
| `risk_score` | int (0–100) | Numeric risk level |
| `risk_level` | str | `Low`, `Medium`, `High`, or `Critical` |
| `recommended_action` | str | `PROCEED`, `WARN`, `HOLD_TRANSACTION`, or `FREEZE_ACCOUNT` |
| `reasons` | list[str] | Justification, in Arabic |
| `red_flags` | list[str] | Specific red flags detected, in Arabic |

The system prompt maps risk level to action directly (Low → PROCEED, Medium → WARN, High/Critical → HOLD_TRANSACTION), and instructs the model to treat plain bank notifications without links as `Safe`.

### Endpoints
- **`POST /analyze-message`**
  Body: `{ "message_text": "..." }`
  Returns a `PhishingAnalysis` object as above.

- **`POST /analyze-transaction`**
  No input required. Currently returns a **hardcoded mock response** (risk_score 90, Critical, HOLD_TRANSACTION) — it doesn't call the LLM yet. Useful as a placeholder for a future transaction-risk model or for frontend testing.

### Error handling
If the OpenAI call fails for any reason (bad key, network issue, rate limit, etc.), the endpoint doesn't crash — it returns a **fallback result**: `is_phishing=True`, risk 85/High, action `WARN`, with a generic Arabic message noting the AI connection failed. This means a failure is treated cautiously (fail-safe toward "warn the user") rather than silently passing the message through.

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
   pip install fastapi uvicorn openai python-dotenv pydantic
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