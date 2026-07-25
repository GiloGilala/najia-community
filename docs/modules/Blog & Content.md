# Module Spec — Blog & Content

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Engineering Lead*
*Reviewers: Product Lead, Design Lead, Legal Director, Content Lead, Moderation Lead*
*Parent PRD: [PRD.md §4.6](../product/PRD.md#46-blog-and-legal-literacy)*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Module scope: blog post lifecycle (MDX-backed), legal literacy module lifecycle, editorial pipeline (writer → fact-check → legal review → publish), comment moderation via the UGC queue, content categories, content search, newsletter signup, legal literacy progress tracking. Out of scope: comments on legal literacy modules, video content (deferred to Year 2), podcast content (not in charter), multi-language content (deferred to Year 2).

---

## 1. Overview

### 1.2 Module Name

Blog & Content

### 1.2 Purpose

Provide the educational content layer of the platform: blog posts (civic engagement, legal guides, community stories) and legal literacy modules (structured courses on legal topics). The module is the platform's commitment to legal literacy and civic education, and is the only place where the platform produces original content (rather than facilitating user actions). The module's primary design constraints are: (1) **editorial quality** — every piece of content goes through a four-step review pipeline; (2) **writer/moderator separation** — writers create, moderators publish; (3) **legal accuracy** — legal content is reviewed by a qualified reviewer; (4) **accessibility** — content is readable, screen-reader friendly, and works on low-bandwidth connections.

### 1.3 In Scope

- Blog post lifecycle (DRAFT → IN_FACT_CHECK → IN_LEGAL_REVIEW → APPROVED → PUBLISHED → ARCHIVED)
- Legal literacy module lifecycle (same states as blog posts)
- Editorial pipeline with four-step review (writer drafts → fact-checker reviews → legal reviewer reviews → moderator publishes)
- Content categorization (8 categories for blog, 8 modules for legal literacy)
- Author profiles (writer role)
- Content search (basic full-text search in the pilot)
- Newsletter signup (basic email collection)
- Comments on blog posts (with UGC moderation)
- Legal literacy enrollment and progress tracking
- Legal literacy quizzes (with score tracking)
- Content analytics (views, reads, completion rates)
- Content SEO (meta tags, Open Graph)
- MDX-based content authoring
- Content revision history (every version preserved)

### 1.4 Out of Scope

- **Comments on legal literacy modules** — modules are educational, not conversational. Comments would dilute the focus.
- **Video content** — deferred to Year 2. The platform is text-and-image in the pilot.
- **Podcast content** — not in the platform's charter.
- **Multi-language content** — English only in the pilot. The data model supports translations but the UI does not.
- **User-generated blog posts** — only the writer role can create content. User submissions (e.g., "Community Voices") are handled by a writer interviewing the user and writing the post.
- **Live blogs or real-time updates** — content is published as a finished artifact.
- **Content paywall or premium content** — all content is free in the pilot.
- **Author monetization** — writers are staff or contracted; the platform does not pay per view.
- **Co-authoring or collaborative editing** — one author per piece in the pilot. Collaborative editing is Year 2.
- **AI-generated content** — content is human-written. AI may be used as a writing aid, but the final content is human-authored and human-reviewed.

### 1.5 Success Metrics

| Metric | Target (pilot end) | Measurement method |
|--------|---------------------|---------------------|
| Blog articles published | ≥ 50 | Count |
| Legal literacy modules published | ≥ 8 (all planned modules) | Count |
| Blog article engagement rate | ≥ 30% (readers who read > 50% of the article) | Analytics |
| Legal literacy module completion rate | ≥ 40% (enrolled users who complete) | Analytics |
| Average blog read time | ≥ 3 minutes | Analytics |
| Average quiz score | ≥ 70% | Analytics |
| Content pipeline SLA | 100% of content through all 4 review steps within 14 days | Editorial metrics |
| Comments moderation SLA | 95% within 24 hours | Moderation metrics |
| Newsletter subscribers | ≥ 1,000 | Count |
| Search query success rate | ≥ 60% (searches that lead to a click) | Analytics |

---

## 2. User Stories

| As a... | I want to... | So that... | Priority |
|---------|--------------|------------|----------|
| Writer | Create a blog post draft | I can contribute content | Must |
| Writer | Save a draft and return to it | I don't lose my work | Must |
| Writer | Submit a draft for fact-check | The editorial pipeline starts | Must |
| Writer | See the status of my drafts | I know where each is in the pipeline | Must |
| Writer | Update a draft after reviewer feedback | I can address feedback | Must |
| Fact-checker | Review a draft for factual accuracy | I can ensure correctness | Must |
| Legal reviewer | Review legal content for accuracy | I can ensure legal correctness | Must |
| Moderator (Blog Editor) | Approve and publish content | The content goes live | Must |
| Moderator (Blog Editor) | Unpublish or archive content | I can correct issues | Must |
| Visitor | Read blog posts | I can learn and engage | Must |
| Visitor | Comment on blog posts | I can engage with the community | Must |
| Visitor | Search for content | I can find what I need | Must |
| Visitor | Subscribe to the newsletter | I get updates | Should |
| User | Enroll in a legal literacy module | I can track my progress | Must |
| User | See my progress in a module | I know what I've completed | Must |
| User | Take a quiz at the end of a module | I can test my knowledge | Must |
| Admin | View content pipeline metrics | I can monitor editorial health | Must |
| Admin | View content analytics | I can understand what works | Should |

---

## 3. Functional Specification

### 3.1 Data Model

Reference [ARCHITECTURE.md §8.1.1](../ARCHITECTURE.md#81-schema-design). Key entities:

| Entity | Key fields | Notes |
|--------|------------|-------|
| `blog_posts` | `id`, `slug` (URL-safe), `title`, `summary`, `content_mdx` (MDX source), `content_html` (compiled HTML), `category_id`, `author_id`, `status` (DRAFT / IN_FACT_CHECK / IN_LEGAL_REVIEW / APPROVED / PUBLISHED / ARCHIVED), `published_at`, `archived_at`, `meta_description`, `meta_image_url`, `reading_time_minutes`, `created_at`, `updated_at` | A blog post |
| `blog_post_revisions` | `id`, `post_id`, `version_number`, `content_mdx` (the MDX at this version), `author_id`, `change_summary`, `created_at` | Every version is preserved |
| `blog_post_review_steps` | `id`, `post_id`, `step` (FACT_CHECK / LEGAL_REVIEW / FINAL_APPROVAL), `reviewer_id`, `status` (PENDING / APPROVED / CHANGES_REQUESTED / REJECTED), `notes`, `reviewed_at` | The four-step editorial pipeline |
| `blog_categories` | `id`, `slug`, `name`, `description`, `display_order` | The 8 blog categories (from [PLATFORM.md §7.3](../PLATFORM.md#73-content-categories)) |
| `blog_comments` | `id`, `post_id`, `user_id`, `parent_comment_id` (for replies, nullable), `content` (≤ 2000 chars), `status` (PENDING / APPROVED / REMOVED), `created_at`, `moderated_at`, `moderated_by` | Comments (feed into UGC moderation queue) |
| `legal_literacy_modules` | `id`, `slug`, `title`, `summary`, `content_mdx`, `content_html`, `category` (one of 8), `estimated_minutes`, `status` (same as blog posts), `published_at`, `meta_description`, `quiz_questions` (JSON), `passing_score` (default 70%) | A legal literacy module |
| `legal_literacy_enrollments` | `id`, `user_id`, `module_id`, `enrolled_at`, `completed_at` (nullable), `last_accessed_at` | Per-user enrollment |
| `legal_literacy_progress` | `id`, `enrollment_id`, `section_id`, `completed_at` | Per-section progress |
| `legal_literacy_quiz_attempts` | `id`, `enrollment_id`, `attempted_at`, `score` (percentage), `answers` (JSON), `passed` (boolean) | Quiz attempts |
| `newsletter_subscribers` | `id`, `email`, `subscribed_at`, `unsubscribed_at`, `confirmation_token`, `confirmed_at` | Newsletter list (basic; not a full email marketing system) |
| `content_analytics` | `id`, `content_type` (BLOG_POST / LEGAL_LITERACY_MODULE), `content_id`, `views`, `read_completions`, `avg_read_time_seconds`, `date` | Daily rollup |

#### 3.1.1 The Editorial Pipeline State Machine

Blog posts and legal literacy modules share the same lifecycle:
DRAFT
│ author submits
▼
IN_FACT_CHECK
│ fact-checker approves │ fact-checker requests changes
▼ ▼
IN_LEGAL_REVIEW DRAFT (back to author)
│ legal reviewer approves │ legal reviewer requests changes
▼ ▼
APPROVED DRAFT (back to author)
│ moderator publishes │ legal reviewer rejects
▼ ▼
PUBLISHED REJECTED (terminal for this draft; can start a new draft)
│ moderator archives / unpublishes
▼
ARCHIVED

text


The four steps are: (1) author drafts, (2) fact-check, (3) legal review, (4) final approval and publish. Every step is documented with the reviewer and notes. The author can update the draft at any point before APPROVED.

#### 3.1.2 Comments and UGC Moderation

Comments on blog posts go through the standard UGC moderation queue. The flow:

1. User submits a comment
2. Comment is enqueued with queue_type = UGC_COMMENT
3. A moderator reviews via the standard Moderation UI
4. The comment is approved, removed, or the user is warned
5. The user is notified of the decision

Comments are not visible until approved. This is the platform's commitment to safe discourse (per [PLATFORM.md §7.5.3](../PLATFORM.md#753-comment-moderation)).

#### 3.1.3 Legal Literacy Quizzes

Each legal literacy module ends with a quiz. The quiz:

- Has 5–10 questions
- Questions are multiple choice or true/false
- Each question has a correct answer and an explanation
- The user can take the quiz unlimited times
- The user's best score is recorded
- A passing score (default 70%) marks the module as completed
- The user can see the correct answers and explanations after each attempt

The quiz is for self-assessment, not certification. The platform does not issue formal certificates in the pilot (Year 2 feature).

### 3.2 API Surface

Reference [API.md](../technical/API.md). The endpoints this module owns:

| Method | Path | Purpose | Auth | RBAC |
|--------|------|---------|------|------|
| `GET` | `/api/blog/posts` | List published blog posts (filterable by category) | Public | — |
| `GET` | `/api/blog/posts/:slug` | Get a published blog post | Public | — |
| `GET` | `/api/blog/posts/:slug/comments` | List approved comments | Public | — |
| `POST` | `/api/blog/posts/:slug/comments` | Submit a comment | Authenticated | `blog:comment` |
| `GET` | `/api/blog/categories` | List blog categories | Public | — |
| `GET` | `/api/blog/search` | Search blog posts | Public | — |
| `POST` | `/api/newsletter/subscribe` | Subscribe to the newsletter | Public | — |
| `POST` | `/api/newsletter/confirm` | Confirm a newsletter subscription | Public | — |
| `POST` | `/api/newsletter/unsubscribe` | Unsubscribe | Public | — |
| `GET` | `/api/legal-literacy/modules` | List published modules | Public | — |
| `GET` | `/api/legal-literacy/modules/:slug` | Get a module | Public | — |
| `POST` | `/api/legal-literacy/modules/:slug/enroll` | Enroll in a module | Authenticated | `literacy:enroll` |
| `GET` | `/api/legal-literacy/modules/:slug/progress` | Get the user's progress | Authenticated | `literacy:progress` (self) |
| `POST` | `/api/legal-literacy/modules/:slug/progress` | Update progress (mark a section complete) | Authenticated | `literacy:progress` (self) |
| `POST` | `/api/legal-literacy/modules/:slug/quiz` | Submit a quiz attempt | Authenticated | `literacy:quiz` (self) |
| `GET` | `/api/legal-literacy/me/enrollments` | List the user's enrollments | Authenticated | `literacy:progress` (self) |
| `POST` | `/api/admin/blog/posts` | Create a new blog post (writer+) | Authenticated | `blog:create` |
| `PUT` | `/api/admin/blog/posts/:postId` | Update a blog post (writer+, only when DRAFT or CHANGES_REQUESTED) | Authenticated | `blog:update` |
| `POST` | `/api/admin/blog/posts/:postId/submit` | Submit a draft for the next review step | Authenticated | `blog:update` (author) |
| `POST` | `/api/admin/blog/posts/:postId/review` | Review at a step (fact-checker, legal reviewer, moderator) | Authenticated | step-specific permission |
| `POST` | `/api/admin/blog/posts/:postId/publish` | Publish an approved post | Authenticated | `blog:publish` |
| `POST` | `/api/admin/blog/posts/:postId/archive` | Archive a published post | Authenticated | `blog:publish` |
| `GET` | `/api/admin/blog/dashboard` | Writer's dashboard (my drafts, my review queue) | Authenticated | `blog:read` |
| `GET` | `/api/admin/blog/pipeline-metrics` | Editorial pipeline metrics | Authenticated | `admin:system` |
| (similar set for legal literacy modules) | | | | |

#### 3.2.1 Server Functions (Web App)

| Server Function | Purpose |
|-----------------|---------|
| `blogPostLoader` | Load a blog post for display |
| `blogListLoader` | Load the blog list (paginated, filterable) |
| `submitCommentAction` | Submit a comment |
| `enrollModuleAction` | Enroll in a legal literacy module |
| `updateProgressAction` | Update progress |
| `submitQuizAction` | Submit a quiz attempt |
| `writerDashboardLoader` | Load the writer's dashboard |
| `reviewPostAction` | Review at a step |
| `publishPostAction` | Publish an approved post |

### 3.3 Business Rules

1. **Only the `writer` role can create blog posts and legal literacy modules.** Citizens, lawyers, and other roles cannot create content directly.
2. **Every blog post and legal literacy module goes through the four-step pipeline:** draft → fact-check → legal review → publish. No shortcuts.
3. **The author cannot review their own post at any step.** Self-review is forbidden.
4. **Fact-checkers are a specific sub-role of the `moderator` role** (defined per [PLATFORM.md §8.4](../PLATFORM.md#84-moderator-roles)). The Content Lead is typically the fact-checker.
5. **Legal reviewers are a specific sub-role.** The Legal Director or a designated legal professional is the legal reviewer.
6. **The final approval and publish is by the Blog Editor sub-role** of the `moderator` role.
7. **A post can be unpublished (moved to ARCHIVED) at any time after publication.** Archiving is a soft-delete; the post is hidden from the public but preserved in the system.
8. **Comments are moderated via the UGC queue.** No comment is visible until approved.
9. **Comments are not allowed on legal literacy modules** (out of scope; see §1.4).
10. **Newsletter signup requires email confirmation** (double opt-in). This is the platform's commitment to not adding people to lists they didn't sign up for.
11. **Legal literacy enrollment is per-user, per-module.** A user can be enrolled in multiple modules. Re-enrolling in a completed module resets the progress.
12. **Quiz attempts are unlimited.** The user's best score is what counts.
13. **Content is searchable by title, summary, and content.** Full-text search in the pilot (Postgres `tsvector` or similar).
14. **All content is accessible (WCAG 2.1 AA).** The MDX-to-HTML compilation must produce accessible output.
15. **All state changes are audit-logged.** Every review action, every publish, every archive.
16. **Content revisions are preserved forever.** Every version of every post is retained.

### 3.4 Edge Cases and Error Handling

| Scenario | Expected Behavior | Error Code |
|----------|-------------------|------------|
| Writer tries to publish their own post directly | "You cannot publish your own post. The post must go through the review pipeline." | `SELF_PUBLISH_DENIED` (403) |
| Reviewer tries to review at a step they're not assigned to | "This review step is assigned to [role]." | `WRONG_REVIEWER` (403) |
| Author tries to edit a post that's IN_FACT_CHECK | "This post is under review. You cannot edit it until the reviewer requests changes." | `EDIT_DENIED_UNDER_REVIEW` (409) |
| Comment submitted by unverified user | "You need to verify your identity to comment. [CTA: Verify now]" | `VERIFICATION_REQUIRED` (403) |
| Comment text > 2000 characters | "Comments are limited to 2000 characters." | `COMMENT_TOO_LONG` (422) |
| Comment contains a URL to malicious site | Caught by the moderation queue; moderator removes | (Moderation) |
| Newsletter email already subscribed | "You're already subscribed. [View preferences]" | `ALREADY_SUBSCRIBED` (409) |
| Newsletter confirmation token expired | "This confirmation link has expired. Please subscribe again." | `CONFIRMATION_EXPIRED` (422) |
| Quiz submission with missing answers | "Please answer all questions before submitting." | `QUIZ_INCOMPLETE` (422) |
| Quiz submission with answers not in the allowed set | "Invalid answer format." | `QUIZ_INVALID_FORMAT` (422) |
| User tries to access another user's progress | "You cannot access another user's progress." | `PERMISSION_DENIED` (403) |
| Search query with no results | "No results found for '[query]'. Try a different search term." | (Not an error) |
| Content not yet published, accessed by slug | "This content is not yet published." | `NOT_PUBLISHED` (404) |
| Slug collision (two posts with the same slug) | "This URL is already in use. Please choose a different slug." | `SLUG_COLLISION` (409) |
| MDX compilation fails (invalid syntax) | "The content has a syntax error. Please fix it and try again." | `MDX_COMPILATION_FAILED` (422) |
| Image referenced in MDX doesn't exist | "The image '[path]' is not available. Please upload it or remove the reference." | `IMAGE_NOT_FOUND` (422) |
| Legal literacy module quiz is updated after users have attempted it | Existing attempts are preserved; new attempts use the new questions. Historical scores remain valid. | — |

---

## 4. Permissions

Reference [RBAC.md](../technical/RBAC.md). This module requires:

| Permission | Roles | Notes |
|------------|-------|-------|
| `blog:read` | public (anonymous) | Anyone can read published blog posts |
| `blog:read:category` | public | Anyone can browse by category |
| `blog:comment` | `citizen`, `lawyer`, `writer`, `moderator`, `admin` (verified) | Any verified user can comment |
| `blog:create` | `writer`, `moderator`, `admin` | Writers create blog posts |
| `blog:update` | `writer` (own drafts), `moderator` (all, with care) | Authors update their own drafts; moderators can edit with documentation |
| `blog:fact-check` | `moderator` (with `content_moderator` or `blog_editor` sub-role) | Fact-checkers review at the fact-check step |
| `blog:legal-review` | `moderator` (with `blog_editor` sub-role, designated as legal reviewer) | Legal reviewers review at the legal review step |
| `blog:publish` | `moderator` (with `blog_editor` sub-role) | Blog editors publish approved posts |
| `blog:archive` | `moderator` (with `blog_editor` sub-role), `admin` | Archive published posts |
| `blog:delete` | `admin` | Hard delete (rare; usually archive is enough) |
| `literacy:read` | public (anonymous) | Anyone can read published modules |
| `literacy:enroll` | `citizen`, `lawyer`, `writer`, `moderator`, `admin` (verified) | Any verified user can enroll |
| `literacy:progress` | authenticated (self only) | The user can read and update their own progress |
| `literacy:quiz` | authenticated (self only) | The user can take quizzes |
| `literacy:create` | `writer`, `moderator`, `admin` | Writers create modules |
| `literacy:update` | `writer` (own drafts) | Authors update their own drafts |
| `literacy:publish` | `moderator` (with `blog_editor` sub-role) | Blog editors publish approved modules |
| `admin:system` | `admin` | Access to pipeline metrics |

---

## 5. User Experience

### 5.1 Key Screens

The blog and content UI is the public-facing read experience plus the writer's editorial dashboard. The screens this module owns:

| Screen # | Name | Persona | Login | Verified |
|----------|------|---------|-------|----------|
| 35 | Blog home | All | No | No |
| 36 | Blog category | All | No | No |
| 37 | Blog post | All | No | No |
| 38 | Legal literacy module home | All | No | No |
| 39 | Legal literacy module detail | All | No | No |
| 40 | Legal literacy quiz | All | Yes | No (but recommended) |
| (admin) | Writer dashboard | Writer | Yes | Yes (staff) |
| (admin) | Editorial review | Moderator (Blog Editor) | Yes | Yes (staff) |

### 5.2 The Public Reading Experience

The blog post reading experience is designed for focus and retention:

- **Clean layout:** Single column, generous spacing, no distracting sidebars
- **Reading time and progress:** Shown at the top; updates as the user scrolls
- **Table of contents:** Auto-generated from headings, for long posts
- **Text-to-speech:** Browser-native support for accessibility
- **Share buttons:** Standard social share (X, Facebook, LinkedIn, WhatsApp)
- **Related posts:** Based on category
- **Comments at the bottom:** Threaded, moderated

### 5.3 The Legal Literacy Experience

The legal literacy module experience is structured for learning:

- **Sectioned content:** Each module is divided into 3–6 sections
- **Progress tracking:** "Section 2 of 5" indicator
- **Mark as complete:** The user marks each section as complete to track progress
- **Quiz at the end:** After all sections are complete, the quiz is available
- **Quiz feedback:** After each attempt, the user sees the correct answers and explanations
- **Completion certificate (Y2):** Out of scope for pilot

### 5.4 The Writer's Dashboard

The writer's dashboard is the editorial workspace:

- **My drafts:** List of posts in progress, with status
- **My review queue:** Posts I'm assigned to review (for fact-checkers, legal reviewers, Blog Editors)
- **Recently published:** Posts I've authored that are now live
- **Analytics:** Views, read time, completion rates
MY DRAFTS
| Title | Category | Status | Last Updated | Action |
| "How to Vote in Policy Polls" | Civic Engagement | DRAFT | 2 days ago | Continue |
| "Understanding Your Rights as a Tenant" | Know Your Rights | IN_LEGAL_REVIEW | 1 week ago | View |

MY REVIEW QUEUE
| Title | Author | Step | Waiting Since | Action |
| "Guide to Mediation" | [author] | FACT_CHECK | 1 day | Review |
| "Consumer Rights in Nigeria" | [author] | LEGAL_REVIEW | 2 days | Review |
| "Policy Analysis: Health Reform" | [author] | FINAL_APPROVAL | 3 days | Review |

text


### 5.5 The Review Experience

The review experience is consistent across the three review steps (fact-check, legal review, final approval):

- **The post content** (rendered MDX, exactly as a reader will see it)
- **The post metadata** (title, summary, category, author)
- **The revision history** (every version, with change summaries)
- **The review form:** Approve / Request Changes / Reject, with notes
- **The previous reviewer's notes** (visible to the current reviewer)
- **The moderation policy** (always one click away)

### 5.6 The Comment Experience

Comments are simple but moderated:

- **Inline comment form** at the bottom of each post
- **Threaded replies** (one level deep)
- **Moderation notice:** "Your comment is being reviewed. It will appear once approved."
- **No edit after submission** (out of scope; Year 2)

### 5.7 Accessibility

Same standards as other modules. The reading experience is especially important:

- **WCAG 2.1 AA** compliance for all published content
- **Text-to-speech** support (browser-native)
- **Adjustable text size** (browser-native)
- **Captions for any video** (deferred to Y2)
- **Alt text required** for all images in MDX (the editor enforces this)

### 5.8 The Kemi Test (Module-Specific)

Beyond the general design principles:

> **Would Kemi (as Blog Editor) be able to (1) find posts in the review queue, (2) review them efficiently, and (3) publish or request changes with clear documentation?**

If the answer to any of these is "no" — the design is not ready. The editorial pipeline depends on the Blog Editor's ability to move content through efficiently.

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Blog list P95 | < 300ms |
| **Performance** | Blog post load P95 | < 500ms |
| **Performance** | MDX compilation (per post) | < 500ms (cached after first compile) |
| **Performance** | Search query P95 | < 500ms |
| **Performance** | Comment submission P95 | < 300ms |
| **Performance** | Module load P95 | < 500ms |
| **Security** | All API endpoints over TLS 1.3 | Yes |
| **Security** | All connections over WireGuard | Yes |
| **Security** | Comment submission is rate-limited | 5 comments per user per hour |
| **Security** | Newsletter signup is rate-limited | 3 signups per email per hour |
| **Security** | MDX compilation is sandboxed (no arbitrary code execution) | Yes (use a vetted MDX compiler) |
| **Privacy** | NDPR compliance | Full |
| **Privacy** | Newsletter email is not shared with third parties | Yes |
| **Privacy** | Quiz attempts are visible only to the user | Yes |
| **Reliability** | Content pipeline SLA | 100% through 4 steps within 14 days |
| **Reliability** | Comments moderation SLA | 95% within 24 hours |
| **Reliability** | Blog uptime | ≥ 99.5% |
| **Observability** | Every content state change logged | Yes |
| **Observability** | Every review action logged | Yes |
| **Observability** | Pipeline metrics dashboard | Yes |
| **Observability** | Search analytics | Yes |

---

## 7. Dependencies

| Depends On | Type | Notes |
|------------|------|-------|
| Authentication & Identity Verification module | Internal | Writers, moderators, and commenters must be verified |
| RBAC module | Internal | Permission checks with sub-role support |
| Audit log module | Internal | All content state changes |
| Moderation module | Internal (downstream) | Consumes the UGC_COMMENT queue |
| Cache layer (SQLite) | Internal | Compiled MDX cache, search results cache |
| Notification service | Internal | Notify author of review decisions; notify subscribers of new content |
| Email service | External | Newsletter delivery (basic; not a full email marketing system) |
| Postgres + Drizzle ORM | Internal | Primary database |
| MDX compiler | External (npm) | For compiling MDX to HTML |

The MDX compiler is a critical dependency. The pilot uses a vetted MDX compiler with sandboxed execution. Custom components in MDX are limited to a known set (defined in `lib/mdx/components.ts`) to prevent arbitrary code execution.

---

## 8. Acceptance Criteria

Testable checklist. Every item must be verifiable before the pilot launches.

### 8.1 Blog Post Lifecycle

- [ ] A writer can create a blog post draft
- [ ] A draft can be saved and resumed
- [ ] A draft can be submitted for fact-check
- [ ] A fact-checker can approve or request changes
- [ ] An approved draft moves to legal review
- [ ] A legal reviewer can approve, request changes, or reject
- [ ] An approved post can be published by a Blog Editor
- [ ] A published post is visible on the blog
- [ ] A published post can be archived
- [ ] An archived post is hidden from the public but preserved in the system
- [ ] Every version is preserved in the revision history

### 8.2 Legal Literacy Module Lifecycle

- [ ] A writer can create a legal literacy module
- [ ] The module goes through the same four-step pipeline
- [ ] The module has sections, progress tracking, and a quiz
- [ ] The quiz has 5–10 questions with correct answers and explanations
- [ ] The user's best score is recorded
- [ ] A passing score (default 70%) marks the module as complete

### 8.3 Editorial Pipeline

- [ ] The four steps are enforced (no shortcuts)
- [ ] The author cannot review their own post
- [ ] Each step is documented with reviewer and notes
- [ ] The pipeline SLA is 14 days
- [ ] 100% of content meets the SLA

### 8.4 Comments

- [ ] A verified user can comment on a blog post
- [ ] An unverified user cannot comment
- [ ] Comments are moderated via the UGC queue
- [ ] Approved comments are visible
- [ ] Removed comments are not visible
- [ ] Comments are threaded (one level deep)
- [ ] Comments cannot be edited after submission

### 8.5 Newsletter

- [ ] A user can subscribe to the newsletter
- [ ] Email confirmation is required (double opt-in)
- [ ] A confirmed subscriber receives updates
- [ ] A user can unsubscribe
- [ ] The email is not shared with third parties

### 8.6 Search

- [ ] Search returns results by title, summary, and content
- [ ] Search is fast (< 500ms P95)
- [ ] Empty results are handled gracefully
- [ ] Search analytics are recorded

### 8.7 Legal Literacy Progress

- [ ] A user can enroll in a module
- [ ] The user can mark sections as complete
- [ ] Progress is saved and visible
- [ ] The user can take the quiz unlimited times
- [ ] The best score is recorded
- [ ] The user can see correct answers and explanations

### 8.8 RBAC and Roles

- [ ] The `writer` role can create drafts
- [ ] The `content_moderator` and `blog_editor` sub-roles can fact-check
- [ ] The `blog_editor` sub-role can do legal review (designated)
- [ ] The `blog_editor` sub-role can publish
- [ ] Authors cannot self-review
- [ ] RBAC conditions are enforced at the API

### 8.9 Security

- [ ] All API endpoints over TLS 1.3
- [ ] All connections over WireGuard
- [ ] Comment rate limit: 5 per user per hour
- [ ] Newsletter signup rate limit: 3 per email per hour
- [ ] MDX compilation is sandboxed
- [ ] No arbitrary code execution via MDX

### 8.10 Operational

- [ ] Health check includes blog service status
- [ ] Pipeline metrics dashboard available
- [ ] Search analytics available
- [ ] Runbook exists for "MDX compilation failure" (fall back to last cached version, alert)
- [ ] Runbook exists for "comment moderation backlog" (add staff, communicate)

---

## 9. Test Plan Summary

Reference [QA.md](../technical/QA.md) (forthcoming). This module's test focus:

### 9.1 Unit Tests

- `blog.service.ts` — post lifecycle, state transitions
- `literacy.service.ts` — module lifecycle, progress, quiz
- `editorial.pipeline.ts` — the four-step pipeline
- `mdx.compiler.ts` — MDX compilation, sandboxing
- `search.service.ts` — full-text search
- `newsletter.service.ts` — subscribe, confirm, unsubscribe

Coverage target: ≥ 85% on all services.

### 9.2 Integration Tests

- Full editorial flow: draft → fact-check → legal review → publish
- Author cannot self-review (verify at the API)
- Comment submitted → moderated → approved → visible
- Comment submitted → moderated → removed → not visible
- Newsletter signup → confirmation → unsubscription
- Legal literacy enrollment → progress → quiz → completion
- Search query with results and without results
- MDX compilation with valid and invalid syntax
- Image reference in MDX (existing and missing)

### 9.3 E2E Tests

- Full blog reading experience
- Full legal literacy learning experience
- Full editorial workflow from writer's perspective
- Full review workflow from moderator's perspective
- Full comment moderation flow

### 9.4 Manual Tests (during pilot)

- Real content with real writers and reviewers
- Real legal literacy modules
- Real comments with real moderation
- Edge case: a content piece that requires all three rounds of changes
- Edge case: a legal literacy module that needs to be updated after launch

### 9.5 Security Tests (required)

- **Penetration test:** Attempt to inject code via MDX. Must fail (sandboxed).
- **Penetration test:** Attempt to access another user's quiz progress. Must fail.
- **Code review:** Every change to the MDX compiler or the editorial pipeline is reviewed by the Engineering Lead AND the Legal Director.

### 9.6 The "Negative Test" Rule

For every "user can do X" test, there must be a matching "user cannot do X" test. For this module, the negative tests are especially important for:
- A writer cannot publish their own post
- A reviewer cannot review their own post
- A user cannot access another user's progress
- A user cannot comment without verification
- An author cannot edit a post under review

---

## 10. Rollout Plan

### 10.1 Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `blog.module.enabled` | true | Disable the entire module |
| `blog.comments.enabled` | true | Disable commenting (rare; for moderation hold) |
| `blog.search.enabled` | true | Disable search |
| `blog.newsletter.enabled` | true | Disable newsletter signup |
| `literacy.module.enabled` | true | Disable legal literacy modules |
| `literacy.quiz.enabled` | true | Disable the quiz (rare) |

### 10.2 Migration (if applicable)

Not applicable — greenfield module.

### 10.3 Rollback Plan

- **MDX compilation failure:** Fall back to the last cached compiled version. Alert the engineering team. The author is notified to fix the content.
- **Comment moderation backlog:** Add staff. The 24-hour SLA may slip temporarily; users are notified.
- **Search performance issue:** Fall back to a simpler search (title and summary only). The full-content search is re-enabled when performance is restored.
- **Newsletter delivery failure:** Pause newsletter sends. Investigate. Re-enable when delivery is restored.

---

## 11. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | What is the right fact-checker staffing? | Content Lead | Open — depends on volume |
| 2 | Should legal literacy modules have a "skip to quiz" option, or must the user complete all sections? | Product Lead | Open — recommend no skip in pilot |
| 3 | Should comments be allowed on legal literacy modules? (Current spec: no.) | Product Lead | Open — recommend no |
| 4 | What is the right passing score for quizzes? (70% is the spec.) | Content Lead | Open — needs user research |
| 5 | Should we issue completion certificates? (Current spec: no, deferred to Y2.) | Product Lead | Open — recommend Y2 |
| 6 | How do we handle MDX components that need to be added (e.g., a new chart type)? | Engineering Lead | Open — component registry proposed |
| 7 | Should the newsletter have segmentation? (Current spec: no, basic only.) | Product Lead | Open — recommend Y2 |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md). Decisions that affect the editorial policy require Content Lead sign-off; decisions that affect legal content require Legal Director sign-off.

---

## Appendix A: Glossary
- **MDX** — Markdown with JSX (a content format that supports React components)
- **NDPR** — Nigeria Data Protection Regulation
- **PII** — Personally Identifiable Information
- **RBAC** — Role-Based Access Control
- **SEO** — Search Engine Optimization
- **SLA** — Service Level Agreement
- **UGC** — User-Generated Content
- **WCAG** — Web Content Accessibility Guidelines

## Appendix B: References
- [PRD.md §4.6 — Blog and Legal Literacy](../product/PRD.md#46-blog-and-legal-literacy)
- [PLATFORM.md §7 — Blog & Content Platform](../PLATFORM.md#7-blog--content-platform)
- [PLATFORM.md §7.3 — Content Categories](../PLATFORM.md#73-content-categories)
- [PLATFORM.md §7.5 — Blog Editorial Guidelines](../PLATFORM.md#75-blog-editorial-guidelines)
- [PLATFORM.md §7.6 — Legal Literacy Modules](../PLATFORM.md#76-legal-literacy-modules)
- [Personas.md §3.4 — Kemi](../product/Personas.md#34-kemi--the-moderator) (Blog Editor sub-role)
- [modules/Moderation.md](./Moderation.md) — consumes the UGC_COMMENT queue
- [ARCHITECTURE.md §3.2.3 — API Routes with RBAC Requirements](../ARCHITECTURE.md#323-api-routes-with-rbac-requirements)
- [RBAC.md](../technical/RBAC.md) (forthcoming in Phase 4)
- [Decision Log](../business/Decision%20Log.md)

## Appendix C: Module Spec Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Engineering Lead | Initial draft. Covers blog posts, legal literacy modules, the four-step editorial pipeline, comment moderation via the UGC queue, newsletter signup, search, and quiz/progress tracking. 16 business rules, 17 edge cases, 50+ acceptance criteria. The four-step pipeline and the writer/moderator separation are the most important design decisions and reflect the platform's commitment to legal accuracy. |