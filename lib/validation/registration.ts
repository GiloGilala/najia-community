import { z } from "zod";

/**
 * Shared validation for user registration. Reused across entry points so
 * validation is not duplicated (architecture doc 6.1.3).
 */

export class RegistrationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistrationValidationError";
  }
}

/** Minimum password length. A stronger policy is a follow-up hardening item. */
export const MIN_PASSWORD_LENGTH = 8;

export const registrationSchema = z
  .object({
    email: z.email().optional(),
    phone: z.string().min(3).optional(),
    password: z.string().min(MIN_PASSWORD_LENGTH),
  })
  .refine((v) => v.email !== undefined || v.phone !== undefined, {
    message: "At least one of email or phone is required",
  });

export type ValidatedRegistration = z.infer<typeof registrationSchema>;

export function validateRegistration(input: unknown): ValidatedRegistration {
  const result = registrationSchema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new RegistrationValidationError(
      first ? `${first.path.join(".")}: ${first.message}` : "Invalid registration",
    );
  }
  return result.data;
}
