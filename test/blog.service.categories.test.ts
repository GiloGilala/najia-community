import { describe, it, beforeEach, afterEach, expect } from "bun:test";

import { createTestHarness } from "./harness";
import { createBlogService, type BlogService } from "../services/blog.service";
import { FixedClock } from "../lib/clock/clock";
import {
  BlogCategoryNotFoundError,
  BlogCategoryInUseError,
  DuplicateCategorySlugError,
} from "../services/blog.service";

const DEFAULT_CLOCK_START = new Date("2025-01-01T00:00:00.000Z");

function buildCreateCategoryInput(overrides: Partial<Parameters<BlogService["createCategory"]>[0]> = {}) {
  return {
    name: `Test Category ${Date.now()}`,
    slug: `test-category-${Date.now()}`,
    ...overrides,
  };
}

function buildUpdateCategoryInput(overrides: Partial<Parameters<BlogService["updateCategory"]>[0]> = {}) {
  return {
    id: "",
    name: `Updated Category ${Date.now()}`,
    ...overrides,
  };
}

describe("BlogService - Categories", () => {
  let harness: ReturnType<typeof createTestHarness>;
  let blogService: BlogService;
  let clock: FixedClock;

  beforeEach(async () => {
    harness = createTestHarness();
    await harness.migrate();
    await harness.reset();
    
    clock = new FixedClock(DEFAULT_CLOCK_START);
    blogService = createBlogService({
      db: harness.db,
      clock,
    });
  });

  afterEach(async () => {
    await harness.close();
  });

  describe("createCategory", () => {
    it("creates a category with valid input", async () => {
      const input = buildCreateCategoryInput();

      const category = await blogService.createCategory(input);

      expect(category.id).toBeTruthy();
      expect(category.id.startsWith("bct_")).toBeTrue();
      expect(category.name).toBe(input.name);
      expect(category.slug).toBe(input.slug);
      expect(category.description ?? undefined).toBe(input.description ?? undefined);
      expect(category.icon ?? undefined).toBe(input.icon ?? undefined);
      expect(category.order).toBe(0);
      expect(category.createdAt).toEqual(DEFAULT_CLOCK_START);
    });

    it("generates a unique slug from name if not provided", async () => {
      const input = buildCreateCategoryInput({
        slug: undefined,
        name: "My Test Category",
      });

      const category = await blogService.createCategory(input);

      expect(category.slug).toBe("my-test-category");
    });

    it("throws DuplicateCategorySlugError for duplicate slug", async () => {
      const slug = `duplicate-category-slug-${Date.now()}`;
      const input1 = buildCreateCategoryInput({ slug });

      await blogService.createCategory(input1);

      const input2 = buildCreateCategoryInput({ slug });

      await expect(blogService.createCategory(input2)).rejects.toThrow(DuplicateCategorySlugError);
    });
  });

  describe("getCategoryById", () => {
    it("returns a category by ID", async () => {
      const input = buildCreateCategoryInput();
      const created = await blogService.createCategory(input);

      const category = await blogService.getCategoryById(created.id);

      expect(category.id).toBe(created.id);
      expect(category.name).toBe(input.name);
    });

    it("throws BlogCategoryNotFoundError for non-existent category", async () => {
      await expect(blogService.getCategoryById("non-existent-id")).rejects.toThrow(BlogCategoryNotFoundError);
    });
  });

  describe("getCategoryBySlug", () => {
    it("returns a category by slug", async () => {
      const slug = `test-category-slug-${Date.now()}`;
      const input = buildCreateCategoryInput({ slug });
      const created = await blogService.createCategory(input);

      const category = await blogService.getCategoryBySlug(slug);

      expect(category.id).toBe(created.id);
      expect(category.slug).toBe(slug);
    });

    it("throws BlogCategoryNotFoundError for non-existent slug", async () => {
      await expect(blogService.getCategoryBySlug("non-existent-slug")).rejects.toThrow(BlogCategoryNotFoundError);
    });
  });

  describe("updateCategory", () => {
    it("updates category fields", async () => {
      const input = buildCreateCategoryInput();
      const created = await blogService.createCategory(input);

      const updateInput = buildUpdateCategoryInput({
        id: created.id,
        name: "Updated Name",
        description: "Updated description",
      });

      const updated = await blogService.updateCategory(updateInput);

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe("Updated Name");
      expect(updated.description).toBe("Updated description");
      expect(updated.slug).toBe(created.slug);
    });

    it("throws BlogCategoryNotFoundError for non-existent category", async () => {
      const updateInput = buildUpdateCategoryInput({
        id: "non-existent-id",
        name: "Updated Name",
      });

      await expect(blogService.updateCategory(updateInput)).rejects.toThrow(BlogCategoryNotFoundError);
    });

    it("throws DuplicateCategorySlugError when changing to duplicate slug", async () => {
      const slug1 = `duplicate-category-slug-${Date.now()}`;
      const slug2 = `another-slug-${Date.now()}`;

      const category1 = await blogService.createCategory(buildCreateCategoryInput({ slug: slug1 }));
      const category2 = await blogService.createCategory(buildCreateCategoryInput({ slug: slug2 }));

      const updateInput = buildUpdateCategoryInput({
        id: category2.id,
        slug: slug1,
      });

      await expect(blogService.updateCategory(updateInput)).rejects.toThrow(DuplicateCategorySlugError);
    });
  });

  describe("deleteCategory", () => {
    it("deletes a category", async () => {
      const input = buildCreateCategoryInput();
      const created = await blogService.createCategory(input);

      await blogService.deleteCategory(created.id);

      await expect(blogService.getCategoryById(created.id)).rejects.toThrow(BlogCategoryNotFoundError);
    });

    it("throws BlogCategoryNotFoundError for non-existent category", async () => {
      await expect(blogService.deleteCategory("non-existent-id")).rejects.toThrow(BlogCategoryNotFoundError);
    });

    it("throws BlogCategoryInUseError when category has posts", async () => {
      // Create a category
      const input = buildCreateCategoryInput();
      const created = await blogService.createCategory(input);

      // Create a user to be author
      const { randomUUID } = await import("node:crypto");
      const { users } = await import("../db/schema/users.ts");
      const authorId = randomUUID();
      const now = new Date("2025-01-01T00:00:00.000Z");
      await harness.db.insert(users).values({
        id: authorId,
        email: `author-${Date.now()}@example.com`,
        passwordHash: "hashed",
        verificationStatus: "email_verified",
        createdAt: now,
        updatedAt: now,
      });

      // Create a post in that category
      await blogService.createPost({
        title: "Test Post",
        slug: `test-post-${Date.now()}`,
        summary: "Test summary",
        content: "Test content",
        categoryId: created.id,
        authorId,
      });

      await expect(blogService.deleteCategory(created.id)).rejects.toThrow(BlogCategoryInUseError);
    });
  });

  describe("listCategories", () => {
    it("returns all categories", async () => {
      // Create multiple categories
      for (let i = 0; i < 5; i++) {
        await blogService.createCategory(buildCreateCategoryInput({
          order: i,
        }));
      }

      const categories = await blogService.listCategories();

      expect(categories.length).toBe(5);
    });

    it("returns categories in order", async () => {
      // Create categories with specific orders
      await blogService.createCategory(buildCreateCategoryInput({ name: "Third", order: 2 }));
      await blogService.createCategory(buildCreateCategoryInput({ name: "First", order: 0 }));
      await blogService.createCategory(buildCreateCategoryInput({ name: "Second", order: 1 }));

      const categories = await blogService.listCategories();

      expect(categories[0].name).toBe("First");
      expect(categories[1].name).toBe("Second");
      expect(categories[2].name).toBe("Third");
    });

    it("returns empty array when no categories exist", async () => {
      const categories = await blogService.listCategories();

      expect(categories.length).toBe(0);
    });
  });
});
