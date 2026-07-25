import { z } from "zod";

// =============================================================================
// Legal Literacy Category Types
// Based on platform documentation §7.6.2
// =============================================================================

export const legalLiteracyCategoryEnum = z.enum([
  "introduction-to-law",
  "civil-rights",
  "landlord-tenant-law",
  "consumer-protection",
  "employment-law",
  "family-law",
  "criminal-law-basics",
  "alternative-dispute-resolution",
]);

export type LegalLiteracyCategory = z.infer<typeof legalLiteracyCategoryEnum>;

// =============================================================================
// Legal Literacy Difficulty Types
// =============================================================================

export const legalLiteracyDifficultyEnum = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

export type LegalLiteracyDifficulty = z.infer<typeof legalLiteracyDifficultyEnum>;

// =============================================================================
// Legal Literacy Enrollment Status Types
// =============================================================================

export const legalLiteracyEnrollmentStatusEnum = z.enum([
  "not_started",
  "in_progress",
  "completed",
]);

export type LegalLiteracyEnrollmentStatus = z.infer<typeof legalLiteracyEnrollmentStatusEnum>;

// =============================================================================
// Legal Literacy Module Schemas
// =============================================================================

const slugValidator = z
  .string()
  .min(1, "Slug must be at least 1 character")
  .max(200, "Slug must be at most 200 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be URL-safe (lowercase letters, numbers, and hyphens only)",
  );

const mdxContentValidator = z
  .string()
  .min(1, "Content must not be empty")
  .max(100000, "Content must be at most 100,000 characters");

export const createLegalLiteracyModuleSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  slug: slugValidator,
  description: z.string().min(1, "Description is required").max(500, "Description must be at most 500 characters"),
  category: legalLiteracyCategoryEnum,
  content: mdxContentValidator,
  estimatedDuration: z.number().int().positive("Duration must be a positive number (minutes)"),
  difficulty: legalLiteracyDifficultyEnum,
  order: z.number().int().nonnegative("Order must be a non-negative number").default(0),
  isPublished: z.boolean().default(false),
});

export const updateLegalLiteracyModuleSchema = z.object({
  id: z.string().min(1, "ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters").optional(),
  slug: slugValidator.optional(),
  description: z.string().min(1, "Description is required").max(500, "Description must be at most 500 characters").optional(),
  category: legalLiteracyCategoryEnum.optional(),
  content: mdxContentValidator.optional(),
  estimatedDuration: z.number().int().positive("Duration must be a positive number (minutes)").optional(),
  difficulty: legalLiteracyDifficultyEnum.optional(),
  order: z.number().int().nonnegative("Order must be a non-negative number").optional(),
  isPublished: z.boolean().optional(),
});

export const publishLegalLiteracyModuleSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const unpublishLegalLiteracyModuleSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type CreateLegalLiteracyModuleInput = z.infer<typeof createLegalLiteracyModuleSchema>;
export type UpdateLegalLiteracyModuleInput = z.infer<typeof updateLegalLiteracyModuleSchema>;
export type PublishLegalLiteracyModuleInput = z.infer<typeof publishLegalLiteracyModuleSchema>;

// =============================================================================
// Legal Literacy Enrollment Schemas
// =============================================================================

export const enrollInModuleSchema = z.object({
  moduleId: z.string().min(1, "Module ID is required"),
});

export const updateEnrollmentProgressSchema = z.object({
  id: z.string().min(1, "Enrollment ID is required"),
  progress: z.number().int().min(0, "Progress must be at least 0").max(100, "Progress must be at most 100"),
  status: legalLiteracyEnrollmentStatusEnum.optional(),
});

export const completeModuleSchema = z.object({
  enrollmentId: z.string().min(1, "Enrollment ID is required"),
  quizScore: z.number().int().min(0, "Score must be at least 0").max(100, "Score must be at most 100").optional(),
});

export type EnrollInModuleInput = z.infer<typeof enrollInModuleSchema>;
export type UpdateEnrollmentProgressInput = z.infer<typeof updateEnrollmentProgressSchema>;
export type CompleteModuleInput = z.infer<typeof completeModuleSchema>;

// =============================================================================
// Legal Literacy Module List Query Schema
// =============================================================================

export const legalLiteracyModuleListSchema = z.object({
  page: z.number().int().positive("Page must be a positive number").default(1),
  limit: z.number().int().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").default(12),
  category: legalLiteracyCategoryEnum.optional(),
  difficulty: legalLiteracyDifficultyEnum.optional(),
  isPublished: z.boolean().optional(),
  search: z.string().max(200, "Search query must be at most 200 characters").optional(),
  sortBy: z.enum(["title", "category", "difficulty", "createdAt", "order"]).optional().default("order"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type LegalLiteracyModuleListParams = z.infer<typeof legalLiteracyModuleListSchema>;

// =============================================================================
// Legal Literacy Enrollment List Query Schema
// =============================================================================

export const legalLiteracyEnrollmentListSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  moduleId: z.string().optional(),
  status: legalLiteracyEnrollmentStatusEnum.optional(),
  page: z.number().int().positive("Page must be a positive number").default(1),
  limit: z.number().int().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").default(20),
  sortBy: z.enum(["createdAt", "lastAccessedAt", "completedAt", "progress"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type LegalLiteracyEnrollmentListParams = z.infer<typeof legalLiteracyEnrollmentListSchema>;
