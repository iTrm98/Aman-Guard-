import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithApp } from "./test-utils";
import SettingsPanel from "../components/layout/SettingsPanel";

describe("SettingsPanel", () => {
  it("applies theme and language changes to the document root", async () => {
    const user = userEvent.setup();
    renderWithApp(<SettingsPanel onClose={vi.fn()} />);

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");

    await user.click(screen.getByRole("button", { name: /داكن/ }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    await user.click(screen.getByRole("button", { name: /الإنجليزية/ }));
    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
    expect(document.documentElement.getAttribute("lang")).toBe("en");
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithApp(<SettingsPanel onClose={onClose} />);

    const closeButton = document.querySelector(".panel-drawer button");
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
