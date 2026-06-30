import { describe, expect, it } from "vitest";
import { analyzeText, checkCallStatus, freezeAccount, getActiveCases } from "../api/fraudService";

// VITE_USE_MOCKS defaults to true in this environment (no .env override in tests),
// so these calls should resolve with mock data without hitting the network.

describe("fraudService (mock mode)", () => {
  it("checkCallStatus returns a call status object", async () => {
    const result = await checkCallStatus();
    expect(result).toHaveProperty("hasActiveOfficialCall");
  });

  it("analyzeText returns a risk score and findings", async () => {
    const result = await analyzeText("نص مشبوه");
    expect(result.riskScore).toBeGreaterThan(0);
    expect(Array.isArray(result.findings)).toBe(true);
    expect(Array.isArray(result.interruptionQuestions)).toBe(true);
  });

  it("freezeAccount returns a report number", async () => {
    const result = await freezeAccount({ caseId: "CASE-1" });
    expect(result.success).toBe(true);
    expect(result.reportNumber).toMatch(/^FR-/);
  });

  it("getActiveCases returns stats and a cases list", async () => {
    const result = await getActiveCases();
    expect(result.stats).toBeDefined();
    expect(Array.isArray(result.cases)).toBe(true);
  });
});
