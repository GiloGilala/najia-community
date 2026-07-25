import { pgTable, text, timestamp, integer, boolean, uuid } from "drizzle-orm/pg-core";
import { users } from "./users.ts";

// =============================================================================
// Legal Literacy Module Categories
// Based on platform documentation §7.6.2
// =============================================================================

export type LegalLiteracyCategory =
  | "introduction-to-law"
  | "civil-rights"
  | "landlord-tenant-law"
  | "consumer-protection"
  | "employment-law"
  | "family-law"
  | "criminal-law-basics"
  | "alternative-dispute-resolution";

// =============================================================================
// Legal Literacy Difficulty Levels
// =============================================================================

export type LegalLiteracyDifficulty = "beginner" | "intermediate" | "advanced";

// =============================================================================
// Legal Literacy Enrollment Status
// =============================================================================

export type LegalLiteracyEnrollmentStatus = "not_started" | "in_progress" | "completed";

// =============================================================================
// Legal Literacy Modules
// =============================================================================

export const legalLiteracyModules = pgTable("legal_literacy_modules", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().$type<LegalLiteracyCategory>(),
  content: text("content").notNull(),
  estimatedDuration: integer("estimated_duration").notNull(), // in minutes
  difficulty: text("difficulty").notNull().$type<LegalLiteracyDifficulty>(),
  order: integer("order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export type LegalLiteracyModuleRow = typeof legalLiteracyModules.$inferSelect;
export type LegalLiteracyModuleInsert = typeof legalLiteracyModules.$inferInsert;

// =============================================================================
// Legal Literacy Enrollments
// =============================================================================

export const legalLiteracyEnrollments = pgTable("legal_literacy_enrollments", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  moduleId: text("module_id").notNull().references(() => legalLiteracyModules.id),
  progress: integer("progress").notNull().default(0), // 0-100
  status: text("status").notNull().$type<LegalLiteracyEnrollmentStatus>(),
  lastAccessedAt: timestamp("last_accessed_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  quizScore: integer("quiz_score"), // 0-100
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export type LegalLiteracyEnrollmentRow = typeof legalLiteracyEnrollments.$inferSelect;
export type LegalLiteracyEnrollmentInsert = typeof legalLiteracyEnrollments.$inferInsert;

// =============================================================================
// Legal Literacy Quiz Attempts
// =============================================================================

export const legalLiteracyQuizAttempts = pgTable("legal_literacy_quiz_attempts", {
  id: text("id").primaryKey(),
  enrollmentId: text("enrollment_id").notNull().references(() => legalLiteracyEnrollments.id),
  questions: text("questions").notNull(), // JSON array of question IDs
  answers: text("answers").notNull(), // JSON array of user answers
  score: integer("score").notNull(), // 0-100
  passed: boolean("passed").notNull(),
  attemptedAt: timestamp("attempted_at", { mode: "date" }).notNull().defaultNow(),
});

export type LegalLiteracyQuizAttemptRow = typeof legalLiteracyQuizAttempts.$inferSelect;
export type LegalLiteracyQuizAttemptInsert = typeof legalLiteracyQuizAttempts.$inferInsert;

// =============================================================================
// Indexes for performance
// =============================================================================

// Legal literacy modules indexes
export const legalLiteracyModulesBySlugIndex = legalLiteracyModules;
export const legalLiteracyModulesByCategoryIndex = legalLiteracyModules;
export const legalLiteracyModulesByDifficultyIndex = legalLiteracyModules;
export const legalLiteracyModulesByPublishedIndex = legalLiteracyModules;
export const legalLiteracyModulesByCreatedAtIndex = legalLiteracyModules;

// Legal literacy enrollments indexes
export const legalLiteracyEnrollmentsByUserIndex = legalLiteracyEnrollments;
export const legalLiteracyEnrollmentsByModuleIndex = legalLiteracyEnrollments;
export const legalLiteracyEnrollmentsByStatusIndex = legalLiteracyEnrollments;
export const legalLiteracyEnrollmentsByUserModuleIndex = legalLiteracyEnrollments;

// Legal literacy quiz attempts indexes
export const legalLiteracyQuizAttemptsByEnrollmentIndex = legalLiteracyQuizAttempts;
export const legalLiteracyQuizAttemptsByAttemptedAtIndex = legalLiteracyQuizAttempts;
