import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";

/**
 * Example React component test
 * This demonstrates how to test React components with React Testing Library
 */

// Simple example component for testing
function ExampleButton({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} data-testid="example-button">
      {children}
    </button>
  );
}

describe("ExampleButton Component", () => {
  it("should render button with text", () => {
    render(<ExampleButton>Click me</ExampleButton>);

    const button = screen.getByTestId("example-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Click me");
  });

  it("should call onClick when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<ExampleButton onClick={handleClick}>Click me</ExampleButton>);

    const button = screen.getByTestId("example-button");
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be accessible", () => {
    render(<ExampleButton>Accessible Button</ExampleButton>);

    const button = screen.getByRole("button", { name: /accessible button/i });
    expect(button).toBeInTheDocument();
  });
});
