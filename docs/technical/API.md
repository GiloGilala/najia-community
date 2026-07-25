# API Documentation

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Engineering Lead*
*Reviewers: Product Lead, Mobile Lead, Integration Partners*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Consolidates all endpoints from the module specs into a single reference. This document is the contract; the module specs are the detailed design.

> **How to read this document:** This is the **developer-facing reference** for the Najia Community Bridge API. It consolidates all endpoints from the module specs into a single, searchable document. For the detailed design (business rules, edge cases, state machines), see the individual module specs. For the architectural context, see [ARCHITECTURE.md](../ARCHITECTURE.md).

> **Related documents:**
> - [ARCHITECTURE.md §3.2](../ARCHITECTURE.md#32-api-layer--hono) — API layer overview
> - [ARCHITECTURE.md §13](../ARCHITECTURE.md#13-api-documentation) — API documentation conventions
> - [ARCHITECTURE.md §15](../ARCHITECTURE.md#15-error-handling) — error response format
> - [Module Specs](../modules/) — detailed design per module
> - [RBAC.md](./RBAC.md) — permission reference

---

## 1. Overview

### 1.1 Base URL

| Environment | URL |
|-------------|-----|
| Production | `https://api.najiacommunitybridge.com` |
| Staging | `https://api.staging.najiacommunitybridge.com` |
| Development | `http://localhost:3000` |

All endpoints are prefixed with `/api`.

### 1.2 Versioning

The API is versioned via URL prefix. The current version is implicit (no prefix). Breaking changes will introduce `/v2/`, etc. Non-breaking changes are added to the current version.

### 1.3 Content Type

All requests and responses use `application/json` unless otherwise specified. File uploads use `multipart/form-data`.

### 1.4 Authentication

Most endpoints require authentication via a JWT bearer token. The token is obtained from `/api/auth/login` and is sent in the `Authorization` header:
Authorization: Bearer <jwt_token>

text


The token expires after 7 days of inactivity (sliding window). The mobile app refreshes the token automatically.

### 1.5 Response Format

All responses follow the format defined in [ARCHITECTURE.md §13.1](../ARCHITECTURE.md#131-response-format):

**Success:**
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2026-07-20T10:30:00.000Z",
    "requestId": "req_abc123",
    "cache": "HIT"  // or "MISS" or absent
  }
}
Error:

JSON

{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { /* error-specific context */ }
  },
  "meta": {
    "timestamp": "2026-07-20T10:30:00.000Z",
    "requestId": "req_abc123"
  }
}
1.6 Pagination
List endpoints use cursor-based pagination:

JSON

{
  "success": true,
  "data": {
    "items": [ /* items */ ],
    "nextCursor": "eyJpZCI6IjEyMyJ9",  // opaque cursor for next page; null if no more
    "hasMore": true
  }
}
Query parameters:

cursor — the cursor from the previous response
limit — page size (default 20, max 100)
1.7 Filtering and Sorting
List endpoints support filtering and sorting via query parameters:

filter[field]=value — filter by a field
sort=field or sort=-field — sort by a field (prefix - for descending)
search=query — full-text search (where applicable)
1.8 Rate Limiting
All endpoints are rate-limited. Rate limit information is returned in response headers:

Header	Description
X-RateLimit-Limit	Maximum requests allowed in window
X-RateLimit-Remaining	Requests remaining in window
X-RateLimit-Reset	Time when window resets (Unix timestamp)
Retry-After	Seconds until next request allowed (on 429 responses)
Default rate limits per category are in ARCHITECTURE.md §7.1.2.

1.9 Caching
GET requests may be cached. Cache information is returned in response headers:

Header	Description
X-Cache	HIT or MISS
X-Cache-Key	Cache key used for lookup
X-Cache-TTL	Time-to-live remaining in seconds
Cache-Control	Standard HTTP cache headers
1.10 Error Codes
Standard error codes are defined in ARCHITECTURE.md §13.1.4. Module-specific codes are defined in each module spec.

2. Authentication
Reference: modules/Authentication & Identity Verification.md

2.1 Endpoints
Method	Path	Auth	RBAC	Description
POST	/api/auth/register	Public	—	Create an unverified account
POST	/api/auth/login	Public	—	Log in
POST	/api/auth/logout	Required	—	Log out of current session
POST	/api/auth/verify-email	Required	—	Verify email ownership
POST	/api/auth/verify-nin	Required	—	Submit NIN for NIMC NVS verification
POST	/api/auth/verify-document	Required	—	Submit ID + selfie for Onfido verification
GET	/api/auth/me	Required	—	Get current user
GET	/api/auth/verification-status	Required	—	Get detailed verification status
POST	/api/auth/appeal-verification	Required	—	Appeal a failed verification
POST	/api/auth/dsar	Required	—	Request a data export
POST	/api/auth/delete-account	Required	—	Request account deletion
POST	/api/auth/refresh	Required	—	Refresh the JWT token
2.2 Examples
Register:

http

POST /api/auth/register
Content-Type: application/json

{
  "email": "amara@example.com",
  "password": "securePassword123!",
  "fullName": "Amara Okafor"
}
Response (201):

JSON

{
  "success": true,
  "data": {
    "user": {
      "id": "usr_9f2a",
      "email": "amara@example.com",
      "fullName": "Amara Okafor",
      "verificationStatus": "UNVERIFIED",
      "role": "citizen"
    },
    "verificationEmailSent": true
  }
}
Login:

http

POST /api/auth/login
Content-Type: application/json

{
  "email": "amara@example.com",
  "password": "securePassword123!"
}
Response (200):

JSON

{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2026-07-27T10:30:00.000Z"
  }
}
Verify NIN:

http

POST /api/auth/verify-nin
Authorization: Bearer <token>
Content-Type: application/json

{
  "nin": "12345678901",
  "dateOfBirth": "1995-03-15",
  "fullName": "Amara Okafor"
}
Response (200):

JSON

{
  "success": true,
  "data": {
    "verificationStatus": "VERIFIED",
    "verifiedAt": "2026-07-20T10:30:00.000Z",
    "cacheExpiresAt": "2026-08-19T10:30:00.000Z"
  }
}
Error response (422 — no match):

JSON

{
  "success": false,
  "error": {
    "code": "NIMC_NO_MATCH",
    "message": "We couldn't match your details. Check your NIN, date of birth, and name, or use a document instead."
  }
}
3. Policy Polls
Reference: modules/Policy Polls.md

3.1 Public Endpoints
Method	Path	Auth	Description
GET	/api/polls	Public	List polls (filterable by status, jurisdiction)
GET	/api/polls/:pollId	Public	Get poll detail
GET	/api/polls/:pollId/results	Public	Get aggregated results (only after close)
3.2 Authenticated Endpoints
Method	Path	Auth	RBAC	Description
POST	/api/polls/:pollId/vote	Required	polls:vote	Cast a vote
GET	/api/polls/:pollId/my-vote	Required	polls:vote	Get current user's selection
POST	/api/polls/suggest-topic	Required	polls:suggest	Suggest a poll topic
GET	/api/polls/my-suggestions	Required	polls:suggest	List the current user's suggestions
3.3 Admin Endpoints
Method	Path	Auth	RBAC	Description
POST	/api/admin/polls	Required	admin:polls	Create a poll draft
PUT	/api/admin/polls/:pollId	Required	admin:polls	Edit a poll (only when DRAFT)
POST	/api/admin/polls/:pollId/submit-for-review	Required	admin:polls	Submit draft for AB review
POST	/api/admin/polls/:pollId/publish	Required	admin:polls	Publish an approved poll
POST	/api/admin/polls/:pollId/close	Required	admin:polls	Close an active poll (emergency only)
GET	/api/admin/polls/review-queue	Required	admin:polls or advisory:review	Get polls awaiting AB review
POST	/api/admin/polls/:pollId/review	Required	advisory:review	AB action (approve/reject/request changes)
GET	/api/admin/poll-suggestions	Required	admin:polls	Get citizen-suggested topics
3.4 Examples
List active polls:

http

GET /api/polls?filter[status]=ACTIVE&filter[jurisdiction]=lagos&sort=-startDate&limit=20
Response (200):

JSON

{
  "success": true,
  "data": {
    "items": [
      {
        "id": "pll_44",
        "title": "Should Lagos invest in more bus rapid transit?",
        "summary": "The state government is considering...",
        "jurisdiction": "lagos",
        "status": "ACTIVE",
        "startDate": "2026-07-15T00:00:00.000Z",
        "endDate": "2026-07-22T00:00:00.000Z",
        "nonBindingDisclaimer": "This is citizen sentiment only. It has no legal or electoral weight."
      }
    ],
    "nextCursor": null,
    "hasMore": false
  }
}
Cast a vote:

http

POST /api/polls/pll_44/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "optionId": "opt_yes"
}
Response (201):

JSON

{
  "success": true,
  "data": {
    "voteRecorded": true,
    "selectedOption": "opt_yes",
    "anonymous": true,
    "message": "Your vote has been recorded anonymously. Only you know how you voted."
  }
}
Get results (after close):

http

GET /api/polls/pll_44/results
Response (200):

JSON

{
  "success": true,
  "data": {
    "pollId": "pll_44",
    "totalVotes": 1247,
    "results": [
      { "optionId": "opt_yes", "label": "Yes", "percentage": 62, "confidenceInterval": 95, "count": 773 },
      { "optionId": "opt_no", "label": "No", "percentage": 32, "confidenceInterval": 95, "count": 399 },
      { "optionId": "opt_unsure", "label": "Unsure", "percentage": 6, "confidenceInterval": 95, "count": 75 }
    ],
    "trend": null,
    "computedAt": "2026-07-22T00:00:00.000Z",
    "nonBindingDisclaimer": "This is citizen sentiment only. It has no legal or electoral weight."
  }
}
4. Confidence Votes
Reference: modules/Confidence Votes.md

4.1 Public Endpoints
Method	Path	Description
GET	/api/officials	List officials (filterable by role, jurisdiction)
GET	/api/officials/:officialId	Get official profile
GET	/api/officials/:officialId/history	Get all past results for an official
GET	/api/confidence/current-window	Get the current window info
GET	/api/confidence/windows	List all windows (past, current, future)
GET	/api/confidence/windows/:windowId	Get window detail
GET	/api/confidence/windows/:windowId/results	Get aggregated results (only after close)
4.2 Authenticated Endpoints
Method	Path	RBAC	Description
POST	/api/confidence/windows/:windowId/officials/:officialId/vote	confidence:vote	Cast a vote
GET	/api/confidence/windows/:windowId/officials/:officialId/my-vote	confidence:vote	Get current user's selection
4.3 Admin Endpoints
Method	Path	RBAC	Description
POST	/api/admin/officials	admin:officials	Add an official
PUT	/api/admin/officials/:officialId	admin:officials	Update an official
POST	/api/admin/confidence/windows/:windowId/open	admin:officials	Open a window early (emergency)
POST	/api/admin/confidence/windows/:windowId/close	admin:officials	Close a window early (emergency)
5. Evidence
Reference: modules/Evidence Upload & Integrity.md

5.1 Authenticated Endpoints
Method	Path	RBAC	Description
POST	/api/evidence/upload	evidence:create	Upload a new evidence file
GET	/api/evidence	evidence:read (own)	List the current user's evidence
GET	/api/evidence/:evidenceId	evidence:read	Get evidence detail
GET	/api/evidence/:evidenceId/download	evidence:read	Download the file
POST	/api/evidence/:evidenceId/share	evidence:read + evidence:update	Share a file with a case or lawyer
PUT	/api/evidence/:evidenceId	evidence:update (own)	Update description, tags, case association
POST	/api/evidence/:evidenceId/appeal	evidence:appeal (own)	Appeal a moderator decision
DELETE	/api/evidence/:evidenceId	evidence:delete (own)	Delete (soft delete) the file
GET	/api/evidence/:evidenceId/integrity-log	evidence:read (own)	Get the integrity audit log
POST	/api/evidence/:evidenceId/reanalyze	evidence:update (own)	Re-run AI detection (rate-limited)
5.2 Admin Endpoints
Method	Path	RBAC	Description
POST	/api/admin/evidence/review	admin:moderation	Review a High AI flag
GET	/api/admin/evidence/review-queue	admin:moderation	Get the review queue
GET	/api/admin/evidence/pipeline-metrics	admin:system	Get AI detection pipeline metrics
5.3 Examples
Upload evidence:

http

POST /api/evidence/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data; boundary=----FormBoundary

------FormBoundary
Content-Disposition: form-data; name="file"; filename="screenshot.png"
Content-Type: image/png

<binary data>
------FormBoundary
Content-Disposition: form-data; name="caseId"

cse_abc123
------FormBoundary
Content-Disposition: form-data; name="description"

WhatsApp conversation showing landlord agreeing to return deposit
------FormBoundary--
Response (201):

JSON

{
  "success": true,
  "data": {
    "evidence": {
      "id": "evd_xyz",
      "filename": "screenshot.png",
      "mimeType": "image/png",
      "fileSize": 245678,
      "sha256Hash": "9e107d9d372bb6826bd81d3542a419d6...",
      "uploadedAt": "2026-07-20T10:30:00.000Z",
      "status": "ACTIVE",
      "integrityStatus": "VERIFIED",
      "aiDetection": {
        "status": "LOW",
        "confidence": 0.12,
        "category": "LOW",
        "modelVersion": "ensemble-v1.2.0",
        "message": "This file was not flagged for AI manipulation. This is an automated check, not a definitive verdict."
      },
      "caseId": "cse_abc123",
      "description": "WhatsApp conversation showing landlord agreeing to return deposit"
    }
  }
}
6. Lawyers
Reference: modules/Lawyer Onboarding & Verification.md, modules/Lawyer Matching & Consultation.md, modules/Lawyer Reviews.md

6.1 Public Endpoints
Method	Path	Description
GET	/api/lawyers	List lawyers (filterable)
GET	/api/lawyers/:lawyerId	Get a lawyer's public profile
GET	/api/lawyers/:lawyerId/reviews	List approved reviews for a lawyer
6.2 Lawyer Endpoints (Self)
Method	Path	RBAC	Description
POST	/api/lawyers/register	lawyer:register	Start lawyer registration
POST	/api/lawyers/me/bar-license	lawyer:register	Submit bar license details
GET	/api/lawyers/me/verification-status	lawyer:read (self)	Get verification status
PUT	/api/lawyers/me/profile	lawyer:update (self)	Update the lawyer profile
POST	/api/lawyers/me/profile/submit-for-review	lawyer:update (self)	Submit for moderator review
GET	/api/lawyers/me/subscription	lawyer:read (self)	Get subscription status
POST	/api/lawyers/me/subscription/subscribe	lawyer:update (self)	Subscribe to a tier
POST	/api/lawyers/me/subscription/cancel	lawyer:update (self)	Cancel subscription
GET	/api/lawyers/me/matches	lawyer:match (self)	List pending matches
POST	/api/matches/:matchId/accept	lawyer:match (self)	Accept a match
POST	/api/matches/:matchId/decline	lawyer:match (self)	Decline a match
GET	/api/lawyers/me/availability	lawyer:read (self)	Get availability
PUT	/api/lawyers/me/availability	lawyer:update (self)	Set availability
GET	/api/lawyers/me/reviews	lawyer:read (self)	List all reviews of self
6.3 Lawyer Response to Reviews
Method	Path	RBAC	Description
POST	/api/reviews/:reviewId/respond	review:respond	Lawyer responds to a review
PUT	/api/reviews/:reviewId/respond	review:respond	Update a response (within 30 days)
6.4 Admin Endpoints
Method	Path	RBAC	Description
GET	/api/admin/lawyers/bar-verification-queue	admin:lawyers	Get bar verification queue
POST	/api/admin/lawyers/:lawyerId/verify-bar	admin:lawyers	Approve or reject bar verification
POST	/api/admin/lawyers/:lawyerId/review-profile	admin:lawyers	Approve or reject profile
POST	/api/admin/lawyers/:lawyerId/suspend	admin:users	Suspend a lawyer
POST	/api/admin/lawyers/:lawyerId/restore	admin:users	Restore a suspended lawyer
POST	/api/admin/lawyers/:lawyerId/override-subscription	admin:system	Override subscription status
GET	/api/admin/lawyers/revenue	admin:system	Get financial summary
6.5 Webhook
Method	Path	Auth	Description
POST	/api/webhooks/paystack	Webhook (signature verified)	Paystack subscription events
7. Cases and Consultations
Reference: modules/Lawyer Matching & Consultation.md

7.1 Authenticated Endpoints (Citizen)
Method	Path	RBAC	Description
POST	/api/cases	cases:create	Create a case
GET	/api/cases	cases:read (own)	List the current user's cases
GET	/api/cases/:caseId	cases:read	Get case detail
POST	/api/cases/:caseId/match	cases:update (own)	Run the matching algorithm
GET	/api/cases/:caseId/matches	cases:read	Get match results
POST	/api/cases/:caseId/matches/:matchId/select	cases:update (own)	Select a lawyer from matches
POST	/api/cases/:caseId/withdraw	cases:update (own)	Withdraw the case
POST	/api/consultations	cases:update (own)	Schedule a consultation
GET	/api/consultations/:consultationId	cases:read (participant)	Get consultation detail
POST	/api/consultations/:consultationId/start	cases:read (participant)	Join the consultation
POST	/api/consultations/:consultationId/end	cases:read (participant)	End the consultation
POST	/api/consultations/:consultationId/rate	cases:update (own)	Rate the matching quality
7.2 Admin Endpoints
Method	Path	RBAC	Description
POST	/api/admin/consultations/:consultationId/refund	admin:system	Refund a no-show consultation
POST	/api/admin/matches/:matchId/override	admin:system	Override a match (rare)
GET	/api/admin/marketplace-metrics	admin:system	Get marketplace metrics
7.3 Examples
Create a case:

http

POST /api/cases
Authorization: Bearer <token>
Content-Type: application/json

{
  "caseType": "landlord-tenant",
  "jurisdiction": "lagos",
  "budgetMin": 50000,
  "budgetMax": 100000,
  "urgency": "within-a-month",
  "description": "My landlord is refusing to return my deposit after I moved out..."
}
Response (201):

JSON

{
  "success": true,
  "data": {
    "case": {
      "id": "cse_abc123",
      "caseType": "landlord-tenant",
      "jurisdiction": "lagos",
      "budgetMin": 50000,
      "budgetMax": 100000,
      "urgency": "within-a-month",
      "status": "INTAKE_SUBMITTED",
      "createdAt": "2026-07-20T10:30:00.000Z"
    }
  }
}
Run matching:

http

POST /api/cases/cse_abc123/match
Authorization: Bearer <token>
Response (200):

JSON

{
  "success": true,
  "data": {
    "matches": [
      {
        "lawyerId": "lwr_xyz",
        "lawyerName": "Ngozi Adeyemi",
        "lawyerPhoto": "https://...",
        "practiceAreas": ["landlord-tenant", "consumer-protection"],
        "jurisdictions": ["lagos"],
        "rating": 4.8,
        "reviewCount": 23,
        "matchScore": 95,
        "scoreBreakdown": {
          "practiceArea": 40,
          "jurisdiction": 30,
          "availability": 8,
          "budgetAlignment": 7,
          "rating": 5,
          "experience": 3,
          "language": 5,
          "location": 2,
          "activeMatchLoad": -2
        },
        "nextAvailableSlot": "2026-07-21T14:00:00.000Z"
      }
    ]
  }
}
8. Reviews
Reference: modules/Lawyer Reviews.md

8.1 Authenticated Endpoints
Method	Path	RBAC	Description
GET	/api/consultations/:consultationId/review-prompt	cases:read (participant)	Get post-consultation prompt status
POST	/api/consultations/:consultationId/confirm-engagement	cases:update (own)	Confirm engagement
POST	/api/consultations/:consultationId/decline-engagement	cases:update (own)	Decline (no engagement)
GET	/api/reviews/drafts/:consultationId	cases:read (own)	Get a draft review
POST	/api/reviews	review:create	Submit a new review
GET	/api/reviews/:reviewId	review:read	Get a review
PUT	/api/reviews/:reviewId	review:update (own, DRAFT)	Update a draft review
POST	/api/reviews/:reviewId/submit	review:update (own)	Submit draft for moderation
POST	/api/reviews/:reviewId/appeal	review:appeal (own)	Appeal a removed review
9. Moderation
Reference: modules/Moderation.md

9.1 Admin Endpoints (Moderator)
Method	Path	RBAC	Description
GET	/api/admin/moderation/queue	admin:moderation	Get the unified queue (filterable)
GET	/api/admin/moderation/queue/:itemId	admin:moderation	Get queue item detail
POST	/api/admin/moderation/queue/:itemId/assign	admin:moderation	Assign to current moderator
POST	/api/admin/moderation/queue/:itemId/decide	queue-type-specific	Make a moderation decision
GET	/api/admin/moderation/decisions	admin:moderation	List recent decisions
GET	/api/admin/moderation/appeals	admin:moderation (senior)	List pending appeals
POST	/api/admin/moderation/appeals/:appealId/decide	admin:moderation (senior)	Decide an appeal
POST	/api/admin/moderation/appeals/:appealId/escalate	admin:moderation (senior)	Escalate to Grievance Committee
GET	/api/admin/moderation/grievance-queue	admin:grievance	List GC reviews
POST	/api/admin/moderation/grievance/:reviewId/decide	admin:grievance	Decide a GC review
POST	/api/users/:userId/warn	admin:users:warn	Issue a warning
9.2 Admin Endpoints (Admin)
Method	Path	RBAC	Description
POST	/api/users/:userId/suspend	admin:users	Suspend a user
POST	/api/users/:userId/restore	admin:users	Restore a suspended user
GET	/api/admin/moderation/metrics	admin:system	Get moderation metrics
GET	/api/admin/moderation/workload	admin:system	Get per-moderator workload
9.3 User Endpoints
Method	Path	RBAC	Description
POST	/api/reports	any verified user	Submit a user report
GET	/api/reports/me	(self)	List the current user's reports
10. Blog & Content
Reference: modules/Blog & Content.md

10.1 Public Endpoints
Method	Path	Description
GET	/api/blog/posts	List published blog posts (filterable by category)
GET	/api/blog/posts/:slug	Get a published blog post
GET	/api/blog/posts/:slug/comments	List approved comments
GET	/api/blog/categories	List blog categories
GET	/api/blog/search	Search blog posts
POST	/api/newsletter/subscribe	Subscribe to the newsletter
POST	/api/newsletter/confirm	Confirm a subscription
POST	/api/newsletter/unsubscribe	Unsubscribe
GET	/api/legal-literacy/modules	List published modules
GET	/api/legal-literacy/modules/:slug	Get a module
10.2 Authenticated Endpoints
Method	Path	RBAC	Description
POST	/api/blog/posts/:slug/comments	blog:comment	Submit a comment
POST	/api/legal-literacy/modules/:slug/enroll	literacy:enroll	Enroll in a module
GET	/api/legal-literacy/modules/:slug/progress	literacy:progress (self)	Get progress
POST	/api/legal-literacy/modules/:slug/progress	literacy:progress (self)	Update progress
POST	/api/legal-literacy/modules/:slug/quiz	literacy:quiz (self)	Submit a quiz attempt
GET	/api/legal-literacy/me/enrollments	literacy:progress (self)	List enrollments
10.3 Admin Endpoints (Writer+)
Method	Path	RBAC	Description
POST	/api/admin/blog/posts	blog:create	Create a new blog post
PUT	/api/admin/blog/posts/:postId	blog:update	Update a blog post (DRAFT only)
POST	/api/admin/blog/posts/:postId/submit	blog:update (author)	Submit draft for next review step
POST	/api/admin/blog/posts/:postId/review	step-specific	Review at a step
POST	/api/admin/blog/posts/:postId/publish	blog:publish	Publish an approved post
POST	/api/admin/blog/posts/:postId/archive	blog:publish	Archive a published post
GET	/api/admin/blog/dashboard	blog:read	Writer's dashboard
GET	/api/admin/blog/pipeline-metrics	admin:system	Editorial pipeline metrics
(similar for legal literacy modules)			
11. Admin & Operations
Reference: modules/Admin & Operations.md

11.1 Admin Endpoints
Method	Path	RBAC	Description
GET	/api/admin/dashboard	admin:dashboard	Get the admin dashboard
GET	/api/admin/users	admin:users	Search/list users
GET	/api/admin/users/:userId	admin:users	Get a user's full profile
POST	/api/admin/users/:userId/change-role	admin:users (senior for high-stakes)	Change a user's role
GET	/api/admin/audit-log	admin:audit	Get the admin audit log
GET	/api/admin/dsar-requests	admin:users	List DSAR requests
POST	/api/admin/dsar-requests/:requestId/fulfill	admin:users	Fulfill a DSAR request
GET	/api/admin/transparency-report/:period	admin:system	Get transparency report data
POST	/api/admin/transparency-report/:period/generate	admin:system	Generate the report data
POST	/api/admin/transparency-report/:period/publish	admin:system (senior)	Publish the report
GET	/api/admin/feature-flags	admin:system	List feature flags
PUT	/api/admin/feature-flags/:key	admin:system	Update a feature flag
GET	/api/admin/operational-alerts	admin:system	List active alerts
POST	/api/admin/operational-alerts/:alertId/acknowledge	admin:system	Acknowledge an alert
POST	/api/admin/operational-alerts/:alertId/resolve	admin:system	Resolve an alert
GET	/api/admin/financial-summary	admin:financial	Get financial summary
GET	/api/admin/health	admin:system	Get system health
12. Webhooks
Method	Path	Description
POST	/api/webhooks/paystack	Paystack subscription events
POST	/api/webhooks/nimc	NIMC webhook (future; not in pilot)
POST	/api/webhooks/onfido	Onfido webhook (future; not in pilot)
12.1 Webhook Security
All webhooks must be signature-verified. Unverified webhooks are rejected with INVALID_SIGNATURE (401).

Paystack: Uses x-paystack-signature header with HMAC-SHA256
NIMC: To be determined (not in pilot)
Onfido: Uses X-Signature header with HMAC-SHA256 (per modules/Authentication & Identity Verification.md §6.3.3)
13. Cross-Cutting Concerns
13.1 Rate Limits
Default rate limits per endpoint category:

Category	Default	Window
Authentication	5	60s
Voting	10	60s
Evidence upload	5	3600s
Lawyer matching	10	3600s
Poll creation	2	3600s
Blog content creation	5	3600s
Blog comments	10	60s
Admin actions	100	3600s
Webhooks	50	60s
General API	100	60s
See ARCHITECTURE.md §7.1.2 for the full table.

13.2 RBAC Permissions Reference
Full permission list is in RBAC.md. Permission checks are enforced at the API level; clients cannot bypass them.

13.3 CORS
CORS is configured per environment. The mobile app's origin is always allowed. Web app origins are configured per deployment.

13.4 Versioning and Deprecation
Breaking changes are introduced with a new URL version prefix (e.g., /api/v2/)
The previous version is supported for at least 6 months after the new version is released
Deprecated endpoints return a Deprecation and Sunset header
Clients are notified of deprecations via the transparency report and direct communication
14. OpenAPI Specification
The full OpenAPI 3.1 specification is generated from the codebase and published at /api/openapi.json. The spec is the machine-readable contract; this document is the human-readable contract. The two are kept in sync via a CI check.

The OpenAPI spec includes:

All endpoints with request/response schemas
All error codes and their HTTP status mappings
All authentication schemes
All rate limit headers
The spec is versioned with the API. Breaking changes to the spec require a version bump.

Appendix A: Module Reference
Module	Reference
Authentication & Identity Verification	modules/Authentication & Identity Verification.md
Policy Polls	modules/Policy Polls.md
Confidence Votes	modules/Confidence Votes.md
Evidence Upload & Integrity	modules/Evidence Upload & Integrity.md
Lawyer Onboarding & Verification	modules/Lawyer Onboarding & Verification.md
Lawyer Matching & Consultation	modules/Lawyer Matching & Consultation.md
Lawyer Reviews	modules/Lawyer Reviews.md
Moderation	modules/Moderation.md
Blog & Content	modules/Blog & Content.md
Admin & Operations	modules/Admin & Operations.md
Mobile App	modules/Mobile App.md
Appendix B: Glossary
AB — Advisory Board
AI — Artificial Intelligence
API — Application Programming Interface
CORS — Cross-Origin Resource Sharing
DSAR — Data Subject Access Request
JWT — JSON Web Token
LGA — Local Government Area
MDX — Markdown with JSX
NBA — Nigerian Bar Association
NDPR — Nigeria Data Protection Regulation
NIN — National Identification Number
NVS — National Verification Service (NIMC)
RBAC — Role-Based Access Control
SLA — Service Level Agreement
TLS — Transport Layer Security
Appendix C: API Documentation Revision History
Version	Date	Author	Changes
1.0.0	2026-07-20	Engineering Lead	Initial draft. Consolidates all endpoints from the 11 module specs into a single reference. 60+ endpoints documented with request/response examples. The OpenAPI spec is generated from the codebase and kept in sync via CI.