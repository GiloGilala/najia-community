# Role-Based Access Control (RBAC)

_Document Version: 1.0.0_
_Last Updated: 2026-07-20_
_Status: Active_
_Owner: Engineering Lead + Legal Director_

> **Changelog:**
>
> - 1.0.0 (2026-07-20) — Initial finalized version. This document supersedes the RBAC sections in ARCHITECTURE.md §4.3 and the role/permission references in the module specs. It is the single source of truth for the RBAC model.

> **How to read this document:** This is the **canonical RBAC reference** for the platform. The permission matrix (§4) is the authoritative view; the per-role descriptions (§5) are derived from it. For the implementation in CASL, see §6. For the testing requirements, see §7. For the operational procedures (role assignment, override), see §8.

> **Related documents:**
>
> - [ARCHITECTURE.md §4.3](../ARCHITECTURE.md) — the architectural context (the import boundaries, the single source of truth)
> - [Security.md §3.2](./Security.md#32-authorization) — the security perspective on authorization
> - [ADRs.md §6](../ADRs.md#adr-006--casl-as-the-rbac-library) — the CASL decision
> - [Engineering.md §11](./Engineering.md#11-code-review) — the code review process for RBAC changes
> - [modules/Admin & Operations.md §3.1.2](../modules/Admin%20%26%20Operations.md) — the role assignment workflow
> - [Database.md §11](./Database.md#11-rbac-domain) — the schema for the RBAC tables

---

## 1. Overview

### 1.1 What This Document Is

This document is the **single source of truth for the RBAC model** on the Najia Community Bridge. It covers:

- The roles (citizen, lawyer, writer, moderator, admin, etc.)
- The permissions (what each role can do)
- The conditions (when a permission applies)
- The per-user overrides (how to grant or revoke a specific permission for a specific user)
- The implementation (CASL ability definitions)
- The testing (how to verify the RBAC works correctly)
- The operations (how to manage roles and overrides)

If you find a role, permission, or condition mentioned in another document that conflicts with this one, this document is the truth. Report the drift.

### 1.2 The RBAC Principles

| Principle                  | Application                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Least privilege**        | Users have only the permissions they need for their role. The default is denial.                           |
| **Role-based defaults**    | Each role has a default set of abilities, defined in code.                                                 |
| **Per-user overrides**     | Admins can grant or revoke individual permissions for specific users, via the `user_permissions` table.    |
| **Resource-based**         | Permissions are defined per resource (Case, Evidence, Poll, etc.), not globally.                           |
| **Conditional**            | Abilities can include conditions (e.g., "own case" vs. "all cases").                                       |
| **Auditable**              | Every permission check is logged at the appropriate level; every role change is audit-logged.              |
| **Cacheable**              | Permission resolutions are cached for performance (1-hour TTL, invalidated on change).                     |
| **Defense in depth**       | RBAC is enforced at the API route, the service layer, and the database query layer.                        |
| **Explicit, not implicit** | A permission is granted only if it's explicitly defined. There are no implicit grants from role hierarchy. |

The last point is important: see §5.5 for the explicit note about role hierarchy.

### 1.3 The Defense in Depth Model

RBAC is enforced at three layers:

1. **API route** — the entry point checks the permission before the handler runs
2. **Service layer** — the service checks the condition (e.g., "is this the user's own case?") before performing the action
3. **Database query** — the query includes the permission condition as a filter (e.g., `WHERE uploader_id = $userId`)

Any one of these layers can stop an unauthorized request. None of them is the only defense.

---

## 2. The Roles

### 2.1 Role Definitions

| Role                  | Description                                            | Typical user                                                                   | Source of assignment                                                   |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `citizen`             | The default role for all registered users              | Any registered user                                                            | Assigned at registration (the Auth module)                             |
| `lawyer`              | A verified lawyer                                      | A person who has completed bar verification                                    | Assigned by the Lawyer Onboarding module after successful verification |
| `writer`              | A content writer                                       | A staff member or contractor who creates blog posts and legal literacy modules | Assigned manually by an admin                                          |
| `moderator`           | A content moderator                                    | A staff member who reviews flagged content                                     | Assigned manually by an admin                                          |
| `senior_moderator`    | A senior moderator who can decide appeals              | A staff member with appeal-decision authority                                  | Assigned manually by an admin                                          |
| `advisory_board`      | An Advisory Board member who reviews poll drafts       | An external expert appointed to the AB                                         | Assigned by the Project Lead (per PLATFORM.md §9.3)                    |
| `grievance_committee` | A Grievance Committee member who reviews final appeals | An expert appointed to the GC                                                  | Assigned by the Legal Director                                         |
| `senior_admin`        | An admin who can approve high-stakes actions           | A staff member with admin authority                                            | Assigned by an admin (requires another admin's approval)               |
| `admin`               | Full system access                                     | A staff member with full access                                                | Assigned by the Project Sponsor (one per person)                       |

### 2.2 Role Hierarchy vs. Explicit Grants

**The numeric hierarchy in the code is for display and ordering only. It does not imply permission inheritance.**

```typescript
// lib/rbac/roles.ts
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  senior_admin: 90,    // Note: senior_admin is below admin but does NOT inherit admin permissions
  senior_moderator: 80, // Same here
  moderator: 70,
  writer: 50,
  lawyer: 40,
  citizen: 10,
  advisory_board: 30,   // Special-purpose role; not a "rank" in the hierarchy
  grievance_committee: 35, // Special-purpose role; not a "rank"
};
A lawyer (rank 40) does not automatically get everything a citizen (rank 10) can do, just because 40 > 10. The lawyer role explicitly grants the lawyer-specific permissions; the citizen-level permissions are also explicitly granted to lawyer (because a lawyer is also a citizen with additional case-side permissions).

This is deliberate. Permission inheritance from numeric hierarchy is a common source of privilege escalation bugs. By making all grants explicit in defineAbilityFor, we avoid this entire class of bugs.

The two special-purpose roles (advisory_board, grievance_committee) are NOT in the standard hierarchy. They are scoped to specific workflows:

advisory_board grants advisory:review (for poll draft review) and nothing else
grievance_committee grants admin:grievance (for GC reviews) and nothing else
This separation ensures that an AB member cannot accidentally access admin features, and a GC member cannot accidentally access AB features. Each role is narrowly scoped to its workflow.

2.3 The Sub-Roles
Some roles have sub-roles that determine which sub-workflows they can access. Sub-roles are assigned when the role is granted.

Role	Sub-role	Purpose
moderator	content_moderator	UGC and lawyer reviews
moderator	poll_moderator	Policy draft review
moderator	ai_reviewer	Evidence AI flags
moderator	blog_editor	Blog content (this is the same as writer for some purposes)
A moderator can have multiple sub-roles. The most common is content_moderator (the default).

The sub-roles are stored in the admin_role_assignments.sub_roles JSONB column. See Database.md §11.2.

3. The Permission Model
3.1 The Permission Format
Permissions are strings in the format {action}:{resource}:

Component	Format	Examples
action	A lowercase verb	read, create, update, delete, vote, verify, moderate, publish
resource	A PascalCase resource name (singular)	Case, Evidence, Poll, Confidence, Lawyer, Review, Blog, User, Permission
Examples:

cases:create — create a case
cases:read — read a case
evidence:upload — upload evidence (deprecated in favor of evidence:create)
admin:users — manage users (admin)
advisory:review — review a poll draft (AB member)
polls:vote — vote in a poll
3.2 The Resource Catalog
The resources are the entities in the platform:

Resource	Notes
Profile	The user's own profile
Case	A civil dispute case
Evidence	An uploaded evidence file
Poll	A policy poll
Confidence	A confidence vote on an official
Lawyer	A lawyer's profile (separate from the User)
Review	A lawyer review (post-consultation)
Blog	A blog post or legal literacy module
LegalLiteracy	A legal literacy module (separate from Blog for clarity)
User	Any user (for admin operations)
Permission	The permission system itself
Moderation	The moderation queue
Admin	The admin operations
Some resources (like User, Permission, Admin) are admin-only. Others (like Profile, Case, Poll) are available to regular users.

3.3 The Standard Action Set
The standard action set (per CASL):

Action	Meaning
read	View the resource
create	Create a new resource
update	Modify an existing resource
delete	Remove the resource (soft or hard delete)
manage	All actions (admin shortcut)
vote	Cast a vote (polls and confidence votes)
verify	Verify something (identity, bar license, etc.)
publish	Publish content (blog posts, polls)
match	Match a case to a lawyer
moderate	Review and decide on a moderation queue item
appeal	Appeal a moderation decision
enroll	Enroll in a learning module
quiz	Take a quiz
consent	Consent to a case action
suspend	Suspend a user
restore	Restore a suspended user
warn	Issue a warning to a user
4. The Permission Grant Matrix
This is the canonical grant matrix. Every "✅" is an explicit grant; every "❌" is a denial. Conditions are noted in parentheses.

The matrix is the source of truth. If a module spec says something different, the matrix wins. Report the drift.

4.1 Profile
Permission	Citizen	Lawyer	Writer	Moderator	Senior Mod	AB	GC	Senior Admin	Admin
profile:read	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ All
profile:update	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ All
profile:verify	❌	❌	❌	❌	❌	❌	❌	❌	✅
4.2 Cases
Permission	Citizen	Lawyer	Writer	Moderator	Senior Mod	AB	GC	Senior Admin	Admin
cases:create	✅	✅	✅	✅	✅	✅	✅	✅	✅
cases:read	✅ Own	✅ Own+	✅ Own	✅ All	✅ All	✅ All	✅ All	✅ All	✅ All
cases:update	✅ Own (DRAFT)	✅ Own+	❌	✅ All	✅ All	❌	❌	✅ All	✅ All
cases:delete	❌	❌	❌	❌	❌	❌	❌	❌	✅
cases:consent	✅ Own (as respondent)	❌	❌	❌	❌	❌	❌	✅ All	✅ All
Notes:

Own means the resource belongs to the user (e.g., complainantId or respondentId for cases)
Own+ for lawyers means: own cases (where they are the complainant) plus assigned cases (where they are the matched lawyer)
4.3 Evidence
Permission	Citizen	Lawyer	Writer	Moderator	Senior Mod	AB	GC	Senior Admin	Admin
evidence:create	✅	✅	❌	✅	✅	❌	❌	✅	✅
evidence:read	✅ Own	✅ Own+	❌	✅ All	✅ All	❌	❌	✅ All	✅ All
evidence:update	✅ Own	✅ Own+	❌	✅ All	✅ All	❌	❌	✅ All	✅ All
evidence:delete	✅ Own (soft)	❌	❌	❌	❌	❌	❌	❌	✅
evidence:appeal	✅ Own	❌	❌	❌	❌	❌	❌	✅ All	✅ All
evidence:verify	❌	❌	❌	✅	✅	❌	❌	✅	✅
evidence:quarantine	❌	❌	❌	❌	❌	❌	❌	❌	✅
4.4 Polls (Policy Polls)
Permission	Citizen	Lawyer	Writer	Moderator	Senior Mod	AB	GC	Senior Admin	Admin
polls:read	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public
polls:suggest	✅	✅	✅	✅	✅	✅	✅	✅	✅
polls:vote	✅	✅	✅	✅	✅	✅	✅	✅	✅
polls:create	❌	❌	❌	✅	✅	❌	❌	✅	✅
polls:update	❌	❌	❌	✅ (DRAFT only)	✅ (DRAFT only)	❌	❌	✅	✅
polls:delete	❌	❌	❌	❌	❌	❌	❌	❌	✅
polls:publish	❌	❌	❌	✅ (approved)	✅ (approved)	❌	❌	✅	✅
polls:close	❌	❌	❌	✅ (emergency)	✅ (emergency)	❌	❌	✅	✅
4.5 Confidence Votes
Permission	Citizen	Lawyer	Writer	Moderator	Senior Mod	AB	GC	Senior Admin	Admin
confidence:read	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public
confidence:vote	✅	✅	✅	✅	✅	✅	✅	✅	✅
confidence:create	❌	❌	❌	✅	✅	❌	❌	✅	✅
confidence:update	❌	❌	❌	✅	✅	❌	❌	✅	✅
confidence:delete	❌	❌	❌	❌	❌	❌	❌	❌	✅
4.6 Lawyers
Permission	Citizen	Lawyer	Writer	Moderator	Senior Mod	AB	GC	Senior Admin	Admin
lawyer:read	✅ Public	✅ Self	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ All
lawyer:register	✅ (verified citizen)	✅ (self)	❌	❌	❌	❌	❌	✅	✅
lawyer:update	❌	✅ Self (DRAFT)	❌	✅ All	✅ All	❌	❌	✅ All	✅ All
lawyer:delete	❌	❌	❌	❌	❌	❌	❌	❌	✅
lawyer:suspend	❌	❌	❌	❌	❌	❌	❌	❌	✅
lawyer:restore	❌	❌	❌	❌	❌	❌	❌	❌	✅
lawyer:match	✅ (initiate)	✅ (self, accept/decline)	❌	✅	✅	❌	❌	✅	✅
lawyer:review (bar verify)	❌	❌	❌	✅	✅	❌	❌	✅	✅
4.7 Reviews (Lawyer Reviews)
Permission	Citizen	Lawyer	Writer	Moderator	Senior Mod	AB	GC	Senior Admin	Admin
review:create	✅ (own, post-engagement)	❌	❌	❌	❌	❌	❌	✅	✅
review:read	✅ Own	✅ Self (as reviewed)	❌	✅ All	✅ All	❌	❌	✅ All	✅ All
review:read:public	✅ Public (approved)	✅ Public (approved)	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public
review:update	✅ Own (DRAFT)	❌	❌	❌	❌	❌	❌	✅ All	✅ All
review:appeal	✅ Own (REMOVED)	❌	❌	❌	❌	❌	❌	✅ All	✅ All
review:respond	❌	✅ Self	❌	❌	❌	❌	❌	✅ All	✅ All
review:moderate	❌	❌	❌	✅	✅	❌	❌	✅	✅
review:delete	❌	❌	❌	❌	❌	❌	❌	❌	✅
4.8 Blog
Permission	Citizen	Lawyer	Writer	Moderator	Senior Mod	AB	GC	Senior Admin	Admin
blog:read	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public
blog:read:category	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public
blog:comment	✅ (verified)	✅ (verified)	✅ (verified)	✅ (verified)	✅ (verified)	✅ (verified)	✅ (verified)	✅ (verified)	✅ (verified)
blog:create	❌	❌	✅	✅	✅	❌	❌	✅	✅
blog:update	❌	❌	✅ Own	✅ All	✅ All	❌	❌	✅ All	✅ All
blog:delete	❌	❌	❌	✅	✅	❌	❌	✅	✅
blog:publish	❌	❌	❌	✅ (approved)	✅ (approved)	❌	❌	✅	✅
blog:archive	❌	❌	❌	✅	✅	❌	❌	✅	✅
4.9 Legal Literacy
Permission	Citizen	Lawyer	Writer	Moderator	Senior Mod	AB	GC	Senior Admin	Admin
literacy:read	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public	✅ Public
literacy:enroll	✅ (verified)	✅ (verified)	✅ (verified)	✅ (verified)	✅ (verified)	✅ (verified)	✅ (verified)	✅ (verified)	✅ (verified)
literacy:progress	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ All
literacy:quiz	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ Self	✅ All
literacy:create	❌	❌	✅	✅	✅	❌	❌	✅	✅
literacy:update	❌	❌	✅ Own	✅ All	✅ All	❌	❌	✅ All	✅ All
literacy:delete	❌	❌	❌	✅	✅	❌	❌	✅	✅
literacy:publish	❌	❌	❌	✅ (approved)	✅ (approved)	❌	❌	✅	✅
4.10 Moderation
Permission	Citizen	Lawyer	Writer	Moderator	Senior Mod	AB	GC	Senior Admin	Admin
moderation:view	❌	❌	❌	✅	✅	❌	❌	✅	✅
moderation:act	❌	❌	❌	✅	✅	❌	❌	✅	✅
moderation:appeal	❌	❌	❌	❌	✅	❌	❌	✅	✅
moderation:escalate	❌	❌	❌	❌	✅	❌	❌	✅	✅
advisory:review	❌	❌	❌	❌	❌	✅	❌	❌	✅
admin:grievance	❌	❌	❌	❌	❌	❌	✅	❌	✅
4.11 Admin
Permission	Citizen	Lawyer	Writer	Moderator	Senior Mod	AB	GC	Senior Admin	Admin
admin:dashboard	❌	❌	❌	✅	✅	❌	❌	✅	✅
admin:users	❌	❌	❌	❌	❌	❌	❌	✅	✅
admin:users:warn	❌	❌	❌	✅	✅	❌	❌	✅	✅
admin:system	❌	❌	❌	❌	❌	❌	❌	✅	✅
admin:audit	❌	❌	❌	❌	❌	❌	❌	✅	✅
admin:financial	❌	❌	❌	❌	❌	❌	❌	✅	✅
admin:transparency	❌	❌	❌	❌	❌	❌	❌	✅	✅
admin:permissions	❌	❌	❌	❌	❌	❌	❌	❌	✅
5. Per-Role Descriptions
This section describes what each role can do, derived from the matrix. It's the human-readable summary; the matrix is the source of truth.

5.1 Citizen
The default role. Every registered user starts as a citizen.

Can do:

Manage their own profile
Complete identity verification (via NIMC or Onfido)
Vote in policy polls (in their jurisdiction)
Vote in confidence questions (for officials in their jurisdiction)
Upload evidence (own)
Create and manage their own cases
Find a lawyer and schedule a free consultation
Submit a review after a documented engagement
Read blog posts and legal literacy modules
Enroll in and complete legal literacy modules
Comment on blog posts
Suggest poll topics
Request a DSAR (data export or deletion)
Manage their own notifications and preferences
Cannot do:

Create polls (only moderators can)
Moderate content
Access admin features
Access other users' data
5.2 Lawyer
A verified lawyer. Assigned by the Lawyer Onboarding module after successful bar verification.

Can do (in addition to citizen-level permissions):

Register and manage their lawyer profile
Receive match notifications for cases in their practice areas
Accept or decline matches
Set their availability for consultations
Respond to reviews about them
See evidence in cases they're assigned to (but NOT before the consultation)
Have their profile visible in the lawyer directory
Cannot do:

See the citizen's identity before accepting a match
See the citizen's identity before the consultation starts
Access other lawyers' data (except public profile data)
Access admin features
5.3 Writer
A content writer. Assigned manually by an admin.

Can do:

Create, edit, and submit blog posts for review
Create, edit, and submit legal literacy modules for review
Read their own drafts and review history
See review feedback on their drafts
Cannot do:

Publish content (only Blog Editors/moderators can)
Access admin features
Access other users' data
Moderate content (unless they also have the moderator role)
5.4 Moderator (with Sub-Roles)
A content moderator. Assigned manually by an admin, with sub-roles that determine which workflows they can access.

Sub-roles:

content_moderator — UGC, lawyer reviews (default)
poll_moderator — Policy draft review
ai_reviewer — Evidence AI flags
blog_editor — Blog content (same scope as writer + publish authority)
A moderator can have multiple sub-roles.

Can do (for their sub-roles):

View the moderation queue (for their queue types)
Pick up and decide on queue items
Issue warnings to users
(Senior moderators) Decide on appeals
(Blog editors) Publish approved content
Cannot do:

Manage users (suspend, restore, change role)
Access financial data
Access transparency reports
Assign roles
Configure the system
5.5 Senior Moderator
A senior moderator with appeal-decision authority. The difference from a regular moderator:

Can decide on appeals
Can reassign queue items
Can override moderator decisions
The numeric rank (80) is higher than a regular moderator (70), but the permissions are explicitly defined — the rank does not imply inheritance.

5.6 Advisory Board (AB)
An Advisory Board member. Special-purpose role, not in the standard hierarchy.

Can do:

Review policy poll drafts
Approve, reject, or request changes on poll drafts
See the poll draft history (their own reviews and others')
Cannot do:

Anything else. This is by design. The AB is an independent review body, and its members have no other access to the platform.
5.7 Grievance Committee (GC)
A Grievance Committee member. Special-purpose role, not in the standard hierarchy.

Can do:

Review escalated appeals
Uphold or overturn the original decision
See the full appeal history
Cannot do:

Anything else. This is by design. The GC is the final review body, and its members have no other access to the platform.
5.8 Senior Admin
An admin with the ability to approve high-stakes actions. The difference from a regular admin:

Can approve role changes for admin and senior_admin (requires another senior admin)
Can approve permanent suspensions
Can approve DSAR denials
The numeric rank (90) is higher than a moderator (70) and a senior moderator (80), but the permissions are explicitly defined — the rank does not imply inheritance from admin (100).

5.9 Admin
Full system access. The numeric rank is the highest (100).

Can do (everything):

All admin features
All user management
All financial data
All transparency reports
Role assignment (requires the assignment to be approved by another admin for high-stakes roles)
System configuration
Audit log access
Self-protection rules:

An admin cannot suspend themselves
An admin cannot change their own role (another admin must do it)
An admin cannot remove the last admin
All admin actions are audit-logged
High-stakes admin actions require senior admin approval
6. The CASL Implementation
The RBAC model is implemented in CASL. The implementation lives in lib/rbac/ability.ts. This section provides the implementation reference; the actual code is committed in the repository.

6.1 The Ability Definition
The defineAbilityFor function takes a user and returns a MongoAbility (CASL's ability object). The function is the single source of truth for the RBAC logic.

TypeScript

// lib/rbac/ability.ts
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';

export type Actions =
  | 'read' | 'create' | 'update' | 'delete' | 'manage'
  | 'vote' | 'verify' | 'publish' | 'match' | 'moderate'
  | 'appeal' | 'enroll' | 'quiz' | 'consent' | 'suspend'
  | 'restore' | 'warn';

export type Subjects =
  | 'Profile' | 'Case' | 'Evidence' | 'Poll' | 'Confidence'
  | 'Lawyer' | 'Review' | 'Blog' | 'LegalLiteracy' | 'Moderation'
  | 'User' | 'Permission' | 'Admin' | 'all';

export type AppAbility = MongoAbility<[Actions, Subjects]>;

export interface AbilityUser {
  id: string;
  role: UserRole;
  subRoles?: string[];
  permissions: string[]; // Per-user overrides
}

export function defineAbilityFor(user: AbilityUser): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  const isAdmin = user.role === 'admin';
  const isSeniorAdmin = user.role === 'senior_admin' || isAdmin;
  const isSeniorModerator = user.role === 'senior_moderator' || isSeniorAdmin;
  const isModerator = user.role === 'moderator' || isSeniorModerator;
  const isWriter = user.role === 'writer' || isModerator;
  const isLawyer = user.role === 'lawyer';
  const isCitizen = user.role === 'citizen' || isLawyer;

  // Admin: full access
  if (isAdmin) {
    can('manage', 'all');
    return build();
  }

  // Per-user overrides (granted only; revokes are applied separately)
  for (const permission of user.permissions) {
    if (permission.startsWith('-')) {
      // Revoke: handled by applying negative abilities
      const [action, resource] = permission.slice(1).split(':');
      cannot(action as Actions, resource as Subjects);
    } else {
      const [action, resource] = permission.split(':');
      can(action as Actions, resource as Subjects);
    }
  }

  // Profile: self-management for all
  can('read', 'Profile', { userId: user.id });
  can('update', 'Profile', { userId: user.id });

  // Cases
  if (isCitizen) {
    can('read', 'Case', { complainantId: user.id });
    can('read', 'Case', { respondentId: user.id });
    can('create', 'Case');
    can('update', 'Case', {
      complainantId: user.id,
      status: { $in: ['DRAFT', 'CONSENT_PENDING'] }
    });
    can('consent', 'Case', { respondentId: user.id });
  }

  if (isLawyer) {
    can('read', 'Case', { lawyerId: user.id });
    can('update', 'Case', { lawyerId: user.id });
  }

  if (isModerator) {
    can('read', 'Case', 'all');
    can('update', 'Case', 'all');
  }

  // Evidence
  if (isCitizen) {
    can('create', 'Evidence');
    can('read', 'Evidence', { uploaderId: user.id });
    can('appeal', 'Evidence', { uploaderId: user.id });
  }

  if (isLawyer) {
    can('read', 'Evidence', { case: { lawyerId: user.id } });
  }

  if (isModerator) {
    can('read', 'Evidence', 'all');
    can('verify', 'Evidence');
  }

  // Polls
  can('read', 'Poll', 'all');
  can('vote', 'Poll');

  if (isModerator) {
    can('create', 'Poll');
    can('update', 'Poll');
    can('delete', 'Poll');
  }

  // Confidence
  can('read', 'Confidence', 'all');
  can('vote', 'Confidence');

  if (isModerator) {
    can('create', 'Confidence');
  }

  // Lawyers
  if (isLawyer) {
    can('read', 'Lawyer', 'all');
    can('match', 'Lawyer');
  }

  if (isCitizen) {
    can('read', 'Lawyer', 'all');
    can('match', 'Lawyer');
    can('create', 'Review');
  }

  if (isModerator) {
    can('verify', 'Lawyer');
  }

  // Blog and legal literacy
  can('read', 'Blog', 'all');
  can('comment', 'Blog');
  can('enroll', 'LegalLiteracy');
  can('quiz', 'LegalLiteracy');

  if (isWriter) {
    can('create', 'Blog');
    can('update', 'Blog', { authorId: user.id });
    can('create', 'LegalLiteracy');
    can('update', 'LegalLiteracy', { authorId: user.id });
  }

  if (isModerator) {
    can('update', 'Blog', 'all');
    can('delete', 'Blog');
    can('publish', 'Blog');
    can('update', 'LegalLiteracy', 'all');
    can('delete', 'LegalLiteracy');
    can('publish', 'LegalLiteracy');
  }

  // Moderation
  if (isModerator) {
    can('view', 'Moderation');
    can('act', 'Moderation');
  }

  if (isSeniorModerator) {
    can('appeal', 'Moderation');
    can('escalate', 'Moderation');
  }

  // Advisory Board: scoped to advisory:review only
  if (user.role === 'advisory_board') {
    can('review', 'Poll');
  }

  // Grievance Committee: scoped to admin:grievance only
  if (user.role === 'grievance_committee') {
    can('view', 'Moderation');
    can('act', 'Moderation');
  }

  return build();
}
6.2 Per-User Overrides
Per-user overrides are applied in two steps:

Grants: the override adds a permission that the user doesn't have by default
Revokes: the override removes a permission that the user has by default (a - prefix in the permission string)
TypeScript

// Example: grant a specific user moderation powers without changing their role
await db.insert(userPermissions).values({
  userId: 'usr_specific',
  permission: 'admin:moderation',
  granted: true,
  grantedBy: adminId,
  grantedAt: new Date(),
});

// Example: revoke a specific permission from a user who has the role
await db.insert(userPermissions).values({
  userId: 'usr_writer',
  permission: '-blog:publish', // Note the minus prefix
  granted: true, // true means "this override is in effect"
  grantedBy: adminId,
  grantedAt: new Date(),
});
The override is explicit revoke beats role grant. A user with -blog:publish cannot publish even if the writer role normally grants it.

6.3 The API Middleware
The requirePermission middleware checks the permission before the handler runs:

TypeScript

// server/api/middleware/rbac.ts
import { Context } from 'hono';
import { defineAbilityFor } from '~/lib/rbac/ability';

export function requirePermission(permission: string) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user');

    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required to perform this action',
        },
      }, 401);
    }

    const ability = defineAbilityFor(user);
    const [action, resource] = permission.split(':');

    if (!ability.can(action as any, resource as any)) {
      return c.json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: `You do not have permission to perform "${permission}"`,
        },
      }, 403);
    }

    await next();
  };
}
6.4 The Service Layer Check
The service layer checks the condition (e.g., "is this the user's own case?") before performing the action:

TypeScript

// services/case.service.ts
export async function updateCase(userId: string, caseId: string, data: UpdateCaseInput) {
  const ability = defineAbilityFor(currentUser);

  // First, check the permission (the route middleware should have done this,
  // but defense in depth means we check again)
  if (!ability.can('update', 'Case')) {
    throw new InsufficientPermissionError('update:Case');
  }

  // Then, check the condition
  const case_ = await db.query.cases.findFirst({
    where: eq(cases.id, caseId),
  });

  if (!case_) {
    throw new NotFoundError('Case', caseId);
  }

  // The condition: the user must be the complainant and the case must be in a
  // state that allows updates
  if (case_.complainantId !== userId) {
    throw new ResourceAccessError('Case', caseId);
  }

  if (!['DRAFT', 'CONSENT_PENDING'].includes(case_.status)) {
    throw new CaseStatusError(case_.status, ['DRAFT', 'CONSENT_PENDING']);
  }

  // Perform the update
  await db.update(cases).set(data).where(eq(cases.id, caseId));
  await auditService.log({
    actorId: userId,
    action: 'case.update',
    targetType: 'Case',
    targetId: caseId,
    metadata: { before: case_, after: { ...case_, ...data } },
  });
}
6.5 The Database Query Filter
The database query includes the permission condition as a filter. This is the third layer of defense.

TypeScript

// Example: list cases for a user (the query itself enforces the access control)
async function listCasesForUser(userId: string, userRole: UserRole) {
  // For citizens, only their own cases
  if (userRole === 'citizen' || userRole === 'lawyer') {
    return db.query.cases.findMany({
      where: or(
        eq(cases.complainantId, userId),
        eq(cases.respondentId, userId),
        // For lawyers, also include assigned cases
        ...(userRole === 'lawyer' ? [eq(cases.lawyerId, userId)] : []),
      ),
    });
  }

  // For moderators and admins, all cases
  if (userRole === 'moderator' || userRole === 'senior_moderator' || userRole === 'senior_admin' || userRole === 'admin') {
    return db.query.cases.findMany();
  }

  // Default: no access
  return [];
}
This is the third layer. Even if the route and the service miss something, the query itself won't return data the user can't see.

7. Testing RBAC
The RBAC testing requirements are in QA.md §8 (the negative test rule). This section provides the RBAC-specific testing patterns.

7.1 The Negative Test Rule (Reinforced)
For every "user can do X" test, there must be a matching "user cannot do X" test. For RBAC, this means:

For every ✅ in the matrix, there's a test that verifies the user can perform the action
For every ❌ in the matrix, there's a test that verifies the user is denied with PERMISSION_DENIED (403)
For every conditional ✅ (e.g., "own case"), there are two tests: one for the case where the condition is met (✅), and one for the case where it's not (❌)
Most RBAC bugs are missing denials, not missing grants. The negative tests are the most important.

7.2 Test Patterns
TypeScript

// tests/unit/rbac/case.test.ts

import { describe, test, expect } from 'bun:test';
import { defineAbilityFor } from '~/lib/rbac/ability';

describe('Case permissions', () => {
  describe('citizen', () => {
    const citizen = {
      id: 'usr_citizen',
      role: 'citizen' as const,
      permissions: [],
    };

    test('can create a case', () => {
      const ability = defineAbilityFor(citizen);
      expect(ability.can('create', 'Case')).toBe(true);
    });

    test('CANNOT update a case they do not own', () => {
      const ability = defineAbilityFor(citizen);
      const otherCase = subject('Case', { complainantId: 'usr_other', status: 'DRAFT' });
      expect(ability.can('update', otherCase)).toBe(false);
    });

    test('can update their own case in DRAFT state', () => {
      const ability = defineAbilityFor(citizen);
      const ownCase = subject('Case', { complainantId: 'usr_citizen', status: 'DRAFT' });
      expect(ability.can('update', ownCase)).toBe(true);
    });

    test('CANNOT update their own case in ACTIVE state', () => {
      const ability = defineAbilityFor(citizen);
      const ownCase = subject('Case', { complainantId: 'usr_citizen', status: 'ACTIVE' });
      expect(ability.can('update', ownCase)).toBe(false);
    });

    test('CANNOT delete a case', () => {
      const ability = defineAbilityFor(citizen);
      const ownCase = subject('Case', { complainantId: 'usr_citizen' });
      expect(ability.can('delete', ownCase)).toBe(false);
    });
  });

  describe('lawyer', () => {
    const lawyer = {
      id: 'usr_lawyer',
      role: 'lawyer' as const,
      permissions: [],
    };

    test('can read their own case', () => {
      const ability = defineAbilityFor(lawyer);
      const ownCase = subject('Case', { complainantId: 'usr_lawyer' });
      expect(ability.can('read', ownCase)).toBe(true);
    });

    test('can read a case they are assigned to', () => {
      const ability = defineAbilityFor(lawyer);
      const assignedCase = subject('Case', { lawyerId: 'usr_lawyer' });
      expect(ability.can('read', assignedCase)).toBe(true);
    });

    test('CANNOT read a case they are not involved in', () => {
      const ability = defineAbilityFor(lawyer);
      const otherCase = subject('Case', { complainantId: 'usr_other', lawyerId: 'usr_other_lawyer' });
      expect(ability.can('read', otherCase)).toBe(false);
    });
  });

  describe('moderator', () => {
    const moderator = {
      id: 'usr_moderator',
      role: 'moderator' as const,
      permissions: [],
    };

    test('can read all cases', () => {
      const ability = defineAbilityFor(moderator);
      const anyCase = subject('Case', { complainantId: 'usr_anyone' });
      expect(ability.can('read', anyCase)).toBe(true);
    });

    test('CANNOT access admin features', () => {
      const ability = defineAbilityFor(moderator);
      expect(ability.can('manage', 'User')).toBe(false);
    });
  });

  describe('admin', () => {
    const admin = {
      id: 'usr_admin',
      role: 'admin' as const,
      permissions: [],
    };

    test('can manage all resources', () => {
      const ability = defineAbilityFor(admin);
      expect(ability.can('manage', 'all')).toBe(true);
    });
  });
});
7.3 Integration Tests
The unit tests verify the ability definitions. The integration tests verify the end-to-end RBAC enforcement:

TypeScript

// tests/integration/api/cases.test.ts

test('a citizen can create a case', async () => {
  const user = await createTestUser({ verified: true, role: 'citizen' });
  const token = user.token;

  const res = await app.request('/api/cases', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      caseType: 'landlord-tenant',
      jurisdiction: 'lagos',
      budgetMin: 50000,
      budgetMax: 100000,
      urgency: 'within-a-month',
      description: 'Test case',
    }),
  });

  expect(res.status).toBe(201);
});

test('a citizen CANNOT delete a case', async () => {
  const user = await createTestUser({ verified: true, role: 'citizen' });
  const case_ = await createTestCase({ complainantId: user.id });
  const token = user.token;

  const res = await app.request(`/api/cases/${case_.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  expect(res.status).toBe(403);
  const body = await res.json();
  expect(body.error.code).toBe('PERMISSION_DENIED');
});

test('a citizen CANNOT access another user\'s case', async () => {
  const user = await createTestUser({ verified: true, role: 'citizen' });
  const otherCase = await createTestCase({ complainantId: 'usr_other' });
  const token = user.token;

  const res = await app.request(`/api/cases/${otherCase.id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  expect(res.status).toBe(403);
  expect((await res.json()).error.code).toBe('PERMISSION_DENIED');
});
7.4 The Reviewer Reassignment Test
The reviewer reassignment rule (a moderator cannot decide on their own appeal) is a critical test:

TypeScript

test('a moderator CANNOT decide on an appeal of their own decision', async () => {
  const moderator = await createTestUser({ verified: true, role: 'moderator' });
  const item = await createTestQueueItem({ assignedTo: moderator.id });
  const decision = await moderatorDecide(moderator, item, 'APPROVE');
  const appeal = await createTestAppeal({ originalDecisionId: decision.id, appellantId: 'usr_citizen' });

  // The same moderator should NOT be able to decide on the appeal
  const res = await app.request(`/api/admin/moderation/appeals/${appeal.id}/decide`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${moderator.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'UPHOLD' }),
  });

  expect(res.status).toBe(403);
  expect((await res.json()).error.code).toBe('PERMISSION_DENIED');
});
7.5 The Per-User Override Test
TypeScript

test('a per-user override can grant a specific permission', async () => {
  const user = await createTestUser({ verified: true, role: 'citizen' });
  await createTestUserPermission({
    userId: user.id,
    permission: 'admin:moderation',
    granted: true,
  });

  const res = await app.request('/api/admin/moderation/queue', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${user.token}` },
  });

  expect(res.status).toBe(200);
});

test('a per-user override can revoke a permission that the role grants', async () => {
  const user = await createTestUser({ verified: true, role: 'writer' });
  await createTestUserPermission({
    userId: user.id,
    permission: '-blog:publish', // Revoke
    granted: true,
  });

  const res = await app.request('/api/admin/blog/posts/published-post/publish', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${user.token}` },
  });

  expect(res.status).toBe(403);
});
8. Operational Procedures
8.1 Assigning a Role
Roles are assigned via the admin endpoint:

http

POST /api/admin/users/:userId/change-role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "moderator",
  "subRoles": ["content_moderator", "blog_editor"],
  "reason": "Hired as a content moderator for the pilot"
}
The procedure:

An admin opens the user's profile
The admin selects the new role and sub-roles
The admin provides a reason (required)
The system logs the change (admin audit log)
If the role is high-stakes (admin or senior_admin), another senior admin must approve
The user's RBAC cache is invalidated
The user is notified (in-app and email)
Self-protection rules:

An admin cannot change their own role
An admin cannot assign admin or senior_admin without another admin's approval
An admin cannot remove the last admin (the system checks for this)
8.2 Granting a Per-User Override
Per-user overrides are granted via the admin endpoint:

http

POST /api/admin/users/:userId/permissions
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "permission": "admin:moderation",
  "granted": true,
  "reason": "Temporary moderation powers for the election freeze period",
  "expiresAt": "2026-10-31T00:00:00.000Z"
}
The procedure:

An admin opens the user's profile
The admin selects the permission and whether it's a grant or revoke
The admin provides a reason (required)
Optionally, the admin sets an expiration date
The system logs the change
The user's RBAC cache is invalidated
The user is notified
Best practices:

Use overrides sparingly; prefer role changes
Always set an expiration for time-bounded overrides
Document the reason in the audit log
Review overrides quarterly
8.3 Reviewing Overrides
Overrides are reviewed quarterly. The review:

Lists all active overrides (granted and not expired)
For each override, the admin decides:
Keep: the override is still needed
Expire: the override is no longer needed
Convert to role: the user's role should be changed instead
The review is documented in the audit log
The user is notified if their overrides are expired
8.4 The RBAC Cache
The user's resolved permission list is cached in SQLite (1-hour TTL). The cache key is permissions:{userId}.

Cache invalidation:

On role change: invalidateCacheByTag('user:usr_xxx')
On override change: invalidateCacheByTag('user:usr_xxx')
On override expiry (cron): invalidateCacheByTag('user:usr_xxx')
On global permission policy change: invalidateCacheByTag('rbac') (all users)
The cache is best-effort. A stale cache means a user may have a permission for up to 1 hour after it's revoked. For high-stakes revocations (e.g., a suspended user's permissions), the cache is invalidated immediately.

9. Open Questions
#	Question	Owner	Status
1	Should the Grievance Committee have a fixed term, or be ad-hoc?	Legal Director	Open — recommend fixed term
2	Should the per-user override expiration default be 90 days, or longer?	Engineering Lead	Open — recommend 90 days
3	Should the Advisory Board be able to see historical polls (for context)?	Product Lead	Open — recommend yes for current quarter only
4	How do we handle a permission that's needed in an emergency but not in the matrix?	Legal Director	Open — recommend time-bounded override with post-hoc review
5	Should the cache TTL be configurable per permission?	Engineering Lead	Open — recommend default for now
6	How do we test the per-user override cache invalidation?	QA Lead	Open — needs test design
Resolved questions move to the Decision Log and the ADRs. Decisions that affect the RBAC model require Legal Director sign-off.

Appendix A: The Permission Catalog (Complete)
For reference, here is the complete list of permissions in the platform, organized by resource.

Profile
profile:read
profile:update
profile:verify
Cases
cases:create
cases:read
cases:update
cases:delete
cases:consent
Evidence
evidence:create
evidence:read
evidence:update
evidence:delete
evidence:appeal
evidence:verify
evidence:quarantine
Polls
polls:read
polls:suggest
polls:vote
polls:create
polls:update
polls:delete
polls:publish
polls:close
Confidence
confidence:read
confidence:vote
confidence:create
confidence:update
confidence:delete
Lawyers
lawyer:read
lawyer:register
lawyer:update
lawyer:delete
lawyer:suspend
lawyer:restore
lawyer:match
lawyer:review (bar verification)
Reviews
review:create
review:read
review:read:public
review:update
review:appeal
review:respond
review:moderate
review:delete
Blog
blog:read
blog:read:category
blog:comment
blog:create
blog:update
blog:delete
blog:publish
blog:archive
Legal Literacy
literacy:read
literacy:enroll
literacy:progress
literacy:quiz
literacy:create
literacy:update
literacy:delete
literacy:publish
Moderation
moderation:view
moderation:act
moderation:appeal
moderation:escalate
advisory:review
admin:grievance
Admin
admin:dashboard
admin:users
admin:users:warn
admin:system
admin:audit
admin:financial
admin:transparency
admin:permissions
Appendix B: The Self-Protection Rules (Summary)
Rule	What it prevents	Implementation
An admin cannot suspend themselves	A compromised admin from locking themselves out and continuing to act	API-level check in the suspend endpoint
An admin cannot change their own role	A compromised admin from escalating themselves	API-level check in the change-role endpoint
An admin cannot remove the last admin	The system from being un-admin-able	API-level check in the role change endpoint
A moderator cannot decide on their own appeal	Bias in the appeal process	Queue-level check when picking up an appeal
The same override cannot both grant and revoke the same permission	Conflicting overrides	Database constraint (only one row per (user_id, permission))
A revoke beats a role grant	Explicit revocations are not silently overridden	Evaluated last in defineAbilityFor
A senior admin cannot approve their own role change	Bias in the role assignment process	Senior admin check in the change-role endpoint
A user cannot bypass RBAC by directly calling the database	Defense in depth	Database queries include the RBAC condition as a filter
Appendix C: Related Documents
ARCHITECTURE.md §4.3 — the architectural context
Security.md §3.2 — the security perspective
ADRs.md §6 — the CASL decision
Engineering.md §11 — the code review process
QA.md §8 — the negative test rule
[modules/Admin & Operations.md §3.1.2](../modules/Admin & Operations.md#312-role-management) — the role assignment workflow
Database.md §11 — the schema for the RBAC tables
Decision Log — business-level decisions
Appendix D: RBAC Revision History
Version	Date	Author	Changes
1.0.0	2026-07-20	Engineering Lead + Legal Director	Initial finalized version. This document is now the single source of truth for the RBAC model. It includes: the 9 roles with detailed descriptions, the sub-roles, the explicit note that role hierarchy does not imply permission inheritance, the complete permission grant matrix (organized by resource), the CASL implementation reference, the testing patterns (including the reinforced negative test rule), the operational procedures for role assignment and per-user overrides, the self-protection rules, and the open questions. The matrix is the canonical view; all other documents point here.
```
