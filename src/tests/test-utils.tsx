import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Custom render function that wraps components with necessary providers
 * Add your providers here (e.g., ThemeProvider, QueryClientProvider, etc.)
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { ...options });
}

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

// Override render method
export { customRender as render };
