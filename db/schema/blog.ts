import { pgTable, text, timestamp, integer, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./users.ts";

// =============================================================================
// Blog Categories
// =============================================================================

export const blogCategories = pgTable("blog_categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export type BlogCategoryRow = typeof blogCategories.$inferSelect;
export type BlogCategoryInsert = typeof blogCategories.$inferInsert;

// =============================================================================
// Blog Posts
// =============================================================================

export type BlogPostStatus = "draft" | "published" | "archived";

export const blogPosts = pgTable("blog_posts", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  categoryId: text("category_id").notNull().references(() => blogCategories.id),
  authorId: text("author_id").notNull().references(() => users.id),
  status: text("status").notNull().$type<BlogPostStatus>(),
  publishedAt: timestamp("published_at", { mode: "date" }),
  featuredImage: text("featured_image"),
  readingTime: integer("reading_time").notNull().default(0),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export type BlogPostRow = typeof blogPosts.$inferSelect;
export type BlogPostInsert = typeof blogPosts.$inferInsert;

// =============================================================================
// Blog Comments
// =============================================================================

export type BlogCommentStatus = "pending" | "approved" | "rejected" | "spam";

export const blogComments = pgTable("blog_comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => blogPosts.id),
  authorId: text("author_id").references(() => users.id),
  authorName: text("author_name"),
  content: text("content").notNull(),
  status: text("status").notNull().$type<BlogCommentStatus>(),
  parentId: text("parent_id").references(() => blogComments.id),
  moderatedBy: text("moderated_by").references(() => users.id),
  moderatedAt: timestamp("moderated_at", { mode: "date" }),
  moderationReason: text("moderation_reason"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export type BlogCommentRow = typeof blogComments.$inferSelect;
export type BlogCommentInsert = typeof blogComments.$inferInsert;

// =============================================================================
// Blog Post Views (for tracking analytics)
// =============================================================================

export const blogPostViews = pgTable("blog_post_views", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => blogPosts.id),
  viewerId: text("viewer_id").references(() => users.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  viewedAt: timestamp("viewed_at", { mode: "date" }).notNull().defaultNow(),
});

export type BlogPostViewRow = typeof blogPostViews.$inferSelect;
export type BlogPostViewInsert = typeof blogPostViews.$inferInsert;

// =============================================================================
// Indexes for performance
// =============================================================================

// Blog posts indexes
export const blogPostsBySlugIndex = blogPosts;
export const blogPostsByCategoryIndex = blogPosts;
export const blogPostsByAuthorIndex = blogPosts;
export const blogPostsByStatusIndex = blogPosts;
export const blogPostsByPublishedAtIndex = blogPosts;
export const blogPostsByCreatedAtIndex = blogPosts;

// Blog comments indexes
export const blogCommentsByPostIndex = blogComments;
export const blogCommentsByAuthorIndex = blogComments;
export const blogCommentsByStatusIndex = blogComments;
export const blogCommentsByParentIndex = blogComments;
export const blogCommentsByCreatedAtIndex = blogComments;

// Blog views indexes
export const blogPostViewsByPostIndex = blogPostViews;
export const blogPostViewsByViewerIndex = blogPostViews;
export const blogPostViewsByViewedAtIndex = blogPostViews;
