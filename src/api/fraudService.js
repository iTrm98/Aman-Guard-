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
//
// Every function calls the backend directly. There is no mock fallback —
// failures throw an ApiError and the calling component is responsible for
// its own loading/error UI.

import { apiClient } from "./client";

/**
 * GET /account/me
 * Response: { iban, maskedIban, balance, currency, status, securityStatus,
 *             stats: { opsToday, securityChecks, threatsStopped } }
 */
export async function getAccountInfo() {
  return apiClient.get("/account/me");
}

/**
 * GET /call-status?phoneNumber=...
 * Response: { hasActiveOfficialCall: boolean, message: string }
 */
export async function checkCallStatus(phoneNumber) {
  return apiClient.get("/call-status", { params: { phoneNumber } });
}

/**
 * POST /analyze
 * Request:  { text: string }
 * Response: {
 *   riskScore, riskLevel, riskLabelAr, riskLabelEn,
 *   findings: [{ titleAr, titleEn, detailAr, detailEn }],
 *   recommendationAr, recommendationEn,
 *   interruptionQuestions: [{ id, text }],
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
