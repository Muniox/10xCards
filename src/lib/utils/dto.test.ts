import { describe, it, expect } from "vitest";
import { transformFlashcardToDTO, transformFlashcardsToDTO, countBySource } from "./dto";
import type { FlashcardSource } from "../../types";

describe("transformFlashcardToDTO", () => {
  describe("usuwanie user_id", () => {
    it("usuwa user_id z obiektu flashcard", () => {
      const flashcard = {
        id: 1,
        user_id: "user-123",
        front: "Question",
        back: "Answer",
        source: "manual",
        created_at: "2024-01-01",
      };

      const result = transformFlashcardToDTO(flashcard);

      expect(result).not.toHaveProperty("user_id");
      expect(result.id).toBe(1);
      expect(result.front).toBe("Question");
      expect(result.back).toBe("Answer");
    });

    it("zachowuje wszystkie inne pola", () => {
      const flashcard = {
        id: 42,
        user_id: "user-456",
        front: "Front text",
        back: "Back text",
        source: "ai-full",
        generation_id: 10,
        created_at: "2024-11-11T10:00:00Z",
        updated_at: "2024-11-11T11:00:00Z",
      };

      const result = transformFlashcardToDTO(flashcard);

      expect(result.id).toBe(42);
      expect(result.front).toBe("Front text");
      expect(result.back).toBe("Back text");
      expect(result.generation_id).toBe(10);
      expect(result.created_at).toBe("2024-11-11T10:00:00Z");
      expect(result.updated_at).toBe("2024-11-11T11:00:00Z");
    });
  });

  describe("casting source", () => {
    it('castuje source na FlashcardSource dla "ai-full"', () => {
      const flashcard = {
        id: 1,
        user_id: "user-123",
        front: "Q",
        back: "A",
        source: "ai-full",
      };

      const result = transformFlashcardToDTO(flashcard);

      expect(result.source).toBe("ai-full");
      // Type check - should be FlashcardSource
      const sourceCheck: FlashcardSource = result.source;
      expect(sourceCheck).toBeDefined();
    });

    it('castuje source na FlashcardSource dla "ai-edited"', () => {
      const flashcard = {
        id: 1,
        user_id: "user-123",
        front: "Q",
        back: "A",
        source: "ai-edited",
      };

      const result = transformFlashcardToDTO(flashcard);
      expect(result.source).toBe("ai-edited");
    });

    it('castuje source na FlashcardSource dla "manual"', () => {
      const flashcard = {
        id: 1,
        user_id: "user-123",
        front: "Q",
        back: "A",
        source: "manual",
      };

      const result = transformFlashcardToDTO(flashcard);
      expect(result.source).toBe("manual");
    });
  });

  describe("edge cases", () => {
    it("obsługuje null generation_id", () => {
      const flashcard = {
        id: 1,
        user_id: "user-123",
        front: "Q",
        back: "A",
        source: "manual",
        generation_id: null,
      };

      const result = transformFlashcardToDTO(flashcard);
      expect(result.generation_id).toBeNull();
    });

    it("obsługuje flashcard z minimalnymi polami", () => {
      const flashcard = {
        id: 1,
        user_id: "user-123",
        source: "manual",
      };

      const result = transformFlashcardToDTO(flashcard);
      expect(result).not.toHaveProperty("user_id");
      expect(result.id).toBe(1);
      expect(result.source).toBe("manual");
    });

    it("obsługuje flashcard z dodatkowymi polami", () => {
      const flashcard = {
        id: 1,
        user_id: "user-123",
        front: "Q",
        back: "A",
        source: "ai-full",
        custom_field: "custom value",
        another_field: 123,
      };

      const result = transformFlashcardToDTO(flashcard);
      expect(result.custom_field).toBe("custom value");
      expect(result.another_field).toBe(123);
    });
  });
});

describe("transformFlashcardsToDTO", () => {
  it("transformuje pustą tablicę", () => {
    const result = transformFlashcardsToDTO([]);
    expect(result).toEqual([]);
  });

  it("transformuje pojedynczy flashcard", () => {
    const flashcards = [
      {
        id: 1,
        user_id: "user-123",
        front: "Q",
        back: "A",
        source: "manual",
      },
    ];

    const result = transformFlashcardsToDTO(flashcards);
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty("user_id");
    expect(result[0].id).toBe(1);
  });

  it("transformuje wiele flashcards", () => {
    const flashcards = [
      {
        id: 1,
        user_id: "user-123",
        front: "Q1",
        back: "A1",
        source: "ai-full",
      },
      {
        id: 2,
        user_id: "user-123",
        front: "Q2",
        back: "A2",
        source: "ai-edited",
      },
      {
        id: 3,
        user_id: "user-456",
        front: "Q3",
        back: "A3",
        source: "manual",
      },
    ];

    const result = transformFlashcardsToDTO(flashcards);
    expect(result).toHaveLength(3);

    result.forEach((flashcard) => {
      expect(flashcard).not.toHaveProperty("user_id");
    });

    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(3);
  });

  it("usuwa user_id ze wszystkich elementów", () => {
    const flashcards = [
      { id: 1, user_id: "user-1", source: "manual" },
      { id: 2, user_id: "user-2", source: "ai-full" },
      { id: 3, user_id: "user-3", source: "ai-edited" },
    ];

    const result = transformFlashcardsToDTO(flashcards);

    result.forEach((flashcard) => {
      expect(flashcard).not.toHaveProperty("user_id");
    });
  });

  it("zachowuje kolejność elementów", () => {
    const flashcards = [
      { id: 5, user_id: "user", source: "manual" },
      { id: 3, user_id: "user", source: "ai-full" },
      { id: 8, user_id: "user", source: "ai-edited" },
    ];

    const result = transformFlashcardsToDTO(flashcards);

    expect(result[0].id).toBe(5);
    expect(result[1].id).toBe(3);
    expect(result[2].id).toBe(8);
  });

  it("transformuje dużą tablicę", () => {
    const flashcards = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      user_id: `user-${i}`,
      source: "manual" as const,
    }));

    const result = transformFlashcardsToDTO(flashcards);

    expect(result).toHaveLength(100);
    result.forEach((flashcard, index) => {
      expect(flashcard.id).toBe(index);
      expect(flashcard).not.toHaveProperty("user_id");
    });
  });
});

describe("countBySource", () => {
  describe("podstawowe zliczanie", () => {
    it("zlicza flashcards ai-full", () => {
      const flashcards = [{ source: "ai-full" as FlashcardSource }];

      const result = countBySource(flashcards);

      expect(result).toEqual({
        aiFullCount: 1,
        aiEditedCount: 0,
        manualCount: 0,
      });
    });

    it("zlicza flashcards ai-edited", () => {
      const flashcards = [{ source: "ai-edited" as FlashcardSource }];

      const result = countBySource(flashcards);

      expect(result).toEqual({
        aiFullCount: 0,
        aiEditedCount: 1,
        manualCount: 0,
      });
    });

    it("zlicza flashcards manual", () => {
      const flashcards = [{ source: "manual" as FlashcardSource }];

      const result = countBySource(flashcards);

      expect(result).toEqual({
        aiFullCount: 0,
        aiEditedCount: 0,
        manualCount: 1,
      });
    });
  });

  describe("zliczanie wielu elementów", () => {
    it("zlicza mieszane typy flashcards", () => {
      const flashcards = [
        { source: "ai-full" as FlashcardSource },
        { source: "ai-full" as FlashcardSource },
        { source: "ai-edited" as FlashcardSource },
        { source: "manual" as FlashcardSource },
      ];

      const result = countBySource(flashcards);

      expect(result).toEqual({
        aiFullCount: 2,
        aiEditedCount: 1,
        manualCount: 1,
      });
    });

    it("zlicza dużą liczbę flashcards", () => {
      const flashcards = [
        ...Array(10).fill({ source: "ai-full" as FlashcardSource }),
        ...Array(5).fill({ source: "ai-edited" as FlashcardSource }),
        ...Array(3).fill({ source: "manual" as FlashcardSource }),
      ];

      const result = countBySource(flashcards);

      expect(result).toEqual({
        aiFullCount: 10,
        aiEditedCount: 5,
        manualCount: 3,
      });
    });
  });

  describe("edge cases", () => {
    it("obsługuje pustą tablicę", () => {
      const result = countBySource([]);

      expect(result).toEqual({
        aiFullCount: 0,
        aiEditedCount: 0,
        manualCount: 0,
      });
    });

    it("obsługuje tylko ai-full", () => {
      const flashcards = Array(5).fill({ source: "ai-full" as FlashcardSource });

      const result = countBySource(flashcards);

      expect(result).toEqual({
        aiFullCount: 5,
        aiEditedCount: 0,
        manualCount: 0,
      });
    });

    it("obsługuje tylko ai-edited", () => {
      const flashcards = Array(3).fill({ source: "ai-edited" as FlashcardSource });

      const result = countBySource(flashcards);

      expect(result).toEqual({
        aiFullCount: 0,
        aiEditedCount: 3,
        manualCount: 0,
      });
    });

    it("obsługuje tylko manual", () => {
      const flashcards = Array(7).fill({ source: "manual" as FlashcardSource });

      const result = countBySource(flashcards);

      expect(result).toEqual({
        aiFullCount: 0,
        aiEditedCount: 0,
        manualCount: 7,
      });
    });
  });

  describe("przypadki użycia biznesowego - bulk create", () => {
    it("zlicza akceptowane flashcards po generowaniu", () => {
      const flashcards = [
        { source: "ai-full" as FlashcardSource }, // zaakceptowane bez edycji
        { source: "ai-full" as FlashcardSource },
        { source: "ai-full" as FlashcardSource },
        { source: "ai-edited" as FlashcardSource }, // zaakceptowane po edycji
        { source: "ai-edited" as FlashcardSource },
      ];

      const result = countBySource(flashcards);

      expect(result.aiFullCount).toBe(3); // accepted_unedited_count
      expect(result.aiEditedCount).toBe(2); // accepted_edited_count
    });

    it("zwraca 0 gdy użytkownik odrzucił wszystkie sugestie", () => {
      const result = countBySource([]);

      expect(result.aiFullCount).toBe(0);
      expect(result.aiEditedCount).toBe(0);
    });

    it("obsługuje scenariusz gdzie wszystkie są edytowane", () => {
      const flashcards = Array(8).fill({ source: "ai-edited" as FlashcardSource });

      const result = countBySource(flashcards);

      expect(result.aiFullCount).toBe(0);
      expect(result.aiEditedCount).toBe(8);
    });

    it("obsługuje scenariusz gdzie wszystkie są akceptowane bez edycji", () => {
      const flashcards = Array(8).fill({ source: "ai-full" as FlashcardSource });

      const result = countBySource(flashcards);

      expect(result.aiFullCount).toBe(8);
      expect(result.aiEditedCount).toBe(0);
    });
  });
});

describe("integracja - przepływ danych", () => {
  it("transformFlashcardsToDTO + countBySource", () => {
    const dbFlashcards = [
      { id: 1, user_id: "user-123", source: "ai-full", front: "Q1", back: "A1" },
      { id: 2, user_id: "user-123", source: "ai-full", front: "Q2", back: "A2" },
      { id: 3, user_id: "user-123", source: "ai-edited", front: "Q3", back: "A3" },
    ];

    // Transform to DTOs
    const dtos = transformFlashcardsToDTO(dbFlashcards);

    // Count by source
    const counts = countBySource(dtos);

    expect(counts).toEqual({
      aiFullCount: 2,
      aiEditedCount: 1,
      manualCount: 0,
    });
  });

  it("pełny przepływ bulk create", () => {
    // Symulacja danych z bazy po bulk insert
    const dbFlashcards = [
      { id: 1, user_id: "user-123", source: "ai-full" as FlashcardSource, front: "Q1", back: "A1" },
      {
        id: 2,
        user_id: "user-123",
        source: "ai-edited" as FlashcardSource,
        front: "Q2",
        back: "A2",
      },
      {
        id: 3,
        user_id: "user-123",
        source: "ai-edited" as FlashcardSource,
        front: "Q3",
        back: "A3",
      },
      { id: 4, user_id: "user-123", source: "ai-full" as FlashcardSource, front: "Q4", back: "A4" },
    ];

    // 1. Transform to DTOs (remove user_id for response)
    const flashcards = transformFlashcardsToDTO(dbFlashcards);

    // 2. Count acceptance types (for updating generation)
    const counts = countBySource(dbFlashcards);

    // Verify DTOs don't have user_id
    flashcards.forEach((card) => {
      expect(card).not.toHaveProperty("user_id");
    });

    // Verify counts for generation update
    expect(counts.aiFullCount).toBe(2);
    expect(counts.aiEditedCount).toBe(2);
  });
});
