# Issue 01: Blog Schema and Migrations

**Slice**: Blog & Content Platform  
**Priority**: High  
**Status**: Not Started  
**Depends on**: None  

---

## Description

Create the database schema for the Blog & Content Platform slice, including tables for:
- Blog posts
- Blog categories
- Blog comments
- Legal literacy modules
- Legal literacy enrollments

The schema should follow the existing patterns in `db/schema/` and use Drizzle ORM conventions.

## Acceptance Criteria

- [ ] `db/schema/blog.ts` exists with properly typed tables
- [ ] `db/schema/legal-literacy.ts` exists with properly typed tables
- [ ] All tables follow naming conventions (prefixes: blg_, bct_, bcmt_, llm_, llen_)
- [ ] All foreign key relationships are properly defined
- [ ] Indexes are created for query performance
- [ ] Enums are defined for status fields
- [ ] Schema exports types for use in services
- [ ] Drizzle configuration includes new schema files
- [ ] Migrations are generated and applied

## Tables to Create

### blog_posts
```typescript
- id: text primary key (blg_ prefix)
- slug: text unique
- title: text not null
- summary: text not null
- content: text not null (MDX)
- categoryId: text references blog_categories
- authorId: text references users
- status: enum (draft, published, archived)
- publishedAt: timestamptz nullable
- featuredImage: text nullable
- readingTime: integer (derived, in minutes)
- metaTitle: text nullable
- metaDescription: text nullable
- createdAt: timestamptz not null
- updatedAt: timestamptz not null
```

### blog_categories
```typescript
- id: text primary key (bct_ prefix)
- slug: text unique
- name: text not null
- description: text nullable
- icon: text nullable
- order: integer not null default 0
- createdAt: timestamptz not null
```

### blog_comments
```typescript
- id: text primary key (bcmt_ prefix)
- postId: text references blog_posts
- authorId: text references users nullable
- authorName: text nullable
- content: text not null
- status: enum (pending, approved, rejected, spam)
- parentId: text references blog_comments nullable
- moderatedBy: text references users nullable
- moderatedAt: timestamptz nullable
- moderationReason: text nullable
- createdAt: timestamptz not null
- updatedAt: timestamptz not null
```

### legal_literacy_modules
```typescript
- id: text primary key (llm_ prefix)
- slug: text unique
- title: text not null
- description: text not null
- category: text not null (predefined enum)
- content: text not null (MDX)
- estimatedDuration: integer not null (minutes)
- difficulty: enum (beginner, intermediate, advanced)
- order: integer not null default 0
- isPublished: boolean not null default false
- createdAt: timestamptz not null
- updatedAt: timestamptz not null
```

### legal_literacy_enrollments
```typescript
- id: text primary key (llen_ prefix)
- userId: text references users
- moduleId: text references legal_literacy_modules
- progress: integer not null default 0 (0-100)
- status: enum (not_started, in_progress, completed)
- lastAccessedAt: timestamptz nullable
- completedAt: timestamptz nullable
- quizScore: integer nullable (0-100)
- createdAt: timestamptz not null
```

## Notes

- Follow existing schema patterns from `db/schema/users.ts`, `db/schema/polls.ts`, etc.
- Use `pgTable` for PostgreSQL tables
- Define appropriate indexes for query performance
- Use `timestamp('created_at').defaultNow()` pattern for timestamps
- Define enums as exported constants for reuse
