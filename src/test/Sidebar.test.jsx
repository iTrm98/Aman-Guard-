import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithApp } from "./test-utils";
import Sidebar from "../components/layout/Sidebar";

describe("Sidebar mobile drawer", () => {
  it("shows the mobile overlay and closes it via the close button", async () => {
    const user = userEvent.setup();
    const onCloseMobile = vi.fn();
    const { container } = renderWithApp(
      <Sidebar view="customer" onSwitchView={vi.fn()} mobileOpen={true} onCloseMobile={onCloseMobile} />
    );

    expect(container.querySelector(".fixed.inset-0.z-40")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "إغلاق القائمة" }));
    expect(onCloseMobile).toHaveBeenCalledTimes(1);
  });

  it("does not render the overlay when closed", () => {
    const { container } = renderWithApp(
      <Sidebar view="customer" onSwitchView={vi.fn()} mobileOpen={false} onCloseMobile={vi.fn()} />
    );

    expect(container.querySelector(".fixed.inset-0.z-40")).not.toBeInTheDocument();
  });

  it("closes the mobile menu after selecting a nav item", async () => {
    const user = userEvent.setup();
    const onSwitchView = vi.fn();
    const onCloseMobile = vi.fn();
    renderWithApp(
      <Sidebar view="customer" onSwitchView={onSwitchView} mobileOpen={true} onCloseMobile={onCloseMobile} />
    );

    await user.click(screen.getByText("لوحة عمليات الأمن"));

    expect(onSwitchView).toHaveBeenCalledWith("bank");
    expect(onCloseMobile).toHaveBeenCalledTimes(1);
  });
});
