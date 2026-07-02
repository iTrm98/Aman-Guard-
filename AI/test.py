import requests
import json

# The URL of your local FastAPI server
url = "http://127.0.0.1:8000/analyze"

test_cases = [
    {
        "label": "Likely phishing",
        "email_body": "URGENT: Your account will be locked in 24 hours. Click here to verify your password immediately.",
    },
    {
        "label": "Likely safe",
        "email_body": "Hi team, attaching the agenda for tomorrow's 10am sync. Let me know if you want to add anything.",
    },
]

for case in test_cases:
    print(f"\n--- {case['label']} ---")
    print("Sending request to API...")
    try:
        response = requests.post(url, json={"email_body": case["email_body"]})
    except requests.exceptions.ConnectionError:
        print("Could not connect to the API. Is it running? Start it with: python api.py")
        break

    if response.status_code == 200:
        print(json.dumps(response.json(), indent=4))
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
