import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import * as XLSX from "xlsx";
import { renderWithApp } from "./test-utils";
import BankView from "../views/BankView";
import { getActiveCases } from "../api/fraudService";

vi.mock("../api/fraudService", async (importOriginal) => ({
  ...(await importOriginal()),
  getActiveCases: vi.fn(),
}));

vi.mock("xlsx", async (importOriginal) => ({
  ...(await importOriginal()),
  writeFile: vi.fn(),
}));

const CASES_FIXTURE = {
  stats: { criticalToday: 1, suspectedCases: 2, accountsFrozen: 1, amountSaved: "5,000" },
  cases: [
    {
      id: "FR-9001", caseId: 1, createdAt: "2026-07-02T00:00:00",
      customerName: "تركي السفياني", fraudPattern: "رابط شحنة وهمي",
      riskScore: 82, riskLevel: "high", accountStatus: "active",
      freezeRequestId: null, freezeStatus: "none",
    },
  ],
};

// xlsx's write_dl() prefers a Node fs.writeFileSync path over the browser
// Blob/URL.createObjectURL download path whenever it detects Node's `fs`
// module is available — which it always is under Vitest, even with the
// jsdom environment. So we spy on XLSX.writeFile itself rather than the
// browser download plumbing it would use in a real browser.
describe("BankView export", () => {
  beforeEach(() => {
    getActiveCases.mockResolvedValue(CASES_FIXTURE);
    XLSX.writeFile.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds a workbook with a timestamp row and the case rows, then writes an xlsx file", async () => {
    const user = userEvent.setup();
    renderWithApp(<BankView />);

    await waitFor(() => expect(screen.getByText("تركي السفياني")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "تصدير التقرير" }));

    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
    const [workbook, filename] = XLSX.writeFile.mock.calls[0];
    expect(filename).toMatch(/^amanguard-cases-\d+\.xlsx$/);
    expect(workbook.SheetNames).toContain("الحالات");

    const sheet = workbook.Sheets["الحالات"];
    // A1 holds the export-generation timestamp; the data table (with its
    // own header row) starts at A2, so parse from row index 1.
    expect(sheet["A1"].v).toContain("تاريخ التصدير");
    const rows = XLSX.utils.sheet_to_json(sheet, { range: 1 });
    expect(rows[0]["العميل"]).toBe("تركي السفياني");
    expect(rows[0]["التاريخ والوقت"]).toBeTruthy();
  });
});
