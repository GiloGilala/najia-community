import { and, asc, desc, eq, like, or, count, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import type { DbClient } from "../db/client.ts";
import type { Clock } from "../lib/clock/clock.ts";
import type { Notifier } from "../lib/notify/notifier.ts";
import {
  generateSlug as generateSlugHelper,
  calculateReadingTime as calculateReadingTimeHelper,
  createBlogPostSchema,
  updateBlogPostSchema,
  publishBlogPostSchema,
  createBlogCategorySchema,
  updateBlogCategorySchema,
  createBlogCommentSchema,
  updateBlogCommentSchema,
  moderateBlogCommentSchema,
  blogPostListSchema,
  blogCommentListSchema,
  type CreateBlogPostInput,
  type UpdateBlogPostInput,
  type CreateBlogCategoryInput,
  type UpdateBlogCategoryInput,
  type CreateBlogCommentInput,
  type UpdateBlogCommentInput,
  type ModerateBlogCommentInput,
  type BlogPostListParams,
  type BlogCommentListParams,
  type BlogPostStatus,
  type BlogCommentStatus,
} from "../lib/validation/blog.ts";
import {
  blogPosts,
  blogCategories,
  blogComments,
  blogPostViews,
  type BlogPostRow,
  type BlogCategoryRow,
  type BlogCommentRow,
} from "../db/schema/blog.ts";
import { users } from "../db/schema/users.ts";

// =============================================================================
// Custom Errors
// =============================================================================

export class BlogPostNotFoundError extends Error {
  constructor(idOrSlug: string, bySlug = false) {
    super(`Blog post ${bySlug ? 'with slug' : 'not found': "${idOrSlug}"}`);
    this.name = "BlogPostNotFoundError";
  }
}

export class BlogPostAlreadyPublishedError extends Error {
  constructor(id: string) {
    super(`Blog post ${id} is already published`);
    this.name = "BlogPostAlreadyPublishedError";
  }
}

export class BlogCategoryNotFoundError extends Error {
  constructor(idOrSlug: string, bySlug = false) {
    super(`Blog category ${bySlug ? 'with slug' : 'not found': "${idOrSlug}"}`);
    this.name = "BlogCategoryNotFoundError";
  }
}

export class BlogCategoryInUseError extends Error {
  constructor(categoryId: string) {
    super(`Cannot delete category ${categoryId}: it has associated posts`);
    this.name = "BlogCategoryInUseError";
  }
}

export class BlogCommentNotFoundError extends Error {
  constructor(id: string) {
    super(`Blog comment not found: ${id}`);
    this.name = "BlogCommentNotFoundError";
  }
}

export class BlogCommentParentNotFoundError extends Error {
  constructor(parentId: string) {
    super(`Parent comment not found: ${parentId}`);
    this.name = "BlogCommentParentNotFoundError";
  }
}

export class DuplicateBlogSlugError extends Error {
  constructor(slug: string) {
    super(`A blog post with slug "${slug}" already exists`);
    this.name = "DuplicateBlogSlugError";
  }
}

export class DuplicateCategorySlugError extends Error {
  constructor(slug: string) {
    super(`A blog category with slug "${slug}" already exists`);
    this.name = "DuplicateCategorySlugError";
  }
}

// =============================================================================
// Service Dependencies
// =============================================================================

export interface BlogServiceDeps {
  db: DbClient;
  clock: Clock;
  /** Optional: for sending notifications on comment moderation */
  notifier?: Notifier;
}

// =============================================================================
// Blog Post Types
// =============================================================================

export interface BlogPostWithCategoryAndAuthor extends BlogPostRow {
  category: BlogCategoryRow;
  author: typeof users.$inferSelect;
  viewCount: number;
}

export interface BlogCommentWithAuthorAndReplies extends BlogCommentRow {
  author: typeof users.$inferSelect | null;
  replies: BlogCommentWithAuthorAndReplies[];
}

// =============================================================================
// Service Interface
// =============================================================================

export interface BlogService {
  // Blog Posts
  createPost(input: CreateBlogPostInput): Promise<BlogPostRow>;
  getPostById(id: string): Promise<BlogPostRow>;
  getPostBySlug(slug: string): Promise<BlogPostRow>;
  updatePost(input: UpdateBlogPostInput): Promise<BlogPostRow>;
  deletePost(id: string): Promise<void>;
  publishPost(input: { id: string }): Promise<BlogPostRow>;
  unpublishPost(input: { id: string }): Promise<BlogPostRow>;
  listPosts(params: BlogPostListParams): Promise<{ posts: BlogPostRow[]; total: number }>;
  getPostWithDetails(slug: string): Promise<BlogPostWithCategoryAndAuthor>;
  
  // Blog Categories
  createCategory(input: CreateBlogCategoryInput): Promise<BlogCategoryRow>;
  getCategoryById(id: string): Promise<BlogCategoryRow>;
  getCategoryBySlug(slug: string): Promise<BlogCategoryRow>;
  updateCategory(input: UpdateBlogCategoryInput): Promise<BlogCategoryRow>;
  deleteCategory(id: string): Promise<void>;
  listCategories(): Promise<BlogCategoryRow[]>;
  
  // Blog Comments
  createComment(input: CreateBlogCommentInput & { authorId?: string }): Promise<BlogCommentRow>;
  getCommentById(id: string): Promise<BlogCommentRow>;
  updateComment(input: UpdateBlogCommentInput): Promise<BlogCommentRow>;
  deleteComment(id: string): Promise<void>;
  listComments(params: BlogCommentListParams): Promise<{ comments: BlogCommentRow[]; total: number }>;
  moderateComment(input: ModerateBlogCommentInput & { moderatedBy: string }): Promise<BlogCommentRow>;
  getCommentThread(commentId: string): Promise<BlogCommentWithAuthorAndReplies>;
  
  // Analytics
  incrementViewCount(postId: string, viewerId?: string): Promise<void>;
  getPostViewCount(postId: string): Promise<number>;
}

// =============================================================================
// Service Implementation
// =============================================================================

export function createBlogService(deps: BlogServiceDeps): BlogService {
  const { db, clock } = deps;
  const notifier = deps.notifier;

  // --------------------------------------------------------------------------
  // Blog Posts
  // --------------------------------------------------------------------------

  async function requirePost(id: string): Promise<BlogPostRow> {
    const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    if (!row) {
      throw new BlogPostNotFoundError(id);
    }
    return row;
  }

  async function requirePostBySlug(slug: string): Promise<BlogPostRow> {
    const [row] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    if (!row) {
      throw new BlogPostNotFoundError(slug, true);
    }
    return row;
  }

  async function requireCategory(id: string): Promise<BlogCategoryRow> {
    const [row] = await db.select().from(blogCategories).where(eq(blogCategories.id, id)).limit(1);
    if (!row) {
      throw new BlogCategoryNotFoundError(id);
    }
    return row;
  }

  function generatePostId(): string {
    return `blg_${randomUUID().replace(/-/g, "")}`;
  }

  function generateCategoryId(): string {
    return `bct_${randomUUID().replace(/-/g, "")}`;
  }

  function generateCommentId(): string {
    return `bcmt_${randomUUID().replace(/-/g, "")}`;
  }

  function generateSlug(title: string): string {
    return generateSlugHelper(title);
  }

  function calculateReadingTime(content: string): number {
    return calculateReadingTimeHelper(content);
  }

  async function checkSlugUnique(slug: string, excludeId?: string): Promise<void> {
    const query = excludeId
      ? and(eq(blogPosts.slug, slug), sql`${blogPosts.id} != ${excludeId}`)
      : eq(blogPosts.slug, slug);
    const [existing] = await db.select({ id: blogPosts.id }).from(blogPosts).where(query).limit(1);
    if (existing) {
      throw new DuplicateBlogSlugError(slug);
    }
  }

  async function checkCategorySlugUnique(slug: string, excludeId?: string): Promise<void> {
    const query = excludeId
      ? and(eq(blogCategories.slug, slug), sql`${blogCategories.id} != ${excludeId}`)
      : eq(blogCategories.slug, slug);
    const [existing] = await db.select({ id: blogCategories.id }).from(blogCategories).where(query).limit(1);
    if (existing) {
      throw new DuplicateCategorySlugError(slug);
    }
  }

  return {
    // Create a new blog post
    async createPost(input) {
      const validated = createBlogPostSchema.parse(input);
      
      // Ensure category exists
      await requireCategory(validated.categoryId);
      
      // Check slug uniqueness
      const slug = validated.slug || generateSlug(validated.title);
      await checkSlugUnique(slug);
      
      const now = clock.now();
      const readingTime = calculateReadingTime(validated.content);
      
      const [row] = await db
        .insert(blogPosts)
        .values({
          id: generatePostId(),
          slug,
          title: validated.title,
          summary: validated.summary,
          content: validated.content,
          categoryId: validated.categoryId,
          authorId: validated.authorId,
          status: validated.status,
          readingTime,
          featuredImage: validated.featuredImage,
          metaTitle: validated.metaTitle,
          metaDescription: validated.metaDescription,
          publishedAt: validated.status === "published" ? now : null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      
      if (!row) {
        throw new Error("Failed to create blog post");
      }
      
      return row;
    },

    // Get a blog post by ID
    async getPostById(id) {
      return requirePost(id);
    },

    // Get a blog post by slug
    async getPostBySlug(slug) {
      return requirePostBySlug(slug);
    },

    // Update a blog post
    async updatePost(input) {
      const validated = updateBlogPostSchema.parse(input);
      
      const existing = await requirePost(validated.id);
      
      // Ensure category exists if provided
      if (validated.categoryId) {
        await requireCategory(validated.categoryId);
      }
      
      // Check slug uniqueness if provided
      if (validated.slug) {
        await checkSlugUnique(validated.slug, validated.id);
      }
      
      const now = clock.now();
      const readingTime = validated.content ? calculateReadingTime(validated.content) : existing.readingTime;
      const publishedAt = validated.status === "published" && !existing.publishedAt 
        ? now 
        : existing.publishedAt;
      
      const [row] = await db
        .update(blogPosts)
        .set({
          slug: validated.slug ?? existing.slug,
          title: validated.title ?? existing.title,
          summary: validated.summary ?? existing.summary,
          content: validated.content ?? existing.content,
          categoryId: validated.categoryId ?? existing.categoryId,
          status: validated.status ?? existing.status,
          readingTime,
          featuredImage: validated.featuredImage !== undefined ? validated.featuredImage : existing.featuredImage,
          metaTitle: validated.metaTitle !== undefined ? validated.metaTitle : existing.metaTitle,
          metaDescription: validated.metaDescription !== undefined ? validated.metaDescription : existing.metaDescription,
          publishedAt,
          updatedAt: now,
        })
        .where(eq(blogPosts.id, validated.id))
        .returning();
      
      if (!row) {
        throw new Error("Failed to update blog post");
      }
      
      return row;
    },

    // Delete a blog post
    async deletePost(id) {
      await requirePost(id);
      await db.delete(blogPosts).where(eq(blogPosts.id, id));
    },

    // Publish a blog post
    async publishPost(input) {
      const validated = publishBlogPostSchema.parse(input);
      const existing = await requirePost(validated.id);
      
      if (existing.status === "published") {
        throw new BlogPostAlreadyPublishedError(validated.id);
      }
      
      const now = clock.now();
      const [row] = await db
        .update(blogPosts)
        .set({
          status: "published",
          publishedAt: now,
          updatedAt: now,
        })
        .where(eq(blogPosts.id, validated.id))
        .returning();
      
      if (!row) {
        throw new Error("Failed to publish blog post");
      }
      
      return row;
    },

    // Unpublish a blog post
    async unpublishPost(input) {
      const validated = publishBlogPostSchema.parse(input);
      await requirePost(validated.id);
      
      const now = clock.now();
      const [row] = await db
        .update(blogPosts)
        .set({
          status: "draft",
          updatedAt: now,
        })
        .where(eq(blogPosts.id, validated.id))
        .returning();
      
      if (!row) {
        throw new Error("Failed to unpublish blog post");
      }
      
      return row;
    },

    // List blog posts with pagination and filtering
    async listPosts(params) {
      const validated = blogPostListSchema.parse(params);
      const { page, limit, category, author, search, status, sortBy, sortOrder } = validated;
      
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const conditions = [];
      
      if (category) {
        conditions.push(eq(blogPosts.categoryId, category));
      }
      
      if (author) {
        conditions.push(eq(blogPosts.authorId, author));
      }
      
      if (status) {
        conditions.push(eq(blogPosts.status, status));
      }
      
      if (search) {
        conditions.push(
          or(
            like(blogPosts.title, `%${search}%`),
            like(blogPosts.summary, `%${search}%`),
            like(blogPosts.content, `%${search}%`),
          ),
        );
      }
      
      // Default to published posts only for public listing
      if (conditions.length === 0) {
        conditions.push(eq(blogPosts.status, "published"));
      }
      
      // Build order by
      const orderBy = [];
      
      if (sortBy === "createdAt") {
        orderBy.push(sortOrder === "desc" ? desc(blogPosts.createdAt) : asc(blogPosts.createdAt));
      } else if (sortBy === "publishedAt") {
        orderBy.push(sortOrder === "desc" ? desc(blogPosts.publishedAt) : asc(blogPosts.publishedAt));
      } else if (sortBy === "title") {
        orderBy.push(sortOrder === "desc" ? desc(blogPosts.title) : asc(blogPosts.title));
      } else if (sortBy === "views") {
        // For views, we need to join with blogPostViews
        // This is a simplified version; a full implementation would use a subquery
        orderBy.push(sortOrder === "desc" ? desc(blogPosts.createdAt) : asc(blogPosts.createdAt));
      } else {
        orderBy.push(desc(blogPosts.publishedAt));
      }
      
      orderBy.push(desc(blogPosts.createdAt));
      
      // Get total count
      const countQuery = conditions.length > 0 
        ? db.select({ count: count() }).from(blogPosts).where(and(...conditions))
        : db.select({ count: count() }).from(blogPosts);
      
      const [countResult] = await countQuery;
      const total = Number(countResult?.count ?? 0);
      
      // Get posts
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const posts = await db
        .select()
        .from(blogPosts)
        .where(where)
        .orderBy(...orderBy)
        .offset(offset)
        .limit(limit);
      
      return { posts, total };
    },

    // Get a blog post with category and author details
    async getPostWithDetails(slug) {
      const post = await requirePostBySlug(slug);
      
      const [category] = await db
        .select()
        .from(blogCategories)
        .where(eq(blogCategories.id, post.categoryId))
        .limit(1);
      
      if (!category) {
        throw new BlogCategoryNotFoundError(post.categoryId);
      }
      
      const [author] = await db
        .select()
        .from(users)
        .where(eq(users.id, post.authorId))
        .limit(1);
      
      if (!author) {
        throw new Error(`Author not found: ${post.authorId}`);
      }
      
      // Get view count
      const [viewCountResult] = await db
        .select({ count: count() })
        .from(blogPostViews)
        .where(eq(blogPostViews.postId, post.id));
      
      const viewCount = Number(viewCountResult?.count ?? 0);
      
      return {
        ...post,
        category,
        author,
        viewCount,
      };
    },

    // --------------------------------------------------------------------------
    // Blog Categories
    // --------------------------------------------------------------------------

    async getCategoryById(id) {
      return requireCategory(id);
    },

    async getCategoryBySlug(slug: string): Promise<BlogCategoryRow> {
      const [row] = await db.select().from(blogCategories).where(eq(blogCategories.slug, slug)).limit(1);
      if (!row) {
        throw new BlogCategoryNotFoundError(slug, true);
      }
      return row;
    },

    async createCategory(input) {
      const validated = createBlogCategorySchema.parse(input);
      
      // Check slug uniqueness
      const slug = validated.slug || generateSlug(validated.name);
      await checkCategorySlugUnique(slug);
      
      const now = clock.now();
      
      const [row] = await db
        .insert(blogCategories)
        .values({
          id: generateCategoryId(),
          slug,
          name: validated.name,
          description: validated.description,
          icon: validated.icon,
          order: validated.order,
          createdAt: now,
        })
        .returning();
      
      if (!row) {
        throw new Error("Failed to create blog category");
      }
      
      return row;
    },

    async updateCategory(input) {
      const validated = updateBlogCategorySchema.parse(input);
      
      await requireCategory(validated.id);
      
      // Check slug uniqueness if provided
      if (validated.slug) {
        await checkCategorySlugUnique(validated.slug, validated.id);
      }
      
      const [row] = await db
        .update(blogCategories)
        .set({
          name: validated.name ?? sql`${blogCategories.name}`,
          slug: validated.slug ?? sql`${blogCategories.slug}`,
          description: validated.description !== undefined ? validated.description : sql`${blogCategories.description}`,
          icon: validated.icon !== undefined ? validated.icon : sql`${blogCategories.icon}`,
          order: validated.order ?? sql`${blogCategories.order}`,
        })
        .where(eq(blogCategories.id, validated.id))
        .returning();
      
      if (!row) {
        throw new Error("Failed to update blog category");
      }
      
      return row;
    },

    async deleteCategory(id) {
      const category = await requireCategory(id);
      
      // Check if category has any posts
      const [postCount] = await db
        .select({ count: count() })
        .from(blogPosts)
        .where(eq(blogPosts.categoryId, id));
      
      if (Number(postCount?.count ?? 0) > 0) {
        throw new BlogCategoryInUseError(id);
      }
      
      await db.delete(blogCategories).where(eq(blogCategories.id, id));
    },

    async listCategories() {
      return db
        .select()
        .from(blogCategories)
        .orderBy(asc(blogCategories.order), asc(blogCategories.name));
    },

    // --------------------------------------------------------------------------
    // Blog Comments
    // --------------------------------------------------------------------------

    async requireComment(id: string): Promise<BlogCommentRow> {
      const [row] = await db.select().from(blogComments).where(eq(blogComments.id, id)).limit(1);
      if (!row) {
        throw new BlogCommentNotFoundError(id);
      }
      return row;
    }

    async requireCommentParent(parentId: string): Promise<BlogCommentRow> {
      const [row] = await db.select().from(blogComments).where(eq(blogComments.id, parentId)).limit(1);
      if (!row) {
        throw new BlogCommentParentNotFoundError(parentId);
      }
      return row;
    }

    async createComment(input) {
      const validated = createBlogCommentSchema.parse(input);
      
      // Ensure post exists
      await requirePost(validated.postId);
      
      // Ensure parent exists if provided
      if (validated.parentId) {
        await requireCommentParent(validated.parentId);
      }
      
      const now = clock.now();
      const defaultStatus: BlogCommentStatus = "approved"; // For now, auto-approve; can change to "pending" later
      
      const [row] = await db
        .insert(blogComments)
        .values({
          id: generateCommentId(),
          postId: validated.postId,
          authorId: input.authorId,
          authorName: validated.authorName,
          content: validated.content,
          status: defaultStatus,
          parentId: validated.parentId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      
      if (!row) {
        throw new Error("Failed to create blog comment");
      }
      
      return row;
    },

    async getCommentById(id) {
      return this.requireComment(id);
    },

    async updateComment(input) {
      const validated = updateBlogCommentSchema.parse(input);
      
      await this.requireComment(validated.id);
      
      const now = clock.now();
      
      const [row] = await db
        .update(blogComments)
        .set({
          content: validated.content,
          updatedAt: now,
        })
        .where(eq(blogComments.id, validated.id))
        .returning();
      
      if (!row) {
        throw new Error("Failed to update blog comment");
      }
      
      return row;
    },

    async deleteComment(id) {
      await this.requireComment(id);
      await db.delete(blogComments).where(eq(blogComments.id, id));
    },

    async listComments(params) {
      const validated = blogCommentListSchema.parse(params);
      const { postId, page, limit, status, parentId, sortBy, sortOrder } = validated;
      
      // Ensure post exists
      await requirePost(postId);
      
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const conditions = [eq(blogComments.postId, postId)];
      
      if (status) {
        conditions.push(eq(blogComments.status, status));
      }
      
      if (parentId) {
        conditions.push(eq(blogComments.parentId, parentId));
      } else {
        // Only top-level comments if no parentId specified
        conditions.push(sql`${blogComments.parentId} IS NULL`);
      }
      
      // Build order by
      const orderBy = [];
      if (sortBy === "createdAt") {
        orderBy.push(sortOrder === "desc" ? desc(blogComments.createdAt) : asc(blogComments.createdAt));
      } else {
        orderBy.push(desc(blogComments.createdAt));
      }
      
      // Get total count
      const [countResult] = await db
        .select({ count: count() })
        .from(blogComments)
        .where(and(...conditions));
      
      const total = Number(countResult?.count ?? 0);
      
      // Get comments
      const comments = await db
        .select()
        .from(blogComments)
        .where(and(...conditions))
        .orderBy(...orderBy)
        .offset(offset)
        .limit(limit);
      
      return { comments, total };
    },

    async moderateComment(input) {
      const validated = moderateBlogCommentSchema.parse(input);
      
      const comment = await this.requireComment(validated.id);
      
      const now = clock.now();
      const statusMap: Record<"approve" | "reject" | "spam", BlogCommentStatus> = {
        approve: "approved",
        reject: "rejected",
        spam: "spam",
      };
      
      const [row] = await db
        .update(blogComments)
        .set({
          status: statusMap[validated.action],
          moderatedBy: input.moderatedBy,
          moderatedAt: now,
          moderationReason: validated.reason,
          updatedAt: now,
        })
        .where(eq(blogComments.id, validated.id))
        .returning();
      
      if (!row) {
        throw new Error("Failed to moderate blog comment");
      }
      
      // Send notification if configured
      if (notifier && validated.action === "rejected" && comment.authorId) {
        await notifier.sendCommentModerationNotification({
          userId: comment.authorId,
          commentId: validated.id,
          action: validated.action,
          reason: validated.reason,
        });
      }
      
      return row;
    },

    async getCommentThread(commentId: string): Promise<BlogCommentWithAuthorAndReplies> {
      const comment = await this.requireComment(commentId);
      
      // Get author
      let author: typeof users.$inferSelect | null = null;
      if (comment.authorId) {
        const [authorRow] = await db
          .select()
          .from(users)
          .where(eq(users.id, comment.authorId))
          .limit(1);
        author = authorRow ?? null;
      }
      
      // Get replies recursively
      const replies = await this.getRepliesForComment(commentId);
      
      return {
        ...comment,
        author,
        replies,
      };
    },

    async getRepliesForComment(parentId: string): Promise<BlogCommentWithAuthorAndReplies[]> {
      const [rows] = await db
        .select()
        .from(blogComments)
        .where(eq(blogComments.parentId, parentId))
        .orderBy(asc(blogComments.createdAt));
      
      const replies: BlogCommentWithAuthorAndReplies[] = [];
      
      for (const row of rows) {
        let author: typeof users.$inferSelect | null = null;
        if (row.authorId) {
          const [authorRow] = await db
            .select()
            .from(users)
            .where(eq(users.id, row.authorId))
            .limit(1);
          author = authorRow ?? null;
        }
        
        const nestedReplies = await this.getRepliesForComment(row.id);
        
        replies.push({
          ...row,
          author,
          replies: nestedReplies,
        });
      }
      
      return replies;
    },

    // --------------------------------------------------------------------------
    // Analytics
    // --------------------------------------------------------------------------

    async incrementViewCount(postId: string, viewerId?: string): Promise<void> {
      await requirePost(postId);
      
      const now = clock.now();
      
      await db.insert(blogPostViews).values({
        id: `bpv_${randomUUID().replace(/-/g, "")}`,
        postId,
        viewerId: viewerId ?? null,
        viewedAt: now,
      });
    },

    async getPostViewCount(postId: string): Promise<number> {
      await requirePost(postId);
      
      const [result] = await db
        .select({ count: count() })
        .from(blogPostViews)
        .where(eq(blogPostViews.postId, postId));
      
      return Number(result?.count ?? 0);
    },
  };
}
