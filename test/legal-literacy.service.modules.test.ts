import { describe, it, beforeEach, afterEach, expect } from "bun:test";
import { createTestHarness } from "./harness";
import { createLegalLiteracyService } from "../services/legal-literacy.service";
import {
  LegalLiteracyModuleNotFoundError,
  LegalLiteracyModuleAlreadyPublishedError,
  DuplicateModuleSlugError,
} from "../services/legal-literacy.service";
import { FixedClock } from "../lib/clock/clock";

const DEFAULT_CLOCK_START = new Date("2025-01-01T00:00:00.000Z");

function buildModuleInput(overrides: any = {}) {
  return {
    title: `Module ${Date.now()}`,
    slug: `module-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    description: "Test description",
    category: "introduction-to-law" as const,
    content: "# Content\n\nTest body",
    estimatedDuration: 30,
    difficulty: "beginner" as const,
    ...overrides,
  };
}

describe("LegalLiteracyService - Modules", () => {
  let harness: ReturnType<typeof createTestHarness>;
  let service: ReturnType<typeof createLegalLiteracyService>;
  let clock: FixedClock;

  beforeEach(async () => {
    harness = createTestHarness();
    await harness.migrate();
    await harness.reset();
    clock = new FixedClock(DEFAULT_CLOCK_START);
    service = createLegalLiteracyService({ db: harness.db, clock });
  });

  afterEach(async () => {
    await harness.close();
  });

  describe("createModule", () => {
    it("creates a module with valid input", async () => {
      const mod = await service.createModule(buildModuleInput());
      expect(mod.id.startsWith("llm_")).toBeTrue();
      expect(mod.title).toBeTruthy();
      expect(mod.slug).toBeTruthy();
    });

    it("creates module as unpublished by default", async () => {
      const mod = await service.createModule(buildModuleInput());
      expect(mod.isPublished).toBeFalse();
    });

    it("throws DuplicateModuleSlugError for duplicate slug", async () => {
      const slug = `dup-slug-${Date.now()}`;
      await service.createModule(buildModuleInput({ slug }));
      await expect(service.createModule(buildModuleInput({ slug }))).rejects.toThrow(DuplicateModuleSlugError);
    });
  });

  describe("getModuleById", () => {
    it("returns a module by ID", async () => {
      const created = await service.createModule(buildModuleInput());
      const fetched = await service.getModuleById(created.id);
      expect(fetched.id).toBe(created.id);
    });

    it("throws LegalLiteracyModuleNotFoundError for non-existent module", async () => {
      await expect(service.getModuleById("non-existent")).rejects.toThrow(LegalLiteracyModuleNotFoundError);
    });
  });

  describe("getModuleBySlug", () => {
    it("returns a module by slug", async () => {
      const slug = `slug-${Date.now()}`;
      const created = await service.createModule(buildModuleInput({ slug }));
      const fetched = await service.getModuleBySlug(slug);
      expect(fetched.id).toBe(created.id);
    });

    it("throws LegalLiteracyModuleNotFoundError for non-existent slug", async () => {
      await expect(service.getModuleBySlug("nope")).rejects.toThrow(LegalLiteracyModuleNotFoundError);
    });
  });

  describe("updateModule", () => {
    it("updates module fields", async () => {
      const created = await service.createModule(buildModuleInput());
      const updated = await service.updateModule({ id: created.id, title: "Updated Title" });
      expect(updated.title).toBe("Updated Title");
    });

    it("throws LegalLiteracyModuleNotFoundError for non-existent module", async () => {
      await expect(service.updateModule({ id: "nope", title: "X" })).rejects.toThrow(LegalLiteracyModuleNotFoundError);
    });
  });

  describe("deleteModule", () => {
    it("deletes a module", async () => {
      const created = await service.createModule(buildModuleInput());
      await service.deleteModule(created.id);
      await expect(service.getModuleById(created.id)).rejects.toThrow(LegalLiteracyModuleNotFoundError);
    });

    it("throws LegalLiteracyModuleNotFoundError for non-existent module", async () => {
      await expect(service.deleteModule("nope")).rejects.toThrow(LegalLiteracyModuleNotFoundError);
    });
  });

  describe("publishModule", () => {
    it("publishes a module", async () => {
      const created = await service.createModule(buildModuleInput());
      const published = await service.publishModule({ id: created.id });
      expect(published.isPublished).toBeTrue();
    });

    it("throws LegalLiteracyModuleAlreadyPublishedError for already published module", async () => {
      const created = await service.createModule(buildModuleInput());
      await service.publishModule({ id: created.id });
      await expect(service.publishModule({ id: created.id })).rejects.toThrow(LegalLiteracyModuleAlreadyPublishedError);
    });

    it("throws LegalLiteracyModuleNotFoundError for non-existent module", async () => {
      await expect(service.publishModule({ id: "nope" })).rejects.toThrow(LegalLiteracyModuleNotFoundError);
    });
  });

  describe("listModules", () => {
    it("returns paginated list of modules", async () => {
      for (let i = 0; i < 5; i++) {
        await service.createModule(buildModuleInput());
      }
      const { modules, total } = await service.listModules({ page: 1, limit: 3 });
      expect(modules.length).toBe(3);
      expect(total).toBe(5);
    });

    it("filters by category", async () => {
      await service.createModule(buildModuleInput({ category: "civil-rights" }));
      await service.createModule(buildModuleInput({ category: "family-law" }));
      const { modules } = await service.listModules({ category: "civil-rights" as any, page: 1, limit: 10 });
      expect(modules.every((m) => m.category === "civil-rights")).toBeTrue();
    });

    it("filters by isPublished", async () => {
      const m1 = await service.createModule(buildModuleInput());
      await service.publishModule({ id: m1.id });
      await service.createModule(buildModuleInput());
      const { modules } = await service.listModules({ isPublished: true, page: 1, limit: 10 });
      expect(modules.every((m) => m.isPublished)).toBeTrue();
    });
  });
});
