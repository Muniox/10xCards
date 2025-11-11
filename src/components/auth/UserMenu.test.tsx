import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "./UserMenu";

// Mock window.location
const mockLocation = {
  href: "",
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("UserMenu", () => {
  const userEmail = "test@example.com";

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";
    global.fetch = vi.fn();
  });

  describe("Rendering", () => {
    it("should render user menu trigger button", () => {
      render(<UserMenu userEmail={userEmail} />);

      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should display truncated email on desktop", () => {
      render(<UserMenu userEmail={userEmail} />);

      const emailSpan = screen.getByText(userEmail);
      expect(emailSpan).toHaveClass("hidden", "md:inline-block");
    });

    it("should open menu when trigger is clicked", async () => {
      const user = userEvent.setup();
      render(<UserMenu userEmail={userEmail} />);

      const triggerButton = screen.getByRole("button");
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText(/moje konto/i)).toBeInTheDocument();
      });
    });
  });

  describe("Menu Content", () => {
    it("should display account info in menu", async () => {
      const user = userEvent.setup();
      render(<UserMenu userEmail={userEmail} />);

      const triggerButton = screen.getByRole("button");
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText(/moje konto/i)).toBeInTheDocument();
        expect(screen.getAllByText(userEmail).length).toBeGreaterThan(0);
      });
    });

    it("should display settings link", async () => {
      const user = userEvent.setup();
      render(<UserMenu userEmail={userEmail} />);

      const triggerButton = screen.getByRole("button");
      await user.click(triggerButton);

      await waitFor(() => {
        const settingsLink = screen.getByRole("link", { name: /ustawienia konta/i });
        expect(settingsLink).toHaveAttribute("href", "/app/settings");
      });
    });

    it("should display logout button", async () => {
      const user = userEvent.setup();
      render(<UserMenu userEmail={userEmail} />);

      const triggerButton = screen.getByRole("button");
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole("menuitem", { name: /wyloguj się/i })).toBeInTheDocument();
      });
    });
  });

  describe("Logout Functionality", () => {
    it("should successfully logout and redirect", async () => {
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      global.fetch = mockFetch;

      render(<UserMenu userEmail={userEmail} />);

      const triggerButton = screen.getByRole("button");
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole("menuitem", { name: /wyloguj się/i })).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole("menuitem", { name: /wyloguj się/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      });

      expect(mockLocation.href).toBe("/");
    });

    it("should disable menu during logout", async () => {
      const user = userEvent.setup();
      let resolveLogout: (value: unknown) => void;
      const logoutPromise = new Promise((resolve) => {
        resolveLogout = resolve;
      });
      const mockFetch = vi.fn().mockReturnValueOnce(logoutPromise);
      global.fetch = mockFetch;

      render(<UserMenu userEmail={userEmail} />);

      const triggerButton = screen.getByRole("button");
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole("menuitem", { name: /wyloguj się/i })).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole("menuitem", { name: /wyloguj się/i });
      await user.click(logoutButton);

      expect(triggerButton).toBeDisabled();
      expect(screen.getByText(/wylogowywanie\.\.\./i)).toBeInTheDocument();

      // Clean up
      resolveLogout!({ ok: true, json: async () => ({}) });
      await logoutPromise;
      await waitFor(() => {
        expect(mockLocation.href).toBe("/");
      });
    });
  });

  describe("Error Handling", () => {
    it("should show alert when logout fails with non-ok response", async () => {
      const user = userEvent.setup();
      const mockAlert = vi.spyOn(window, "alert").mockImplementation(() => {});
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      global.fetch = mockFetch;

      render(<UserMenu userEmail={userEmail} />);

      const triggerButton = screen.getByRole("button");
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole("menuitem", { name: /wyloguj się/i })).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole("menuitem", { name: /wyloguj się/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("Nie udało się wylogować. Spróbuj ponownie.");
      });

      expect(mockLocation.href).toBe("");
      mockAlert.mockRestore();
    });

    it("should show alert when network error occurs", async () => {
      const user = userEvent.setup();
      const mockAlert = vi.spyOn(window, "alert").mockImplementation(() => {});
      const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));
      global.fetch = mockFetch;

      render(<UserMenu userEmail={userEmail} />);

      const triggerButton = screen.getByRole("button");
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole("menuitem", { name: /wyloguj się/i })).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole("menuitem", { name: /wyloguj się/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("Brak połączenia z serwerem");
      });

      expect(mockLocation.href).toBe("");
      mockAlert.mockRestore();
    });

    it("should re-enable menu after logout error", async () => {
      const user = userEvent.setup();
      const mockAlert = vi.spyOn(window, "alert").mockImplementation(() => {});
      const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));
      global.fetch = mockFetch;

      render(<UserMenu userEmail={userEmail} />);

      const triggerButton = screen.getByRole("button");
      await user.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByRole("menuitem", { name: /wyloguj się/i })).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole("menuitem", { name: /wyloguj się/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });

      expect(triggerButton).not.toBeDisabled();
      mockAlert.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    it("should truncate long email addresses", () => {
      const longEmail = "verylongemailaddress@verylongdomainname.com";
      render(<UserMenu userEmail={longEmail} />);

      const emailSpan = screen.getByText(longEmail);
      expect(emailSpan).toHaveClass("truncate", "max-w-[150px]");
    });
  });
});
