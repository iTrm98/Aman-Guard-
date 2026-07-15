# AmanGuard Extension

AmanGuard is a Manifest V3 Chrome Extension designed to proactively intercept and analyze online payment transactions in real-time. It acts as a client-side firewall, pausing checkout processes to verify the security of the payment gateway against Phishing, Typosquatting, and Form Hijacking before any sensitive data leaves the user's browser.

## 1. Architectural Overview

The extension is built to handle the complexities of modern web development, including Single Page Applications (SPAs), React/Angular synthetic events, and cross-origin iframes.

### Core Components

| Component | Description |
| :--- | :--- |
| `manifest.json` | The Manifest V3 configuration file. It grants permissions (`scripting`, `storage`), enables execution inside all frames (`all_frames: true`), and exposes the UI stylesheet. |
| `content.js` | The "Core" of the frontend. Injected at `document_start`, it monitors the DOM for payment contexts, intercepts clicks/submits, injects the Shadow DOM UI, and handles secure transaction resumption. |
| `background.js` | The Service Worker. It acts as a Message Broker for iframe-to-top-frame communication (bypassing CORS) and handles the asynchronous `fetch` requests to the local Python AI Engine. |
| `overlay.css` | The stylesheet for the AmanGuard warning modal, injected safely inside a Shadow Root to prevent host-site CSS conflicts. |

---

## 2. Advanced Heuristics Engine (`content.js`)

The extension does not solely rely on `<form>` submissions, as modern SPAs (like Amazon) often use hidden tokens and background API calls. It utilizes a **Dual-Engine Contextual Analyzer**:

1.  **Raw Data Engine:** Scans inputs, IDs, names, and placeholders for explicit credit card indicators (e.g., `ccnum`, `cvv`, `تاريخ الانتهاء`).
2.  **Tokenized Payment Engine:** Scans for hidden inputs and generic submit buttons often used in saved-card checkout flows (e.g., `paymentinstrumentid`, `placeorder`).
3.  **Form Blueprinting:** Analyzes form actions and IDs for explicit checkout routing.

### Interception Strategy
*   **Gatekeeper:** The script strictly ignores explicit `GET` requests (e.g., search bars) to prevent false positives and performance overhead.
*   **Event Delegation:** It listens to both `submit` and `click` events at the `document` level using the Capture Phase (`true`).
*   **Race Condition Lock:** Implements an `isProcessingTransaction` mutex to prevent multiple API calls if a button triggers both a click and a submit event simultaneously.

---

## 3. Secure UI & Resumption

### Shadow DOM Isolation
When a payment is intercepted, the extension halts the event (`preventDefault()`, `stopImmediatePropagation()`) and injects a loading screen. This UI is encapsulated within a **Closed Shadow DOM**, ensuring that malicious scripts on the host page cannot hide, alter, or click the AmanGuard warning buttons.

### Native Resumption (React/SPA Bypass)
If the backend AI deems the transaction safe (or the user explicitly proceeds), the extension resumes the transaction. To bypass React's synthetic event protections (which block `isTrusted: false` events), AmanGuard natively triggers `.click()` on the intercepted element or `HTMLFormElement.prototype.submit.call()` on forms.

---

## 4. Cross-Domain Hijacking Detection

Before sending data to the backend, `content.js` dynamically evaluates the action URL of the form against the current page's origin. 
If a form on `trusted-shop.com` attempts to send a POST request to `evil-hacker.com`, the extension flags `is_cross_domain: true`. The backend will immediately classify this as a **Critical Threat** (Form Hijacking).

---

## 5. Setup & Installation for Developers

To test or develop the extension locally:

1.  Clone the repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** (toggle switch in the top right corner).
4.  Click **Load unpacked** and select the folder containing this extension's source code (where `manifest.json` is located).
5.  Ensure the AmanGuard AI Engine (Python Backend) is running on `http://127.0.0.1:8000`.

## 6. Testing

You can use the provided `test-checkout.html` suite to verify the extension's behavior. The suite includes:
*   Standard POST forms.
*   Cross-Origin Hijacking attempts.
*   Hidden token simulations (Amazon SPA structure).
*   Isolated Iframe scenarios.
*   False-positive tests (Logins, Searches, Surveys).