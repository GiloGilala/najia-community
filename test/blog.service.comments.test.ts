import { describe, it, beforeEach, afterEach, expect } from "bun:test";
import { createTestHarness } from "./harness";
import { createBlogService, type BlogService } from "../services/blog.service";
import {
  BlogCommentNotFoundError,
  BlogPostNotFoundError,
  BlogCommentParentNotFoundError,
} from "../services/blog.service";
import { FixedClock } from "../lib/clock/clock";
import { users } from "../db/schema/users";
import { randomUUID } from "node:crypto";

const DEFAULT_CLOCK_START = new Date("2025-01-01T00:00:00.000Z");

async function createUser(db: any, overrides: any = {}) {
  const id = randomUUID();
  const now = new Date(DEFAULT_CLOCK_START);
  const [row] = await db.insert(users).values({
    id,
    email: `user-${Date.now()}-${Math.random()}@example.com`,
    passwordHash: "hashed",
    verificationStatus: "email_verified",
    createdAt: now,
    updatedAt: now,
    ...overrides,
    id,
  }).returning();
  return row;
}

describe("BlogService - Comments", () => {
  let harness: ReturnType<typeof createTestHarness>;
  let blogService: BlogService;
  let clock: FixedClock;
  let writer: any;
  let category: any;
  let post: any;

  beforeEach(async () => {
    harness = createTestHarness();
    await harness.migrate();
    await harness.reset();
    clock = new FixedClock(DEFAULT_CLOCK_START);
    blogService = createBlogService({ db: harness.db, clock });
    writer = await createUser(harness.db);
    const cat = await blogService.createCategory({
      name: `Cat ${Date.now()}`,
      slug: `cat-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    });
    category = cat;
    post = await blogService.createPost({
      title: `Post ${Date.now()}`,
      slug: `post-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      summary: "summary",
      content: "# Content",
      categoryId: category.id,
      authorId: writer.id,
      status: "published",
    });
  });

  afterEach(async () => {
    await harness.close();
  });

  describe("createComment", () => {
    it("creates a comment with authenticated user", async () => {
      const commenter = await createUser(harness.db);
      const comment = await blogService.createComment({
        postId: post.id,
        content: "Great post!",
        authorId: commenter.id,
      });
      expect(comment.id.startsWith("bcmt_")).toBeTrue();
      expect(comment.postId).toBe(post.id);
      expect(comment.authorId).toBe(commenter.id);
    });

    it("creates an anonymous comment with authorName", async () => {
      const comment = await blogService.createComment({
        postId: post.id,
        content: "Anonymous comment",
        authorName: "Anonymous",
      });
      expect(comment.authorName).toBe("Anonymous");
      expect(comment.authorId).toBeNull();
    });

    it("creates a threaded comment with parentId", async () => {
      const c1 = await blogService.createComment({
        postId: post.id,
        content: "Parent",
        authorId: writer.id,
      });
      const c2 = await blogService.createComment({
        postId: post.id,
        content: "Child reply",
        authorId: writer.id,
        parentId: c1.id,
      });
      expect(c2.parentId).toBe(c1.id);
    });

    it("throws BlogPostNotFoundError for invalid postId", async () => {
      await expect(
        blogService.createComment({
          postId: "non-existent-post",
          content: "test",
          authorId: writer.id,
        }),
      ).rejects.toThrow(BlogPostNotFoundError);
    });

    it("throws BlogCommentParentNotFoundError for invalid parentId", async () => {
      await expect(
        blogService.createComment({
          postId: post.id,
          content: "reply",
          authorId: writer.id,
          parentId: "non-existent-parent",
        }),
      ).rejects.toThrow(BlogCommentParentNotFoundError);
    });
  });

  describe("getCommentById", () => {
    it("returns a comment by ID", async () => {
      const created = await blogService.createComment({
        postId: post.id,
        content: "Find me",
        authorId: writer.id,
      });
      const fetched = await blogService.getCommentById(created.id);
      expect(fetched.id).toBe(created.id);
    });

    it("throws BlogCommentNotFoundError for non-existent comment", async () => {
      await expect(blogService.getCommentById("non-existent")).rejects.toThrow(BlogCommentNotFoundError);
    });
  });

  describe("updateComment", () => {
    it("updates comment content", async () => {
      const created = await blogService.createComment({
        postId: post.id,
        content: "Original",
        authorId: writer.id,
      });
      const updated = await blogService.updateComment({
        id: created.id,
        content: "Updated content",
      });
      expect(updated.content).toBe("Updated content");
    });

    it("throws BlogCommentNotFoundError for non-existent comment", async () => {
      await expect(
        blogService.updateComment({ id: "nope", content: "new" }),
      ).rejects.toThrow(BlogCommentNotFoundError);
    });
  });

  describe("deleteComment", () => {
    it("deletes a comment", async () => {
      const created = await blogService.createComment({
        postId: post.id,
        content: "Delete me",
        authorId: writer.id,
      });
      await blogService.deleteComment(created.id);
      await expect(blogService.getCommentById(created.id)).rejects.toThrow(BlogCommentNotFoundError);
    });

    it("throws BlogCommentNotFoundError for non-existent comment", async () => {
      await expect(blogService.deleteComment("nope")).rejects.toThrow(BlogCommentNotFoundError);
    });
  });

  describe("listComments", () => {
    it("returns paginated list of comments for a post", async () => {
      for (let i = 0; i < 5; i++) {
        await blogService.createComment({
          postId: post.id,
          content: `Comment ${i}`,
          authorId: writer.id,
        });
      }
      const { comments, total } = await blogService.listComments({ postId: post.id, page: 1, limit: 2 });
      expect(comments.length).toBe(2);
      expect(total).toBe(5);
    });

    it("filters by status", async () => {
      const c1 = await blogService.createComment({
        postId: post.id,
        content: "Pending comment",
        authorId: writer.id,
      });
      // Moderate one to approved / rejected
      await blogService.moderateComment({
        id: c1.id,
        action: "reject",
        reason: "spam",
        moderatedBy: writer.id,
      });
      const { comments } = await blogService.listComments({
        postId: post.id,
        status: "rejected",
        page: 1,
        limit: 10,
      });
      expect(comments.length).toBeGreaterThanOrEqual(1);
      expect(comments[0].status).toBe("rejected");
    });
  });

  describe("moderateComment", () => {
    it("approves a comment", async () => {
      const c = await blogService.createComment({
        postId: post.id,
        content: "To approve",
        authorId: writer.id,
      });
      const moderated = await blogService.moderateComment({
        id: c.id,
        action: "approve",
        moderatedBy: writer.id,
      });
      expect(moderated.status).toBe("approved");
    });

    it("rejects a comment with reason", async () => {
      const c = await blogService.createComment({
        postId: post.id,
        content: "To reject",
        authorId: writer.id,
      });
      const moderated = await blogService.moderateComment({
        id: c.id,
        action: "reject",
        reason: "inappropriate",
        moderatedBy: writer.id,
      });
      expect(moderated.status).toBe("rejected");
      expect(moderated.moderationReason).toBe("inappropriate");
    });

    it("sets moderatedBy and moderatedAt", async () => {
      const c = await blogService.createComment({
        postId: post.id,
        content: "mod fields",
        authorId: writer.id,
      });
      const moderated = await blogService.moderateComment({
        id: c.id,
        action: "spam",
        moderatedBy: writer.id,
      });
      expect(moderated.moderatedBy).toBe(writer.id);
      expect(moderated.moderatedAt).toBeTruthy();
    });

    it("throws BlogCommentNotFoundError for non-existent comment", async () => {
      await expect(
        blogService.moderateComment({ id: "nope", action: "approve", moderatedBy: writer.id }),
      ).rejects.toThrow(BlogCommentNotFoundError);
    });
  });
});
