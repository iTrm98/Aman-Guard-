import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithApp } from "./test-utils";
import RiskReport from "../components/customer/RiskReport";

const mockResult = {
  riskScore: 95,
  riskLabelAr: "حرج",
  riskLabelEn: "Critical",
  findings: [{
    titleAr: "طلب رمز OTP",
    titleEn: "OTP Code Request",
    detailAr: "البنك لن يطلب منك رمز التحقق الخاص بك أبداً.",
    detailEn: "The bank will never ask you for your OTP.",
  }],
  recommendationAr: "لا تستجب للرسالة.",
  recommendationEn: "Do not respond to the message.",
  interruptionQuestions: [{ id: "q1", textAr: "هل طلب منك شخص ما تنفيذ هذه العملية؟", textEn: "Did someone ask you to perform this action?" }],
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
    expect(screen.getByText("حرج")).toBeInTheDocument();
    expect(screen.getByText(/طلب رمز OTP/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /تجميد طارئ للحساب/ })).toBeInTheDocument();
  });

  it("calls onFreezeRequest with the full analysis result when the freeze button is clicked", async () => {
    const onFreezeRequest = vi.fn();
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    const result = { ...mockResult, caseId: "CASE-1" };
    renderWithApp(<RiskReport result={result} onFreezeRequest={onFreezeRequest} />);
    await user.click(screen.getByRole("button", { name: /تجميد طارئ للحساب/ }));

    expect(onFreezeRequest).toHaveBeenCalledWith(result);
  });
});
