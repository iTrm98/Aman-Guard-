// Service layer mapping to the backend endpoints from the MVP spec:
//   GET  /call-status        (CUST-002 verification)
//   POST /analyze            (BACK-SB-004)
//   POST /freeze             (BACK-SB-004)
//   GET  /cases/active       (BACK-SB-004)
//
// Every function tries the real API first. If VITE_USE_MOCKS is on (default,
// since there's no backend deployed yet) or the request fails, it falls back
// to mock data so the UI keeps working. Swap MOCK_MODE off once the backend
// is live and these calls will hit it directly.

import { apiClient, isMockMode } from "./client";
import {
  mockCallStatus,
  mockAnalysisResult,
  mockFreezeResponse,
  mockStats,
  mockCases,
} from "./mockData";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GET /call-status
 * Request:  none
 * Response: {
 *   hasActiveOfficialCall: boolean,  // true if the bank has an official call in progress with this customer right now
 *   message: string,                 // localized guidance to show the customer
 * }
 */
export async function checkCallStatus() {
  if (isMockMode()) {
    await delay(1200);
    return mockCallStatus;
  }
  try {
    return await apiClient.get("/call-status");
  } catch (err) {
    console.error("checkCallStatus failed, falling back to mock:", err);
    await delay(800);
    return mockCallStatus;
  }
}

/**
 * POST /analyze
 * Request:  { text: string }         // pasted message/link, max 500 chars (enforced client-side in ScamChecker)
 * Response: {
 *   riskScore: number,                // 0-100
 *   riskLevel: "critical" | "high" | "medium",
 *   riskLabel: string,                 // localized display label, e.g. "حرج (Critical)"
 *   findings: [{ title: string, detail: string }],
 *   recommendation: string,
 *   interruptionQuestions: [{ id: string, text: string }],
 *   caseId: string | null,            // set when the backend opens a bank-side case for this analysis
 * }
 */
export async function analyzeText(text) {
  if (isMockMode()) {
    await delay(1800);
    return mockAnalysisResult;
  }
  try {
    return await apiClient.post("/analyze", { text });
  } catch (err) {
    console.error("analyzeText failed, falling back to mock:", err);
    await delay(800);
    return mockAnalysisResult;
  }
}

/**
 * POST /freeze
 * Request:  {
 *   caseId: string | null,   // RiskReport.caseId when freezing off an AI analysis, or an existing bank case id
 *   reason: string,          // e.g. "customer_initiated"
 * }
 * Response: {
 *   success: boolean,
 *   reportNumber: string,    // e.g. "FR-9022", surfaced to the customer and used as the bank-side case id
 *   message: string,
 * }
 */
export async function freezeAccount({ caseId, reason } = {}) {
  const fallbackReportNumber = `FR-${9022 + Math.floor(Math.random() * 50)}`;
  if (isMockMode()) {
    await delay(700);
    return mockFreezeResponse(fallbackReportNumber);
  }
  try {
    return await apiClient.post("/freeze", { caseId, reason });
  } catch (err) {
    console.error("freezeAccount failed, falling back to mock:", err);
    await delay(500);
    return mockFreezeResponse(fallbackReportNumber);
  }
}

/**
 * GET /cases/active
 * Request:  none
 * Response: {
 *   stats: {
 *     criticalToday: number,
 *     suspectedCases: number,
 *     accountsFrozen: number,
 *     amountSaved: string,          // pre-formatted with thousands separators, e.g. "1,240,500"
 *   },
 *   cases: [{
 *     id: string,                   // e.g. "FR-9021"
 *     timeAgo: string,               // pre-formatted relative time, localized server-side
 *     customerName: string,
 *     fraudPattern: string,
 *     riskScore: number,             // 0-100
 *     riskLevel: "critical" | "high" | "medium",
 *     accountStatus: "active" | "partially_restricted" | "frozen",
 *   }],
 * }
 */
export async function getActiveCases() {
  if (isMockMode()) {
    await delay(500);
    return { stats: mockStats, cases: mockCases };
  }
  try {
    return await apiClient.get("/cases/active");
  } catch (err) {
    console.error("getActiveCases failed, falling back to mock:", err);
    await delay(400);
    return { stats: mockStats, cases: mockCases };
  }
}
