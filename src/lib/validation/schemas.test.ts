import { describe, it, expect } from "vitest";
import {
  paginationSchema,
  flashcardContentSchema,
  flashcardSourceSchema,
  listFlashcardsQuerySchema,
  flashcardIdParamSchema,
  createFlashcardSchema,
  updateFlashcardSchema,
  bulkCreateFlashcardsSchema,
  generateFlashcardsSchema,
  generationStatisticsQuerySchema,
} from "./schemas";

describe("paginationSchema", () => {
  describe("poprawne wartości", () => {
    it("akceptuje poprawną paginację", () => {
      const result = paginationSchema.parse({ page: "1", limit: "20" });
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it("używa domyślnych wartości", () => {
      const result = paginationSchema.parse({});
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it("konwertuje stringi na liczby (coerce)", () => {
      const result = paginationSchema.parse({ page: "5", limit: "50" });
      expect(result).toEqual({ page: 5, limit: 50 });
    });

    it("akceptuje maksymalny limit (100)", () => {
      const result = paginationSchema.parse({ page: "1", limit: "100" });
      expect(result.limit).toBe(100);
    });

    it("akceptuje minimalną stronę (1)", () => {
      const result = paginationSchema.parse({ page: "1", limit: "20" });
      expect(result.page).toBe(1);
    });
  });

  describe("edge cases - nullish values", () => {
    it("traktuje null jako undefined (używa defaults)", () => {
      const result = paginationSchema.parse({ page: null, limit: null });
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it("traktuje puste stringi jako undefined", () => {
      const result = paginationSchema.parse({ page: "", limit: "" });
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    it("traktuje undefined jako default", () => {
      const result = paginationSchema.parse({ page: undefined, limit: undefined });
      expect(result).toEqual({ page: 1, limit: 20 });
    });
  });

  describe("walidacja błędów", () => {
    it("odrzuca page = 0", () => {
      expect(() => paginationSchema.parse({ page: "0" })).toThrow();
    });

    it("odrzuca ujemne page", () => {
      expect(() => paginationSchema.parse({ page: "-1" })).toThrow();
    });

    it("odrzuca limit = 0", () => {
      expect(() => paginationSchema.parse({ limit: "0" })).toThrow();
    });

    it("odrzuca ujemne limit", () => {
      expect(() => paginationSchema.parse({ limit: "-1" })).toThrow();
    });

    it("odrzuca limit > 100", () => {
      expect(() => paginationSchema.parse({ limit: "101" })).toThrow();
    });

    it("odrzuca niebędące liczbami stringi", () => {
      expect(() => paginationSchema.parse({ page: "abc" })).toThrow();
    });
  });
});

describe("flashcardContentSchema", () => {
  describe("poprawne wartości", () => {
    it("akceptuje poprawną treść flashcard", () => {
      const result = flashcardContentSchema.parse({
        front: "What is TypeScript?",
        back: "A typed superset of JavaScript",
      });
      expect(result).toEqual({
        front: "What is TypeScript?",
        back: "A typed superset of JavaScript",
      });
    });

    it("akceptuje maksymalną długość front (200 znaków)", () => {
      const front = "a".repeat(200);
      const result = flashcardContentSchema.parse({ front, back: "answer" });
      expect(result.front.length).toBe(200);
    });

    it("akceptuje maksymalną długość back (500 znaków)", () => {
      const back = "a".repeat(500);
      const result = flashcardContentSchema.parse({ front: "question", back });
      expect(result.back.length).toBe(500);
    });

    it("akceptuje znaki specjalne i emoji", () => {
      const result = flashcardContentSchema.parse({
        front: "What is 🚀?",
        back: "A rocket emoji! 🎉",
      });
      expect(result.front).toContain("🚀");
      expect(result.back).toContain("🎉");
    });
  });

  describe("walidacja błędów", () => {
    it("odrzuca pusty front", () => {
      expect(() =>
        flashcardContentSchema.parse({
          front: "",
          back: "answer",
        })
      ).toThrow("Front text is required");
    });

    it("odrzuca pusty back", () => {
      expect(() =>
        flashcardContentSchema.parse({
          front: "question",
          back: "",
        })
      ).toThrow("Back text is required");
    });

    it("odrzuca front > 200 znaków", () => {
      const front = "a".repeat(201);
      expect(() =>
        flashcardContentSchema.parse({
          front,
          back: "answer",
        })
      ).toThrow("Front text must be 200 characters or less");
    });

    it("odrzuca back > 500 znaków", () => {
      const back = "a".repeat(501);
      expect(() =>
        flashcardContentSchema.parse({
          front: "question",
          back,
        })
      ).toThrow("Back text must be 500 characters or less");
    });

    it("odrzuca brak pola front", () => {
      expect(() =>
        flashcardContentSchema.parse({
          back: "answer",
        })
      ).toThrow();
    });

    it("odrzuca brak pola back", () => {
      expect(() =>
        flashcardContentSchema.parse({
          front: "question",
        })
      ).toThrow();
    });
  });
});

describe("flashcardSourceSchema", () => {
  it('akceptuje "ai-full"', () => {
    const result = flashcardSourceSchema.parse("ai-full");
    expect(result).toBe("ai-full");
  });

  it('akceptuje "ai-edited"', () => {
    const result = flashcardSourceSchema.parse("ai-edited");
    expect(result).toBe("ai-edited");
  });

  it('akceptuje "manual"', () => {
    const result = flashcardSourceSchema.parse("manual");
    expect(result).toBe("manual");
  });

  it("odrzuca niepoprawne wartości", () => {
    expect(() => flashcardSourceSchema.parse("invalid")).toThrow();
    expect(() => flashcardSourceSchema.parse("ai")).toThrow();
    expect(() => flashcardSourceSchema.parse("")).toThrow();
  });
});

describe("listFlashcardsQuerySchema", () => {
  it("akceptuje wszystkie opcjonalne parametry", () => {
    const result = listFlashcardsQuerySchema.parse({
      page: "2",
      limit: "30",
      source: "ai-full",
      generation_id: "123",
    });
    expect(result).toEqual({
      page: 2,
      limit: 30,
      source: "ai-full",
      generation_id: 123,
    });
  });

  it("obsługuje brak opcjonalnych filtrów", () => {
    const result = listFlashcardsQuerySchema.parse({ page: "1", limit: "20" });
    expect(result.source).toBeUndefined();
    expect(result.generation_id).toBeUndefined();
  });

  it("konwertuje generation_id na liczbę", () => {
    const result = listFlashcardsQuerySchema.parse({ generation_id: "456" });
    expect(result.generation_id).toBe(456);
  });

  it("obsługuje nullish source", () => {
    const result = listFlashcardsQuerySchema.parse({ source: null });
    expect(result.source).toBeUndefined();
  });

  it("odrzuca ujemne generation_id", () => {
    expect(() => listFlashcardsQuerySchema.parse({ generation_id: "-1" })).toThrow();
  });

  it("odrzuca generation_id = 0", () => {
    expect(() => listFlashcardsQuerySchema.parse({ generation_id: "0" })).toThrow();
  });
});

describe("flashcardIdParamSchema", () => {
  it("konwertuje string id na liczbę", () => {
    const result = flashcardIdParamSchema.parse({ id: "123" });
    expect(result.id).toBe(123);
  });

  it("akceptuje liczbę", () => {
    const result = flashcardIdParamSchema.parse({ id: 456 });
    expect(result.id).toBe(456);
  });

  it("odrzuca ujemne id", () => {
    expect(() => flashcardIdParamSchema.parse({ id: "-1" })).toThrow();
  });

  it("odrzuca id = 0", () => {
    expect(() => flashcardIdParamSchema.parse({ id: "0" })).toThrow();
  });

  it("odrzuca niebędące liczbami stringi", () => {
    expect(() => flashcardIdParamSchema.parse({ id: "abc" })).toThrow();
  });
});

describe("createFlashcardSchema", () => {
  it("jest tożsamy z flashcardContentSchema", () => {
    const data = { front: "question", back: "answer" };
    const result1 = createFlashcardSchema.parse(data);
    const result2 = flashcardContentSchema.parse(data);
    expect(result1).toEqual(result2);
  });
});

describe("updateFlashcardSchema", () => {
  it("akceptuje tylko front", () => {
    const result = updateFlashcardSchema.parse({ front: "Updated question" });
    expect(result.front).toBe("Updated question");
    expect(result.back).toBeUndefined();
  });

  it("akceptuje tylko back", () => {
    const result = updateFlashcardSchema.parse({ back: "Updated answer" });
    expect(result.back).toBe("Updated answer");
    expect(result.front).toBeUndefined();
  });

  it("akceptuje oba pola", () => {
    const result = updateFlashcardSchema.parse({
      front: "Updated question",
      back: "Updated answer",
    });
    expect(result.front).toBe("Updated question");
    expect(result.back).toBe("Updated answer");
  });

  it("odrzuca puste obiekty (wymaga co najmniej jednego pola)", () => {
    expect(() => updateFlashcardSchema.parse({})).toThrow("At least one field (front or back) must be provided");
  });

  it("sprawdza długość front jeśli podane", () => {
    const front = "a".repeat(201);
    expect(() => updateFlashcardSchema.parse({ front })).toThrow();
  });

  it("sprawdza długość back jeśli podane", () => {
    const back = "a".repeat(501);
    expect(() => updateFlashcardSchema.parse({ back })).toThrow();
  });
});

describe("bulkCreateFlashcardsSchema", () => {
  describe("poprawne wartości", () => {
    it("akceptuje poprawne dane bulk create", () => {
      const result = bulkCreateFlashcardsSchema.parse({
        generation_id: 123,
        flashcards: [
          { front: "Q1", back: "A1", source: "ai-full" },
          { front: "Q2", back: "A2", source: "ai-edited" },
        ],
      });
      expect(result.generation_id).toBe(123);
      expect(result.flashcards).toHaveLength(2);
    });

    it("akceptuje maksymalnie 50 flashcards", () => {
      const flashcards = Array.from({ length: 50 }, (_, i) => ({
        front: `Q${i}`,
        back: `A${i}`,
        source: "ai-full" as const,
      }));
      const result = bulkCreateFlashcardsSchema.parse({
        generation_id: 1,
        flashcards,
      });
      expect(result.flashcards).toHaveLength(50);
    });

    it('akceptuje tylko source "ai-full" i "ai-edited"', () => {
      const result = bulkCreateFlashcardsSchema.parse({
        generation_id: 1,
        flashcards: [
          { front: "Q1", back: "A1", source: "ai-full" },
          { front: "Q2", back: "A2", source: "ai-edited" },
        ],
      });
      expect(result.flashcards[0].source).toBe("ai-full");
      expect(result.flashcards[1].source).toBe("ai-edited");
    });
  });

  describe("walidacja błędów", () => {
    it("odrzuca pustą tablicę flashcards", () => {
      expect(() =>
        bulkCreateFlashcardsSchema.parse({
          generation_id: 1,
          flashcards: [],
        })
      ).toThrow("At least one flashcard is required");
    });

    it("odrzuca więcej niż 50 flashcards", () => {
      const flashcards = Array.from({ length: 51 }, (_, i) => ({
        front: `Q${i}`,
        back: `A${i}`,
        source: "ai-full" as const,
      }));
      expect(() =>
        bulkCreateFlashcardsSchema.parse({
          generation_id: 1,
          flashcards,
        })
      ).toThrow("Maximum 50 flashcards per request");
    });

    it('odrzuca source "manual" w bulk create', () => {
      expect(() =>
        bulkCreateFlashcardsSchema.parse({
          generation_id: 1,
          flashcards: [{ front: "Q", back: "A", source: "manual" }],
        })
      ).toThrow();
    });

    it("odrzuca ujemne generation_id", () => {
      expect(() =>
        bulkCreateFlashcardsSchema.parse({
          generation_id: -1,
          flashcards: [{ front: "Q", back: "A", source: "ai-full" }],
        })
      ).toThrow();
    });

    it("waliduje każdy flashcard w tablicy", () => {
      expect(() =>
        bulkCreateFlashcardsSchema.parse({
          generation_id: 1,
          flashcards: [
            { front: "", back: "A", source: "ai-full" }, // Invalid: empty front
          ],
        })
      ).toThrow();
    });
  });
});

describe("generateFlashcardsSchema", () => {
  describe("poprawne wartości", () => {
    it("akceptuje tekst o długości 1000 znaków", () => {
      const source_text = "a".repeat(1000);
      const result = generateFlashcardsSchema.parse({ source_text });
      expect(result.source_text.length).toBe(1000);
    });

    it("akceptuje tekst o długości 10000 znaków", () => {
      const source_text = "a".repeat(10000);
      const result = generateFlashcardsSchema.parse({ source_text });
      expect(result.source_text.length).toBe(10000);
    });

    it("akceptuje opcjonalny model", () => {
      const source_text = "a".repeat(1000);
      const result = generateFlashcardsSchema.parse({
        source_text,
        model: "openai/gpt-4o-mini",
      });
      expect(result.model).toBe("openai/gpt-4o-mini");
    });

    it("model jest opcjonalny", () => {
      const source_text = "a".repeat(1000);
      const result = generateFlashcardsSchema.parse({ source_text });
      expect(result.model).toBeUndefined();
    });
  });

  describe("walidacja błędów - długość tekstu", () => {
    it("odrzuca tekst < 1000 znaków", () => {
      const source_text = "a".repeat(999);
      expect(() => generateFlashcardsSchema.parse({ source_text })).toThrow(
        "Source text must be at least 1000 characters"
      );
    });

    it("odrzuca tekst > 10000 znaków", () => {
      const source_text = "a".repeat(10001);
      expect(() => generateFlashcardsSchema.parse({ source_text })).toThrow(
        "Source text must be 10000 characters or less"
      );
    });

    it("odrzuca pusty tekst", () => {
      expect(() => generateFlashcardsSchema.parse({ source_text: "" })).toThrow();
    });
  });

  describe("edge cases - granice", () => {
    it("dokładnie 1000 znaków jest OK", () => {
      const source_text = "a".repeat(1000);
      const result = generateFlashcardsSchema.parse({ source_text });
      expect(result.source_text.length).toBe(1000);
    });

    it("dokładnie 10000 znaków jest OK", () => {
      const source_text = "a".repeat(10000);
      const result = generateFlashcardsSchema.parse({ source_text });
      expect(result.source_text.length).toBe(10000);
    });

    it("1001 znaków jest OK", () => {
      const source_text = "a".repeat(1001);
      const result = generateFlashcardsSchema.parse({ source_text });
      expect(result.source_text.length).toBe(1001);
    });

    it("9999 znaków jest OK", () => {
      const source_text = "a".repeat(9999);
      const result = generateFlashcardsSchema.parse({ source_text });
      expect(result.source_text.length).toBe(9999);
    });
  });
});

describe("generationStatisticsQuerySchema", () => {
  it('akceptuje period "week"', () => {
    const result = generationStatisticsQuerySchema.parse({ period: "week" });
    expect(result.period).toBe("week");
  });

  it('akceptuje period "month"', () => {
    const result = generationStatisticsQuerySchema.parse({ period: "month" });
    expect(result.period).toBe("month");
  });

  it('akceptuje period "all"', () => {
    const result = generationStatisticsQuerySchema.parse({ period: "all" });
    expect(result.period).toBe("all");
  });

  it('używa "all" jako domyślnej wartości', () => {
    const result = generationStatisticsQuerySchema.parse({});
    expect(result.period).toBe("all");
  });

  it("traktuje nullish jako default", () => {
    const result = generationStatisticsQuerySchema.parse({ period: null });
    expect(result.period).toBe("all");
  });

  it("odrzuca niepoprawne wartości period", () => {
    expect(() => generationStatisticsQuerySchema.parse({ period: "day" })).toThrow();
    expect(() => generationStatisticsQuerySchema.parse({ period: "year" })).toThrow();
  });
});
