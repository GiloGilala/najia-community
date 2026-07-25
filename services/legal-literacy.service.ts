import { and, asc, desc, eq, like, or, count, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import type { DbClient } from "../db/client.ts";
import type { Clock } from "../lib/clock/clock.ts";
import {
  createLegalLiteracyModuleSchema,
  updateLegalLiteracyModuleSchema,
  publishLegalLiteracyModuleSchema,
  enrollInModuleSchema,
  updateEnrollmentProgressSchema,
  completeModuleSchema,
  legalLiteracyModuleListSchema,
  legalLiteracyEnrollmentListSchema,
  type CreateLegalLiteracyModuleInput,
  type UpdateLegalLiteracyModuleInput,
  type EnrollInModuleInput,
  type UpdateEnrollmentProgressInput,
  type CompleteModuleInput,
  type LegalLiteracyModuleListParams,
  type LegalLiteracyEnrollmentListParams,
  type LegalLiteracyCategory,
  type LegalLiteracyDifficulty,
  type LegalLiteracyEnrollmentStatus,
} from "../lib/validation/legal-literacy.ts";
import {
  legalLiteracyModules,
  legalLiteracyEnrollments,
  legalLiteracyQuizAttempts,
  type LegalLiteracyModuleRow,
  type LegalLiteracyEnrollmentRow,
  type LegalLiteracyQuizAttemptRow,
} from "../db/schema/legal-literacy.ts";
import { users } from "../db/schema/users.ts";

// =============================================================================
// Custom Errors
// =============================================================================

export class LegalLiteracyModuleNotFoundError extends Error {
  constructor(idOrSlug: string, bySlug = false) {
    super(`Legal literacy module ${bySlug ? 'with slug' : 'not found': "${idOrSlug}"}`);
    this.name = "LegalLiteracyModuleNotFoundError";
  }
}

export class LegalLiteracyModuleAlreadyPublishedError extends Error {
  constructor(id: string) {
    super(`Legal literacy module ${id} is already published`);
    this.name = "LegalLiteracyModuleAlreadyPublishedError";
  }
}

export class LegalLiteracyEnrollmentNotFoundError extends Error {
  constructor(id: string) {
    super(`Legal literacy enrollment not found: ${id}`);
    this.name = "LegalLiteracyEnrollmentNotFoundError";
  }
}

export class DuplicateModuleSlugError extends Error {
  constructor(slug: string) {
    super(`A legal literacy module with slug "${slug}" already exists`);
    this.name = "DuplicateModuleSlugError";
  }
}

export class AlreadyEnrolledError extends Error {
  constructor(userId: string, moduleId: string) {
    super(`User ${userId} is already enrolled in module ${moduleId}`);
    this.name = "AlreadyEnrolledError";
  }
}

export class ModuleNotEnrolledError extends Error {
  constructor(userId: string, moduleId: string) {
    super(`User ${userId} is not enrolled in module ${moduleId}`);
    this.name = "ModuleNotEnrolledError";
  }
}

// =============================================================================
// Service Dependencies
// =============================================================================

export interface LegalLiteracyServiceDeps {
  db: DbClient;
  clock: Clock;
}

// =============================================================================
// Extended Types
// =============================================================================

export interface LegalLiteracyModuleWithEnrollmentInfo extends LegalLiteracyModuleRow {
  enrollmentCount: number;
  completionRate: number;
  isEnrolled: boolean;
  userProgress?: number;
  userStatus?: LegalLiteracyEnrollmentStatus;
}

export interface LegalLiteracyEnrollmentWithModule extends LegalLiteracyEnrollmentRow {
  module: LegalLiteracyModuleRow;
}

// =============================================================================
// Service Interface
// =============================================================================

export interface LegalLiteracyService {
  // Modules
  createModule(input: CreateLegalLiteracyModuleInput): Promise<LegalLiteracyModuleRow>;
  getModuleById(id: string): Promise<LegalLiteracyModuleRow>;
  getModuleBySlug(slug: string): Promise<LegalLiteracyModuleRow>;
  updateModule(input: UpdateLegalLiteracyModuleInput): Promise<LegalLiteracyModuleRow>;
  deleteModule(id: string): Promise<void>;
  publishModule(input: { id: string }): Promise<LegalLiteracyModuleRow>;
  unpublishModule(input: { id: string }): Promise<LegalLiteracyModuleRow>;
  listModules(params: LegalLiteracyModuleListParams): Promise<{ modules: LegalLiteracyModuleRow[]; total: number }>;
  listPublishedModules(): Promise<LegalLiteracyModuleRow[]>;
  
  // Enrollments
  enrollUser(input: EnrollInModuleInput & { userId: string }): Promise<LegalLiteracyEnrollmentRow>;
  getEnrollmentById(id: string): Promise<LegalLiteracyEnrollmentRow>;
  updateEnrollmentProgress(input: UpdateEnrollmentProgressInput): Promise<LegalLiteracyEnrollmentRow>;
  completeModule(input: CompleteModuleInput & { userId: string }): Promise<LegalLiteracyEnrollmentRow>;
  listUserEnrollments(userId: string): Promise<LegalLiteracyEnrollmentRow[]>;
  getUserModuleProgress(userId: string, moduleId: string): Promise<LegalLiteracyEnrollmentRow | null>;
  listEnrollments(params: LegalLiteracyEnrollmentListParams): Promise<{ enrollments: LegalLiteracyEnrollmentRow[]; total: number }>;
  
  // Analytics
  getModuleEnrollmentCount(moduleId: string): Promise<number>;
  getModuleCompletionRate(moduleId: string): Promise<number>;
  getUserProgressSummary(userId: string): Promise<{
    totalModules: number;
    enrolledCount: number;
    completedCount: number;
    inProgressCount: number;
    overallProgress: number;
  }>;
  
  // Quiz Attempts
  recordQuizAttempt(input: {
    enrollmentId: string;
    questions: string[];
    answers: string[];
    score: number;
    passed: boolean;
  }): Promise<LegalLiteracyQuizAttemptRow>;
  getQuizAttemptsForEnrollment(enrollmentId: string): Promise<LegalLiteracyQuizAttemptRow[]>;
}

// =============================================================================
// Service Implementation
// =============================================================================

export function createLegalLiteracyService(deps: LegalLiteracyServiceDeps): LegalLiteracyService {
  const { db, clock } = deps;

  // --------------------------------------------------------------------------
  // Helper functions
  // --------------------------------------------------------------------------

  function generateModuleId(): string {
    return `llm_${randomUUID().replace(/-/g, "")}`;
  }

  function generateEnrollmentId(): string {
    return `llen_${randomUUID().replace(/-/g, "")}`;
  }

  function generateQuizAttemptId(): string {
    return `llqa_${randomUUID().replace(/-/g, "")}`;
  }

  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function requireModule(id: string): Promise<LegalLiteracyModuleRow> {
    const [row] = await db.select().from(legalLiteracyModules).where(eq(legalLiteracyModules.id, id)).limit(1);
    if (!row) {
      throw new LegalLiteracyModuleNotFoundError(id);
    }
    return row;
  }

  async function requireModuleBySlug(slug: string): Promise<LegalLiteracyModuleRow> {
    const [row] = await db.select().from(legalLiteracyModules).where(eq(legalLiteracyModules.slug, slug)).limit(1);
    if (!row) {
      throw new LegalLiteracyModuleNotFoundError(slug, true);
    }
    return row;
  }

  async function requireEnrollment(id: string): Promise<LegalLiteracyEnrollmentRow> {
    const [row] = await db.select().from(legalLiteracyEnrollments).where(eq(legalLiteracyEnrollments.id, id)).limit(1);
    if (!row) {
      throw new LegalLiteracyEnrollmentNotFoundError(id);
    }
    return row;
  }

  async function checkModuleSlugUnique(slug: string, excludeId?: string): Promise<void> {
    const query = excludeId
      ? and(eq(legalLiteracyModules.slug, slug), sql`${legalLiteracyModules.id} != ${excludeId}`)
      : eq(legalLiteracyModules.slug, slug);
    const [existing] = await db.select({ id: legalLiteracyModules.id }).from(legalLiteracyModules).where(query).limit(1);
    if (existing) {
      throw new DuplicateModuleSlugError(slug);
    }
  }

  return {
    // --------------------------------------------------------------------------
    // Modules
    // --------------------------------------------------------------------------

    async createModule(input) {
      const validated = createLegalLiteracyModuleSchema.parse(input);
      
      // Check slug uniqueness
      const slug = validated.slug || generateSlug(validated.title);
      await checkModuleSlugUnique(slug);
      
      const now = clock.now();
      
      const [row] = await db
        .insert(legalLiteracyModules)
        .values({
          id: generateModuleId(),
          slug,
          title: validated.title,
          description: validated.description,
          category: validated.category,
          content: validated.content,
          estimatedDuration: validated.estimatedDuration,
          difficulty: validated.difficulty,
          order: validated.order,
          isPublished: validated.isPublished,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      
      if (!row) {
        throw new Error("Failed to create legal literacy module");
      }
      
      return row;
    },

    async getModuleById(id) {
      return requireModule(id);
    },

    async getModuleBySlug(slug) {
      return requireModuleBySlug(slug);
    },

    async updateModule(input) {
      const validated = updateLegalLiteracyModuleSchema.parse(input);
      
      await requireModule(validated.id);
      
      // Check slug uniqueness if provided
      if (validated.slug) {
        await checkModuleSlugUnique(validated.slug, validated.id);
      }
      
      const now = clock.now();
      
      const [row] = await db
        .update(legalLiteracyModules)
        .set({
          title: validated.title ?? sql`${legalLiteracyModules.title}`,
          slug: validated.slug ?? sql`${legalLiteracyModules.slug}`,
          description: validated.description ?? sql`${legalLiteracyModules.description}`,
          category: validated.category ?? sql`${legalLiteracyModules.category}`,
          content: validated.content ?? sql`${legalLiteracyModules.content}`,
          estimatedDuration: validated.estimatedDuration ?? sql`${legalLiteracyModules.estimatedDuration}`,
          difficulty: validated.difficulty ?? sql`${legalLiteracyModules.difficulty}`,
          order: validated.order ?? sql`${legalLiteracyModules.order}`,
          isPublished: validated.isPublished !== undefined ? validated.isPublished : sql`${legalLiteracyModules.isPublished}`,
          updatedAt: now,
        })
        .where(eq(legalLiteracyModules.id, validated.id))
        .returning();
      
      if (!row) {
        throw new Error("Failed to update legal literacy module");
      }
      
      return row;
    },

    async deleteModule(id) {
      await requireModule(id);
      await db.delete(legalLiteracyModules).where(eq(legalLiteracyModules.id, id));
    },

    async publishModule(input) {
      const validated = publishLegalLiteracyModuleSchema.parse(input);
      const module = await requireModule(validated.id);
      
      if (module.isPublished) {
        throw new LegalLiteracyModuleAlreadyPublishedError(validated.id);
      }
      
      const now = clock.now();
      const [row] = await db
        .update(legalLiteracyModules)
        .set({
          isPublished: true,
          updatedAt: now,
        })
        .where(eq(legalLiteracyModules.id, validated.id))
        .returning();
      
      if (!row) {
        throw new Error("Failed to publish legal literacy module");
      }
      
      return row;
    },

    async unpublishModule(input) {
      const validated = publishLegalLiteracyModuleSchema.parse(input);
      await requireModule(validated.id);
      
      const now = clock.now();
      const [row] = await db
        .update(legalLiteracyModules)
        .set({
          isPublished: false,
          updatedAt: now,
        })
        .where(eq(legalLiteracyModules.id, validated.id))
        .returning();
      
      if (!row) {
        throw new Error("Failed to unpublish legal literacy module");
      }
      
      return row;
    },

    async listModules(params) {
      const validated = legalLiteracyModuleListSchema.parse(params);
      const { page, limit, category, difficulty, isPublished, search, sortBy, sortOrder } = validated;
      
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const conditions = [];
      
      if (category) {
        conditions.push(eq(legalLiteracyModules.category, category));
      }
      
      if (difficulty) {
        conditions.push(eq(legalLiteracyModules.difficulty, difficulty));
      }
      
      if (isPublished !== undefined) {
        conditions.push(eq(legalLiteracyModules.isPublished, isPublished));
      }
      
      if (search) {
        conditions.push(
          or(
            like(legalLiteracyModules.title, `%${search}%`),
            like(legalLiteracyModules.description, `%${search}%`),
            like(legalLiteracyModules.content, `%${search}%`),
          ),
        );
      }
      
      // Build order by
      const orderBy = [];
      
      if (sortBy === "title") {
        orderBy.push(sortOrder === "desc" ? desc(legalLiteracyModules.title) : asc(legalLiteracyModules.title));
      } else if (sortBy === "category") {
        orderBy.push(sortOrder === "desc" ? desc(legalLiteracyModules.category) : asc(legalLiteracyModules.category));
      } else if (sortBy === "difficulty") {
        orderBy.push(sortOrder === "desc" ? desc(legalLiteracyModules.difficulty) : asc(legalLiteracyModules.difficulty));
      } else if (sortBy === "createdAt") {
        orderBy.push(sortOrder === "desc" ? desc(legalLiteracyModules.createdAt) : asc(legalLiteracyModules.createdAt));
      } else {
        // Default: sort by order, then createdAt
        orderBy.push(asc(legalLiteracyModules.order), desc(legalLiteracyModules.createdAt));
      }
      
      // Get total count
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const [countResult] = await db
        .select({ count: count() })
        .from(legalLiteracyModules)
        .where(where);
      
      const total = Number(countResult?.count ?? 0);
      
      // Get modules
      const modules = await db
        .select()
        .from(legalLiteracyModules)
        .where(where)
        .orderBy(...orderBy)
        .offset(offset)
        .limit(limit);
      
      return { modules, total };
    },

    async listPublishedModules() {
      return db
        .select()
        .from(legalLiteracyModules)
        .where(eq(legalLiteracyModules.isPublished, true))
        .orderBy(asc(legalLiteracyModules.order), desc(legalLiteracyModules.createdAt));
    },

    // --------------------------------------------------------------------------
    // Enrollments
    // --------------------------------------------------------------------------

    async enrollUser(input) {
      const validated = enrollInModuleSchema.parse(input);
      
      // Ensure module exists
      await requireModule(validated.moduleId);
      
      // Check if user is already enrolled
      const [existing] = await db
        .select()
        .from(legalLiteracyEnrollments)
        .where(
          and(
            eq(legalLiteracyEnrollments.userId, input.userId),
            eq(legalLiteracyEnrollments.moduleId, validated.moduleId),
          ),
        )
        .limit(1);
      
      if (existing) {
        throw new AlreadyEnrolledError(input.userId, validated.moduleId);
      }
      
      const now = clock.now();
      
      const [row] = await db
        .insert(legalLiteracyEnrollments)
        .values({
          id: generateEnrollmentId(),
          userId: input.userId,
          moduleId: validated.moduleId,
          progress: 0,
          status: "not_started",
          createdAt: now,
        })
        .returning();
      
      if (!row) {
        throw new Error("Failed to create legal literacy enrollment");
      }
      
      return row;
    },

    async getEnrollmentById(id) {
      return requireEnrollment(id);
    },

    async updateEnrollmentProgress(input) {
      const validated = updateEnrollmentProgressSchema.parse(input);
      
      const enrollment = await requireEnrollment(validated.id);
      
      // Determine status based on progress
      let status: LegalLiteracyEnrollmentStatus;
      if (validated.progress >= 100) {
        status = "completed";
      } else if (validated.progress > 0) {
        status = "in_progress";
      } else {
        status = "not_started";
      }
      
      // Use provided status if specified, otherwise use derived status
      const finalStatus = validated.status ?? status;
      
      const now = clock.now();
      
      const [row] = await db
        .update(legalLiteracyEnrollments)
        .set({
          progress: validated.progress,
          status: finalStatus,
          lastAccessedAt: now,
          // Set completedAt if status is completed and not already set
          completedAt: finalStatus === "completed" && !enrollment.completedAt ? now : sql`${legalLiteracyEnrollments.completedAt}`,
        })
        .where(eq(legalLiteracyEnrollments.id, validated.id))
        .returning();
      
      if (!row) {
        throw new Error("Failed to update legal literacy enrollment progress");
      }
      
      return row;
    },

    async completeModule(input) {
      const validated = completeModuleSchema.parse(input);
      
      const enrollment = await requireEnrollment(validated.enrollmentId);
      
      // Ensure the user owns this enrollment
      if (enrollment.userId !== input.userId) {
        throw new ModuleNotEnrolledError(input.userId, enrollment.moduleId);
      }
      
      const now = clock.now();
      
      const [row] = await db
        .update(legalLiteracyEnrollments)
        .set({
          progress: 100,
          status: "completed",
          completedAt: now,
          lastAccessedAt: now,
          quizScore: validated.quizScore,
        })
        .where(eq(legalLiteracyEnrollments.id, validated.enrollmentId))
        .returning();
      
      if (!row) {
        throw new Error("Failed to complete legal literacy module");
      }
      
      return row;
    },

    async listUserEnrollments(userId) {
      return db
        .select()
        .from(legalLiteracyEnrollments)
        .where(eq(legalLiteracyEnrollments.userId, userId))
        .orderBy(desc(legalLiteracyEnrollments.createdAt));
    },

    async getUserModuleProgress(userId, moduleId) {
      const [row] = await db
        .select()
        .from(legalLiteracyEnrollments)
        .where(
          and(
            eq(legalLiteracyEnrollments.userId, userId),
            eq(legalLiteracyEnrollments.moduleId, moduleId),
          ),
        )
        .limit(1);
      
      return row ?? null;
    },

    async listEnrollments(params) {
      const validated = legalLiteracyEnrollmentListSchema.parse(params);
      const { userId, moduleId, status, page, limit, sortBy, sortOrder } = validated;
      
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const conditions = [];
      
      if (userId) {
        conditions.push(eq(legalLiteracyEnrollments.userId, userId));
      }
      
      if (moduleId) {
        conditions.push(eq(legalLiteracyEnrollments.moduleId, moduleId));
      }
      
      if (status) {
        conditions.push(eq(legalLiteracyEnrollments.status, status));
      }
      
      // Build order by
      const orderBy = [];
      
      if (sortBy === "createdAt") {
        orderBy.push(sortOrder === "desc" ? desc(legalLiteracyEnrollments.createdAt) : asc(legalLiteracyEnrollments.createdAt));
      } else if (sortBy === "lastAccessedAt") {
        orderBy.push(sortOrder === "desc" ? desc(legalLiteracyEnrollments.lastAccessedAt) : asc(legalLiteracyEnrollments.lastAccessedAt));
      } else if (sortBy === "completedAt") {
        orderBy.push(sortOrder === "desc" ? desc(legalLiteracyEnrollments.completedAt) : asc(legalLiteracyEnrollments.completedAt));
      } else if (sortBy === "progress") {
        orderBy.push(sortOrder === "desc" ? desc(legalLiteracyEnrollments.progress) : asc(legalLiteracyEnrollments.progress));
      } else {
        orderBy.push(desc(legalLiteracyEnrollments.createdAt));
      }
      
      // Get total count
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const [countResult] = await db
        .select({ count: count() })
        .from(legalLiteracyEnrollments)
        .where(where);
      
      const total = Number(countResult?.count ?? 0);
      
      // Get enrollments
      const enrollments = await db
        .select()
        .from(legalLiteracyEnrollments)
        .where(where)
        .orderBy(...orderBy)
        .offset(offset)
        .limit(limit);
      
      return { enrollments, total };
    },

    // --------------------------------------------------------------------------
    // Analytics
    // --------------------------------------------------------------------------

    async getModuleEnrollmentCount(moduleId) {
      await requireModule(moduleId);
      
      const [result] = await db
        .select({ count: count() })
        .from(legalLiteracyEnrollments)
        .where(eq(legalLiteracyEnrollments.moduleId, moduleId));
      
      return Number(result?.count ?? 0);
    },

    async getModuleCompletionRate(moduleId) {
      await requireModule(moduleId);
      
      const [totalResult] = await db
        .select({ count: count() })
        .from(legalLiteracyEnrollments)
        .where(eq(legalLiteracyEnrollments.moduleId, moduleId));
      
      const [completedResult] = await db
        .select({ count: count() })
        .from(legalLiteracyEnrollments)
        .where(
          and(
            eq(legalLiteracyEnrollments.moduleId, moduleId),
            eq(legalLiteracyEnrollments.status, "completed"),
          ),
        );
      
      const total = Number(totalResult?.count ?? 0);
      const completed = Number(completedResult?.count ?? 0);
      
      return total > 0 ? Math.round((completed / total) * 100) : 0;
    },

    async getUserProgressSummary(userId) {
      // Get all published modules
      const publishedModules = await this.listPublishedModules();
      const totalModules = publishedModules.length;
      
      // Get user's enrollments
      const enrollments = await this.listUserEnrollments(userId);
      const enrolledCount = enrollments.length;
      
      // Count completed and in-progress
      const completedCount = enrollments.filter((e) => e.status === "completed").length;
      const inProgressCount = enrollments.filter((e) => e.status === "in_progress").length;
      
      // Calculate overall progress
      const overallProgress = totalModules > 0 
        ? Math.round((completedCount / totalModules) * 100) 
        : 0;
      
      return {
        totalModules,
        enrolledCount,
        completedCount,
        inProgressCount,
        overallProgress,
      };
    },

    // --------------------------------------------------------------------------
    // Quiz Attempts
    // --------------------------------------------------------------------------

    async recordQuizAttempt(input) {
      await requireEnrollment(input.enrollmentId);
      
      const now = clock.now();
      
      const [row] = await db
        .insert(legalLiteracyQuizAttempts)
        .values({
          id: generateQuizAttemptId(),
          enrollmentId: input.enrollmentId,
          questions: JSON.stringify(input.questions),
          answers: JSON.stringify(input.answers),
          score: input.score,
          passed: input.passed,
          attemptedAt: now,
        })
        .returning();
      
      if (!row) {
        throw new Error("Failed to record quiz attempt");
      }
      
      return row;
    },

    async getQuizAttemptsForEnrollment(enrollmentId) {
      await requireEnrollment(enrollmentId);
      
      return db
        .select()
        .from(legalLiteracyQuizAttempts)
        .where(eq(legalLiteracyQuizAttempts.enrollmentId, enrollmentId))
        .orderBy(desc(legalLiteracyQuizAttempts.attemptedAt));
    },
  };
}
