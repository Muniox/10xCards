import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

// Mock window.location
const mockLocation = {
  href: "",
  search: "",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Mock window.history
const mockHistoryReplaceState = vi.fn();
Object.defineProperty(window, "history", {
  value: {
    replaceState: mockHistoryReplaceState,
  },
  writable: true,
});

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";
    mockLocation.search = "";
    global.fetch = vi.fn();
  });

  describe("Rendering", () => {
    it("should render the form with all fields", () => {
      render(<LoginForm />);

      expect(screen.getByRole("heading", { name: /zaloguj się/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hasło/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /zaloguj się/i })).toBeInTheDocument();
    });

    it("should render forgot password link", () => {
      render(<LoginForm />);

      const forgotPasswordLink = screen.getByRole("link", { name: /zapomniałeś hasła/i });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute("href", "/reset-password");
    });

    it("should render register link", () => {
      render(<LoginForm />);

      const registerLink = screen.getByRole("link", { name: /zarejestruj się/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute("href", "/register");
    });
  });

  describe("Success Message", () => {
    it("should display success message when redirected from registration", () => {
      mockLocation.search = "?registered=true";

      render(<LoginForm />);

      expect(screen.getByText(/konto zostało utworzone pomyślnie/i)).toBeInTheDocument();
      expect(mockHistoryReplaceState).toHaveBeenCalledWith({}, "", "/login");
    });

    it("should not display success message on normal load", () => {
      mockLocation.search = "";

      render(<LoginForm />);

      expect(screen.queryByText(/konto zostało utworzone pomyślnie/i)).not.toBeInTheDocument();
    });
  });

  describe("Client-side Validation", () => {
    it("should show error for empty email", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email jest wymagany/i)).toBeInTheDocument();
      });
    });

    it("should show error for invalid email format", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "invalid-email");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nieprawidłowy format email/i)).toBeInTheDocument();
      });
    });

    it("should show error for empty password", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/hasło jest wymagane/i)).toBeInTheDocument();
      });
    });

    it("should clear field error when user starts typing", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email jest wymagany/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "t");

      await waitFor(() => {
        expect(screen.queryByText(/email jest wymagany/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should successfully submit valid form data", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      global.fetch = mockFetch;

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com", password: "password123" }),
        });
      });

      expect(mockLocation.href).toBe("/app/dashboard");
    });

    it("should disable form during submission", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100);
          })
      );
      global.fetch = mockFetch;

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      expect(submitButton).toHaveTextContent(/logowanie/i);
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();

      await waitFor(() => {
        expect(mockLocation.href).toBe("/app/dashboard");
      });
    });
  });

  describe("Error Handling", () => {
    it("should show error for invalid credentials (401)", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "Unauthorized" } }),
      });
      global.fetch = mockFetch;

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nieprawidłowy email lub hasło/i)).toBeInTheDocument();
      });
    });

    it("should show field errors from backend (400)", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            details: {
              email: "Email jest wymagany",
              password: "Hasło musi mieć co najmniej 8 znaków",
            },
          },
        }),
      });
      global.fetch = mockFetch;

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "short");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/hasło musi mieć co najmniej 8 znaków/i)).toBeInTheDocument();
      });
    });

    it("should show generic error for other errors", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: "Internal server error" } }),
      });
      global.fetch = mockFetch;

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/wystąpił błąd\. spróbuj ponownie\./i)).toBeInTheDocument();
      });
    });

    it("should show network error when fetch fails", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));
      global.fetch = mockFetch;

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/brak połączenia z serwerem/i)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-invalid attributes on error", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /zaloguj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/hasło/i);
        expect(emailInput).toHaveAttribute("aria-invalid", "true");
        expect(passwordInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("should have proper autocomplete attributes", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/hasło/i);

      expect(emailInput).toHaveAttribute("autocomplete", "email");
      expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
    });
  });
});
