import { render } from "@testing-library/react";
import { AppProvider } from "../context/AppContext";

// Every component under src/components and src/views reads from AppContext
// via useApp(), so tests need a real provider in the tree, not a bare render.
export function renderWithApp(ui, options) {
  return render(ui, { wrapper: AppProvider, ...options });
}
