import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { resetPasswordSchema, type ResetPasswordFormData } from "../../lib/validation/auth.schemas";
import { AlertCircle, CheckCircle } from "lucide-react";

export function ResetPasswordForm() {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Walidacja kliencka
    const validation = resetPasswordSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    // TODO: Implementacja wysyłania do API
    // try {
    //   const response = await fetch("/api/auth/reset-password", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(validation.data),
    //   });
    //
    //   if (!response.ok) {
    //     const error = await response.json();
    //     if (response.status === 404) {
    //       setError("Nie znaleziono użytkownika z tym adresem email");
    //     } else if (response.status === 400) {
    //       // Błędy walidacji z backendu
    //       setFieldErrors(error.error.details || {});
    //     } else {
    //       setError("Wystąpił błąd. Spróbuj ponownie.");
    //     }
    //     return;
    //   }
    //
    //   // Sukces
    //   setSuccess(true);
    // } catch (err) {
    //   setError("Brak połączenia z serwerem");
    // } finally {
    //   setIsLoading(false);
    // }

    // Tymczasowo - symulacja
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
      console.log("Reset password attempt:", validation.data);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Usuń błąd pola po zmianie wartości
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-lg border shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Resetowanie hasła</h1>
        <p className="text-center text-muted-foreground text-sm mb-6">Podaj adres email powiązany z Twoim kontem</p>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <div className="space-y-6">
            <Alert variant="default" className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                Link do resetowania hasła został wysłany na adres <strong>{formData.email}</strong>. Sprawdź swoją
                skrzynkę pocztową.
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <a
                href="/login"
                className="inline-flex items-center justify-center text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
              >
                Powrót do logowania
              </a>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="twoj@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  autoComplete="email"
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && <p className="text-sm text-red-600">{fieldErrors.email}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <a
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
              >
                Powrót do logowania
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
