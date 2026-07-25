# Issue 02: Blog Validation Schemas

**Slice**: Blog & Content Platform  
**Priority**: High  
**Status**: Not Started  
**Depends on**: Issue 01 (schema definition for type references)  

---

## Description

Create Zod validation schemas for all Blog & Content Platform inputs. These schemas will be used by both the service layer and API routes for consistent validation.

## Acceptance Criteria

- [ ] `lib/validation/blog.schema.ts` exists with all blog-related schemas
- [ ] `lib/validation/legal-literacy.schema.ts` exists with all literacy schemas
- [ ] All schemas follow existing patterns from `lib/validation/`
- [ ] Schemas are exported for use in services and API layer
- [ ] Validation errors provide clear, user-friendly messages

## Schemas to Create

### Blog Post Schemas

#### createBlogPostSchema
Validates input for creating a new blog post.
```typescript
{
  title: string (1-200 chars)
  slug: string (1-200 chars, URL-safe)
  summary: string (1-500 chars)
  content: string (non-empty MDX)
  categoryId: string (valid category ID)
  featuredImage?: string (valid URL, max 2048 chars)
  metaTitle?: string (max 200 chars)
  metaDescription?: string (max 500 chars)
  status?: 'draft' | 'published' (default: 'draft')
}
```

#### updateBlogPostSchema
Validates input for updating a blog post.
```typescript
{
  id: string (required)
  title?: string (1-200 chars)
  slug?: string (1-200 chars, URL-safe)
  summary?: string (1-500 chars)
  content?: string (non-empty MDX)
  categoryId?: string (valid category ID)
  featuredImage?: string (valid URL, max 2048 chars) | null
  metaTitle?: string (max 200 chars) | null
  metaDescription?: string (max 500 chars) | null
  status?: 'draft' | 'published' | 'archived'
}
```

#### publishBlogPostSchema
Validates input for publishing a blog post.
```typescript
{
  id: string (required)
}
```

### Blog Category Schemas

#### createBlogCategorySchema
```typescript
{
  name: string (1-100 chars)
  slug: string (1-100 chars, URL-safe)
  description?: string (max 500 chars)
  icon?: string (max 50 chars)
  order?: number (>= 0, default: 0)
}
```

#### updateBlogCategorySchema
```typescript
{
  id: string (required)
  name?: string (1-100 chars)
  slug?: string (1-100 chars, URL-safe)
  description?: string (max 500 chars) | null
  icon?: string (max 50 chars) | null
  order?: number (>= 0)
}
```

### Blog Comment Schemas

#### createBlogCommentSchema
```typescript
{
  postId: string (required, valid post ID)
  content: string (1-2000 chars)
  authorName?: string (1-100 chars, required if not authenticated)
  parentId?: string (valid comment ID, for threading)
}
```

#### updateBlogCommentSchema
```typescript
{
  id: string (required)
  content: string (1-2000 chars)
}
```

#### moderateBlogCommentSchema
```typescript
{
  id: string (required)
  action: 'approve' | 'reject' | 'spam' (required)
  reason?: string (max 500 chars, for reject/spam)
}
```

### Legal Literacy Module Schemas

#### createLegalLiteracyModuleSchema
```typescript
{
  title: string (1-200 chars)
  slug: string (1-200 chars, URL-safe)
  description: string (1-500 chars)
  category: LegalLiteracyCategory (predefined enum)
  content: string (non-empty MDX)
  estimatedDuration: number (> 0, minutes)
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  order?: number (>= 0, default: 0)
  isPublished?: boolean (default: false)
}
```

#### updateLegalLiteracyModuleSchema
```typescript
{
  id: string (required)
  title?: string (1-200 chars)
  slug?: string (1-200 chars, URL-safe)
  description?: string (1-500 chars)
  category?: LegalLiteracyCategory
  content?: string (non-empty MDX)
  estimatedDuration?: number (> 0)
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  order?: number (>= 0)
  isPublished?: boolean
}
```

### Legal Literacy Enrollment Schemas

#### enrollInModuleSchema
```typescript
{
  moduleId: string (required, valid module ID)
}
```

#### updateEnrollmentProgressSchema
```typescript
{
  id: string (required)
  progress: number (0-100)
  status?: 'not_started' | 'in_progress' | 'completed'
}
```

#### completeModuleSchema
```typescript
{
  enrollmentId: string (required)
  quizScore?: number (0-100)
}
```

### Query Parameter Schemas

#### blogPostListSchema
For validating query parameters when listing blog posts.
```typescript
{
  page?: number (>= 1, default: 1)
  limit?: number (1-100, default: 10)
  category?: string (valid category slug)
  author?: string (valid author ID)
  search?: string (max 200 chars)
  status?: 'draft' | 'published' | 'archived'
  sortBy?: 'createdAt' | 'publishedAt' | 'title' | 'views'
  sortOrder?: 'asc' | 'desc' (default: 'desc')
}
```

#### blogCommentListSchema
```typescript
{
  page?: number (>= 1, default: 1)
  limit?: number (1-50, default: 10)
  status?: 'pending' | 'approved' | 'rejected' | 'spam'
  sortBy?: 'createdAt'
  sortOrder?: 'asc' | 'desc' (default: 'asc')
}
```

## Notes

- Follow existing patterns from `lib/validation/registration.ts`, `lib/validation/evidence-upload.ts`, etc.
- Use `z.string().min().max()` for length validation
- Use `z.enum()` for enum fields
- Use `z.coerce.number()` or `z.number()` for numeric fields
- Add custom error messages where helpful
- Export schema types for use in services (e.g., `type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>`)
