import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { DeleteFlashcardDialog } from "./DeleteFlashcardDialog";
import type { FlashcardDTO } from "@/types";

describe("DeleteFlashcardDialog", () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  const mockFlashcard: FlashcardDTO = {
    id: 1,
    front: "Test Front",
    back: "Test Back",
    source: "manual",
    generation_id: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should not render when closed", () => {
      render(
        <DeleteFlashcardDialog
          isOpen={false}
          flashcard={mockFlashcard}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("should render when open", () => {
      render(
        <DeleteFlashcardDialog
          isOpen={true}
          flashcard={mockFlashcard}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByText(/usuń fiszkę/i)).toBeInTheDocument();
      expect(
        screen.getByText(/czy na pewno chcesz usunąć tę fiszkę\? ta operacja jest nieodwracalna\./i)
      ).toBeInTheDocument();
    });

    it("should display flashcard preview when flashcard is provided", () => {
      render(
        <DeleteFlashcardDialog
          isOpen={true}
          flashcard={mockFlashcard}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/przód:/i)).toBeInTheDocument();
      expect(screen.getByText("Test Front")).toBeInTheDocument();
    });

    it("should not display preview when flashcard is null", () => {
      render(<DeleteFlashcardDialog isOpen={true} flashcard={null} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

      expect(screen.queryByText(/przód:/i)).not.toBeInTheDocument();
    });

    it("should render action buttons", () => {
      render(
        <DeleteFlashcardDialog
          isOpen={true}
          flashcard={mockFlashcard}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByRole("button", { name: /anuluj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /usuń/i })).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should call onClose when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <DeleteFlashcardDialog
          isOpen={true}
          flashcard={mockFlashcard}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it("should call onConfirm when delete button is clicked", async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValueOnce(undefined);

      render(
        <DeleteFlashcardDialog
          isOpen={true}
          flashcard={mockFlashcard}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe("Loading State", () => {
    it("should show loading text during deletion", async () => {
      const user = userEvent.setup();
      let resolveConfirm: (() => void) | undefined;
      const confirmPromise = new Promise<void>((resolve) => {
        resolveConfirm = resolve;
      });
      mockOnConfirm.mockReturnValueOnce(confirmPromise);

      render(
        <DeleteFlashcardDialog
          isOpen={true}
          flashcard={mockFlashcard}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      expect(screen.getByText(/usuwanie\.\.\./i)).toBeInTheDocument();

      // Clean up
      if (resolveConfirm) {
        resolveConfirm();
      }
      await confirmPromise;
    });

    it("should disable buttons during deletion", async () => {
      const user = userEvent.setup();
      let resolveConfirm: (() => void) | undefined;
      const confirmPromise = new Promise<void>((resolve) => {
        resolveConfirm = resolve;
      });
      mockOnConfirm.mockReturnValueOnce(confirmPromise);

      render(
        <DeleteFlashcardDialog
          isOpen={true}
          flashcard={mockFlashcard}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      const cancelButton = screen.getByRole("button", { name: /anuluj/i });

      await user.click(deleteButton);

      expect(deleteButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();

      // Clean up
      if (resolveConfirm) {
        resolveConfirm();
      }
      await confirmPromise;
    });
  });

  describe("Edge Cases", () => {
    it("should handle long flashcard front text", () => {
      const longFlashcard: FlashcardDTO = {
        ...mockFlashcard,
        front: "This is a very long text that should be truncated with line-clamp-2 class".repeat(10),
      };

      render(
        <DeleteFlashcardDialog
          isOpen={true}
          flashcard={longFlashcard}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const flashcardPreview = screen.getByText(/this is a very long text/i);
      expect(flashcardPreview).toBeInTheDocument();
      expect(flashcardPreview).toHaveClass("line-clamp-2");
    });

    it("should handle errors from onConfirm gracefully", async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockRejectedValueOnce(new Error("Delete failed"));

      render(
        <DeleteFlashcardDialog
          isOpen={true}
          flashcard={mockFlashcard}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const deleteButton = screen.getByRole("button", { name: /^usuń$/i });
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      // Component should still be functional after error
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });
  });
});
