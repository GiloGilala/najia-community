# Issue 03: Blog Service

**Slice**: Blog & Content Platform  
**Priority**: High  
**Status**: Not Started  
**Depends on**: Issue 01 (schema), Issue 02 (validation)  

---

## Description

Create the blog service with all business logic for managing blog posts, categories, and comments. This service will be the single source of truth for all blog-related operations.

## Acceptance Criteria

- [ ] `services/blog.service.ts` exists with complete implementation
- [ ] `services/legal-literacy.service.ts` exists with complete implementation
- [ ] All service methods follow existing patterns from `services/auth.service.ts`, `services/poll.service.ts`
- [ ] Service uses dependency injection pattern
- [ ] Service properly validates all inputs
- [ ] Service handles errors appropriately (throws typed errors)
- [ ] Service respects RBAC permissions (enforced at API layer, but service is aware)
- [ ] Service includes comprehensive JSDoc comments

## Service Interface: BlogService

```typescript
interface BlogService {
  // Blog Posts
  createPost(input: CreateBlogPostInput): Promise<BlogPostRow>;
  getPostById(id: string): Promise<BlogPostRow>;
  getPostBySlug(slug: string): Promise<BlogPostRow>;
  updatePost(input: UpdateBlogPostInput): Promise<BlogPostRow>;
  deletePost(id: string): Promise<void>;
  publishPost(id: string): Promise<BlogPostRow>;
  unpublishPost(id: string): Promise<BlogPostRow>;
  listPosts(params: BlogPostListParams): Promise<{ posts: BlogPostRow[]; total: number }>;
  
  // Blog Categories
  createCategory(input: CreateBlogCategoryInput): Promise<BlogCategoryRow>;
  getCategoryById(id: string): Promise<BlogCategoryRow>;
  getCategoryBySlug(slug: string): Promise<BlogCategoryRow>;
  updateCategory(input: UpdateBlogCategoryInput): Promise<BlogCategoryRow>;
  deleteCategory(id: string): Promise<void>;
  listCategories(): Promise<BlogCategoryRow[]>;
  
  // Blog Comments
  createComment(input: CreateBlogCommentInput): Promise<BlogCommentRow>;
  getCommentById(id: string): Promise<BlogCommentRow>;
  updateComment(input: UpdateBlogCommentInput): Promise<BlogCommentRow>;
  deleteComment(id: string): Promise<void>;
  listComments(params: BlogCommentListParams): Promise<{ comments: BlogCommentRow[]; total: number }>;
  moderateComment(input: ModerateBlogCommentInput): Promise<BlogCommentRow>;
  
  // Analytics
  incrementViewCount(postId: string): Promise<void>;
  getPostViews(postId: string): Promise<number>;
}
```

## Service Interface: LegalLiteracyService

```typescript
interface LegalLiteracyService {
  // Modules
  createModule(input: CreateLegalLiteracyModuleInput): Promise<LegalLiteracyModuleRow>;
  getModuleById(id: string): Promise<LegalLiteracyModuleRow>;
  getModuleBySlug(slug: string): Promise<LegalLiteracyModuleRow>;
  updateModule(input: UpdateLegalLiteracyModuleInput): Promise<LegalLiteracyModuleRow>;
  deleteModule(id: string): Promise<void>;
  publishModule(id: string): Promise<LegalLiteracyModuleRow>;
  unpublishModule(id: string): Promise<LegalLiteracyModuleRow>;
  listModules(params: LegalLiteracyModuleListParams): Promise<{ modules: LegalLiteracyModuleRow[]; total: number }>;
  
  // Enrollments
  enrollUser(input: EnrollInModuleInput): Promise<LegalLiteracyEnrollmentRow>;
  getEnrollmentById(id: string): Promise<LegalLiteracyEnrollmentRow>;
  updateEnrollmentProgress(input: UpdateEnrollmentProgressInput): Promise<LegalLiteracyEnrollmentRow>;
  completeModule(input: CompleteModuleInput): Promise<LegalLiteracyEnrollmentRow>;
  listUserEnrollments(userId: string): Promise<LegalLiteracyEnrollmentRow[]>;
  getUserModuleProgress(userId: string, moduleId: string): Promise<LegalLiteracyEnrollmentRow | null>;
  
  // Analytics
  getModuleEnrollmentCount(moduleId: string): Promise<number>;
  getModuleCompletionRate(moduleId: string): Promise<number>;
}
```

## Custom Errors

Create typed errors for blog-specific failure modes:

```typescript
// Blog Errors
export class BlogPostNotFoundError extends Error { ... }
export class BlogPostAlreadyPublishedError extends Error { ... }
export class BlogCategoryNotFoundError extends Error { ... }
export class BlogCategoryInUseError extends Error { ... }  // Cannot delete if posts exist
export class BlogCommentNotFoundError extends Error { ... }
export class BlogCommentParentNotFoundError extends Error { ... }
export class DuplicateBlogSlugError extends Error { ... }
export class DuplicateCategorySlugError extends Error { ... }

// Legal Literacy Errors
export class LegalLiteracyModuleNotFoundError extends Error { ... }
export class LegalLiteracyModuleAlreadyPublishedError extends Error { ... }
export class LegalLiteracyEnrollmentNotFoundError extends Error { ... }
export class DuplicateModuleSlugError extends Error { ... }
export class AlreadyEnrolledError extends Error { ... }
export class ModuleNotEnrolledError extends Error { ... }
```

## Service Dependencies

```typescript
interface BlogServiceDeps {
  db: DbClient;
  clock: Clock;
  // Optional: for sending notifications on comment moderation
  notifier?: Notifier;
}

interface LegalLiteracyServiceDeps {
  db: DbClient;
  clock: Clock;
}
```

## Helper Functions

The service should include helper functions for:

1. **Slug generation**: Convert title to URL-friendly slug
2. **Reading time calculation**: Estimate reading time from MDX content
3. **Content sanitization**: Basic sanitization of MDX content
4. **Pagination**: Reusable pagination logic
5. **Text search**: Simple full-text search for blog posts

## Notes

- Follow the dependency injection pattern from `services/auth.service.ts`
- Use `createBlogService(deps: BlogServiceDeps): BlogService` pattern
- All async methods should properly handle database errors
- Include comprehensive JSDoc comments for all public methods
- Use the validation schemas from Issue 02
- Return proper types (BlogPostRow, etc.) from schema
- Throw typed errors for domain-specific failures
- Use the clock dependency for all date/time operations (testability)
