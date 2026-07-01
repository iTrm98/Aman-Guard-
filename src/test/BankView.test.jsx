import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderWithApp } from "./test-utils";
import BankView from "../views/BankView";

describe("BankView CSV export", () => {
  let createdAnchor;
  let clickSpy;
  const originalCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    clickSpy = vi.fn();
    createdAnchor = null;
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = originalCreateElement(tag);
      if (tag === "a") {
        el.click = clickSpy;
        createdAnchor = el;
      }
      return el;
    });
    globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("builds a CSV blob with the case rows and triggers a download", async () => {
    const user = userEvent.setup();
    renderWithApp(<BankView />);

    await waitFor(() => expect(screen.getByText("تركي السفياني")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "تصدير التقرير" }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blob = URL.createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe("text/csv;charset=utf-8;");

    const csvText = await blob.text();
    expect(csvText).toContain("ID,Customer,Pattern,Risk Score,Risk Level,Status,Time");
    expect(csvText).toContain("تركي السفياني");

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createdAnchor.download).toMatch(/^amanguard-cases-\d+\.csv$/);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
