import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { ResetPasswordForm } from "./ResetPasswordForm";

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("Rendering", () => {
    it("should render the form with all elements", () => {
      render(<ResetPasswordForm />);

      expect(screen.getByRole("heading", { name: /resetowanie hasła/i })).toBeInTheDocument();
      expect(screen.getByText(/podaj adres email powiązany z twoim kontem/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /wyślij link resetujący/i })).toBeInTheDocument();
    });

    it("should render back to login link", () => {
      render(<ResetPasswordForm />);

      const loginLink = screen.getByRole("link", { name: /powrót do logowania/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  describe("Client-side Validation", () => {
    it("should show error for empty email", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      const submitButton = screen.getByRole("button", { name: /wyślij link resetujący/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email jest wymagany/i)).toBeInTheDocument();
      });
    });

    it("should show error for invalid email format", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "invalid-email");

      const submitButton = screen.getByRole("button", { name: /wyślij link resetujący/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nieprawidłowy format email/i)).toBeInTheDocument();
      });
    });

    it("should clear field error when user starts typing", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      const submitButton = screen.getByRole("button", { name: /wyślij link resetujący/i });
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
    it("should show success message after valid submission", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", { name: /wyślij link resetujący/i });
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText(/link do resetowania hasła został wysłany na adres/i)).toBeInTheDocument();
          expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("should hide form and show success state after submission", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", { name: /wyślij link resetujący/i });
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
          expect(screen.queryByRole("button", { name: /wyślij link resetujący/i })).not.toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("should disable form during submission", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", { name: /wyślij link resetujący/i });
      await user.click(submitButton);

      // Should show loading state
      expect(submitButton).toHaveTextContent(/wysyłanie/i);
      expect(emailInput).toBeDisabled();

      await waitFor(
        () => {
          expect(screen.getByText(/link do resetowania hasła został wysłany na adres/i)).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-invalid attributes on error", async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      const submitButton = screen.getByRole("button", { name: /wyślij link resetujący/i });
      await user.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        expect(emailInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("should have proper autocomplete attributes", () => {
      render(<ResetPasswordForm />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("autocomplete", "email");
    });
  });
});
