import { z } from "zod";

// =============================================================================
// Helper validators
// =============================================================================

const slugValidator = z
  .string()
  .min(1, "Slug must be at least 1 character")
  .max(200, "Slug must be at most 200 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be URL-safe (lowercase letters, numbers, and hyphens only)",
  );

const urlValidator = z
  .string()
  .max(2048, "URL must be at most 2048 characters")
  .url("Invalid URL format");

const mdxContentValidator = z
  .string()
  .min(1, "Content must not be empty")
  .max(100000, "Content must be at most 100,000 characters");

// =============================================================================
// Blog Category Schemas
// =============================================================================

export const createBlogCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters"),
  slug: slugValidator.optional(),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  icon: z.string().max(50, "Icon must be at most 50 characters").optional(),
  order: z.number().int().nonnegative("Order must be a non-negative number").default(0),
});

export const updateBlogCategorySchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name must be at most 100 characters").optional(),
  slug: slugValidator.optional(),
  description: z.string().max(500, "Description must be at most 500 characters").optional().nullable(),
  icon: z.string().max(50, "Icon must be at most 50 characters").optional().nullable(),
  order: z.number().int().nonnegative("Order must be a non-negative number").optional(),
});

export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;
export type UpdateBlogCategoryInput = z.infer<typeof updateBlogCategorySchema>;

// =============================================================================
// Blog Post Schemas
// =============================================================================

export const blogPostStatusEnum = z.enum(["draft", "published", "archived"]);

export const createBlogPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  slug: slugValidator.optional(),
  summary: z.string().min(1, "Summary is required").max(500, "Summary must be at most 500 characters"),
  content: mdxContentValidator,
  categoryId: z.string().min(1, "Category ID is required"),
  authorId: z.string().min(1, "Author ID is required"),
  featuredImage: urlValidator.optional(),
  metaTitle: z.string().max(200, "Meta title must be at most 200 characters").optional(),
  metaDescription: z.string().max(500, "Meta description must be at most 500 characters").optional(),
  status: blogPostStatusEnum.optional().default("draft"),
});

export const updateBlogPostSchema = z.object({
  id: z.string().min(1, "ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters").optional(),
  slug: slugValidator.optional(),
  summary: z.string().min(1, "Summary is required").max(500, "Summary must be at most 500 characters").optional(),
  content: mdxContentValidator.optional(),
  categoryId: z.string().min(1, "Category ID is required").optional(),
  featuredImage: urlValidator.optional().nullable(),
  metaTitle: z.string().max(200, "Meta title must be at most 200 characters").optional().nullable(),
  metaDescription: z.string().max(500, "Meta description must be at most 500 characters").optional().nullable(),
  status: blogPostStatusEnum.optional(),
});

export const publishBlogPostSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const unpublishBlogPostSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
export type PublishBlogPostInput = z.infer<typeof publishBlogPostSchema>;
export type BlogPostStatus = z.infer<typeof blogPostStatusEnum>;

// =============================================================================
// Blog Comment Schemas
// =============================================================================

export const blogCommentStatusEnum = z.enum(["pending", "approved", "rejected", "spam"]);

export const createBlogCommentSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
  content: z.string().min(1, "Content is required").max(2000, "Content must be at most 2000 characters"),
  authorName: z.string().min(1, "Author name is required for anonymous comments").max(100, "Author name must be at most 100 characters").optional(),
  parentId: z.string().min(1, "Parent ID must be a valid comment ID").optional(),
});

export const updateBlogCommentSchema = z.object({
  id: z.string().min(1, "ID is required"),
  content: z.string().min(1, "Content is required").max(2000, "Content must be at most 2000 characters"),
});

export const moderateBlogCommentSchema = z.object({
  id: z.string().min(1, "ID is required"),
  action: z.enum(["approve", "reject", "spam"], "Invalid moderation action"),
  reason: z.string().max(500, "Reason must be at most 500 characters").optional(),
});

export type CreateBlogCommentInput = z.infer<typeof createBlogCommentSchema>;
export type UpdateBlogCommentInput = z.infer<typeof updateBlogCommentSchema>;
export type ModerateBlogCommentInput = z.infer<typeof moderateBlogCommentSchema>;
export type BlogCommentStatus = z.infer<typeof blogCommentStatusEnum>;

// =============================================================================
// Blog Post List Query Schema
// =============================================================================

export const blogPostListSchema = z.object({
  page: z.number().int().positive("Page must be a positive number").default(1),
  limit: z.number().int().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").default(10),
  category: z.string().optional(),
  author: z.string().optional(),
  search: z.string().max(200, "Search query must be at most 200 characters").optional(),
  status: blogPostStatusEnum.optional(),
  sortBy: z.enum(["createdAt", "publishedAt", "title", "views"]).optional().default("publishedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type BlogPostListParams = z.infer<typeof blogPostListSchema>;

// =============================================================================
// Blog Comment List Query Schema
// =============================================================================

export const blogCommentListSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
  page: z.number().int().positive("Page must be a positive number").default(1),
  limit: z.number().int().min(1, "Limit must be at least 1").max(50, "Limit must be at most 50").default(10),
  status: blogCommentStatusEnum.optional(),
  parentId: z.string().optional(),
  sortBy: z.enum(["createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export type BlogCommentListParams = z.infer<typeof blogCommentListSchema>;

// =============================================================================
// Validation helper functions
// =============================================================================

/** Generate a URL-safe slug from a title. */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Calculate estimated reading time in minutes from MDX content. */
export function calculateReadingTime(content: string): number {
  // Remove MDX frontmatter and code blocks
  const plainText = content
    .replace(/^---[\s\S]*?---/, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[#*_~`]/g, "");
  
  const wordCount = plainText.split(/\s+/).filter((word) => word.length > 0).length;
  // Average reading speed: 200 words per minute
  return Math.max(1, Math.ceil(wordCount / 200));
}
