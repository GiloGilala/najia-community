import {
  expect,
  test,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";

import { createTestHarness, type TestHarness } from "./harness.ts";
import {
  validateSubmitReview,
  validateRespondToReview,
  LawyerReviewValidationError,
} from "../lib/validation/lawyer-review.ts";
import { lawyerReviews } from "../db/schema/lawyer-reviews.ts";
import { users } from "../db/schema/users.ts";

describe("lawyer-reviews ticket 01 — schema, validation", () => {
  let harness: TestHarness;

  beforeAll(async () => {
    harness = createTestHarness();
    await harness.migrate();
  });

  afterAll(async () => {
    await harness.close();
  });

  beforeEach(async () => {
    await harness.reset();
  });

  test("migration creates the lawyer_reviews table", async () => {
    const tables = await harness.listTables();
    expect(tables).toContain("lawyer_reviews");
  });

  test("validation accepts a well-formed review", () => {
    expect(() =>
      validateSubmitReview({
        lawyerId: "11111111-1111-4111-8111-111111111111",
        rating: 4,
        comment: "Helpful",
        anonymous: true,
      }),
    ).not.toThrow();
  });

  test("validation rejects a rating below 1", () => {
    expect(() =>
      validateSubmitReview({
        lawyerId: "11111111-1111-4111-8111-111111111111",
        rating: 0,
      }),
    ).toThrow(LawyerReviewValidationError);
  });

  test("validation rejects a rating above 5", () => {
    expect(() =>
      validateSubmitReview({
        lawyerId: "11111111-1111-4111-8111-111111111111",
        rating: 6,
      }),
    ).toThrow(LawyerReviewValidationError);
  });

  test("validation rejects a comment over 1000 chars", () => {
    expect(() =>
      validateSubmitReview({
        lawyerId: "11111111-1111-4111-8111-111111111111",
        rating: 5,
        comment: "x".repeat(1001),
      }),
    ).toThrow(LawyerReviewValidationError);
  });

  test("validation accepts a response", () => {
    expect(() =>
      validateRespondToReview({ reviewId: "11111111-1111-4111-8111-111111111111", response: "Thanks" }),
    ).not.toThrow();
  });

  test("validation rejects an empty response", () => {
    expect(() =>
      validateRespondToReview({ reviewId: "11111111-1111-4111-8111-111111111111", response: "" }),
    ).toThrow(LawyerReviewValidationError);
  });
});


