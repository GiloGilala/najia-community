import { z } from "zod";

/**
 * Shared validation for poll creation. Reused across entry points so
 * validation is not duplicated (architecture doc 6.1.3).
 */
export class PollValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PollValidationError";
  }
}

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 5;

export const createPollSchema = z
  .object({
    title: z.string().min(1),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(MIN_OPTIONS).max(MAX_OPTIONS),
    jurisdictionId: z.string().uuid(),
    opensAt: z.date(),
    closesAt: z.date(),
    createdBy: z.string().uuid(),
  })
  .refine((v) => v.closesAt.getTime() > v.opensAt.getTime(), {
    message: "closesAt must be after opensAt",
    path: ["closesAt"],
  });

export type ValidatedCreatePoll = z.infer<typeof createPollSchema>;

export function validateCreatePoll(input: unknown): ValidatedCreatePoll {
  const result = createPollSchema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new PollValidationError(
      first ? `${first.path.join(".")}: ${first.message}` : "Invalid poll",
    );
  }
  return result.data;
}
