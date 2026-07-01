import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithApp } from "./test-utils";
import RiskReport from "../components/customer/RiskReport";

const mockResult = {
  riskScore: 95,
  riskLabel: "حرج (Critical)",
  findings: [{ title: "طلب رمز OTP", detail: "البنك لن يطلب منك رمز التحقق الخاص بك أبداً." }],
  recommendation: "لا تستجب للرسالة.",
  interruptionQuestions: [{ id: "q1", text: "هل طلب منك شخص ما تنفيذ هذه العملية؟" }],
  caseId: null,
};

describe("RiskReport", () => {
  it("renders nothing when there is no result", () => {
    const { container } = renderWithApp(<RiskReport result={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the risk score, findings, and freeze button", () => {
    renderWithApp(<RiskReport result={mockResult} onFreezeRequest={vi.fn()} />);

    expect(screen.getByText("95")).toBeInTheDocument();
    expect(screen.getByText("حرج (Critical)")).toBeInTheDocument();
    expect(screen.getByText(/طلب رمز OTP/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /تجميد طارئ للحساب/ })).toBeInTheDocument();
  });

  it("calls onFreezeRequest with the case id when the freeze button is clicked", async () => {
    const onFreezeRequest = vi.fn();
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    renderWithApp(<RiskReport result={{ ...mockResult, caseId: "CASE-1" }} onFreezeRequest={onFreezeRequest} />);
    await user.click(screen.getByRole("button", { name: /تجميد طارئ للحساب/ }));

    expect(onFreezeRequest).toHaveBeenCalledWith("CASE-1");
  });
});
