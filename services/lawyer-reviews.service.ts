import { eq, and, avg, count, sql } from "drizzle-orm";

import type { DbClient } from "../db/client.ts";
import type { Clock } from "../lib/clock/clock.ts";
import {
  validateSubmitReview,
  validateRespondToReview,
  LawyerReviewValidationError,
} from "../lib/validation/lawyer-review.ts";
import {
  lawyerReviews,
  type LawyerReviewRow,
} from "../db/schema/lawyer-reviews.ts";
import { lawyers, type LawyerRow } from "../db/schema/lawyers.ts";
import { users } from "../db/schema/users.ts";
import type { ResolvedVoter } from "../lib/auth/voter-resolver.ts";

export interface SubmitReviewInput {
  lawyerId: string;
  reviewer: ResolvedVoter;
  rating: number;
  comment?: string;
  anonymous?: boolean;
}

export interface LawyerReviewsServiceDeps {
  db: DbClient;
  clock: Clock;
}

export class LawyerNotFoundError extends Error {
  constructor(lawyerId: string) {
    super(`No lawyer found with id: ${lawyerId}`);
    this.name = "LawyerNotFoundError";
  }
}

export class LawyerNotVerifiedError extends Error {
  constructor() {
    super("Lawyer is not verified");
    this.name = "LawyerNotVerifiedError";
  }
}

export class ReviewerUnverifiedError extends Error {
  constructor() {
    super("Reviewer is not id_verified");
    this.name = "ReviewerUnverifiedError";
  }
}

export class DuplicateReviewError extends Error {
  constructor() {
    super("Reviewer has already reviewed this lawyer");
    this.name = "DuplicateReviewError";
  }
}

export class ReviewNotFoundError extends Error {
  constructor(reviewId: string) {
    super(`No review found with id: ${reviewId}`);
    this.name = "ReviewNotFoundError";
  }
}

export class NotReviewOwnerError extends Error {
  constructor() {
    super("Review does not belong to this lawyer");
    this.name = "NotReviewOwnerError";
  }
}

/** A review as shown publicly — never exposes the reviewer's credentials. */
export interface PublicReview {
  id: string;
  lawyerId: string;
  rating: number;
  comment: string | null;
  anonymous: boolean;
  reviewerName: string | null;
  response: string | null;
  createdAt: Date;
}

export interface LawyerRating {
  averageRating: number;
  reviewCount: number;
}

export interface LawyerReviewsService {
  submitReview(input: SubmitReviewInput): Promise<LawyerReviewRow>;
  respondToReview(args: { reviewId: string; lawyerId: string; response: string }): Promise<LawyerReviewRow>;
  moderateReview(args: { reviewId: string }): Promise<LawyerReviewRow>;
  getReviews(args: { lawyerId: string }): Promise<PublicReview[]>;
  getRating(args: { lawyerId: string }): Promise<LawyerRating>;
}

export function createLawyerReviewsService(
  deps: LawyerReviewsServiceDeps,
): LawyerReviewsService {
  const { db, clock } = deps;

  async function requireLawyer(lawyerId: string): Promise<LawyerRow> {
    const [row] = await db
      .select()
      .from(lawyers)
      .where(eq(lawyers.userId, lawyerId))
      .limit(1);
    if (!row) {
      throw new LawyerNotFoundError(lawyerId);
    }
    return row;
  }

  async function requireReview(reviewId: string): Promise<LawyerReviewRow> {
    const [row] = await db
      .select()
      .from(lawyerReviews)
      .where(eq(lawyerReviews.id, reviewId))
      .limit(1);
    if (!row) {
      throw new ReviewNotFoundError(reviewId);
    }
    return row;
  }

  return {
    async submitReview(input) {
      const validated = validateSubmitReview({
        lawyerId: input.lawyerId,
        rating: input.rating,
        comment: input.comment,
        anonymous: input.anonymous,
      });

      const lawyer = await requireLawyer(validated.lawyerId);
      if (lawyer.verificationStatus !== "verified") {
        throw new LawyerNotVerifiedError();
      }

      if (input.reviewer.verificationStatus !== "id_verified") {
        throw new ReviewerUnverifiedError();
      }

      const [existing] = await db
        .select({ id: lawyerReviews.id })
        .from(lawyerReviews)
        .where(
          and(
            eq(lawyerReviews.lawyerId, validated.lawyerId),
            eq(lawyerReviews.reviewerId, input.reviewer.id),
          ),
        )
        .limit(1);
      if (existing) {
        throw new DuplicateReviewError();
      }

      const [row] = await db
        .insert(lawyerReviews)
        .values({
          lawyerId: validated.lawyerId,
          reviewerId: input.reviewer.id,
          rating: validated.rating,
          comment: validated.comment ?? null,
          anonymous: validated.anonymous ?? false,
          moderated: false,
          response: null,
          createdAt: clock.now(),
        })
        .returning();
      if (!row) {
        throw new Error("Failed to insert review row");
      }
      return row;
    },

    async respondToReview({ reviewId, lawyerId, response }) {
      const validated = validateRespondToReview({ reviewId, response });
      const review = await requireReview(validated.reviewId);
      if (review.lawyerId !== lawyerId) {
        throw new NotReviewOwnerError();
      }
      const [row] = await db
        .update(lawyerReviews)
        .set({ response: validated.response })
        .where(eq(lawyerReviews.id, review.id))
        .returning();
      if (!row) {
        throw new Error("Failed to update review row");
      }
      return row;
    },

    async moderateReview({ reviewId }) {
      const review = await requireReview(reviewId);
      const [row] = await db
        .update(lawyerReviews)
        .set({ moderated: true })
        .where(eq(lawyerReviews.id, review.id))
        .returning();
      if (!row) {
        throw new Error("Failed to update review row");
      }
      return row;
    },

    async getReviews({ lawyerId }) {
      const rows = await db
        .select({
          review: lawyerReviews,
          reviewerName: users.email,
        })
        .from(lawyerReviews)
        .leftJoin(users, eq(lawyerReviews.reviewerId, users.id))
        .where(
          and(
            eq(lawyerReviews.lawyerId, lawyerId),
            eq(lawyerReviews.moderated, false),
          ),
        );

      return rows.map(({ review, reviewerName }) => ({
        id: review.id,
        lawyerId: review.lawyerId,
        rating: review.rating,
        comment: review.comment,
        anonymous: review.anonymous,
        // Identity is hidden entirely when anonymous; never return reviewerId.
        reviewerName: review.anonymous ? null : (reviewerName ?? null),
        response: review.response,
        createdAt: review.createdAt,
      }));
    },

    async getRating({ lawyerId }) {
      const [row] = await db
        .select({
          avg: avg(lawyerReviews.rating),
          count: count(),
        })
        .from(lawyerReviews)
        .where(
          and(
            eq(lawyerReviews.lawyerId, lawyerId),
            eq(lawyerReviews.moderated, false),
          ),
        );

      const reviewCount = Number(row?.count ?? 0);
      const avgVal = row?.avg != null ? Number(row.avg) : 0;
      const averageRating = reviewCount === 0 ? 0 : Math.round(avgVal * 10) / 10;
      return { averageRating, reviewCount };
    },
  };
}
