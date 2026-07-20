import {
  expect,
  test,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";

import { createTestHarness, type TestHarness } from "./harness.ts";
import { createLawyerService } from "../services/lawyer.service.ts";
import {
  createLawyerReviewsService,
  LawyerNotFoundError,
  LawyerNotVerifiedError,
  ReviewerUnverifiedError,
  DuplicateReviewError,
  NotReviewOwnerError,
} from "../services/lawyer-reviews.service.ts";
import { jurisdictions } from "../db/schema/jurisdictions.ts";
import { users } from "../db/schema/users.ts";
import { lawyerReviews } from "../db/schema/lawyer-reviews.ts";
import { eq } from "drizzle-orm";
import type { ResolvedVoter } from "../lib/auth/voter-resolver.ts";

const STATE = "11111111-1111-4111-8111-111111111111";
const LAWYER_USER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const REVIEWER = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const REVIEWER_UNVERIFIED = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const OTHER_LAWYER = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function voter(id: string, status: "id_verified" | "email_verified" = "id_verified"): ResolvedVoter {
  return { id, verificationStatus: status, jurisdictionId: STATE };
}

describe("lawyer-reviews ticket 02 — submit, respond, moderate & read", () => {
  let harness: TestHarness;
  let reviews: ReturnType<typeof createLawyerReviewsService>;
  let lawyerService: ReturnType<typeof createLawyerService>;

  beforeAll(async () => {
    harness = createTestHarness();
    await harness.migrate();
  });

  afterAll(async () => {
    await harness.close();
  });

  beforeEach(async () => {
    await harness.reset();
    await harness.db.insert(jurisdictions).values({
      id: STATE,
      name: "Lagos",
      level: "state",
      parentId: null,
    });
    await harness.db.insert(users).values([
      { id: LAWYER_USER, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: STATE, createdAt: new Date(), updatedAt: new Date(), email: "lawyer@example.com" },
      { id: REVIEWER, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: STATE, createdAt: new Date(), updatedAt: new Date(), email: "reviewer@example.com" },
      { id: REVIEWER_UNVERIFIED, passwordHash: "x", verificationStatus: "email_verified", jurisdictionId: STATE, createdAt: new Date(), updatedAt: new Date(), email: "unverified@example.com" },
      { id: OTHER_LAWYER, passwordHash: "x", verificationStatus: "id_verified", jurisdictionId: STATE, createdAt: new Date(), updatedAt: new Date(), email: "other@example.com" },
    ]);
    lawyerService = createLawyerService({ db: harness.db, clock: harness.clock });
    reviews = createLawyerReviewsService({ db: harness.db, clock: harness.clock });
    harness.clock.set(new Date("2025-06-01T00:00:00.000Z"));
  });

  async function verifiedLawyer(userId: string, barNumber: string) {
    const l = await lawyerService.onboardLawyer({
      userId,
      barNumber,
      practiceAreas: ["family"],
      licensedJurisdictionIds: [STATE],
      yearsPracticing: 1,
      languages: ["English"],
    });
    return lawyerService.verifyLawyer({ lawyerId: l.userId });
  }

  test("submitReview persists a review for a verified lawyer by an id_verified reviewer", async () => {
    const lawyer = await verifiedLawyer(LAWYER_USER, "B/1");
    const review = await reviews.submitReview({
      lawyerId: lawyer.userId,
      reviewer: voter(REVIEWER),
      rating: 4,
      comment: "Helpful",
      anonymous: false,
    });
    expect(review.rating).toBe(4);
    expect(review.reviewerId).toBe(REVIEWER);
  });

  test("submitReview rejects a missing lawyer", async () => {
    await expect(
      reviews.submitReview({ lawyerId: "99999999-9999-4999-8999-999999999999", reviewer: voter(REVIEWER), rating: 5 }),
    ).rejects.toThrow(LawyerNotFoundError);
  });

  test("submitReview rejects an unverified lawyer", async () => {
    const l = await lawyerService.onboardLawyer({
      userId: LAWYER_USER,
      barNumber: "B/1",
      practiceAreas: ["family"],
      licensedJurisdictionIds: [STATE],
      yearsPracticing: 1,
      languages: ["English"],
    });
    await expect(
      reviews.submitReview({ lawyerId: l.userId, reviewer: voter(REVIEWER), rating: 5 }),
    ).rejects.toThrow(LawyerNotVerifiedError);
  });

  test("submitReview rejects an unverified reviewer", async () => {
    const lawyer = await verifiedLawyer(LAWYER_USER, "B/1");
    await expect(
      reviews.submitReview({ lawyerId: lawyer.userId, reviewer: voter(REVIEWER_UNVERIFIED, "email_verified"), rating: 5 }),
    ).rejects.toThrow(ReviewerUnverifiedError);
  });

  test("submitReview rejects a duplicate review", async () => {
    const lawyer = await verifiedLawyer(LAWYER_USER, "B/1");
    await reviews.submitReview({ lawyerId: lawyer.userId, reviewer: voter(REVIEWER), rating: 4 });
    await expect(
      reviews.submitReview({ lawyerId: lawyer.userId, reviewer: voter(REVIEWER), rating: 5 }),
    ).rejects.toThrow(DuplicateReviewError);
  });

  test("respondToReview lets the lawyer respond to their own review", async () => {
    const lawyer = await verifiedLawyer(LAWYER_USER, "B/1");
    const review = await reviews.submitReview({ lawyerId: lawyer.userId, reviewer: voter(REVIEWER), rating: 4 });
    const updated = await reviews.respondToReview({ reviewId: review.id, lawyerId: lawyer.userId, response: "Thank you" });
    expect(updated.response).toBe("Thank you");
  });

  test("respondToReview rejects a lawyer who does not own the review", async () => {
    const lawyer = await verifiedLawyer(LAWYER_USER, "B/1");
    await verifiedLawyer(OTHER_LAWYER, "B/2");
    const review = await reviews.submitReview({ lawyerId: lawyer.userId, reviewer: voter(REVIEWER), rating: 4 });
    await expect(
      reviews.respondToReview({ reviewId: review.id, lawyerId: OTHER_LAWYER, response: "Nope" }),
    ).rejects.toThrow(NotReviewOwnerError);
  });

  test("moderateReview excludes the review from getReviews and getRating", async () => {
    const lawyer = await verifiedLawyer(LAWYER_USER, "B/1");
    const r1 = await reviews.submitReview({ lawyerId: lawyer.userId, reviewer: voter(REVIEWER), rating: 5 });
    await reviews.submitReview({ lawyerId: lawyer.userId, reviewer: voter(OTHER_LAWYER), rating: 1, anonymous: true });
    await reviews.moderateReview({ reviewId: r1.id });

    const list = await reviews.getReviews({ lawyerId: lawyer.userId });
    expect(list).toHaveLength(1);
    expect(list[0].rating).toBe(1);

    const rating = await reviews.getRating({ lawyerId: lawyer.userId });
    expect(rating.reviewCount).toBe(1);
    expect(rating.averageRating).toBe(1);
  });

  test("getReviews hides reviewer identity when anonymous and never returns reviewerId", async () => {
    const lawyer = await verifiedLawyer(LAWYER_USER, "B/1");
    await reviews.submitReview({ lawyerId: lawyer.userId, reviewer: voter(REVIEWER), rating: 4, anonymous: true });
    const list = await reviews.getReviews({ lawyerId: lawyer.userId });
    expect(list).toHaveLength(1);
    expect(list[0].reviewerName).toBeNull();
    expect(list[0]).not.toHaveProperty("reviewerId");
    const serialized = JSON.stringify(list);
    expect(serialized).not.toContain(REVIEWER);
    expect(serialized).not.toContain("passwordHash");
  });

  test("getReviews shows reviewer name when not anonymous", async () => {
    const lawyer = await verifiedLawyer(LAWYER_USER, "B/1");
    await reviews.submitReview({ lawyerId: lawyer.userId, reviewer: voter(REVIEWER), rating: 4, anonymous: false });
    const list = await reviews.getReviews({ lawyerId: lawyer.userId });
    expect(list[0].reviewerName).toBe("reviewer@example.com");
  });

  test("getRating computes the average and count", async () => {
    const lawyer = await verifiedLawyer(LAWYER_USER, "B/1");
    await reviews.submitReview({ lawyerId: lawyer.userId, reviewer: voter(REVIEWER), rating: 4 });
    await reviews.submitReview({ lawyerId: lawyer.userId, reviewer: voter(OTHER_LAWYER), rating: 2 });
    const rating = await reviews.getRating({ lawyerId: lawyer.userId });
    expect(rating.reviewCount).toBe(2);
    expect(rating.averageRating).toBe(3);
  });

  test("getRating returns zero when there are no reviews", async () => {
    const lawyer = await verifiedLawyer(LAWYER_USER, "B/1");
    const rating = await reviews.getRating({ lawyerId: lawyer.userId });
    expect(rating).toEqual({ averageRating: 0, reviewCount: 0 });
  });
});
