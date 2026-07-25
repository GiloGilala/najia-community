import { describe, it, beforeEach, afterEach, expect } from "bun:test";
import { eq } from "drizzle-orm";

import { createTestHarness } from "./harness";
import { createAuthService, type AuthService } from "../services/auth.service";
import { createBlogService, type BlogService } from "../services/blog.service";
import { users, type UserRow } from "../db/schema/users";
import { blogCategories, blogPosts } from "../db/schema/blog";
import {
  BlogPostNotFoundError,
  BlogCategoryNotFoundError,
  DuplicateBlogSlugError,
} from "../services/blog.service";
import { InMemoryFileStorage } from "../lib/storage/in-memory-file-storage";
import { FixedClock } from "../lib/clock/clock";

const DEFAULT_CLOCK_START = new Date("2025-01-01T00:00:00.000Z");

function buildCreatePostInput(overrides: Partial<Parameters<BlogService["createPost"]>[0]> = {}) {
  return {
    title: `Test Post ${Date.now()}`,
    slug: `test-post-${Date.now()}`,
    summary: "Test summary",
    content: "# Test Content\n\nTest body content",
    categoryId: "",
    authorId: "",
    ...overrides,
  };
}

function buildUpdatePostInput(overrides: Partial<Parameters<BlogService["updatePost"]>[0]> = {}) {
  return {
    id: "",
    title: `Updated Post ${Date.now()}`,
    ...overrides,
  };
}

describe("BlogService - Posts", () => {
  let harness: ReturnType<typeof createTestHarness>;
  let blogService: BlogService;
  let clock: FixedClock;
  
  let writer: UserRow;
  let category: typeof blogCategories.$inferSelect;

  beforeEach(async () => {
    harness = createTestHarness();
    await harness.migrate();
    await harness.reset();
    
    clock = new FixedClock(DEFAULT_CLOCK_START);
    blogService = createBlogService({
      db: harness.db,
      clock,
    });

    // Create a writer user
    const authService = createAuthService({
      db: harness.db,
      clock,
      passwordHasher: {
        hash: async (pw: string) => `hashed_${pw}`,
        verify: async (_hash: string, _pw: string) => true,
      },
    });
    
    writer = await authService.register({
      email: `writer-${Date.now()}@test.com`,
      password: "password123",
    });
    
    // Update user to writer role (simplified for test)
    await harness.db
      .update(users)
      .set({ role: "writer" })
      .where(eq(users.id, writer.id));
    
    // Create a category
    category = await blogService.createCategory({
      name: `Test Category ${Date.now()}`,
      slug: `test-category-${Date.now()}`,
    });
  });

  afterEach(async () => {
    await harness.close();
  });

  describe("createPost", () => {
    it("creates a blog post with valid input", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
      });

      const post = await blogService.createPost(input);

      expect(post.id).toBeTruthy();
      expect(post.id.startsWith("blg_")).toBeTrue();
      expect(post.title).toBe(input.title);
      expect(post.slug).toBe(input.slug);
      expect(post.summary).toBe(input.summary);
      expect(post.content).toBe(input.content);
      expect(post.categoryId).toBe(category.id);
      expect(post.authorId).toBe(writer.id);
      expect(post.status).toBe("draft");
      expect(post.readingTime).toBeGreaterThan(0);
      expect(post.createdAt).toEqual(DEFAULT_CLOCK_START);
      expect(post.updatedAt).toEqual(DEFAULT_CLOCK_START);
      expect(post.publishedAt).toBeNull();
    });

    it("creates a post in draft status by default", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
      });

      const post = await blogService.createPost(input);

      expect(post.status).toBe("draft");
    });

    it("allows creating a post with published status", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "published",
      });

      const post = await blogService.createPost(input);

      expect(post.status).toBe("published");
      expect(post.publishedAt).toEqual(DEFAULT_CLOCK_START);
    });

    it("calculates reading time from content", async () => {
      const shortContent = "# Short\n\nThis is short.";
      const longContent = "# Long\n\n".padEnd(5000, "x");

      const shortPost = await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        content: shortContent,
      }));

      const longPost = await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        content: longContent,
      }));

      expect(shortPost.readingTime).toBe(1);
      expect(longPost.readingTime).toBeGreaterThan(shortPost.readingTime);
    });

    it("generates a unique slug from title if not provided", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        slug: undefined,
        title: "My Test Post",
      });

      const post = await blogService.createPost(input);

      expect(post.slug).toBe("my-test-post");
    });

    it("throws BlogCategoryNotFoundError for invalid categoryId", async () => {
      const input = buildCreatePostInput({
        categoryId: "invalid-category-id",
        authorId: writer.id,
      });

      await expect(blogService.createPost(input)).toThrow(BlogCategoryNotFoundError);
    });

    it("throws DuplicateBlogSlugError for duplicate slug", async () => {
      const slug = `duplicate-slug-${Date.now()}`;
      const input1 = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        slug,
      });

      await blogService.createPost(input1);

      const input2 = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        slug,
      });

      await expect(blogService.createPost(input2)).toThrow(DuplicateBlogSlugError);
    });
  });

  describe("getPostById", () => {
    it("returns a post by ID", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
      });
      const created = await blogService.createPost(input);

      const post = await blogService.getPostById(created.id);

      expect(post.id).toBe(created.id);
      expect(post.title).toBe(input.title);
    });

    it("throws BlogPostNotFoundError for non-existent post", async () => {
      await expect(blogService.getPostById("non-existent-id")).toThrow(BlogPostNotFoundError);
    });
  });

  describe("getPostBySlug", () => {
    it("returns a post by slug", async () => {
      const slug = `test-slug-${Date.now()}`;
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        slug,
      });
      const created = await blogService.createPost(input);

      const post = await blogService.getPostBySlug(slug);

      expect(post.id).toBe(created.id);
      expect(post.slug).toBe(slug);
    });

    it("throws BlogPostNotFoundError for non-existent slug", async () => {
      await expect(blogService.getPostBySlug("non-existent-slug")).toThrow(BlogPostNotFoundError);
    });
  });

  describe("updatePost", () => {
    it("updates post fields", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
      });
      const created = await blogService.createPost(input);

      clock.advance({ milliseconds: 1000 });

      const updateInput = buildUpdatePostInput({
        id: created.id,
        title: "Updated Title",
        summary: "Updated summary",
      });

      const updated = await blogService.updatePost(updateInput);

      expect(updated.id).toBe(created.id);
      expect(updated.title).toBe("Updated Title");
      expect(updated.summary).toBe("Updated summary");
      expect(updated.content).toBe(created.content);
      expect(updated.updatedAt).toEqual(new Date(DEFAULT_CLOCK_START.getTime() + 1000));
    });

    it("updates the updatedAt timestamp", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
      });
      const created = await blogService.createPost(input);

      clock.advance({ milliseconds: 1000 });

      const updateInput = buildUpdatePostInput({
        id: created.id,
        title: "Updated Title",
      });

      const updated = await blogService.updatePost(updateInput);

      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it("allows changing status to published", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "draft",
      });
      const created = await blogService.createPost(input);

      const updateInput = buildUpdatePostInput({
        id: created.id,
        status: "published",
      });

      const updated = await blogService.updatePost(updateInput);

      expect(updated.status).toBe("published");
      expect(updated.publishedAt).toEqual(new Date(DEFAULT_CLOCK_START.getTime() + 1000));
    });

    it("throws BlogPostNotFoundError for non-existent post", async () => {
      const updateInput = buildUpdatePostInput({
        id: "non-existent-id",
        title: "Updated Title",
      });

      await expect(blogService.updatePost(updateInput)).toThrow(BlogPostNotFoundError);
    });

    it("throws DuplicateBlogSlugError when changing to duplicate slug", async () => {
      const slug1 = `duplicate-update-slug-${Date.now()}`;
      const slug2 = `another-slug-${Date.now()}`;

      const post1 = await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        slug: slug1,
      }));

      const post2 = await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        slug: slug2,
      }));

      const updateInput = buildUpdatePostInput({
        id: post2.id,
        slug: slug1,
      });

      await expect(blogService.updatePost(updateInput)).toThrow(DuplicateBlogSlugError);
    });
  });

  describe("deletePost", () => {
    it("deletes a post", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
      });
      const created = await blogService.createPost(input);

      await blogService.deletePost(created.id);

      await expect(blogService.getPostById(created.id)).toThrow(BlogPostNotFoundError);
    });

    it("throws BlogPostNotFoundError for non-existent post", async () => {
      await expect(blogService.deletePost("non-existent-id")).toThrow(BlogPostNotFoundError);
    });
  });

  describe("publishPost", () => {
    it("publishes a draft post", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "draft",
      });
      const created = await blogService.createPost(input);

      clock.advance({ milliseconds: 1000 });

      const published = await blogService.publishPost({ id: created.id });

      expect(published.status).toBe("published");
      expect(published.publishedAt).toEqual(new Date(DEFAULT_CLOCK_START.getTime() + 1000));
    });

    it("sets publishedAt to current time", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
      });
      const created = await blogService.createPost(input);

      clock.advance({ milliseconds: 1000 });

      const published = await blogService.publishPost({ id: created.id });

      expect(published.publishedAt).toBeTruthy();
      expect(published.publishedAt?.getTime()).toBe(DEFAULT_CLOCK_START.getTime() + 1000);
    });

    it("throws BlogPostNotFoundError for non-existent post", async () => {
      await expect(blogService.publishPost({ id: "non-existent-id" })).toThrow(BlogPostNotFoundError);
    });

    it("throws BlogPostAlreadyPublishedError for already published post", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "published",
      });
      const created = await blogService.createPost(input);

      await expect(blogService.publishPost({ id: created.id })).toThrow(
        "Blog post blg_.* is already published",
      );
    });
  });

  describe("unpublishPost", () => {
    it("unpublishes a published post", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "published",
      });
      const created = await blogService.createPost(input);

      const unpublished = await blogService.unpublishPost({ id: created.id });

      expect(unpublished.status).toBe("draft");
    });

    it("does not clear publishedAt", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "published",
      });
      const created = await blogService.createPost(input);

      const unpublished = await blogService.unpublishPost({ id: created.id });

      expect(unpublished.publishedAt).toBe(created.publishedAt);
    });

    it("throws BlogPostNotFoundError for non-existent post", async () => {
      await expect(blogService.unpublishPost({ id: "non-existent-id" })).toThrow(BlogPostNotFoundError);
    });
  });

  describe("listPosts", () => {
    it("returns paginated list of posts", async () => {
      // Create multiple posts
      for (let i = 0; i < 5; i++) {
        await blogService.createPost(buildCreatePostInput({
          categoryId: category.id,
          authorId: writer.id,
          status: "published",
          publishedAt: new Date(DEFAULT_CLOCK_START.getTime() + i * 1000),
        }));
      }

      const result = await blogService.listPosts({ page: 1, limit: 3 });

      expect(result.posts.length).toBe(3);
      expect(result.total).toBe(5);
    });

    it("filters by category", async () => {
      const category2 = await blogService.createCategory({
        name: `Category 2 ${Date.now()}`,
        slug: `category-2-${Date.now()}`,
      });

      // Create posts in both categories
      await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "published",
      }));
      await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "published",
      }));
      await blogService.createPost(buildCreatePostInput({
        categoryId: category2.id,
        authorId: writer.id,
        status: "published",
      }));

      const result = await blogService.listPosts({ category: category.id });

      expect(result.posts.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.posts.every((p) => p.categoryId === category.id)).toBeTrue();
    });

    it("filters by author", async () => {
      // Create another writer
      const writer2 = await harness.db
        .insert(users)
        .values({
          email: `writer2-${Date.now()}@test.com`,
          passwordHash: "hashed_password",
          verificationStatus: "email_verified",
          role: "writer",
          createdAt: DEFAULT_CLOCK_START,
          updatedAt: DEFAULT_CLOCK_START,
        })
        .returning();

      await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "published",
      }));
      await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "published",
      }));
      await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer2[0].id,
        status: "published",
      }));

      const result = await blogService.listPosts({ author: writer.id });

      expect(result.posts.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.posts.every((p) => p.authorId === writer.id)).toBeTrue();
    });

    it("filters by status", async () => {
      await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "draft",
      }));
      await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "published",
      }));
      await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "archived",
      }));

      const publishedResult = await blogService.listPosts({ status: "published" });
      expect(publishedResult.posts.length).toBe(1);
      expect(publishedResult.posts[0].status).toBe("published");
    });

    it("searches by title and content", async () => {
      await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        title: "Searchable Post",
        content: "This post contains searchable content",
        status: "published",
      }));
      await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        title: "Other Post",
        content: "This post does not match",
        status: "published",
      }));

      const result = await blogService.listPosts({ search: "searchable" });

      expect(result.posts.length).toBe(1);
      expect(result.posts[0].title).toBe("Searchable Post");
    });

    it("sorts by createdAt", async () => {
      for (let i = 0; i < 3; i++) {
        clock.advance({ milliseconds: 1000 });
        await blogService.createPost(buildCreatePostInput({
          categoryId: category.id,
          authorId: writer.id,
          status: "published",
        }));
      }

      const ascending = await blogService.listPosts({
        sortBy: "createdAt",
        sortOrder: "asc",
      });
      const descending = await blogService.listPosts({
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      expect(ascending.posts[0].createdAt.getTime()).toBeLessThan(
        ascending.posts[1].createdAt.getTime(),
      );
      expect(descending.posts[0].createdAt.getTime()).toBeGreaterThan(
        descending.posts[1].createdAt.getTime(),
      );
    });

    it("defaults to published posts only for public listing", async () => {
      await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "draft",
      }));
      await blogService.createPost(buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "published",
      }));

      const result = await blogService.listPosts({});

      expect(result.posts.length).toBe(1);
      expect(result.posts[0].status).toBe("published");
    });

    it("returns total count for pagination", async () => {
      for (let i = 0; i < 15; i++) {
        await blogService.createPost(buildCreatePostInput({
          categoryId: category.id,
          authorId: writer.id,
          status: "published",
        }));
      }

      const page1 = await blogService.listPosts({ page: 1, limit: 10 });
      const page2 = await blogService.listPosts({ page: 2, limit: 10 });

      expect(page1.posts.length).toBe(10);
      expect(page2.posts.length).toBe(5);
      expect(page1.total).toBe(15);
      expect(page2.total).toBe(15);
    });
  });

  describe("getPostWithDetails", () => {
    it("returns a post with category and author details", async () => {
      const input = buildCreatePostInput({
        categoryId: category.id,
        authorId: writer.id,
        status: "published",
      });
      const created = await blogService.createPost(input);

      const result = await blogService.getPostWithDetails(created.slug);

      expect(result.id).toBe(created.id);
      expect(result.category.id).toBe(category.id);
      expect(result.category.name).toBe(category.name);
      expect(result.author.id).toBe(writer.id);
      expect(result.viewCount).toBe(0);
    });

    it("throws BlogPostNotFoundError for non-existent slug", async () => {
      await expect(blogService.getPostWithDetails("non-existent-slug")).toThrow(BlogPostNotFoundError);
    });
  });
});
