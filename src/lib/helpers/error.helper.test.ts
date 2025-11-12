import { describe, it, expect } from "vitest";
import {
  errorResponse,
  validationError,
  notFoundError,
  unauthorizedError,
  internalError,
  rateLimitError,
  aiServiceError,
} from "./error.helper";

describe("errorResponse", () => {
  it("tworzy poprawną odpowiedź z błędem", async () => {
    const response = errorResponse("VALIDATION_ERROR", "Invalid input", 400);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/json");

    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: undefined,
      },
    });
  });

  it("tworzy odpowiedź z dodatkowymi szczegółami", async () => {
    const details = { field: "email", reason: "invalid format" };
    const response = errorResponse("VALIDATION_ERROR", "Invalid email", 400, details);

    const body = await response.json();
    expect(body.error.details).toEqual(details);
  });

  it("ustawia poprawny Content-Type header", () => {
    const response = errorResponse("INTERNAL_ERROR", "Server error", 500);
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("obsługuje różne kody błędów", async () => {
    const codes = ["VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED", "INTERNAL_ERROR"] as const;

    for (const code of codes) {
      const response = errorResponse(code, "Test message", 400);
      const body = await response.json();
      expect(body.error.code).toBe(code);
    }
  });

  it("obsługuje puste details", async () => {
    const response = errorResponse("INTERNAL_ERROR", "Error", 500, undefined);
    const body = await response.json();
    expect(body.error.details).toBeUndefined();
  });

  it("obsługuje złożone obiekty details", async () => {
    const details = {
      errors: [
        { field: "name", message: "required" },
        { field: "email", message: "invalid" },
      ],
      metadata: { timestamp: "2024-01-01" },
    };
    const response = errorResponse("VALIDATION_ERROR", "Multiple errors", 400, details);
    const body = await response.json();
    expect(body.error.details).toEqual(details);
  });
});

describe("validationError", () => {
  it("tworzy odpowiedź 400 Bad Request", async () => {
    const response = validationError("Validation failed");

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Validation failed");
  });

  it("obsługuje szczegóły walidacji", async () => {
    const details = {
      front: "Front text is required",
      back: "Back text must be 500 characters or less",
    };
    const response = validationError("Validation failed", details);

    const body = await response.json();
    expect(body.error.details).toEqual(details);
  });

  it("zwraca poprawną strukturę JSON", async () => {
    const response = validationError("Invalid data");
    const body = await response.json();

    expect(body).toHaveProperty("error");
    expect(body.error).toHaveProperty("code");
    expect(body.error).toHaveProperty("message");
  });

  it("obsługuje długie komunikaty błędów", async () => {
    const longMessage =
      "This is a very long validation error message that describes all the problems with the input data in great detail.";
    const response = validationError(longMessage);
    const body = await response.json();
    expect(body.error.message).toBe(longMessage);
  });
});

describe("notFoundError", () => {
  it("tworzy odpowiedź 404 Not Found z domyślnym komunikatem", async () => {
    const response = notFoundError();

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("Resource not found");
  });

  it("obsługuje niestandardowy komunikat", async () => {
    const response = notFoundError("Flashcard not found");

    const body = await response.json();
    expect(body.error.message).toBe("Flashcard not found");
  });

  it("zwraca poprawny kod błędu", async () => {
    const response = notFoundError();
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("obsługuje różne typy zasobów", async () => {
    const resources = ["User", "Flashcard", "Generation", "Statistics"];

    for (const resource of resources) {
      const response = notFoundError(`${resource} not found`);
      const body = await response.json();
      expect(body.error.message).toContain(resource);
    }
  });
});

describe("unauthorizedError", () => {
  it("tworzy odpowiedź 401 Unauthorized z domyślnym komunikatem", async () => {
    const response = unauthorizedError();

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(body.error.message).toBe("Unauthorized");
  });

  it("obsługuje niestandardowy komunikat", async () => {
    const response = unauthorizedError("Invalid credentials");

    const body = await response.json();
    expect(body.error.message).toBe("Invalid credentials");
  });

  it("zwraca poprawny Content-Type", () => {
    const response = unauthorizedError();
    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  it("obsługuje różne scenariusze autoryzacji", async () => {
    const scenarios = ["Session expired", "Invalid token", "Access denied", "Authentication required"];

    for (const scenario of scenarios) {
      const response = unauthorizedError(scenario);
      const body = await response.json();
      expect(body.error.message).toBe(scenario);
      expect(response.status).toBe(401);
    }
  });
});

describe("internalError", () => {
  it("tworzy odpowiedź 500 Internal Server Error z domyślnym komunikatem", async () => {
    const response = internalError();

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).toBe("Internal server error");
  });

  it("obsługuje niestandardowy komunikat", async () => {
    const response = internalError("Database connection failed");

    const body = await response.json();
    expect(body.error.message).toBe("Database connection failed");
  });

  it("obsługuje szczegóły błędu", async () => {
    const details = {
      stack: "Error: Connection timeout",
      timestamp: "2024-01-01T12:00:00Z",
    };
    const response = internalError("Server error", details);

    const body = await response.json();
    expect(body.error.details).toEqual(details);
  });

  it("zwraca poprawną strukturę bez details", async () => {
    const response = internalError("Error occurred");
    const body = await response.json();
    expect(body.error).toHaveProperty("code");
    expect(body.error).toHaveProperty("message");
    expect(body.error.details).toBeUndefined();
  });
});

describe("rateLimitError", () => {
  it("tworzy odpowiedź 429 Too Many Requests z domyślnym komunikatem", async () => {
    const response = rateLimitError();

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error.code).toBe("RATE_LIMIT_ERROR");
    expect(body.error.message).toBe("Too many requests");
  });

  it("obsługuje niestandardowy komunikat", async () => {
    const response = rateLimitError("Rate limit exceeded. Try again in 60 seconds.");

    const body = await response.json();
    expect(body.error.message).toBe("Rate limit exceeded. Try again in 60 seconds.");
  });

  it("zwraca poprawny kod HTTP", () => {
    const response = rateLimitError();
    expect(response.status).toBe(429);
  });

  it("zwraca poprawny kod błędu", async () => {
    const response = rateLimitError();
    const body = await response.json();
    expect(body.error.code).toBe("RATE_LIMIT_ERROR");
  });
});

describe("aiServiceError", () => {
  it("tworzy odpowiedź 500 z domyślnym statusem", async () => {
    const response = aiServiceError("AI service unavailable");

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error.code).toBe("AI_SERVICE_ERROR");
    expect(body.error.message).toBe("AI service unavailable");
  });

  it("obsługuje niestandardowy status (503)", async () => {
    const response = aiServiceError("Service temporarily unavailable", 503);

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("AI_SERVICE_ERROR");
  });

  it("obsługuje szczegóły błędu", async () => {
    const details = {
      provider: "OpenRouter",
      model: "gpt-4o-mini",
      error_type: "timeout",
    };
    const response = aiServiceError("API timeout", 504, details);

    const body = await response.json();
    expect(body.error.details).toEqual(details);
    expect(response.status).toBe(504);
  });

  it("obsługuje różne statusy HTTP", async () => {
    const statuses = [500, 502, 503, 504];

    for (const status of statuses) {
      const response = aiServiceError("AI error", status);
      expect(response.status).toBe(status);
      const body = await response.json();
      expect(body.error.code).toBe("AI_SERVICE_ERROR");
    }
  });

  it("obsługuje szczegóły błędu OpenRouter", async () => {
    const details = {
      provider: "OpenRouter",
      model: "openai/gpt-4o-mini",
      error_code: "rate_limit_exceeded",
      retry_after: 60,
    };
    const response = aiServiceError("Rate limit exceeded", 429, details);

    const body = await response.json();
    expect(body.error.details).toEqual(details);
  });
});

describe("integracja - łączenie różnych typów błędów", () => {
  it("wszystkie funkcje zwracają Response", () => {
    const responses = [
      errorResponse("VALIDATION_ERROR", "test", 400),
      validationError("test"),
      notFoundError(),
      unauthorizedError(),
      internalError(),
      rateLimitError(),
      aiServiceError("test"),
    ];

    responses.forEach((response) => {
      expect(response).toBeInstanceOf(Response);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  it("wszystkie odpowiedzi są JSON-parsowalne", async () => {
    const responses = [
      validationError("test"),
      notFoundError(),
      unauthorizedError(),
      internalError(),
      rateLimitError(),
      aiServiceError("test"),
    ];

    for (const response of responses) {
      const body = await response.json();
      expect(body).toHaveProperty("error");
      expect(body.error).toHaveProperty("code");
      expect(body.error).toHaveProperty("message");
    }
  });

  it("każdy typ błędu ma unikalny status code", () => {
    const errors = [
      { fn: validationError("test"), status: 400 },
      { fn: unauthorizedError(), status: 401 },
      { fn: notFoundError(), status: 404 },
      { fn: rateLimitError(), status: 429 },
      { fn: internalError(), status: 500 },
      { fn: aiServiceError("test"), status: 500 },
    ];

    errors.forEach(({ fn, status }) => {
      expect(fn.status).toBe(status);
    });
  });
});
