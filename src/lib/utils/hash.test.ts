import { describe, it, expect } from "vitest";
import { hashSourceText, calculatePagination } from "./hash";

describe("hashSourceText", () => {
  describe("deterministyczność", () => {
    it("ten sam tekst daje ten sam hash", async () => {
      const text = "Hello, world!";
      const hash1 = await hashSourceText(text);
      const hash2 = await hashSourceText(text);
      expect(hash1).toBe(hash2);
    });

    it("hash jest zawsze tej samej długości (64 znaki dla SHA-256)", async () => {
      const texts = ["short", "a".repeat(100), "a".repeat(10000)];
      for (const text of texts) {
        const hash = await hashSourceText(text);
        expect(hash.length).toBe(64);
      }
    });

    it("hash zawiera tylko znaki hex (0-9, a-f)", async () => {
      const hash = await hashSourceText("test");
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe("różne inputy dają różne hashe", () => {
    it("różne teksty dają różne hashe", async () => {
      const hash1 = await hashSourceText("text1");
      const hash2 = await hashSourceText("text2");
      expect(hash1).not.toBe(hash2);
    });

    it("wielkość liter ma znaczenie", async () => {
      const hash1 = await hashSourceText("Hello");
      const hash2 = await hashSourceText("hello");
      expect(hash1).not.toBe(hash2);
    });

    it("spacje mają znaczenie", async () => {
      const hash1 = await hashSourceText("hello world");
      const hash2 = await hashSourceText("helloworld");
      expect(hash1).not.toBe(hash2);
    });

    it("kolejność znaków ma znaczenie", async () => {
      const hash1 = await hashSourceText("abc");
      const hash2 = await hashSourceText("cba");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("edge cases", () => {
    it("hashuje pusty string", async () => {
      const hash = await hashSourceText("");
      expect(hash).toBeTruthy();
      expect(hash.length).toBe(64);
      // Known SHA-256 hash of empty string
      expect(hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    });

    it("hashuje bardzo długi tekst", async () => {
      const longText = "a".repeat(100000);
      const hash = await hashSourceText(longText);
      expect(hash.length).toBe(64);
    });

    it("hashuje tekst z Unicode", async () => {
      const hash1 = await hashSourceText("Hello 🚀");
      const hash2 = await hashSourceText("Hello 🎉");
      expect(hash1).not.toBe(hash2);
      expect(hash1.length).toBe(64);
    });

    it("hashuje tekst z polskimi znakami", async () => {
      const hash1 = await hashSourceText("Cześć! Jak się masz?");
      const hash2 = await hashSourceText("Czesc! Jak sie masz?");
      expect(hash1).not.toBe(hash2);
      expect(hash1.length).toBe(64);
    });

    it("hashuje tekst z znakami specjalnymi", async () => {
      const hash = await hashSourceText("!@#$%^&*()_+-=[]{}|;':\",./<>?");
      expect(hash.length).toBe(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("hashuje tekst z newlines", async () => {
      const hash1 = await hashSourceText("line1\nline2");
      const hash2 = await hashSourceText("line1line2");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("przypadki użycia biznesowego", () => {
    it("hashuje typowy source text do generowania flashcards", async () => {
      const sourceText = `
TypeScript is a strongly typed programming language that builds on JavaScript,
giving you better tooling at any scale. TypeScript adds additional syntax to
JavaScript to support a tighter integration with your editor.
      `.trim();

      const hash1 = await hashSourceText(sourceText);
      const hash2 = await hashSourceText(sourceText);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64);
    });

    it("różne source texts dają różne hashe", async () => {
      const text1 = "JavaScript is a programming language";
      const text2 = "TypeScript is a programming language";

      const hash1 = await hashSourceText(text1);
      const hash2 = await hashSourceText(text2);

      expect(hash1).not.toBe(hash2);
    });

    it("minimalna długość (1000 znaków) jest hashowalna", async () => {
      const text = "a".repeat(1000);
      const hash = await hashSourceText(text);
      expect(hash.length).toBe(64);
    });

    it("maksymalna długość (10000 znaków) jest hashowalna", async () => {
      const text = "a".repeat(10000);
      const hash = await hashSourceText(text);
      expect(hash.length).toBe(64);
    });
  });

  describe("znane wartości SHA-256", () => {
    it('hashuje "hello" do znanego SHA-256', async () => {
      const hash = await hashSourceText("hello");
      expect(hash).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
    });

    it('hashuje "test" do znanego SHA-256', async () => {
      const hash = await hashSourceText("test");
      expect(hash).toBe("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
    });
  });
});

describe("calculatePagination", () => {
  describe("podstawowe obliczenia", () => {
    it("oblicza paginację dla pierwszej strony", () => {
      const result = calculatePagination(100, 1, 20);
      expect(result).toEqual({
        total: 100,
        page: 1,
        limit: 20,
        total_pages: 5,
        offset: 0,
      });
    });

    it("oblicza paginację dla drugiej strony", () => {
      const result = calculatePagination(100, 2, 20);
      expect(result).toEqual({
        total: 100,
        page: 2,
        limit: 20,
        total_pages: 5,
        offset: 20,
      });
    });

    it("oblicza paginację dla ostatniej strony", () => {
      const result = calculatePagination(100, 5, 20);
      expect(result).toEqual({
        total: 100,
        page: 5,
        limit: 20,
        total_pages: 5,
        offset: 80,
      });
    });
  });

  describe("obliczanie offset", () => {
    it("offset = 0 dla pierwszej strony", () => {
      const result = calculatePagination(100, 1, 10);
      expect(result.offset).toBe(0);
    });

    it("offset = limit dla drugiej strony", () => {
      const result = calculatePagination(100, 2, 10);
      expect(result.offset).toBe(10);
    });

    it("offset = (page - 1) * limit", () => {
      const result = calculatePagination(100, 5, 10);
      expect(result.offset).toBe(40);
    });

    it("oblicza offset dla różnych limitów", () => {
      expect(calculatePagination(100, 3, 20).offset).toBe(40);
      expect(calculatePagination(100, 3, 30).offset).toBe(60);
      expect(calculatePagination(100, 3, 50).offset).toBe(100);
    });
  });

  describe("obliczanie total_pages", () => {
    it("oblicza total_pages dla dokładnego podziału", () => {
      const result = calculatePagination(100, 1, 20);
      expect(result.total_pages).toBe(5);
    });

    it("zaokrągla w górę dla niepełnej strony", () => {
      const result = calculatePagination(105, 1, 20);
      expect(result.total_pages).toBe(6);
    });

    it("total_pages = 1 dla małej liczby elementów", () => {
      const result = calculatePagination(10, 1, 20);
      expect(result.total_pages).toBe(1);
    });

    it("total_pages używa Math.ceil", () => {
      expect(calculatePagination(21, 1, 20).total_pages).toBe(2);
      expect(calculatePagination(39, 1, 20).total_pages).toBe(2);
      expect(calculatePagination(40, 1, 20).total_pages).toBe(2);
      expect(calculatePagination(41, 1, 20).total_pages).toBe(3);
    });
  });

  describe("edge cases - zero i puste", () => {
    it("obsługuje total = 0", () => {
      const result = calculatePagination(0, 1, 20);
      expect(result).toEqual({
        total: 0,
        page: 1,
        limit: 20,
        total_pages: 0,
        offset: 0,
      });
    });

    it("total_pages = 0 gdy brak elementów", () => {
      const result = calculatePagination(0, 1, 20);
      expect(result.total_pages).toBe(0);
    });

    it("obsługuje małą liczbę elementów", () => {
      const result = calculatePagination(5, 1, 20);
      expect(result.total_pages).toBe(1);
    });
  });

  describe("edge cases - granice", () => {
    it("dokładnie jeden element", () => {
      const result = calculatePagination(1, 1, 20);
      expect(result).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        total_pages: 1,
        offset: 0,
      });
    });

    it("dokładnie limit elementów", () => {
      const result = calculatePagination(20, 1, 20);
      expect(result.total_pages).toBe(1);
    });

    it("limit + 1 elementów", () => {
      const result = calculatePagination(21, 1, 20);
      expect(result.total_pages).toBe(2);
    });

    it("bardzo duża liczba elementów", () => {
      const result = calculatePagination(1000000, 100, 100);
      expect(result.total_pages).toBe(10000);
      expect(result.offset).toBe(9900);
    });
  });

  describe("różne limity", () => {
    it("obsługuje limit = 1", () => {
      const result = calculatePagination(10, 5, 1);
      expect(result.offset).toBe(4);
      expect(result.total_pages).toBe(10);
    });

    it("obsługuje limit = 100 (maksymalny)", () => {
      const result = calculatePagination(500, 3, 100);
      expect(result.offset).toBe(200);
      expect(result.total_pages).toBe(5);
    });

    it("obsługuje limit = 50", () => {
      const result = calculatePagination(200, 2, 50);
      expect(result.offset).toBe(50);
      expect(result.total_pages).toBe(4);
    });
  });

  describe("przypadki użycia biznesowego", () => {
    it("domyślna paginacja (page=1, limit=20)", () => {
      const result = calculatePagination(150, 1, 20);
      expect(result.total_pages).toBe(8);
      expect(result.offset).toBe(0);
    });

    it("paginacja dla pustej listy flashcards", () => {
      const result = calculatePagination(0, 1, 20);
      expect(result.total_pages).toBe(0);
      expect(result.total).toBe(0);
    });

    it("paginacja dla dużej liczby flashcards", () => {
      const result = calculatePagination(1000, 10, 20);
      expect(result.total_pages).toBe(50);
      expect(result.offset).toBe(180);
    });

    it("ostatnia niepełna strona", () => {
      const result = calculatePagination(95, 5, 20);
      expect(result.total_pages).toBe(5);
      expect(result.offset).toBe(80);
      // Ostatnia strona będzie miała tylko 15 elementów (95 - 80)
    });
  });
});
