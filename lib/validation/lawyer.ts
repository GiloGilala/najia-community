import { z } from "zod";

/**
 * Shared validation for lawyer onboarding.
 * Reused across entry points so validation is not duplicated.
 */
export class LawyerValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LawyerValidationError";
  }
}

export const onboardLawyerSchema = z
  .object({
    userId: z.string().uuid(),
    barNumber: z.string().min(1),
    practiceAreas: z.array(z.string().min(1)).min(1),
    licensedJurisdictionIds: z.array(z.string().uuid()).min(1),
    yearsPracticing: z.number().int().min(0),
    languages: z.array(z.string().min(1)),
    proBono: z.boolean().optional().default(false),
  });

export type ValidatedOnboardLawyer = z.infer<typeof onboardLawyerSchema>;

export function validateOnboardLawyer(input: unknown): ValidatedOnboardLawyer {
  const result = onboardLawyerSchema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new LawyerValidationError(
      first ? `${first.path.join(".")}: ${first.message}` : "Invalid lawyer",
    );
  }
  return result.data;
}
