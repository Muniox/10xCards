import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, resetPasswordSchema } from "./auth.schemas";

describe("loginSchema", () => {
  describe("poprawne wartości", () => {
    it("akceptuje poprawny email i hasło", () => {
      const result = loginSchema.parse({
        email: "user@example.com",
        password: "password123",
      });
      expect(result.email).toBe("user@example.com");
      expect(result.password).toBe("password123");
    });

    it("akceptuje hasło o długości 6 znaków (minimum)", () => {
      const result = loginSchema.parse({
        email: "user@example.com",
        password: "pass12",
      });
      expect(result.password.length).toBe(6);
    });

    it("akceptuje różne formaty email", () => {
      const validEmails = [
        "user@example.com",
        "user.name@example.com",
        "user+tag@example.co.uk",
        "user_123@sub.example.com",
      ];

      validEmails.forEach((email) => {
        const result = loginSchema.parse({ email, password: "password123" });
        expect(result.email).toBe(email);
      });
    });
  });

  describe("walidacja błędów email", () => {
    it("odrzuca pusty email", () => {
      expect(() =>
        loginSchema.parse({
          email: "",
          password: "password123",
        })
      ).toThrow("Email jest wymagany");
    });

    it("odrzuca nieprawidłowy format email", () => {
      const invalidEmails = ["notanemail", "missing@domain", "@example.com", "user@", "user @example.com"];

      invalidEmails.forEach((email) => {
        expect(() =>
          loginSchema.parse({
            email,
            password: "password123",
          })
        ).toThrow("Nieprawidłowy format email");
      });
    });

    it("odrzuca email bez @", () => {
      expect(() =>
        loginSchema.parse({
          email: "userexample.com",
          password: "password123",
        })
      ).toThrow("Nieprawidłowy format email");
    });
  });

  describe("walidacja błędów hasła", () => {
    it("odrzuca hasło < 6 znaków", () => {
      expect(() =>
        loginSchema.parse({
          email: "user@example.com",
          password: "12345",
        })
      ).toThrow("Hasło musi mieć minimum 6 znaków");
    });

    it("odrzuca puste hasło", () => {
      expect(() =>
        loginSchema.parse({
          email: "user@example.com",
          password: "",
        })
      ).toThrow();
    });
  });

  describe("edge cases", () => {
    it("akceptuje bardzo długie hasło", () => {
      const longPassword = "a".repeat(100);
      const result = loginSchema.parse({
        email: "user@example.com",
        password: longPassword,
      });
      expect(result.password).toBe(longPassword);
    });

    it("akceptuje hasło ze znakami specjalnymi", () => {
      const result = loginSchema.parse({
        email: "user@example.com",
        password: "P@ssw0rd!#$%",
      });
      expect(result.password).toBe("P@ssw0rd!#$%");
    });
  });
});

describe("registerSchema", () => {
  describe("poprawne wartości", () => {
    it("akceptuje poprawne dane rejestracji", () => {
      const result = registerSchema.parse({
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.email).toBe("user@example.com");
      expect(result.password).toBe("password123");
      expect(result.confirmPassword).toBe("password123");
    });

    it("akceptuje hasło o długości 8 znaków (minimum)", () => {
      const result = registerSchema.parse({
        email: "user@example.com",
        password: "pass1234",
        confirmPassword: "pass1234",
      });
      expect(result.password.length).toBe(8);
    });

    it("akceptuje silne hasła", () => {
      const result = registerSchema.parse({
        email: "user@example.com",
        password: "StrongP@ssw0rd!",
        confirmPassword: "StrongP@ssw0rd!",
      });
      expect(result.password).toBe("StrongP@ssw0rd!");
    });
  });

  describe("walidacja błędów email", () => {
    it("odrzuca pusty email", () => {
      expect(() =>
        registerSchema.parse({
          email: "",
          password: "password123",
          confirmPassword: "password123",
        })
      ).toThrow("Email jest wymagany");
    });

    it("odrzuca nieprawidłowy format email", () => {
      expect(() =>
        registerSchema.parse({
          email: "invalid-email",
          password: "password123",
          confirmPassword: "password123",
        })
      ).toThrow("Nieprawidłowy format email");
    });
  });

  describe("walidacja błędów hasła", () => {
    it("odrzuca hasło < 8 znaków", () => {
      expect(() =>
        registerSchema.parse({
          email: "user@example.com",
          password: "pass123",
          confirmPassword: "pass123",
        })
      ).toThrow("Hasło musi mieć minimum 8 znaków");
    });

    it("odrzuca puste hasło", () => {
      expect(() =>
        registerSchema.parse({
          email: "user@example.com",
          password: "",
          confirmPassword: "",
        })
      ).toThrow();
    });
  });

  describe("walidacja potwierdzenia hasła", () => {
    it("odrzuca różne hasła", () => {
      expect(() =>
        registerSchema.parse({
          email: "user@example.com",
          password: "password123",
          confirmPassword: "different123",
        })
      ).toThrow("Hasła muszą być identyczne");
    });

    it("odrzuca puste confirmPassword", () => {
      expect(() =>
        registerSchema.parse({
          email: "user@example.com",
          password: "password123",
          confirmPassword: "",
        })
      ).toThrow("Potwierdzenie hasła jest wymagane");
    });

    it("waliduje zgodność uwzględniając wielkość liter", () => {
      expect(() =>
        registerSchema.parse({
          email: "user@example.com",
          password: "Password123",
          confirmPassword: "password123",
        })
      ).toThrow("Hasła muszą być identyczne");
    });

    it("akceptuje identyczne hasła ze znakami specjalnymi", () => {
      const result = registerSchema.parse({
        email: "user@example.com",
        password: "P@ssw0rd!123",
        confirmPassword: "P@ssw0rd!123",
      });
      expect(result.password).toBe(result.confirmPassword);
    });
  });

  describe("edge cases", () => {
    it("wymaga minimum 8 znaków (więcej niż login)", () => {
      // Login wymaga 6, register wymaga 8
      expect(() =>
        registerSchema.parse({
          email: "user@example.com",
          password: "pass12", // 6 znaków - OK dla login, nie OK dla register
          confirmPassword: "pass12",
        })
      ).toThrow("Hasło musi mieć minimum 8 znaków");
    });

    it("akceptuje bardzo długie hasła jeśli są identyczne", () => {
      const longPassword = "a".repeat(100);
      const result = registerSchema.parse({
        email: "user@example.com",
        password: longPassword,
        confirmPassword: longPassword,
      });
      expect(result.password).toBe(longPassword);
    });

    it("odrzuca hasła różniące się spacją", () => {
      expect(() =>
        registerSchema.parse({
          email: "user@example.com",
          password: "password123",
          confirmPassword: "password123 ",
        })
      ).toThrow("Hasła muszą być identyczne");
    });
  });

  describe("refine - custom validation", () => {
    it("działa refine dla zgodności haseł", () => {
      const valid = registerSchema.safeParse({
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(valid.success).toBe(true);

      const invalid = registerSchema.safeParse({
        email: "user@example.com",
        password: "password123",
        confirmPassword: "different",
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues[0].path).toContain("confirmPassword");
      }
    });
  });
});

describe("resetPasswordSchema", () => {
  describe("poprawne wartości", () => {
    it("akceptuje poprawny email", () => {
      const result = resetPasswordSchema.parse({
        email: "user@example.com",
      });
      expect(result.email).toBe("user@example.com");
    });

    it("akceptuje różne formaty email", () => {
      const validEmails = ["user@example.com", "user.name@example.com", "user+reset@example.co.uk"];

      validEmails.forEach((email) => {
        const result = resetPasswordSchema.parse({ email });
        expect(result.email).toBe(email);
      });
    });
  });

  describe("walidacja błędów", () => {
    it("odrzuca pusty email", () => {
      expect(() =>
        resetPasswordSchema.parse({
          email: "",
        })
      ).toThrow("Email jest wymagany");
    });

    it("odrzuca nieprawidłowy format email", () => {
      expect(() =>
        resetPasswordSchema.parse({
          email: "not-an-email",
        })
      ).toThrow("Nieprawidłowy format email");
    });

    it("odrzuca email bez @", () => {
      expect(() =>
        resetPasswordSchema.parse({
          email: "userexample.com",
        })
      ).toThrow("Nieprawidłowy format email");
    });

    it("odrzuca email bez domeny", () => {
      expect(() =>
        resetPasswordSchema.parse({
          email: "user@",
        })
      ).toThrow("Nieprawidłowy format email");
    });
  });

  describe("edge cases", () => {
    it("akceptuje email z subdomeną", () => {
      const result = resetPasswordSchema.parse({
        email: "user@mail.example.com",
      });
      expect(result.email).toBe("user@mail.example.com");
    });

    it("akceptuje email z plusem (tag)", () => {
      const result = resetPasswordSchema.parse({
        email: "user+tag@example.com",
      });
      expect(result.email).toBe("user+tag@example.com");
    });
  });
});

describe("integracja - porównanie schematów auth", () => {
  it("loginSchema wymaga 6 znaków, registerSchema 8", () => {
    const password6 = "pass12";
    const password8 = "pass1234";

    // Login akceptuje 6 znaków
    const loginResult = loginSchema.safeParse({
      email: "user@example.com",
      password: password6,
    });
    expect(loginResult.success).toBe(true);

    // Register wymaga 8 znaków
    const registerResult = registerSchema.safeParse({
      email: "user@example.com",
      password: password6,
      confirmPassword: password6,
    });
    expect(registerResult.success).toBe(false);

    // Register akceptuje 8 znaków
    const registerResult2 = registerSchema.safeParse({
      email: "user@example.com",
      password: password8,
      confirmPassword: password8,
    });
    expect(registerResult2.success).toBe(true);
  });

  it("wszystkie schematy używają tych samych komunikatów błędów email", () => {
    const schemas = [
      { name: "login", schema: loginSchema, data: { email: "", password: "password" } },
      {
        name: "register",
        schema: registerSchema,
        data: { email: "", password: "password123", confirmPassword: "password123" },
      },
      { name: "reset", schema: resetPasswordSchema, data: { email: "" } },
    ];

    schemas.forEach(({ name, schema, data }) => {
      expect(() => schema.parse(data)).toThrow("Email jest wymagany");
    });
  });

  it("wszystkie schematy walidują format email konsystentnie", () => {
    const invalidEmail = "invalid-email";

    expect(() => loginSchema.parse({ email: invalidEmail, password: "password" })).toThrow(
      "Nieprawidłowy format email"
    );

    expect(() =>
      registerSchema.parse({
        email: invalidEmail,
        password: "password123",
        confirmPassword: "password123",
      })
    ).toThrow("Nieprawidłowy format email");

    expect(() => resetPasswordSchema.parse({ email: invalidEmail })).toThrow("Nieprawidłowy format email");
  });
});
