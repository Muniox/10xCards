import { describe, it, expect } from "vitest";

/**
 * Example unit test file
 * This demonstrates how to write unit tests with Vitest
 */

describe("Example Unit Tests", () => {
  it("should pass a basic assertion", () => {
    expect(true).toBe(true);
  });

  it("should perform mathematical operations", () => {
    const sum = 2 + 2;
    expect(sum).toBe(4);
  });

  it("should work with arrays", () => {
    const numbers = [1, 2, 3];
    expect(numbers).toHaveLength(3);
    expect(numbers).toContain(2);
  });

  it("should work with objects", () => {
    const user = { name: "John", age: 30 };
    expect(user).toHaveProperty("name");
    expect(user.name).toBe("John");
  });
});
