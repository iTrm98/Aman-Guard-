import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithApp } from "./test-utils";
import Sidebar from "../components/layout/Sidebar";

// AppProvider reads the current user from localStorage["amanguard_user"] at
// mount, so seeding it before render sets the role the Sidebar filters nav by.
function seedRole(role) {
  localStorage.setItem(
    "amanguard_user",
    JSON.stringify({ name: "مستخدم", nameEn: "User", role })
  );
}

afterEach(() => {
  localStorage.clear();
});

describe("Sidebar mobile drawer", () => {
  it("closes the drawer via the close button on mobile", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithApp(
      <Sidebar view="customer" onSwitchView={vi.fn()} isOpen={true} isMobile={true} onClose={onClose} />
    );

    await user.click(screen.getByRole("button", { name: "إغلاق القائمة" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render the drawer close button on desktop", () => {
    renderWithApp(
      <Sidebar view="customer" onSwitchView={vi.fn()} isOpen={true} isMobile={false} onClose={vi.fn()} />
    );

    expect(screen.queryByRole("button", { name: "إغلاق القائمة" })).not.toBeInTheDocument();
  });
});

describe("Sidebar role-based nav", () => {
  it("shows only the customer portal item for a customer", async () => {
    const user = userEvent.setup();
    const onSwitchView = vi.fn();
    const onClose = vi.fn();
    seedRole("CUSTOMER");
    renderWithApp(
      <Sidebar view="customer" onSwitchView={onSwitchView} isOpen={true} isMobile={true} onClose={onClose} />
    );

    expect(screen.getByText("بوابة العميل الآمنة")).toBeInTheDocument();
    // The bank dashboard item must not exist in the DOM for a customer.
    expect(screen.queryByText("لوحة عمليات الأمن")).not.toBeInTheDocument();

    await user.click(screen.getByText("بوابة العميل الآمنة"));
    expect(onSwitchView).toHaveBeenCalledWith("customer");
    // Navigating on mobile closes the drawer.
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows only the bank dashboard item for a bank officer", async () => {
    const user = userEvent.setup();
    const onSwitchView = vi.fn();
    const onClose = vi.fn();
    seedRole("BANK_OFFICER");
    renderWithApp(
      <Sidebar view="bank" onSwitchView={onSwitchView} isOpen={true} isMobile={true} onClose={onClose} />
    );

    expect(screen.getByText("لوحة عمليات الأمن")).toBeInTheDocument();
    // The customer portal item must not exist in the DOM for an officer.
    expect(screen.queryByText("بوابة العميل الآمنة")).not.toBeInTheDocument();

    await user.click(screen.getByText("لوحة عمليات الأمن"));
    expect(onSwitchView).toHaveBeenCalledWith("bank");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
