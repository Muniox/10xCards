import { useState, useEffect, useCallback } from "react";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FLASHCARD_LIMITS } from "@/lib/constants/flashcards";
import type {
  CreateEditFlashcardDialogProps,
  FlashcardFormData,
  FlashcardFormErrors,
} from "@/types/flashcards-view.types";

/**
 * Dialog for creating a new flashcard or editing an existing one
 * Includes form validation, character counters, and error handling
 */
export function CreateEditFlashcardDialog({
  isOpen,
  mode,
  flashcard,
  onClose,
  onSubmit,
}: CreateEditFlashcardDialogProps) {
  const [formData, setFormData] = useState<FlashcardFormData>({
    front: "",
    back: "",
  });
  const [formErrors, setFormErrors] = useState<FlashcardFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form data when dialog opens or flashcard changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        front: flashcard?.front || "",
        back: flashcard?.back || "",
      });
      setFormErrors({});
      setSubmitError(null);
    }
  }, [isOpen, flashcard]);

  // Validate front field
  const validateFront = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return "Przód fiszki jest wymagany";
    }
    if (trimmed.length > FLASHCARD_LIMITS.FRONT_MAX_LENGTH) {
      return `Maksymalnie ${FLASHCARD_LIMITS.FRONT_MAX_LENGTH} znaków`;
    }
    return undefined;
  }, []);

  // Validate back field
  const validateBack = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return "Tył fiszki jest wymagany";
    }
    if (trimmed.length > FLASHCARD_LIMITS.BACK_MAX_LENGTH) {
      return `Maksymalnie ${FLASHCARD_LIMITS.BACK_MAX_LENGTH} znaków`;
    }
    return undefined;
  }, []);

  // Handle field change with validation
  const handleFieldChange = useCallback(
    (field: keyof FlashcardFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Validate field
      const error = field === "front" ? validateFront(value) : validateBack(value);
      setFormErrors((prev) => ({ ...prev, [field]: error }));
    },
    [validateFront, validateBack]
  );

  // Only disable submit button during submission, not for validation
  const isSubmitDisabled = isSubmitting;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const frontError = validateFront(formData.front);
    const backError = validateBack(formData.back);

    if (frontError || backError) {
      setFormErrors({ front: frontError, back: backError });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === "create" ? "Dodaj fiszkę" : "Edytuj fiszkę";
  const submitButtonText = mode === "create" ? "Dodaj" : "Zapisz";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Stwórz nową fiszkę wprowadzając treść przodu i tyłu."
              : "Edytuj treść przodu i tyłu fiszki."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 py-4">
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Front field */}
            <div className="space-y-2">
              <Label htmlFor="front">
                Przód fiszki <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="front"
                value={formData.front}
                onChange={(e) => handleFieldChange("front", e.target.value)}
                placeholder="Wprowadź treść przodu fiszki..."
                className={`min-h-[100px] ${formErrors.front ? "border-destructive" : ""}`}
                disabled={isSubmitting}
                aria-describedby={formErrors.front ? "front-error" : "front-counter"}
                aria-invalid={!!formErrors.front}
              />
              <div className="flex justify-between items-center text-xs">
                {formErrors.front ? (
                  <span id="front-error" className="text-destructive">
                    {formErrors.front}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Wymagane pole</span>
                )}
                <span
                  id="front-counter"
                  className={`${
                    formData.front.length > FLASHCARD_LIMITS.FRONT_MAX_LENGTH
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {formData.front.length} / {FLASHCARD_LIMITS.FRONT_MAX_LENGTH}
                </span>
              </div>
            </div>

            {/* Back field */}
            <div className="space-y-2">
              <Label htmlFor="back">
                Tył fiszki <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="back"
                value={formData.back}
                onChange={(e) => handleFieldChange("back", e.target.value)}
                placeholder="Wprowadź treść tyłu fiszki..."
                className={`min-h-[120px] ${formErrors.back ? "border-destructive" : ""}`}
                disabled={isSubmitting}
                aria-describedby={formErrors.back ? "back-error" : "back-counter"}
                aria-invalid={!!formErrors.back}
              />
              <div className="flex justify-between items-center text-xs">
                {formErrors.back ? (
                  <span id="back-error" className="text-destructive">
                    {formErrors.back}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Wymagane pole</span>
                )}
                <span
                  id="back-counter"
                  className={`${
                    formData.back.length > FLASHCARD_LIMITS.BACK_MAX_LENGTH
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {formData.back.length} / {FLASHCARD_LIMITS.BACK_MAX_LENGTH}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {isSubmitting ? "Zapisywanie..." : submitButtonText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
