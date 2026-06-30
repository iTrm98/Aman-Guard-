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
