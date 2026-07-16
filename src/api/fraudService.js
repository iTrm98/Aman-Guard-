// Service layer mapping to the Spring Boot backend endpoints:
//   GET   /account/me                    (AccountController)
//   GET   /call-status                   (CallVerificationController)
//   POST  /analyze                       (FraudAnalysisController)
//   POST  /freeze                        (EmergencyFreezeController)
//   PATCH /freeze/{id}/approve           (EmergencyFreezeController)
//   GET   /cases/active                  (DashboardController)
//   GET   /cases/{id}                    (DashboardController)
//   POST  /cases                         (DashboardController)
//   PUT   /cases/{id}                    (DashboardController)
//   GET   /customers/{nationalId}        (CustomerController)
//   GET   /notifications                 (NotificationsController)
//   PATCH /notifications/{id}/read       (NotificationsController)
//   PATCH /notifications/read-all        (NotificationsController)
//   POST  /transactions/analyze          (TransactionAnalysisController)
//   POST  /transactions/{id}/confirm     (TransactionAnalysisController)
//   POST  /transactions/{id}/cancel      (TransactionAnalysisController)
//   GET   /config/thresholds             (ConfigController)
//
// Every function calls the backend directly. There is no mock fallback —
// failures throw an ApiError and the calling component is responsible for
// its own loading/error UI.

import { apiClient, ApiError, BASE_URL, TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from "./client";

/**
 * POST /auth/login — exchange national id + password for a JWT session.
 * Uses raw fetch (not apiClient) so a bad-credentials 401 surfaces as a normal
 * ApiError here instead of triggering the client's session-expiry reload.
 * Response: { token, refreshToken, role, userId, name, nameEn }
 */
export async function login(nationalId, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nationalId, password }),
  });
  if (!res.ok) {
    let message = "Invalid credentials";
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(message, res.status);
  }
  return res.json();
}

/**
 * POST /auth/logout — best-effort server-side token blacklist. The local
 * session is cleared regardless of whether the request succeeds.
 */
export async function logout() {
  try {
    await apiClient.post("/auth/logout", {});
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

/**
 * GET /account/me
 * Response: { iban, maskedIban, balance, currency, status, securityStatus,
 *             stats: { opsToday, securityChecks, threatsStopped } }
 */
export async function getAccountInfo() {
  return apiClient.get("/account/me");
}

/**
 * GET /call-status — no parameters. The backend checks the current user's
 * registered phone number against its active-calls registry server-side.
 * Response: { hasActiveOfficialCall: boolean, message: string }
 */
export async function checkCallStatus() {
  return apiClient.get("/call-status");
}

/**
 * POST /analyze
 * Request:  { text: string }
 * Response: {
 *   riskScore, riskLevel, riskLabelAr, riskLabelEn,
 *   findings: [{ titleAr, titleEn, detailAr, detailEn }],
 *   recommendationAr, recommendationEn,
 *   interruptionQuestions: [{ id, textAr, textEn }],
 *   caseId,
 * }
 */
export async function analyzeText(text) {
  return apiClient.post("/analyze", { text });
}

/**
 * POST /freeze
 * Request:  { caseId: number, reason: string }
 * Response: { requestId, success, reportNumber, status: "pending"|"approved"|"rejected", message }
 */
export async function freezeAccount({ caseId, reason } = {}) {
  return apiClient.post("/freeze", { caseId, reason });
}

/**
 * PATCH /freeze/{id}/approve
 */
export async function approveFreezeRequest(requestId) {
  return apiClient.patch(`/freeze/${requestId}/approve`);
}

/**
 * Bank-staff-initiated freeze: staff have authority to freeze immediately,
 * so this creates the freeze request (or reuses an existing pending one)
 * and approves it in the same action.
 */
export async function freezeCaseByStaff({ caseId, freezeRequestId, freezeStatus, reason = "bank_staff_initiated" } = {}) {
  if (freezeRequestId && freezeStatus === "pending") {
    return approveFreezeRequest(freezeRequestId);
  }
  const created = await apiClient.post("/freeze", { caseId, reason });
  if (created.status === "approved") return created;
  return approveFreezeRequest(created.requestId);
}

/**
 * GET /cases/active
 * Response: {
 *   stats: {
 *     criticalToday, suspectedCases, accountsFrozen, amountSaved,
 *     criticalDelta, suspectedDelta, frozenDelta, amountSavedToday,
 *   },
 *   cases: [{
 *     id, caseId, createdAt, customerName, fraudPattern, riskScore, riskLevel,
 *     accountStatus, notes, freezeRequestId, freezeStatus,
 *   }],
 * }
 */
export async function getActiveCases() {
  return apiClient.get("/cases/active");
}

/**
 * GET /cases/{id} — single case, same shape as a /cases/active row.
 */
export async function getCaseById(caseId) {
  return apiClient.get(`/cases/${caseId}`);
}

/**
 * POST /cases — manual case entry by a bank officer.
 * Request: { nationalId, customerName, accountNumber, phone, fraudPattern,
 *            description, riskScore, immediateAction: "monitor"|"freeze"|"close" }
 * Response: the created case (same shape as a /cases/active row).
 */
export async function createCase(body) {
  return apiClient.post("/cases", body);
}

/**
 * PUT /cases/{id} — officer edits. All fields optional:
 * { customerName, fraudPattern, riskScore, accountStatus, notes }
 * Response: the updated case (same shape as a /cases/active row).
 */
export async function updateCase(caseId, body) {
  return apiClient.put(`/cases/${caseId}`, body);
}

/**
 * GET /customers/{nationalId}
 * Response: { name, nameEn, accountNumber, phone, customerId }
 */
export async function getCustomerByNationalId(nationalId) {
  return apiClient.get(`/customers/${encodeURIComponent(nationalId)}`);
}

/**
 * GET /notifications
 * Response: [{ id, read, icon, titleAr, titleEn, bodyAr, bodyEn, type, caseId, createdAt }]
 */
export async function getNotifications() {
  return apiClient.get("/notifications");
}

/**
 * PATCH /notifications/{id}/read — fire-and-forget from the UI's perspective;
 * local state updates optimistically.
 */
export async function markNotificationRead(notificationId) {
  return apiClient.patch(`/notifications/${notificationId}/read`);
}

/**
 * PATCH /notifications/read-all — fire-and-forget from the UI's perspective;
 * local state updates optimistically.
 */
export async function markAllNotificationsRead() {
  return apiClient.patch("/notifications/read-all");
}

/**
 * POST /transactions/analyze — real-time purchase risk gating.
 * Request:  { merchantName, amount, currency, merchantUrl, transactionType, accountId }
 * Response: {
 *   transactionId, riskScore, riskLevel, riskLabelAr, riskLabelEn,
 *   action: "allowed" | "suspended" | "blocked",
 *   findings: [{ titleAr, titleEn, detailAr, detailEn }],
 *   recommendationAr, recommendationEn,
 *   reportNumber,   // set only when blocked, null otherwise
 * }
 */
export async function analyzeTransaction(body) {
  return apiClient.post("/transactions/analyze", body);
}

/**
 * POST /transactions/{id}/confirm — customer approves a suspended purchase.
 * Response: { success, message, caseId: null }
 */
export async function confirmTransaction(transactionId) {
  return apiClient.post(`/transactions/${transactionId}/confirm`);
}

/**
 * POST /transactions/{id}/cancel — customer stops a suspended purchase.
 * The backend creates a "محاولة شراء غير مصرحة" fraud case and returns its id
 * so the caller can run the emergency freeze flow (POST /freeze needs caseId).
 * Response: { success, message, caseId }
 */
export async function cancelTransaction(transactionId) {
  return apiClient.post(`/transactions/${transactionId}/cancel`);
}

/**
 * GET /config/thresholds — server-side fraud config, read-only in the UI
 * (shown to bank officers in SettingsPanel; never a customer form field).
 * Response: { maxPurchaseAmount: number, currency: string }
 */
export async function getThresholds() {
  return apiClient.get("/config/thresholds");
}

/**
 * GET /audit-logs — paged, filterable audit trail (bank officers only).
 * All params optional: page, size, from/to (ISO dates, Saudi calendar days),
 * action (contains-filter on the stored action token), search (user id or IP).
 * Response: { content: [{ id, userId, userRole, action, entityType, entityId,
 *             ipAddress, httpStatus, createdAt }], totalElements, totalPages, number }
 */
export async function getAuditLogs(params = {}) {
  return apiClient.get("/audit-logs", { params });
}
