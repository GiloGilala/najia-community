import { z } from "zod";

import type { ConfidenceOption } from "../db/schema/officials.ts";

/**
 * Shared validation for official registration and confidence votes.
 * Reused across entry points so validation is not duplicated.
 */
export class ConfidenceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfidenceValidationError";
  }
}

export const CONFIDENCE_OPTIONS: ConfidenceOption[] = ["yes", "no", "uncertain"];

export const confidenceOptionSchema = z.enum(["yes", "no", "uncertain"]);

export const registerOfficialSchema = z
  .object({
    name: z.string().min(1),
    title: z.string().min(1),
    jurisdictionId: z.string().uuid(),
    termStartsAt: z.date(),
    termEndsAt: z.date().nullable().optional(),
  })
  .refine(
    (v) => v.termEndsAt == null || v.termEndsAt.getTime() > v.termStartsAt.getTime(),
    {
      message: "termEndsAt must be after termStartsAt",
      path: ["termEndsAt"],
    },
  );

export type ValidatedRegisterOfficial = z.infer<typeof registerOfficialSchema>;

export const castConfidenceVoteSchema = z.object({
  officialId: z.string().uuid(),
  option: confidenceOptionSchema,
});

export type ValidatedCastConfidenceVote = z.infer<typeof castConfidenceVoteSchema>;

export function validateRegisterOfficial(input: unknown): ValidatedRegisterOfficial {
  const result = registerOfficialSchema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ConfidenceValidationError(
      first ? `${first.path.join(".")}: ${first.message}` : "Invalid official",
    );
  }
  return result.data;
}

export function validateCastConfidenceVote(
  input: unknown,
): ValidatedCastConfidenceVote {
  const result = castConfidenceVoteSchema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ConfidenceValidationError(
      first ? `${first.path.join(".")}: ${first.message}` : "Invalid confidence vote",
    );
  }
  return result.data;
}
