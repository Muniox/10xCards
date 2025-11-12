import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { PaginationControls } from "./PaginationControls";
import type { PaginationMeta } from "@/types";

describe("PaginationControls", () => {
  const mockOnPageChange = vi.fn();

  const defaultPagination: PaginationMeta = {
    page: 2,
    limit: 10,
    total: 50,
    total_pages: 5,
  };

  describe("Rendering", () => {
    it("should render pagination information", () => {
      render(<PaginationControls pagination={defaultPagination} onPageChange={mockOnPageChange} />);

      expect(screen.getByText(/strona 2 z 5/i)).toBeInTheDocument();
      expect(screen.getByText(/wyświetlono 11-20 z 50/i)).toBeInTheDocument();
    });

    it("should render navigation buttons", () => {
      render(<PaginationControls pagination={defaultPagination} onPageChange={mockOnPageChange} />);

      expect(screen.getByRole("button", { name: /poprzednia strona/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /następna strona/i })).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should call onPageChange with previous page when clicking previous button", async () => {
      const user = userEvent.setup();
      render(<PaginationControls pagination={defaultPagination} onPageChange={mockOnPageChange} />);

      const previousButton = screen.getByRole("button", { name: /poprzednia strona/i });
      await user.click(previousButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it("should call onPageChange with next page when clicking next button", async () => {
      const user = userEvent.setup();
      render(<PaginationControls pagination={defaultPagination} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByRole("button", { name: /następna strona/i });
      await user.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });
  });

  describe("Disabled States", () => {
    it("should disable previous button on first page", () => {
      const firstPagePagination: PaginationMeta = {
        page: 1,
        limit: 10,
        total: 50,
        total_pages: 5,
      };

      render(<PaginationControls pagination={firstPagePagination} onPageChange={mockOnPageChange} />);

      const previousButton = screen.getByRole("button", { name: /poprzednia strona/i });
      expect(previousButton).toBeDisabled();
    });

    it("should disable next button on last page", () => {
      const lastPagePagination: PaginationMeta = {
        page: 5,
        limit: 10,
        total: 50,
        total_pages: 5,
      };

      render(<PaginationControls pagination={lastPagePagination} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByRole("button", { name: /następna strona/i });
      expect(nextButton).toBeDisabled();
    });

    it("should disable next button when total is 0", () => {
      const emptyPagination: PaginationMeta = {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
      };

      render(<PaginationControls pagination={emptyPagination} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByRole("button", { name: /następna strona/i });
      expect(nextButton).toBeDisabled();
    });

    it("should enable both buttons on middle page", () => {
      render(<PaginationControls pagination={defaultPagination} onPageChange={mockOnPageChange} />);

      const previousButton = screen.getByRole("button", { name: /poprzednia strona/i });
      const nextButton = screen.getByRole("button", { name: /następna strona/i });

      expect(previousButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle single page correctly", () => {
      const singlePagePagination: PaginationMeta = {
        page: 1,
        limit: 10,
        total: 5,
        total_pages: 1,
      };

      render(<PaginationControls pagination={singlePagePagination} onPageChange={mockOnPageChange} />);

      expect(screen.getByText(/strona 1 z 1/i)).toBeInTheDocument();
      expect(screen.getByText(/wyświetlono 1-5 z 5/i)).toBeInTheDocument();

      const previousButton = screen.getByRole("button", { name: /poprzednia strona/i });
      const nextButton = screen.getByRole("button", { name: /następna strona/i });

      expect(previousButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it("should calculate correct item range for first page", () => {
      const firstPagePagination: PaginationMeta = {
        page: 1,
        limit: 10,
        total: 50,
        total_pages: 5,
      };

      render(<PaginationControls pagination={firstPagePagination} onPageChange={mockOnPageChange} />);

      expect(screen.getByText(/wyświetlono 1-10 z 50/i)).toBeInTheDocument();
    });

    it("should calculate correct item range for last page with partial items", () => {
      const lastPagePagination: PaginationMeta = {
        page: 3,
        limit: 10,
        total: 25,
        total_pages: 3,
      };

      render(<PaginationControls pagination={lastPagePagination} onPageChange={mockOnPageChange} />);

      expect(screen.getByText(/wyświetlono 21-25 z 25/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-label on buttons", () => {
      render(<PaginationControls pagination={defaultPagination} onPageChange={mockOnPageChange} />);

      const previousButton = screen.getByLabelText(/poprzednia strona/i);
      const nextButton = screen.getByLabelText(/następna strona/i);

      expect(previousButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it("should have aria-hidden on icons", () => {
      const { container } = render(
        <PaginationControls pagination={defaultPagination} onPageChange={mockOnPageChange} />
      );

      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
