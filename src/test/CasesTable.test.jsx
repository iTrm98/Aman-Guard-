import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithApp } from "./test-utils";
import CasesTable from "../components/bank/CasesTable";

const cases = [
  {
    id: "FR-9021",
    createdAt: "2026-07-02T03:45:00",
    customerName: "تركي السفياني",
    fraudPattern: "رابط شحنة وهمي",
    riskScore: 82,
    riskLevel: "high",
    accountStatus: "active",
  },
  {
    id: "FR-9020",
    createdAt: "2026-07-02T04:00:00",
    customerName: "نواف العتيبي",
    fraudPattern: "احتيال OTP",
    riskScore: 95,
    riskLevel: "critical",
    accountStatus: "frozen",
  },
];

describe("CasesTable", () => {
  it("renders a row for each case with its risk score", () => {
    renderWithApp(<CasesTable cases={cases} onRefresh={vi.fn()} />);

    expect(screen.getByText("تركي السفياني")).toBeInTheDocument();
    expect(screen.getByText("نواف العتيبي")).toBeInTheDocument();
    expect(screen.getByText(/82 —/)).toBeInTheDocument();
    expect(screen.getByText(/95 —/)).toBeInTheDocument();
  });

  it("shows the staff confirmation button only for the highlighted case", () => {
    renderWithApp(<CasesTable cases={cases} onRefresh={vi.fn()} highlightId="FR-9020" />);

    expect(screen.getByRole("button", { name: /تأكيد التجميد والتواصل/ })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /مراجعة الحالة/ })).toHaveLength(1);
  });
});
