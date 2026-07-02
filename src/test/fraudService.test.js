import { describe, expect, it, vi, afterEach } from "vitest";
import {
  checkCallStatus,
  analyzeText,
  freezeAccount,
  getActiveCases,
  getAccountInfo,
  getNotifications,
} from "../api/fraudService";
import { ApiError } from "../api/client";

function mockFetchOnce(body, { ok = true, status = 200 } = {}) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });
}

describe("fraudService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("checkCallStatus sends the phone number as a query param and returns the parsed response", async () => {
    mockFetchOnce({ hasActiveOfficialCall: true, message: "ok" });

    const result = await checkCallStatus("920000001");

    expect(result.hasActiveOfficialCall).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/call-status?phoneNumber=920000001"),
      expect.any(Object)
    );
  });

  it("analyzeText posts the text and returns the parsed response", async () => {
    mockFetchOnce({ riskScore: 82, riskLevel: "high", findings: [], interruptionQuestions: [], caseId: 5 });

    const result = await analyzeText("suspicious text");

    expect(result.riskScore).toBe(82);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/analyze"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("freezeAccount throws an ApiError when the backend rejects the request (no mock fallback)", async () => {
    mockFetchOnce({ message: "رقم حالة الاحتيال مطلوب" }, { ok: false, status: 400 });

    await expect(freezeAccount({ caseId: null, reason: "x" })).rejects.toBeInstanceOf(ApiError);
  });

  it("getActiveCases returns stats and a cases list", async () => {
    mockFetchOnce({ stats: { criticalToday: 1 }, cases: [] });

    const result = await getActiveCases();

    expect(result.stats).toBeDefined();
    expect(Array.isArray(result.cases)).toBe(true);
  });

  it("getAccountInfo returns the parsed account response", async () => {
    mockFetchOnce({ iban: "SA...", maskedIban: "SA••4821", balance: 100, currency: "SAR", status: "active", securityStatus: "protected", stats: { opsToday: 1, securityChecks: 2, threatsStopped: 3 } });

    const result = await getAccountInfo();

    expect(result.maskedIban).toBe("SA••4821");
  });

  it("getNotifications returns the parsed notifications list", async () => {
    mockFetchOnce([{ id: 1, read: false, icon: "🚨", titleAr: "x", titleEn: "x", bodyAr: "y", bodyEn: "y", createdAt: "2026-01-01T00:00:00" }]);

    const result = await getNotifications();

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].id).toBe(1);
  });
});
