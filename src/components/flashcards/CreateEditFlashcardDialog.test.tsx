import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { CreateEditFlashcardDialog } from "./CreateEditFlashcardDialog";
import type { FlashcardDTO } from "@/types";
import { FLASHCARD_LIMITS } from "@/lib/constants/flashcards";

describe("CreateEditFlashcardDialog", () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  const mockFlashcard: FlashcardDTO = {
    id: 1,
    front: "Existing Front",
    back: "Existing Back",
    source: "manual",
    generation_id: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe("Rendering - Create Mode", () => {
    it("should render dialog in create mode", () => {
      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.getByText("Dodaj fiszkę")).toBeInTheDocument();
      expect(screen.getByText(/stwórz nową fiszkę wprowadzając treść przodu i tyłu\./i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /dodaj/i })).toBeInTheDocument();
    });

    it("should render empty form fields in create mode", () => {
      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      const backInput = screen.getByLabelText(/tył fiszki/i);

      expect(frontInput).toHaveValue("");
      expect(backInput).toHaveValue("");
    });
  });

  describe("Rendering - Edit Mode", () => {
    it("should render dialog in edit mode", () => {
      render(
        <CreateEditFlashcardDialog
          isOpen={true}
          mode="edit"
          flashcard={mockFlashcard}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText("Edytuj fiszkę")).toBeInTheDocument();
      expect(screen.getByText(/edytuj treść przodu i tyłu fiszki\./i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /zapisz/i })).toBeInTheDocument();
    });

    it("should populate form fields with flashcard data in edit mode", () => {
      render(
        <CreateEditFlashcardDialog
          isOpen={true}
          mode="edit"
          flashcard={mockFlashcard}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      const backInput = screen.getByLabelText(/tył fiszki/i);

      expect(frontInput).toHaveValue("Existing Front");
      expect(backInput).toHaveValue("Existing Back");
    });

    it("should reset form when opening with different flashcard", () => {
      const { rerender } = render(
        <CreateEditFlashcardDialog
          isOpen={true}
          mode="edit"
          flashcard={mockFlashcard}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const newFlashcard: FlashcardDTO = {
        ...mockFlashcard,
        id: 2,
        front: "New Front",
        back: "New Back",
      };

      rerender(
        <CreateEditFlashcardDialog
          isOpen={true}
          mode="edit"
          flashcard={newFlashcard}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      const backInput = screen.getByLabelText(/tył fiszki/i);

      expect(frontInput).toHaveValue("New Front");
      expect(backInput).toHaveValue("New Back");
    });
  });

  describe("Form Interaction", () => {
    it("should update character counter when typing", async () => {
      const user = userEvent.setup();
      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      await user.type(frontInput, "Test");

      expect(screen.getByText(`4 / ${FLASHCARD_LIMITS.FRONT_MAX_LENGTH}`)).toBeInTheDocument();
    });

    it("should clear errors when user starts typing", async () => {
      const user = userEvent.setup();
      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole("button", { name: /dodaj/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/przód fiszki jest wymagany/i)).toBeInTheDocument();
      });

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      await user.type(frontInput, "T");

      await waitFor(() => {
        expect(screen.queryByText(/przód fiszki jest wymagany/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Validation", () => {
    it("should show error for empty front field", async () => {
      const user = userEvent.setup();
      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const backInput = screen.getByLabelText(/tył fiszki/i);
      await user.type(backInput, "Back text");

      const submitButton = screen.getByRole("button", { name: /dodaj/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/przód fiszki jest wymagany/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should show error for empty back field", async () => {
      const user = userEvent.setup();
      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      await user.type(frontInput, "Front text");

      const submitButton = screen.getByRole("button", { name: /dodaj/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/tył fiszki jest wymagany/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should show error when front exceeds max length", async () => {
      const user = userEvent.setup();
      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      const longText = "a".repeat(FLASHCARD_LIMITS.FRONT_MAX_LENGTH + 1);
      await user.type(frontInput, longText);

      const backInput = screen.getByLabelText(/tył fiszki/i);
      await user.type(backInput, "Back text");

      const submitButton = screen.getByRole("button", { name: /dodaj/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(`Maksymalnie ${FLASHCARD_LIMITS.FRONT_MAX_LENGTH} znaków`)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should show error when back exceeds max length", async () => {
      const user = userEvent.setup();
      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      await user.type(frontInput, "Front text");

      const backInput = screen.getByLabelText(/tył fiszki/i);
      const longText = "a".repeat(FLASHCARD_LIMITS.BACK_MAX_LENGTH + 1);
      await user.type(backInput, longText);

      const submitButton = screen.getByRole("button", { name: /dodaj/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(`Maksymalnie ${FLASHCARD_LIMITS.BACK_MAX_LENGTH} znaków`)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should trim whitespace before validation", async () => {
      const user = userEvent.setup();
      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      const backInput = screen.getByLabelText(/tył fiszki/i);

      await user.type(frontInput, "   ");
      await user.type(backInput, "   ");

      const submitButton = screen.getByRole("button", { name: /dodaj/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/przód fiszki jest wymagany/i)).toBeInTheDocument();
        expect(screen.getByText(/tył fiszki jest wymagany/i)).toBeInTheDocument();
      });
    });
  });

  describe("Form Submission", () => {
    it("should successfully submit valid form in create mode", async () => {
      const user = userEvent.setup();
      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      const backInput = screen.getByLabelText(/tył fiszki/i);

      await user.type(frontInput, "New Front");
      await user.type(backInput, "New Back");

      const submitButton = screen.getByRole("button", { name: /dodaj/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          front: "New Front",
          back: "New Back",
        });
      });
    });

    it("should successfully submit valid form in edit mode", async () => {
      const user = userEvent.setup();
      render(
        <CreateEditFlashcardDialog
          isOpen={true}
          mode="edit"
          flashcard={mockFlashcard}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      await user.clear(frontInput);
      await user.type(frontInput, "Updated Front");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          front: "Updated Front",
          back: "Existing Back",
        });
      });
    });

    it("should disable form during submission", async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValueOnce(submitPromise);

      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      const backInput = screen.getByLabelText(/tył fiszki/i);

      await user.type(frontInput, "Front");
      await user.type(backInput, "Back");

      const submitButton = screen.getByRole("button", { name: /dodaj/i });
      await user.click(submitButton);

      expect(screen.getByText(/zapisywanie\.\.\./i)).toBeInTheDocument();
      expect(frontInput).toBeDisabled();
      expect(backInput).toBeDisabled();

      // Clean up
      resolveSubmit!();
      await submitPromise;
    });

    it("should close dialog after successful submission", async () => {
      const user = userEvent.setup();
      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      const backInput = screen.getByLabelText(/tył fiszki/i);

      await user.type(frontInput, "Front");
      await user.type(backInput, "Back");

      const submitButton = screen.getByRole("button", { name: /dodaj/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("Error Handling", () => {
    it("should display error message when submission fails", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValueOnce(new Error("Failed to create flashcard"));

      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      const backInput = screen.getByLabelText(/tył fiszki/i);

      await user.type(frontInput, "Front");
      await user.type(backInput, "Back");

      const submitButton = screen.getByRole("button", { name: /dodaj/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create flashcard/i)).toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should not close dialog when submission fails", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValueOnce(new Error("Error"));

      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const frontInput = screen.getByLabelText(/przód fiszki/i);
      const backInput = screen.getByLabelText(/tył fiszki/i);

      await user.type(frontInput, "Front");
      await user.type(backInput, "Back");

      const submitButton = screen.getByRole("button", { name: /dodaj/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Dialog Interactions", () => {
    it("should call onClose when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should not render when closed", () => {
      render(<CreateEditFlashcardDialog isOpen={false} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-invalid attributes", async () => {
      const user = userEvent.setup();
      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole("button", { name: /dodaj/i });
      await user.click(submitButton);

      await waitFor(() => {
        const frontInput = screen.getByLabelText(/przód fiszki/i);
        const backInput = screen.getByLabelText(/tył fiszki/i);
        expect(frontInput).toHaveAttribute("aria-invalid", "true");
        expect(backInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("should have proper aria-describedby for error messages", async () => {
      const user = userEvent.setup();
      render(<CreateEditFlashcardDialog isOpen={true} mode="create" onClose={mockOnClose} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole("button", { name: /dodaj/i });
      await user.click(submitButton);

      await waitFor(() => {
        const frontInput = screen.getByLabelText(/przód fiszki/i);
        expect(frontInput).toHaveAttribute("aria-describedby", "front-error");
      });
    });
  });
});
