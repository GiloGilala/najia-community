# Issue 04: Blog Service Tests

**Slice**: Blog & Content Platform  
**Priority**: High  
**Status**: Not Started  
**Depends on**: Issue 01 (schema), Issue 02 (validation), Issue 03 (service)  

---

## Description

Create comprehensive tests for the Blog & Content Platform services. Tests should cover all happy paths, error cases, and edge cases.

## Acceptance Criteria

- [ ] `test/blog.service.posts.test.ts` - Blog post tests
- [ ] `test/blog.service.categories.test.ts` - Blog category tests
- [ ] `test/blog.service.comments.test.ts` - Blog comment tests
- [ ] `test/legal-literacy.service.modules.test.ts` - Legal literacy module tests
- [ ] `test/legal-literacy.service.enrollments.test.ts` - Legal literacy enrollment tests
- [ ] All tests follow existing patterns from `test/auth.service.*`
- [ ] Tests use the test harness and in-memory database
- [ ] Tests achieve > 90% code coverage for blog services

## Test Files

### test/blog.service.posts.test.ts

Test cases for blog post operations:

```typescript
// Setup
- describe("BlogService - Posts", () => {
  let service: BlogService;
  let db: DbClient;
  let clock: TestClock;

  beforeEach(() => {
    // Initialize test harness
    // Create test user with writer role
    // Create test categories
  });

  // createPost
  describe("createPost", () => {
    it("creates a blog post with valid input");
    it("creates a post in draft status by default");
    it("allows writer to specify published status");
    it("calculates reading time from content");
    it("generates a unique slug");
    it("throws ValidationError for invalid input");
    it("throws BlogCategoryNotFoundError for invalid categoryId");
    it("throws DuplicateBlogSlugError for duplicate slug");
  });

  // getPostById
  describe("getPostById", () => {
    it("returns a post by ID");
    it("throws BlogPostNotFoundError for non-existent post");
  });

  // getPostBySlug
  describe("getPostBySlug", () => {
    it("returns a post by slug");
    it("throws BlogPostNotFoundError for non-existent slug");
  });

  // updatePost
  describe("updatePost", () => {
    it("updates post fields");
    it("updates the updatedAt timestamp");
    it("allows changing status to published");
    it("throws BlogPostNotFoundError for non-existent post");
    it("throws DuplicateBlogSlugError when changing to duplicate slug");
  });

  // deletePost
  describe("deletePost", () => {
    it("deletes a post");
    it("throws BlogPostNotFoundError for non-existent post");
  });

  // publishPost
  describe("publishPost", () => {
    it("publishes a draft post");
    it("sets publishedAt to current time");
    it("changes status to published");
    it("throws BlogPostNotFoundError for non-existent post");
    it("throws BlogPostAlreadyPublishedError for already published post");
  });

  // unpublishPost
  describe("unpublishPost", () => {
    it("unpublishes a published post");
    it("changes status to draft");
    it("does not clear publishedAt");
    it("throws BlogPostNotFoundError for non-existent post");
  });

  // listPosts
  describe("listPosts", () => {
    it("returns paginated list of posts");
    it("filters by category");
    it("filters by author");
    it("filters by status");
    it("searches by title and content");
    it("sorts by createdAt");
    it("sorts by publishedAt");
    it("returns total count for pagination");
    it("defaults to published posts only for public");
  });
});
```

### test/blog.service.categories.test.ts

Test cases for blog category operations:

```typescript
describe("BlogService - Categories", () => {
  // createCategory
  describe("createCategory", () => {
    it("creates a category with valid input");
    it("generates a unique slug");
    it("throws ValidationError for invalid input");
    it("throws DuplicateCategorySlugError for duplicate slug");
  });

  // getCategoryById
  describe("getCategoryById", () => {
    it("returns a category by ID");
    it("throws BlogCategoryNotFoundError for non-existent category");
  });

  // getCategoryBySlug
  describe("getCategoryBySlug", () => {
    it("returns a category by slug");
    it("throws BlogCategoryNotFoundError for non-existent slug");
  });

  // updateCategory
  describe("updateCategory", () => {
    it("updates category fields");
    it("throws BlogCategoryNotFoundError for non-existent category");
    it("throws DuplicateCategorySlugError when changing to duplicate slug");
  });

  // deleteCategory
  describe("deleteCategory", () => {
    it("deletes a category");
    it("throws BlogCategoryNotFoundError for non-existent category");
    it("throws BlogCategoryInUseError when category has posts");
  });

  // listCategories
  describe("listCategories", () => {
    it("returns all categories");
    it("returns categories in order");
  });
});
```

### test/blog.service.comments.test.ts

Test cases for blog comment operations:

```typescript
describe("BlogService - Comments", () => {
  // createComment
  describe("createComment", () => {
    it("creates a comment with authenticated user");
    it("creates an anonymous comment with authorName");
    it("creates a threaded comment with parentId");
    it("creates comment with pending status by default");
    it("throws ValidationError for invalid input");
    it("throws BlogPostNotFoundError for invalid postId");
    it("throws BlogCommentParentNotFoundError for invalid parentId");
  });

  // getCommentById
  describe("getCommentById", () => {
    it("returns a comment by ID");
    it("throws BlogCommentNotFoundError for non-existent comment");
  });

  // updateComment
  describe("updateComment", () => {
    it("updates comment content");
    it("throws BlogCommentNotFoundError for non-existent comment");
  });

  // deleteComment
  describe("deleteComment", () => {
    it("deletes a comment");
    it("throws BlogCommentNotFoundError for non-existent comment");
  });

  // listComments
  describe("listComments", () => {
    it("returns paginated list of comments for a post");
    it("filters by status");
    it("includes threaded comments");
    it("returns total count");
  });

  // moderateComment
  describe("moderateComment", () => {
    it("approves a comment");
    it("rejects a comment with reason");
    it("marks a comment as spam");
    it("sets moderatedBy and moderatedAt");
    it("throws BlogCommentNotFoundError for non-existent comment");
  });
});
```

### test/legal-literacy.service.modules.test.ts

Test cases for legal literacy module operations:

```typescript
describe("LegalLiteracyService - Modules", () => {
  // createModule
  describe("createModule", () => {
    it("creates a module with valid input");
    it("creates module as unpublished by default");
    it("throws ValidationError for invalid input");
    it("throws DuplicateModuleSlugError for duplicate slug");
  });

  // getModuleById
  describe("getModuleById", () => {
    it("returns a module by ID");
    it("throws LegalLiteracyModuleNotFoundError for non-existent module");
  });

  // getModuleBySlug
  describe("getModuleBySlug", () => {
    it("returns a module by slug");
    it("throws LegalLiteracyModuleNotFoundError for non-existent slug");
  });

  // updateModule
  describe("updateModule", () => {
    it("updates module fields");
    it("throws LegalLiteracyModuleNotFoundError for non-existent module");
  });

  // deleteModule
  describe("deleteModule", () => {
    it("deletes a module");
    it("throws LegalLiteracyModuleNotFoundError for non-existent module");
  });

  // publishModule
  describe("publishModule", () => {
    it("publishes a module");
    it("sets isPublished to true");
    it("throws LegalLiteracyModuleNotFoundError for non-existent module");
    it("throws LegalLiteracyModuleAlreadyPublishedError for already published module");
  });

  // listModules
  describe("listModules", () => {
    it("returns paginated list of modules");
    it("filters by category");
    it("filters by difficulty");
    it("filters by isPublished");
    it("returns total count");
  });
});
```

### test/legal-literacy.service.enrollments.test.ts

Test cases for legal literacy enrollment operations:

```typescript
describe("LegalLiteracyService - Enrollments", () => {
  // enrollUser
  describe("enrollUser", () => {
    it("creates an enrollment for a user and module");
    it("sets status to not_started");
    it("throws LegalLiteracyModuleNotFoundError for invalid moduleId");
    it("throws AlreadyEnrolledError if user already enrolled");
  });

  // getEnrollmentById
  describe("getEnrollmentById", () => {
    it("returns an enrollment by ID");
    it("throws LegalLiteracyEnrollmentNotFoundError for non-existent enrollment");
  });

  // updateEnrollmentProgress
  describe("updateEnrollmentProgress", () => {
    it("updates progress percentage");
    it("updates status based on progress");
    it("updates lastAccessedAt");
    it("throws LegalLiteracyEnrollmentNotFoundError for non-existent enrollment");
  });

  // completeModule
  describe("completeModule", () => {
    it("marks enrollment as completed");
    it("sets completedAt");
    it("sets quizScore if provided");
    it("sets status to completed");
    it("throws LegalLiteracyEnrollmentNotFoundError for non-existent enrollment");
  });

  // listUserEnrollments
  describe("listUserEnrollments", () => {
    it("returns all enrollments for a user");
    it("returns empty array for user with no enrollments");
  });

  // getUserModuleProgress
  describe("getUserModuleProgress", () => {
    it("returns enrollment if user is enrolled in module");
    it("returns null if user is not enrolled");
  });
});
```

## Test Harness

Use the existing test harness pattern from `test/harness.ts`:

```typescript
// Example test setup
import { createTestHarness } from "../test/harness";

function createBlogTestHarness() {
  const h = createTestHarness();
  
  // Create a writer user
  const writer = h.createUser({ role: 'writer' });
  
  // Create a category
  const category = h.blogService.createCategory({
    name: 'Test Category',
    slug: 'test-category',
  });
  
  return {
    ...h,
    writer,
    category,
  };
}
```

## Test Data Builders

Create helper functions for building test data:

```typescript
// In test helpers or within test files
function buildBlogPost(overrides: Partial<CreateBlogPostInput> = {}): CreateBlogPostInput {
  return {
    title: `Test Post ${Date.now()}`,
    slug: `test-post-${Date.now()}`,
    summary: 'Test summary',
    content: '# Test Content\n\nTest body',
    categoryId: '',
    ...overrides,
  };
}

function buildBlogCategory(overrides: Partial<CreateBlogCategoryInput> = {}): CreateBlogCategoryInput {
  return {
    name: `Test Category ${Date.now()}`,
    slug: `test-category-${Date.now()}`,
    ...overrides,
  };
}
```

## Notes

- Follow existing test patterns from `test/auth.service.registration.test.ts`, etc.
- Use `describe`, `it`, `beforeEach`, `afterEach` appropriately
- Test both happy paths and error cases
- Test edge cases (empty inputs, boundary values, etc.)
- Use the test clock for time-sensitive operations
- Mock external dependencies where needed
- Keep tests focused and fast
