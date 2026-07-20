import { z } from "zod";

/**
 * Shared validation for lawyer reviews.
 * Reused across entry points so validation is not duplicated.
 */
export class LawyerReviewValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LawyerReviewValidationError";
  }
}

export const MAX_COMMENT_LENGTH = 1000;

export const submitReviewSchema = z
  .object({
    lawyerId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(MAX_COMMENT_LENGTH).optional(),
    anonymous: z.boolean().optional().default(false),
  });

export type ValidatedSubmitReview = z.infer<typeof submitReviewSchema>;

export function validateSubmitReview(input: unknown): ValidatedSubmitReview {
  const result = submitReviewSchema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new LawyerReviewValidationError(
      first ? `${first.path.join(".")}: ${first.message}` : "Invalid review",
    );
  }
  return result.data;
}

export const respondToReviewSchema = z.object({
  reviewId: z.string().uuid(),
  response: z.string().max(MAX_COMMENT_LENGTH).min(1),
});

export type ValidatedRespondToReview = z.infer<typeof respondToReviewSchema>;

export function validateRespondToReview(
  input: unknown,
): ValidatedRespondToReview {
  const result = respondToReviewSchema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new LawyerReviewValidationError(
      first ? `${first.path.join(".")}: ${first.message}` : "Invalid response",
    );
  }
  return result.data;
}
