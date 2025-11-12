import { describe, it, expect } from "vitest";
import { formatNumber, formatPercentage, formatDuration } from "./format";

describe("formatNumber", () => {
  describe("podstawowe formatowanie", () => {
    it("formatuje liczbę z domyślnymi ustawieniami (2 miejsca po przecinku)", () => {
      const result = formatNumber(1234.56);
      expect(result).toBe("1234,56");
    });

    it("formatuje liczbę z separatorem tysięcy", () => {
      const result = formatNumber(1000000);
      // Accept both with and without separators (depends on Node.js/browser version)
      expect(result).toMatch(/1[\s\u00A0]?000[\s\u00A0]?000,00/);
    });

    it("formatuje małe liczby bez separatora", () => {
      expect(formatNumber(123.45)).toBe("123,45");
    });

    it("formatuje liczby ujemne", () => {
      const result = formatNumber(-1234.56);
      expect(result).toContain("1234,56");
      expect(result).toContain("-");
    });
  });

  describe("edge cases", () => {
    it("formatuje zero", () => {
      expect(formatNumber(0)).toBe("0,00");
    });

    it("formatuje bardzo małe liczby", () => {
      expect(formatNumber(0.01)).toBe("0,01");
    });

    it("formatuje bardzo duże liczby", () => {
      const result = formatNumber(999999999.99);
      expect(result).toContain("999");
      expect(result).toContain(",99");
    });

    it("formatuje liczby z wieloma miejscami dziesiętnymi (zaokrągla)", () => {
      const result = formatNumber(1234.5678);
      expect(result).toContain("1234,57");
    });

    it("formatuje liczby całkowite", () => {
      const result = formatNumber(1000);
      expect(result).toContain(",00");
    });
  });

  describe("opcje formatowania - decimals", () => {
    it("formatuje z 0 miejscami po przecinku", () => {
      const result = formatNumber(1234.56, { decimals: 0 });
      expect(result).toContain("1235");
    });

    it("formatuje z 1 miejscem po przecinku", () => {
      const result = formatNumber(1234.56, { decimals: 1 });
      expect(result).toContain("1234,6");
    });

    it("formatuje z 3 miejscami po przecinku", () => {
      const result = formatNumber(1234.5, { decimals: 3 });
      expect(result).toContain("1234,500");
    });

    it("zaokrągla w górę przy decimals=0", () => {
      const result = formatNumber(1234.7, { decimals: 0 });
      expect(result).toContain("1235");
    });

    it("zaokrągla w dół przy decimals=0", () => {
      const result = formatNumber(1234.4, { decimals: 0 });
      expect(result).toContain("1234");
    });

    it("zaokrągla do pełnych wartości przy .5", () => {
      // Banker's rounding - JavaScript Math.round behavior
      const result = formatNumber(1234.5, { decimals: 0 });
      expect(result).toContain("1235");
    });
  });

  describe("wartości graniczne", () => {
    it("formatuje Number.MAX_SAFE_INTEGER", () => {
      const result = formatNumber(Number.MAX_SAFE_INTEGER);
      expect(result).toContain("9");
      expect(result).toContain("007");
      expect(result).toContain(",00");
    });

    it("formatuje Number.MIN_SAFE_INTEGER", () => {
      const result = formatNumber(Number.MIN_SAFE_INTEGER);
      expect(result).toContain("-");
      expect(result).toContain("9");
      expect(result).toContain("007");
      expect(result).toContain(",00");
    });

    it("formatuje bardzo małą liczbę dziesiętną", () => {
      expect(formatNumber(0.001)).toBe("0,00");
    });

    it("formatuje liczby blisko zera", () => {
      expect(formatNumber(0.005)).toBe("0,01");
      expect(formatNumber(-0.005)).toBe("-0,01");
    });
  });
});

describe("formatPercentage", () => {
  describe("podstawowe formatowanie", () => {
    it("formatuje 0.75 jako 75%", () => {
      expect(formatPercentage(0.75)).toBe("75%");
    });

    it("formatuje 0 jako 0%", () => {
      expect(formatPercentage(0)).toBe("0%");
    });

    it("formatuje 1 jako 100%", () => {
      expect(formatPercentage(1)).toBe("100%");
    });

    it("formatuje wartości ujemne", () => {
      expect(formatPercentage(-0.5)).toBe("-50%");
    });

    it("formatuje wartości powyżej 1 (ponad 100%)", () => {
      expect(formatPercentage(1.5)).toBe("150%");
    });
  });

  describe("zaokrąglanie domyślne (0 miejsc po przecinku)", () => {
    it("zaokrągla 0.755 do 76%", () => {
      expect(formatPercentage(0.755)).toBe("76%");
    });

    it("zaokrągla 0.744 do 74%", () => {
      expect(formatPercentage(0.744)).toBe("74%");
    });

    it("zaokrągla 0.7532 do 75%", () => {
      expect(formatPercentage(0.7532)).toBe("75%");
    });

    it("zaokrągla małe wartości", () => {
      expect(formatPercentage(0.004)).toBe("0%");
      expect(formatPercentage(0.005)).toBe("1%");
    });
  });

  describe("formatowanie z miejscami dziesiętnymi", () => {
    it("formatuje z 1 miejscem po przecinku", () => {
      expect(formatPercentage(0.7532, 1)).toBe("75,3%");
    });

    it("formatuje z 2 miejscami po przecinku", () => {
      expect(formatPercentage(0.7532, 2)).toBe("75,32%");
    });

    it("formatuje 0 z miejscami dziesiętnymi", () => {
      expect(formatPercentage(0, 2)).toBe("0,00%");
    });

    it("formatuje 1 z miejscami dziesiętnymi", () => {
      expect(formatPercentage(1, 2)).toBe("100,00%");
    });

    it("używa przecinka jako separatora dziesiętnego", () => {
      expect(formatPercentage(0.12345, 3)).toBe("12,345%");
    });
  });

  describe("edge cases", () => {
    it("formatuje bardzo małe wartości", () => {
      expect(formatPercentage(0.001, 1)).toBe("0,1%");
      expect(formatPercentage(0.0001, 2)).toBe("0,01%");
    });

    it("formatuje bardzo duże wartości", () => {
      expect(formatPercentage(10)).toBe("1000%");
      expect(formatPercentage(100, 1)).toBe("10000,0%");
    });

    it("formatuje wartości bliskie zeru", () => {
      expect(formatPercentage(0.00001)).toBe("0%");
      expect(formatPercentage(-0.00001)).toBe("0%"); // JavaScript zaokrągla -0 do 0
    });

    it("formatuje ujemne wartości z decimals", () => {
      expect(formatPercentage(-0.456, 2)).toBe("-45,60%");
    });
  });

  describe("przypadki użycia biznesowego", () => {
    it("formatuje współczynnik akceptacji (success rate)", () => {
      expect(formatPercentage(0.875)).toBe("88%");
    });

    it("formatuje współczynnik edycji", () => {
      expect(formatPercentage(0.333, 1)).toBe("33,3%");
    });

    it("formatuje 100% akceptacji", () => {
      expect(formatPercentage(1.0)).toBe("100%");
    });

    it("formatuje brak akceptacji", () => {
      expect(formatPercentage(0.0)).toBe("0%");
    });
  });
});

describe("formatDuration", () => {
  describe("podstawowe formatowanie", () => {
    it("formatuje 2500ms jako 2,5s", () => {
      expect(formatDuration(2500)).toBe("2,5s");
    });

    it("formatuje 1000ms jako 1,0s", () => {
      expect(formatDuration(1000)).toBe("1,0s");
    });

    it("formatuje 1234ms jako 1,2s", () => {
      expect(formatDuration(1234)).toBe("1,2s");
    });

    it("formatuje 0ms jako 0,0s", () => {
      expect(formatDuration(0)).toBe("0,0s");
    });
  });

  describe("zaokrąglanie do 1 miejsca po przecinku", () => {
    it("zaokrągla 1555ms do 1,6s", () => {
      expect(formatDuration(1555)).toBe("1,6s");
    });

    it("zaokrągla 1544ms do 1,5s", () => {
      expect(formatDuration(1544)).toBe("1,5s");
    });

    it("zaokrągla 999ms do 1,0s", () => {
      expect(formatDuration(999)).toBe("1,0s");
    });

    it("zaokrągla 501ms do 0,5s", () => {
      expect(formatDuration(501)).toBe("0,5s");
    });
  });

  describe("edge cases", () => {
    it("formatuje bardzo małe wartości", () => {
      expect(formatDuration(1)).toBe("0,0s");
      expect(formatDuration(10)).toBe("0,0s");
      expect(formatDuration(50)).toBe("0,1s");
    });

    it("formatuje bardzo duże wartości", () => {
      expect(formatDuration(60000)).toBe("60,0s"); // 1 minuta
      expect(formatDuration(600000)).toBe("600,0s"); // 10 minut
    });

    it("formatuje dokładnie sekundy", () => {
      expect(formatDuration(1000)).toBe("1,0s");
      expect(formatDuration(5000)).toBe("5,0s");
      expect(formatDuration(10000)).toBe("10,0s");
    });

    it("używa przecinka jako separatora", () => {
      const result = formatDuration(1500);
      expect(result).toContain(",");
      expect(result).not.toContain(".");
    });
  });

  describe("przypadki użycia biznesowego - generowanie flashcards", () => {
    it("formatuje typowy czas generowania (2-5s)", () => {
      expect(formatDuration(2134)).toBe("2,1s");
      expect(formatDuration(3876)).toBe("3,9s");
      expect(formatDuration(4521)).toBe("4,5s");
    });

    it("formatuje szybkie generowanie (<1s)", () => {
      expect(formatDuration(750)).toBe("0,8s");
    });

    it("formatuje wolne generowanie (>10s)", () => {
      expect(formatDuration(12345)).toBe("12,3s");
    });

    it("formatuje timeout scenario (30s)", () => {
      expect(formatDuration(30000)).toBe("30,0s");
    });
  });
});
