import { describe, it, expect } from "vitest";
import { render, screen } from "@/tests/test-utils";
import { StatisticsGrid } from "./StatisticsGrid";
import type { GenerationStatisticsDTO } from "@/types";

describe("StatisticsGrid", () => {
  const mockStatistics: GenerationStatisticsDTO = {
    total_generations: 42,
    total_generated_flashcards: 250,
    total_accepted_flashcards: 200,
    total_accepted_unedited: 150,
    total_accepted_edited: 50,
    acceptance_rate: 80.0,
    unedited_acceptance_rate: 60.0,
    average_generation_duration: 3.5,
    most_used_model: "gpt-4",
    period: "week",
  };

  describe("Rendering", () => {
    it("should render all statistics cards", () => {
      render(<StatisticsGrid statistics={mockStatistics} />);

      expect(screen.getByText(/łączna liczba generacji/i)).toBeInTheDocument();
      expect(screen.getByText(/wygenerowane fiszki/i)).toBeInTheDocument();
      expect(screen.getByText(/zaakceptowane fiszki/i)).toBeInTheDocument();
      expect(screen.getByText(/współczynnik akceptacji/i)).toBeInTheDocument();
      expect(screen.getByText(/akceptacja bez edycji/i)).toBeInTheDocument();
      expect(screen.getByText(/średni czas generowania/i)).toBeInTheDocument();
      expect(screen.getByText(/najczęściej używany model/i)).toBeInTheDocument();
    });

    it("should display correct values", () => {
      render(<StatisticsGrid statistics={mockStatistics} />);

      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("250")).toBeInTheDocument();
      expect(screen.getByText("200")).toBeInTheDocument();
      expect(screen.getByText(/80%/i)).toBeInTheDocument();
      expect(screen.getByText(/60%/i)).toBeInTheDocument();
      expect(screen.getByText("gpt-4")).toBeInTheDocument();
    });

    it("should render descriptions for each card", () => {
      render(<StatisticsGrid statistics={mockStatistics} />);

      expect(screen.getByText(/ile razy użyłeś ai do generowania fiszek/i)).toBeInTheDocument();
      expect(screen.getByText(/łączna liczba fiszek stworzonych przez ai/i)).toBeInTheDocument();
      expect(screen.getByText(/fiszki, które zaakceptowałeś do nauki/i)).toBeInTheDocument();
      expect(screen.getByText(/procent fiszek, które zaakceptowałeś/i)).toBeInTheDocument();
      expect(screen.getByText(/procent fiszek zaakceptowanych bez zmian/i)).toBeInTheDocument();
      expect(screen.getByText(/ile czasu zajmuje wygenerowanie fiszek/i)).toBeInTheDocument();
      expect(screen.getByText(/model ai, z którego korzystasz najczęściej/i)).toBeInTheDocument();
    });

    it("should render icons for each card", () => {
      const { container } = render(<StatisticsGrid statistics={mockStatistics} />);

      const icons = container.querySelectorAll("svg");
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero values correctly", () => {
      const zeroStatistics: GenerationStatisticsDTO = {
        total_generations: 0,
        total_generated_flashcards: 0,
        total_accepted_flashcards: 0,
        total_accepted_unedited: 0,
        total_accepted_edited: 0,
        acceptance_rate: 0.0,
        unedited_acceptance_rate: 0.0,
        average_generation_duration: 0.0,
        most_used_model: "N/A",
        period: "all",
      };

      render(<StatisticsGrid statistics={zeroStatistics} />);

      // Check for multiple "0" values via aria-labels to be more specific
      expect(screen.getByLabelText(/Łączna liczba generacji: 0/i)).toBeInTheDocument();
      expect(screen.getAllByText(/0%/i).length).toBeGreaterThan(0);
      expect(screen.getByText("N/A")).toBeInTheDocument();
    });

    it("should handle high values correctly", () => {
      const highStatistics: GenerationStatisticsDTO = {
        total_generations: 9999,
        total_generated_flashcards: 50000,
        total_accepted_flashcards: 48000,
        total_accepted_unedited: 40800,
        total_accepted_edited: 7200,
        acceptance_rate: 96.0,
        unedited_acceptance_rate: 85.5,
        average_generation_duration: 12.75,
        most_used_model: "gpt-4-turbo",
        period: "month",
      };

      render(<StatisticsGrid statistics={highStatistics} />);

      // pl-PL locale formats with spaces, not commas
      expect(screen.getByText("9999")).toBeInTheDocument();
      expect(screen.getByText("50 000")).toBeInTheDocument();
      expect(screen.getByText("48 000")).toBeInTheDocument();
      expect(screen.getByText(/96%/i)).toBeInTheDocument();
    });

    it("should handle decimal acceptance rates", () => {
      const decimalStatistics: GenerationStatisticsDTO = {
        ...mockStatistics,
        acceptance_rate: 75.5,
        unedited_acceptance_rate: 50.25,
      };

      render(<StatisticsGrid statistics={decimalStatistics} />);

      // Percentages are rounded to nearest integer
      expect(screen.getByText(/76%/i)).toBeInTheDocument(); // 75.5 -> 76
      expect(screen.getByText(/50%/i)).toBeInTheDocument(); // 50.25 -> 50
    });

    it("should handle long model names", () => {
      const longModelStatistics: GenerationStatisticsDTO = {
        ...mockStatistics,
        most_used_model: "anthropic/claude-3-opus-very-long-model-name",
      };

      render(<StatisticsGrid statistics={longModelStatistics} />);

      expect(screen.getByText("anthropic/claude-3-opus-very-long-model-name")).toBeInTheDocument();
    });

    it("should handle very short durations", () => {
      const shortDurationStatistics: GenerationStatisticsDTO = {
        ...mockStatistics,
        average_generation_duration: 0.5,
      };

      render(<StatisticsGrid statistics={shortDurationStatistics} />);

      // formatDuration converts milliseconds to seconds: 0.5ms -> 0.0005s displayed as "0,0s"
      expect(screen.getByText(/0,0s/i)).toBeInTheDocument();
    });

    it("should handle very long durations", () => {
      const longDurationStatistics: GenerationStatisticsDTO = {
        ...mockStatistics,
        average_generation_duration: 300.0,
      };

      render(<StatisticsGrid statistics={longDurationStatistics} />);

      // formatDuration: 300ms -> 0.3s displayed as "0,3s"
      const durationElement = screen.getByText(/0,3s/i);
      expect(durationElement).toBeInTheDocument();
    });
  });

  describe("Responsive Grid", () => {
    it("should apply correct grid classes", () => {
      const { container } = render(<StatisticsGrid statistics={mockStatistics} />);

      const gridElement = container.querySelector(".grid");
      expect(gridElement).toHaveClass("gap-4");
      expect(gridElement).toHaveClass("sm:grid-cols-2");
      expect(gridElement).toHaveClass("lg:grid-cols-3");
    });
  });

  describe("Accessibility", () => {
    it("should have semantic structure", () => {
      render(<StatisticsGrid statistics={mockStatistics} />);

      // Check that values have aria-labels
      expect(screen.getByLabelText(/Łączna liczba generacji: 42/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Wygenerowane fiszki: 250/i)).toBeInTheDocument();
    });
  });
});
