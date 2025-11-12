import { z } from "zod";

// ============================================================================
// Authentication Schemas
// ============================================================================

/**
 * Schema for login form validation
 * Used in LoginForm component and POST /api/auth/login endpoint
 */
export const loginSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
  password: z.string().min(6, "Hasło musi mieć minimum 6 znaków"),
});

/**
 * Schema for registration form validation
 * Used in RegisterForm component and POST /api/auth/register endpoint
 */
export const registerSchema = z
  .object({
    email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
    password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

/**
 * Schema for password reset form validation
 * Used in ResetPasswordForm component and POST /api/auth/reset-password endpoint
 * OPTIONAL in MVP - can be implemented later
 */
export const resetPasswordSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
});

// ============================================================================
// Type Exports (for TypeScript inference)
// ============================================================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
