import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./RegisterForm";

// Mock window.location
const mockLocation = {
  href: "",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";
    global.fetch = vi.fn();
  });

  describe("Rendering", () => {
    it("should render the form with all fields", () => {
      render(<RegisterForm />);

      expect(screen.getByRole("heading", { name: /utwórz konto/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^hasło$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/powtórz hasło/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /zarejestruj się/i })).toBeInTheDocument();
    });

    it("should render login link", () => {
      render(<RegisterForm />);

      const loginLink = screen.getByRole("link", { name: /zaloguj się/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  describe("Client-side Validation", () => {
    it("should show error for empty email", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email jest wymagany/i)).toBeInTheDocument();
      });
    });

    it("should show error for invalid email format", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      await user.type(emailInput, "invalid-email");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nieprawidłowy format email/i)).toBeInTheDocument();
      });
    });

    it("should show error for short password", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "short");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/hasło musi mieć co najmniej 8 znaków/i)).toBeInTheDocument();
      });
    });

    it("should show error when passwords don't match", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "different123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/hasła muszą być identyczne/i)).toBeInTheDocument();
      });
    });

    it("should clear field error when user starts typing", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email jest wymagany/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/^email$/i);
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

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło/i);

      await user.type(emailInput, "newuser@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "newuser@example.com",
            password: "password123",
            confirmPassword: "password123",
          }),
        });
      });

      expect(mockLocation.href).toBe("/login?registered=true");
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

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło/i);

      await user.type(emailInput, "newuser@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      expect(submitButton).toHaveTextContent(/rejestracja/i);
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();

      await waitFor(() => {
        expect(mockLocation.href).toBe("/login?registered=true");
      });
    });
  });

  describe("Error Handling", () => {
    it("should show error when email already exists (409)", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: { message: "Email already exists" } }),
      });
      global.fetch = mockFetch;

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło/i);

      await user.type(emailInput, "existing@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ten email jest już zarejestrowany/i)).toBeInTheDocument();
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
              password: "Hasło jest zbyt słabe",
            },
          },
        }),
      });
      global.fetch = mockFetch;

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "weakpass");
      await user.type(confirmPasswordInput, "weakpass");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/hasło jest zbyt słabe/i)).toBeInTheDocument();
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

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/wystąpił błąd\. spróbuj ponownie\./i)).toBeInTheDocument();
      });
    });

    it("should show network error when fetch fails", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));
      global.fetch = mockFetch;

      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/brak połączenia z serwerem/i)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-invalid attributes on error", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const submitButton = screen.getByRole("button", { name: /zarejestruj się/i });
      await user.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/^email$/i);
        const passwordInput = screen.getByLabelText(/^hasło$/i);
        const confirmPasswordInput = screen.getByLabelText(/powtórz hasło/i);
        expect(emailInput).toHaveAttribute("aria-invalid", "true");
        expect(passwordInput).toHaveAttribute("aria-invalid", "true");
        expect(confirmPasswordInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("should have proper autocomplete attributes", () => {
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^hasło$/i);
      const confirmPasswordInput = screen.getByLabelText(/powtórz hasło/i);

      expect(emailInput).toHaveAttribute("autocomplete", "email");
      expect(passwordInput).toHaveAttribute("autocomplete", "new-password");
      expect(confirmPasswordInput).toHaveAttribute("autocomplete", "new-password");
    });
  });
});
