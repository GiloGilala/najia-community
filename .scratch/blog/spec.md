# Blog & Content Platform - Specification

## Overview

The Najia Community Bridge Blog serves as an educational and informational hub for citizens, legal professionals, and civil society. It provides accessible content on civic engagement, legal literacy, and platform updates.

**Status**: NOT YET IMPLEMENTED

**Priority**: High (enables citizen education, builds trust)

**Dependencies**: 
- Existing auth service (for writer authentication)
- Existing RBAC patterns (from architecture docs)
- File storage (for MDX content)

---

## Domain Model

### Blog Post
A single article or guide published on the platform.

**Properties:**
- `id`: Unique identifier (prefix: `blg_`)
- `slug`: URL-friendly unique identifier
- `title`: Post title (max 200 chars)
- `summary`: Short description (max 500 chars)
- `content`: Main content in MDX format
- `categoryId`: Reference to category
- `authorId`: User who created the post
- `status`: `draft` | `published` | `archived`
- `publishedAt`: When the post was published (nullable for drafts)
- `featuredImage`: Optional image URL
- `readingTime`: Estimated minutes to read (derived)
- `metaTitle`: SEO title (optional)
- `metaDescription`: SEO description (optional)
- `createdAt`: When the post was created
- `updatedAt`: When the post was last updated

### Blog Category
Organizes blog posts into topics.

**Properties:**
- `id`: Unique identifier (prefix: `bct_`)
- `slug`: URL-friendly unique identifier
- `name`: Display name
- `description`: Category description
- `icon`: Optional icon identifier
- `order`: Display order (for sorting)
- `createdAt`: When the category was created

### Blog Comment
User comments on blog posts.

**Properties:**
- `id`: Unique identifier (prefix: `bcmt_`)
- `postId`: Reference to blog post
- `authorId`: User who created the comment (nullable for anonymous)
- `authorName`: Display name for anonymous comments
- `content`: Comment text (max 2000 chars)
- `status`: `pending` | `approved` | `rejected` | `spam`
- `parentId`: Reference to parent comment (for threading, nullable)
- `moderatedBy`: User who moderated (nullable)
- `moderatedAt`: When moderated (nullable)
- `moderationReason`: Why comment was rejected (nullable)
- `createdAt`: When the comment was created
- `updatedAt`: When the comment was last updated

### Legal Literacy Module
Structured educational content for legal literacy.

**Properties:**
- `id`: Unique identifier (prefix: `llm_`)
- `slug`: URL-friendly unique identifier
- `title`: Module title
- `description`: Short description
- `category`: Module category (from predefined list)
- `content`: Main educational content in MDX
- `estimatedDuration`: Minutes to complete
- `difficulty`: `beginner` | `intermediate` | `advanced`
- `order`: Display order within category
- `isPublished`: Boolean flag
- `createdAt`: When the module was created
- `updatedAt`: When the module was last updated

### Legal Literacy Enrollment
Tracks user progress through modules.

**Properties:**
- `id`: Unique identifier (prefix: `llen_`)
- `userId`: Reference to user
- `moduleId`: Reference to module
- `progress`: Percentage complete (0-100)
- `status`: `not_started` | `in_progress` | `completed`
- `lastAccessedAt`: When user last accessed
- `completedAt`: When completed (nullable)
- `quizScore`: Score on module quiz (nullable)
- `createdAt`: When enrollment was created

---

## Use Cases

### UC-01: Create Blog Post (Writer)
1. Writer navigates to admin/blog/new
2. System displays blog post form with fields: title, slug, summary, content (MDX), category, featured image
3. Writer fills in details and submits
4. System validates input
5. System saves post with status = `draft`
6. System returns success with post ID

**Permissions**: `blog:create` (writer+ role)

### UC-02: Publish Blog Post (Moderator)
1. Moderator navigates to admin/blog
2. System displays list of draft posts
3. Moderator selects a post and clicks "Publish"
4. System validates post is complete (has title, content, category)
5. System updates status to `published` and sets `publishedAt`
6. System clears blog cache
7. System returns success

**Permissions**: `blog:publish` (moderator+ role)

### UC-03: View Blog Post (Public)
1. User navigates to /blog/:slug
2. System looks up post by slug
3. System increments view count (if tracking enabled)
4. System renders post with MDX content
5. System displays related posts, author info, comments

**Permissions**: Public (no auth required)

### UC-04: List Blog Posts (Public)
1. User navigates to /blog
2. System queries published posts
3. System applies filters (category, author, date range, search)
4. System applies pagination
5. System returns list with metadata

**Permissions**: Public

### UC-05: Submit Comment (Authenticated)
1. User views a blog post
2. User fills in comment form (content, optional name if anonymous)
3. User submits comment
4. System validates comment
5. System creates comment with status = `pending` (if moderation enabled) or `approved`
6. System returns success

**Permissions**: `blog:comment` (citizen+ role)

### UC-06: Moderate Comment (Moderator)
1. Moderator navigates to admin/moderation
2. System displays pending comments
3. Moderator reviews comment and selects action (approve, reject, mark as spam)
4. System updates comment status
5. System records moderation action
6. System optionally notifies user

**Permissions**: `admin:moderation` (moderator+ role)

### UC-07: Manage Categories (Moderator)
1. Moderator navigates to admin/blog/categories
2. System displays category list
3. Moderator can create, update, delete, reorder categories
4. System validates changes
5. System persists changes

**Permissions**: `admin:blog` (moderator+ role)

### UC-08: Create Legal Literacy Module (Writer)
1. Writer navigates to admin/literacy/new
2. System displays module form
3. Writer fills in details and submits
4. System validates and saves module with isPublished = false
5. System returns success

**Permissions**: `literacy:create` (writer+ role)

### UC-09: Enroll in Legal Literacy Module (Citizen)
1. Citizen browses legal literacy modules
2. Citizen clicks "Start Module" on a module
3. System creates enrollment record with status = `not_started`
4. System redirects to module content

**Permissions**: `literacy:enroll` (citizen+ role)

### UC-10: Track Module Progress (Citizen)
1. Citizen accesses enrolled module
2. System updates lastAccessedAt
3. System can update progress based on content consumed
4. Citizen can mark module as complete
5. System updates status and completedAt

**Permissions**: `literacy:progress` (citizen, own enrollment)

---

## API Endpoints

### Blog Posts
- `GET /api/blog` - List posts (public)
- `GET /api/blog/:slug` - Get single post (public)
- `POST /api/blog` - Create post (writer+)
- `PUT /api/blog/:id` - Update post (writer+ own, moderator+ all)
- `DELETE /api/blog/:id` - Delete post (moderator+)
- `POST /api/blog/:id/publish` - Publish post (moderator+)
- `POST /api/blog/:id/unpublish` - Unpublish post (moderator+)

### Blog Categories
- `GET /api/blog/categories` - List categories (public)
- `POST /api/blog/categories` - Create category (moderator+)
- `PUT /api/blog/categories/:id` - Update category (moderator+)
- `DELETE /api/blog/categories/:id` - Delete category (moderator+)

### Blog Comments
- `GET /api/blog/:postId/comments` - List comments (public)
- `POST /api/blog/:postId/comments` - Create comment (authenticated)
- `PUT /api/blog/comments/:id` - Update comment (author or moderator+)
- `DELETE /api/blog/comments/:id` - Delete comment (author or moderator+)
- `POST /api/blog/comments/:id/approve` - Approve comment (moderator+)
- `POST /api/blog/comments/:id/reject` - Reject comment (moderator+)

### Legal Literacy Modules
- `GET /api/legal-literacy` - List modules (public)
- `GET /api/legal-literacy/:slug` - Get single module (public)
- `POST /api/legal-literacy` - Create module (writer+)
- `PUT /api/legal-literacy/:id` - Update module (writer+ own, moderator+ all)
- `DELETE /api/legal-literacy/:id` - Delete module (moderator+)
- `POST /api/legal-literacy/:id/publish` - Publish module (moderator+)

### Legal Literacy Enrollments
- `GET /api/legal-literacy/enrollments` - List user's enrollments (authenticated)
- `POST /api/legal-literacy/:moduleId/enroll` - Enroll in module (authenticated)
- `PUT /api/legal-literacy/enrollments/:id` - Update progress (authenticated, own)

---

## Validation Rules

### Blog Post
- `title`: Required, 1-200 characters
- `slug`: Required, URL-safe, unique, 1-200 characters
- `summary`: Required, 1-500 characters
- `content`: Required, non-empty MDX
- `categoryId`: Required, must reference existing category
- `status`: Required, must be one of: draft, published, archived
- `featuredImage`: Optional, valid URL, max 2048 characters

### Blog Category
- `name`: Required, 1-100 characters
- `slug`: Required, URL-safe, unique, 1-100 characters
- `description`: Optional, max 500 characters
- `order`: Required, integer >= 0

### Blog Comment
- `content`: Required, 1-2000 characters
- `authorName`: Required if authorId is null (anonymous), 1-100 characters
- `parentId`: Optional, must reference existing comment

### Legal Literacy Module
- `title`: Required, 1-200 characters
- `slug`: Required, URL-safe, unique, 1-200 characters
- `description`: Required, 1-500 characters
- `category`: Required, must be one of predefined categories
- `content`: Required, non-empty MDX
- `estimatedDuration`: Required, integer > 0
- `difficulty`: Required, one of: beginner, intermediate, advanced

---

## Predefined Categories

Based on platform documentation (§7.3):

1. **Civic Engagement** - How to participate in governance, understanding polls
2. **Know Your Rights** - Legal rights explained in plain language
3. **Legal Guide** - Step-by-step guides for common legal issues
4. **Platform How-To** - Tutorials on using Najia Community Bridge
5. **Community Voices** - Stories from citizens using the platform
6. **Policy Watch** - Analysis of government policies
7. **Lawyer Insights** - Professional legal perspectives
8. **Transparency Reports** - Platform activity and impact data

---

## Predefined Legal Literacy Module Categories

Based on platform documentation (§7.6.2):

1. **Introduction to Law** - What is law? Sources of law in Nigeria
2. **Civil Rights** - Constitutional rights, human rights
3. **Landlord-Tenant Law** - Rights and responsibilities, dispute resolution
4. **Consumer Protection** - Consumer rights, complaint process
5. **Employment Law** - Employee rights, workplace disputes
6. **Family Law** - Marriage, divorce, child custody
7. **Criminal Law Basics** - Understanding criminal procedure
8. **Alternative Dispute Resolution** - Mediation, arbitration

---

## Cache Strategy

| Data | Cache Key | TTL | Invalidation Triggers |
|------|-----------|-----|---------------------|
| Blog post | `blog:post:{slug}` | 1 hour | Post updated, deleted, published |
| Blog list | `blog:list:{filtersHash}` | 5 minutes | New post, post updated/deleted |
| Category list | `blog:categories` | 1 hour | Category CRUD |
| Comments | `blog:comments:{postId}` | 5 minutes | New comment, comment moderated |
| Legal literacy modules | `literacy:modules` | 1 hour | Module CRUD |
| User enrollments | `literacy:enrollments:{userId}` | 1 hour | Enrollment changes |

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /api/blog | 5 | 1 hour |
| POST /api/blog/:id/publish | 10 | 1 hour |
| POST /api/blog/:postId/comments | 10 | 1 minute |
| POST /api/legal-literacy | 5 | 1 hour |
| POST /api/legal-literacy/:moduleId/enroll | 20 | 1 minute |

---

## RBAC Permissions

| Resource | Citizen | Lawyer | Writer | Moderator | Admin |
|----------|---------|--------|--------|-----------|-------|
| blog:read | ✅ | ✅ | ✅ | ✅ | ✅ |
| blog:create | ❌ | ❌ | ✅ | ✅ | ✅ |
| blog:update | ❌ | ❌ | ✅ own | ✅ all | ✅ all |
| blog:delete | ❌ | ❌ | ❌ | ✅ | ✅ |
| blog:publish | ❌ | ❌ | ❌ | ✅ | ✅ |
| blog:comment | ✅ | ✅ | ✅ | ✅ | ✅ |
| blog:moderate | ❌ | ❌ | ❌ | ✅ | ✅ |
| literacy:read | ✅ | ✅ | ✅ | ✅ | ✅ |
| literacy:create | ❌ | ❌ | ✅ | ✅ | ✅ |
| literacy:update | ❌ | ❌ | ✅ own | ✅ all | ✅ all |
| literacy:delete | ❌ | ❌ | ❌ | ✅ | ✅ |
| literacy:enroll | ✅ | ✅ | ✅ | ✅ | ✅ |
| literacy:progress | ✅ own | ✅ own | ✅ own | ✅ all | ✅ all |

---

## Database Schema (Reference)

See implementation in `db/schema/blog.ts` and `db/schema/legal-literacy.ts`

---

## Implementation Tickets

See `.scratch/blog/issues/` directory for individual implementation tickets.
