\# ARCHITECTURE.md



\## Najia Community Bridge — Technical Architecture



\*Document Version: 1.0.0\*

\*Last Updated: July 20, 2026\*

\*Prepared by: Najia Community Bridge Technical Team\*



> \*\*v1.0.0 notes:\*\* This is the first consolidated release of the architecture doc. It supersedes all earlier drafts. Changes from the last draft: removed the duplicated permissions matrix (was in both §4.3 and §12.2 — now §12.2 references §4.3), filled in the previously empty Cache Client, Cache Key Pattern, and Schema Design sections, standardized the cache table name to `cache\_entries` everywhere , and fixed invalid inline `INDEX` syntax in the rate-limit SQL (moved to standalone `CREATE INDEX` statements, which is required by both PostgreSQL and SQLite).



\---



\# 1. ARCHITECTURE OVERVIEW



\## 1.1 System Philosophy



Najia Community Bridge is built on a \*\*single deployable service\*\* architecture with \*\*two entry points\*\* sharing one service layer. This design ensures business logic is never duplicated, the web application experiences zero unnecessary network hops, and mobile/webhook consumers have a clean JSON API surface.



\### 1.1.1 Core Principles



| Principle | Description |

|-----------|-------------|

| \*\*Single Source of Truth\*\* | All business logic resides exclusively in the services layer |

| \*\*Thin Entry Points\*\* | Web actions and API routes only handle validation, auth, and response shaping |

| \*\*Direct Calls\*\* | Web app calls services directly in-process (no HTTP hop) |

| \*\*Shared Validation\*\* | Zod schemas are shared across all entry points |

| \*\*No Reverse Dependencies\*\* | Services never import from web actions or API routes |

| \*\*Cache First\*\* | Check cache before any database query |

| \*\*Rate Limit First\*\* | Enforce rate limits before any processing |

| \*\*Observability by Default\*\* | All operations logged, traced, and monitored |

| \*\*Least Privilege\*\* | Users have minimum permissions needed for their role |



\---



\## 1.2 High-Level Architecture



```

┌─────────────────────────────────────────────────────────────────────────────┐

│                           REQUEST FLOW                                     │

├─────────────────────────────────────────────────────────────────────────────┤

│                                                                             │

│   ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐   │

│   │   Web App    │     │  Mobile App  │     │  Webhooks / 3rd Party   │   │

│   │  (Browser)   │     │   (Expo)     │     │                          │   │

│   └──────┬───────┘     └──────┬───────┘     └──────────┬───────────────┘   │

│          │                    │                         │                   │

│          │ SSR/               │ HTTP/                   │ HTTP/             │

│          │ Server Functions   │ JSON                    │ JSON              │

│          ▼                    ▼                         ▼                   │

│   ┌──────────────────────────────────────────────────────────────────────┐  │

│   │                    TANSTACK START SERVER                            │  │

│   │                                                                     │  │

│   │  ┌─────────────────────┐          ┌─────────────────────────────┐  │  │

│   │  │   Server Functions  │          │      HONO API LAYER         │  │  │

│   │  │   (In-Process)      │◄────────►│      (Mounted at /api)      │  │  │

│   │  │                     │          │                             │  │  │

│   │  │  • Mutations        │          │  • Mobile API              │  │  │

│   │  │  • Loaders          │          │  • Webhook Endpoints        │  │  │

│   │  │  • SSR Rendering    │          │  • Third-party Integration │  │  │

│   │  └──────────┬──────────┘          └────────────┬────────────────┘  │  │

│   │             │                                   │                   │  │

│   │             └───────────────┬───────────────────┘                   │  │

│   │                             ▼                                       │  │

│   │                 ┌─────────────────────────┐                        │  │

│   │                 │    SHARED SERVICES LAYER │                        │  │

│   │                 │    (Single Source of    │                        │  │

│   │                 │     Truth)              │                        │  │

│   │                 └────────────┬────────────┘                        │  │

│   └──────────────────────────────┼─────────────────────────────────────┘  │

│                                  │                                        │

│                                  ▼                                        │

│   ┌──────────────────────────────────────────────────────────────────────┐  │

│   │              POSTGRESQL DATABASE + SQLITE CACHE                     │  │

│   │  ┌────────────────┐  ┌────────────────┐  ┌──────────────────────┐  │  │

│   │  │   PostgreSQL   │  │   SQLite Cache  │  │   SQLite Rate Limit  │  │  │

│   │  │   (Primary)    │  │   (Bun.sql)     │  │   (Bun.sql)          │  │  │

│   │  └────────────────┘  └────────────────┘  └──────────────────────┘  │  │

│   └──────────────────────────────────────────────────────────────────────┘  │

│                                                                             │

└─────────────────────────────────────────────────────────────────────────────┘

```



\---



\## 1.3 Technology Stack Summary



| Layer | Technology | Version | Rationale |

|-------|------------|---------|-----------|

| \*\*Runtime\*\* | Bun | 1.0+ | Fast startup, native TypeScript, built-in utilities |

| \*\*Web Framework\*\* | TanStack Start | Latest | Full-stack React, SSR, Server Functions, file-based routing |

| \*\*API Layer\*\* | Hono | Latest | Lightweight, fast, TypeScript-first, mounted in Start server |

| \*\*Mobile\*\* | React Native + Expo | 50+ | Cross-platform, hot reload, extensive ecosystem |

| \*\*ORM\*\* | Drizzle ORM | Latest | Type-safe, performant, excellent Postgres/SQLite support |

| \*\*Primary DB\*\* | PostgreSQL | 14+ | Relational integrity, complex queries, full-text search |

| \*\*Cache Store\*\* | SQLite | 3+ | Embedded, fast, managed via Bun.sql |

| \*\*Rate Limit Store\*\* | SQLite | 3+ | Embedded, fast, managed via Bun.sql |

| \*\*State Management\*\* | TanStack Query + Zustand | Latest | Server state + client state separation |

| \*\*UI\*\* | Tailwind CSS + shadcn/ui | Latest | Utility-first, accessible, consistent |

| \*\*Forms\*\* | TanStack Form | Latest | Type-safe, pairs with Server Functions |

| \*\*Validation\*\* | Zod | Latest | Runtime validation, shared schemas |

| \*\*RBAC\*\* | Custom + CASL | Latest | Fine-grained permission control |

| \*\*File Storage\*\* | Bunny CDN / ImageKit | - | Cost-effective, optimized media delivery |

| \*\*Identity Verification\*\* | NIMC NVS API + Onfido | - | Government ID verification (Nigeria) |

| \*\*Payment\*\* | Paystack | - | Nigerian payment processing |

| \*\*Realtime\*\* | WebSockets | - | Live discussion, case updates |

| \*\*Blog/CMS\*\* | MDX + Markdown | 2.0+ | Content management for blog and educational content |

| \*\*Hosting\*\* | Self-hosted VPS behind WireGuard VPN | - | Full control, data sovereignty |



\---



\## 1.4 Key Technical Decisions



\### 1.4.1 Why Bun?



| Factor | Benefit |

|--------|---------|

| \*\*Performance\*\* | Significantly faster cold-start than Node.js |

| \*\*Built-in Utilities\*\* | Bun.sql, Bun.cron, Bun.password, Bun.crypto |

| \*\*TypeScript Native\*\* | No compilation step needed |

| \*\*SQLite Integration\*\* | First-class support for SQLite cache |

| \*\*Package Manager\*\* | Fast, works with npm packages |

| \*\*Testing\*\* | Built-in test runner |



\### 1.4.2 Why TanStack Start + Hono?



| Decision | Rationale |

|----------|-----------|

| \*\*Start for Web\*\* | Full-stack React with SSR, Server Functions for direct service calls |

| \*\*Hono for API\*\* | Lightweight, fast, easy to mount inside Start server |

| \*\*Single Server\*\* | One deployable service, no microservices complexity |

| \*\*Shared Services\*\* | Both entry points use the same services layer |



\### 1.4.3 Why SQLite for Cache/Rate Limits?



| Factor | Benefit |

|--------|---------|

| \*\*Performance\*\* | Sub-millisecond read/write, in-memory option |

| \*\*Embedded\*\* | No separate service to deploy |

| \*\*ACID Compliance\*\* | Transaction-safe operations |

| \*\*Bun Native\*\* | Bun.sql provides excellent SQLite support |

| \*\*Simplicity\*\* | No network overhead, no connection pooling complexity |



\### 1.4.4 Why a Self-Hosted VPN Server?



| Factor | Benefit |

|--------|---------|

| \*\*Data Sovereignty\*\* | All citizen data remains within Nigeria |

| \*\*Compliance\*\* | NDPR compliance through local hosting |

| \*\*Control\*\* | Full control over security, backups, and scaling |

| \*\*Cost\*\* | Predictable costs, no per-request charges |

| \*\*Security\*\* | VPN protects against external threats |

| \*\*Performance\*\* | Direct access to NIMC NVS API |



\### 1.4.5 Why NIMC NVS API + Onfido?



| Factor | Benefit |

|--------|---------|

| \*\*NIMC NVS API\*\* | Official Nigerian identity verification |

| \*\*Government Recognition\*\* | Recognized by Nigerian authorities |

| \*\*Biometric Verification\*\* | Fingerprint and facial matching |

| \*\*Onfido\*\* | Document verification fallback |

| \*\*Compliance\*\* | Meets KYC requirements |

| \*\*Cost-Effective\*\* | NIMC API is government-subsidized and affordable |



\### 1.4.6 Why MDX for Blog Content?



| Factor | Benefit |

|--------|---------|

| \*\*Type-Safe\*\* | MDX supports TypeScript imports |

| \*\*Component-Driven\*\* | Reusable React components in content |

| \*\*Version Control\*\* | Content in Git, track changes |

| \*\*Performance\*\* | Static generation, fast load times |

| \*\*Flexibility\*\* | Mix of static content and dynamic components |

| \*\*Accessibility\*\* | Built-in support for accessibility features |



\### 1.4.7 Why CASL for RBAC?



| Factor | Benefit |

|--------|---------|

| \*\*Fine-Grained\*\* | Define permissions at the resource level |

| \*\*Flexible\*\* | Supports conditions and field-level permissions |

| \*\*Type-Safe\*\* | TypeScript support for permissions |

| \*\*Lightweight\*\* | Minimal overhead |

| \*\*Testable\*\* | Easy to test permission rules |

| \*\*Framework Agnostic\*\* | Works with any architecture |



\---



\# 2. PROJECT STRUCTURE



\## 2.1 Complete Folder Structure



```

platform/

│

├── app/                                    # TanStack Start Web Application

│   ├── routes/                             # File-based routing

│   │   ├── \_\_root.tsx                      # Root layout

│   │   ├── index.tsx                       # Home page

│   │   ├── cases/

│   │   │   ├── index.tsx                   # Cases list

│   │   │   ├── $caseId.tsx                 # Case detail

│   │   │   └── new.tsx                     # New case form

│   │   ├── polls/

│   │   │   ├── policy/

│   │   │   │   ├── index.tsx               # Policy polls list

│   │   │   │   └── $pollId.tsx             # Poll detail

│   │   │   └── confidence/

│   │   │       ├── index.tsx               # Confidence votes list

│   │   │       └── $officialId.tsx         # Official detail

│   │   ├── lawyers/

│   │   │   ├── index.tsx                   # Lawyer directory

│   │   │   └── $lawyerId.tsx               # Lawyer profile

│   │   ├── blog/                           # Blog routes

│   │   │   ├── index.tsx                   # Blog homepage

│   │   │   ├── category/

│   │   │   │   └── $category.tsx           # Category page

│   │   │   ├── author/

│   │   │   │   └── $authorId.tsx           # Author page

│   │   │   └── $slug.tsx                   # Individual post

│   │   ├── admin/                          # Admin routes (RBAC protected)

│   │   │   ├── dashboard.tsx               # Admin dashboard

│   │   │   ├── polls.tsx                   # Poll management

│   │   │   ├── lawyers.tsx                 # Lawyer management

│   │   │   ├── moderation.tsx              # Moderation queue

│   │   │   ├── blog.tsx                    # Blog management

│   │   │   └── users.tsx                   # User management (admin only)

│   │   └── profile/                        # User profile (RBAC aware)

│   │       ├── index.tsx                   # Profile view

│   │       └── settings.tsx                # Profile settings

│   │

│   ├── actions/                            # Server Function wrappers

│   │   ├── cases.actions.ts                # Case server actions

│   │   ├── evidence.actions.ts             # Evidence server actions

│   │   ├── votes.actions.ts                # Vote server actions

│   │   ├── lawyers.actions.ts              # Lawyer server actions

│   │   ├── polls.actions.ts                # Poll server actions

│   │   ├── blog.actions.ts                 # Blog server actions

│   │   ├── auth.actions.ts                 # Auth server actions

│   │   └── admin.actions.ts                # Admin server actions (RBAC)

│   │

│   ├── components/                         # Reusable UI components

│   │   ├── ui/                             # shadcn/ui components

│   │   ├── forms/                          # Form components

│   │   ├── evidence/                       # Evidence display components

│   │   ├── polls/                          # Poll display components

│   │   ├── lawyers/                        # Lawyer display components

│   │   ├── blog/                           # Blog components

│   │   │   ├── PostCard.tsx                # Blog post card

│   │   │   ├── CategoryFilter.tsx          # Category filter

│   │   │   ├── AuthorBio.tsx               # Author bio component

│   │   │   ├── NewsletterSignup.tsx        # Newsletter signup

│   │   │   ├── ReadingProgress.tsx         # Reading progress indicator

│   │   │   ├── TableOfContents.tsx         # Table of contents

│   │   │   └── ShareButtons.tsx            # Social share buttons

│   │   ├── auth/                           # Authentication components

│   │   │   ├── LoginForm.tsx               # Login form

│   │   │   ├── RegisterForm.tsx            # Registration form

│   │   │   └── ProtectedRoute.tsx          # RBAC route guard

│   │   └── admin/                          # Admin components (RBAC)

│   │       ├── UserManagement.tsx          # User management

│   │       ├── PermissionMatrix.tsx        # Permission viewer

│   │       └── AuditLog.tsx                # Audit log viewer

│   │

│   ├── hooks/                              # Custom React hooks

│   │   ├── useAuth.ts

│   │   ├── useCases.ts

│   │   ├── usePolls.ts

│   │   ├── useEvidence.ts

│   │   ├── useBlog.ts

│   │   └── usePermissions.ts               # RBAC permission hook

│   │

│   ├── lib/                                # Frontend utilities

│   │   ├── permissions.ts                  # Permission helpers

│   │   └── ability.ts                      # CASL ability configuration

│   │

│   ├── styles/                             # CSS and styling

│   │   └── globals.css

│   │

│   ├── content/                            # Blog and educational content

│   │   ├── blog/                           # Blog posts

│   │   │   ├── civic-engagement/

│   │   │   ├── know-your-rights/

│   │   │   ├── legal-guides/

│   │   │   ├── platform-how-to/

│   │   │   ├── community-voices/

│   │   │   ├── policy-watch/

│   │   │   ├── lawyer-insights/

│   │   │   └── transparency-reports/

│   │   ├── legal-literacy/                 # Legal literacy modules

│   │   │   ├── introduction-to-law/

│   │   │   ├── civil-rights/

│   │   │   ├── landlord-tenant/

│   │   │   ├── consumer-protection/

│   │   │   ├── employment-law/

│   │   │   ├── family-law/

│   │   │   ├── criminal-law-basics/

│   │   │   └── alternative-dispute-resolution/

│   │   └── pages/                          # Static pages

│   │       ├── about.mdx

│   │       ├── terms.mdx

│   │       ├── privacy.mdx

│   │       └── faq.mdx

│   │

│   └── client.tsx                          # Client entry point

│

├── server/                                 # Server-side code

│   ├── api/                                # Hono API Layer

│   │   ├── index.ts                        # Root Hono instance

│   │   ├── middleware/

│   │   │   ├── auth.ts                     # JWT verification

│   │   │   ├── rateLimit.ts                # Rate limit middleware

│   │   │   ├── cache.ts                    # Cache middleware

│   │   │   ├── rbac.ts                     # RBAC middleware

│   │   │   ├── requestLogger.ts            # Logging middleware

│   │   │   └── errorHandler.ts             # Global error handling

│   │   └── routes/

│   │       ├── cases.routes.ts             # Case API endpoints

│   │       ├── evidence.routes.ts          # Evidence API endpoints

│   │       ├── votes.routes.ts             # Vote API endpoints

│   │       ├── polls.routes.ts             # Poll API endpoints

│   │       ├── lawyers.routes.ts           # Lawyer API endpoints

│   │       ├── blog.routes.ts              # Blog API endpoints

│   │       ├── auth.routes.ts              # Auth API endpoints

│   │       ├── admin.routes.ts             # Admin API endpoints (RBAC)

│   │       └── webhooks.routes.ts          # Webhook endpoints

│   │

│   └── entry.ts                            # Server entry point

│

├── services/                               # ALL business logic

│   ├── case.service.ts                     # Case management

│   ├── evidence.service.ts                 # Evidence management

│   ├── deepfake.service.ts                 # AI detection service

│   ├── vote.service.ts                     # Voting business logic

│   ├── poll.service.ts                     # Poll management

│   ├── lawyer.service.ts                   # Lawyer management

│   ├── moderation.service.ts               # Content moderation

│   ├── notification.service.ts             # Notifications

│   ├── auth.service.ts                     # Authentication logic

│   ├── verification.service.ts             # NIMC + Onfido verification

│   ├── blog.service.ts                     # Blog and content management

│   ├── rbac.service.ts                     # RBAC management

│   └── audit.service.ts                    # Audit logging

│

├── lib/                                    # Shared utilities

│   ├── rbac/                               # RBAC utilities

│   │   ├── ability.ts                      # CASL ability definition

│   │   ├── permissions.ts                  # Permission definitions

│   │   ├── roles.ts                        # Role definitions

│   │   ├── rules.ts                        # Permission rules

│   │   └── middleware.ts                   # RBAC middleware helpers

│   ├── validation/                         # Zod schemas

│   │   ├── case.schema.ts

│   │   ├── vote.schema.ts

│   │   ├── poll.schema.ts

│   │   ├── lawyer.schema.ts

│   │   ├── blog.schema.ts                  # Blog validation schemas

│   │   └── rbac.schema.ts                  # RBAC validation schemas

│   ├── mdx/                                # MDX utilities

│   │   ├── compile.ts                      # MDX compilation

│   │   ├── render.ts                       # MDX rendering

│   │   └── components.ts                   # MDX components

│   ├── jwt.ts                              # JWT utilities

│   ├── mailer.ts                           # Email utilities

│   ├── logger.ts                           # Logging utilities

│   ├── metrics.ts                          # Observability metrics

│   ├── crypto.ts                           # Cryptographic utilities

│   └── nimc.ts                             # NIMC NVS API client

│

├── cache/                                  # SQLite cache layer

│   ├── client.ts                           # SQLite connection (Bun.sql)

│   ├── entries.ts                          # cache\_entries table operations

│   ├── session.ts                          # Session cache

│   ├── query.ts                            # Query cache

│   ├── poll.ts                             # Poll results cache

│   ├── hash.ts                             # Evidence hash cache

│   ├── config.ts                           # Configuration cache

│   ├── verification.ts                     # Verification result cache

│   ├── blog.ts                             # Blog content cache

│   ├── rbac.ts                             # RBAC permission cache

│   └── cleanup.ts                          # Cache cleanup (Bun.cron)

│

├── rate-limit/                             # Rate limit layer

│   ├── client.ts                           # SQLite connection (Bun.sql)

│   ├── token.ts                            # Token bucket algorithm

│   ├── sliding.ts                          # Sliding window algorithm

│   ├── middleware.ts                       # Rate limit middleware

│   └── cleanup.ts                          # Rate limit cleanup (Bun.cron)

│

├── db/                                     # Database layer

│   ├── schema/                             # Drizzle schemas

│   │   ├── users.schema.ts

│   │   ├── cases.schema.ts

│   │   ├── evidence.schema.ts

│   │   ├── votes.schema.ts

│   │   ├── polls.schema.ts

│   │   ├── officials.schema.ts

│   │   ├── lawyers.schema.ts

│   │   ├── jurisdictions.schema.ts

│   │   ├── blog.schema.ts                  # Blog tables

│   │   ├── legal-literacy.schema.ts        # Legal literacy tables

│   │   ├── rbac.schema.ts                  # RBAC tables

│   │   ├── audit.schema.ts                 # Audit log tables

│   │   ├── relationships.schema.ts         # Cross-entity relationship tables

│   │   └── moderation.schema.ts

│   ├── migrations/                         # Drizzle migrations

│   │   ├── 0000\_initial.sql

│   │   ├── 0001\_polls.sql

│   │   ├── 0002\_blog.sql

│   │   ├── 0003\_rbac.sql

│   │   └── ...

│   ├── client.ts                           # Drizzle client

│   └── seed.ts                             # Seed data (includes default roles)

│

├── mobile/                                 # Expo React Native app

│   ├── app/                                # Expo app directory

│   │   ├── (tabs)/                         # Tab navigation

│   │   ├── cases/                          # Case screens

│   │   ├── polls/                          # Poll screens

│   │   ├── lawyers/                        # Lawyer screens

│   │   └── blog/                           # Blog screens

│   ├── components/                         # Mobile components

│   ├── hooks/                              # Mobile hooks

│   ├── api/                                # API client

│   ├── store/                              # Zustand store

│   └── app.json                            # Expo configuration

│

├── shared-types/                           # Shared TypeScript types

│   ├── index.ts

│   ├── cases.ts

│   ├── votes.ts

│   ├── polls.ts

│   ├── lawyers.ts

│   ├── blog.ts                             # Blog types

│   └── rbac.ts                             # RBAC types

│

├── scripts/                                # Build and utility scripts

│   ├── deploy.sh

│   ├── migrate.sh

│   ├── seed.sh

│   ├── cache-cleanup.ts

│   ├── mdx-build.ts                        # Build MDX content

│   └── seed-rbac.ts                        # Seed RBAC permissions

│

├── tests/                                  # Test files

│   ├── unit/

│   │   ├── services/

│   │   ├── lib/

│   │   └── rbac/                           # RBAC unit tests

│   ├── integration/

│   │   ├── api/

│   │   └── cache/

│   └── e2e/

│

├── docs/                                   # Documentation

│   ├── README.md

│   ├── ARCHITECTURE.md                     # This file

│   ├── API.md                              # API documentation

│   ├── RBAC.md                             # RBAC documentation

│   ├── DEPLOYMENT.md                       # Deployment guide

│   └── CONTRIBUTING.md                     # Contribution guidelines

│

├── .env                                    # Environment variables

├── .env.example                            # Example environment

├── package.json                            # Dependencies

├── tsconfig.json                           # TypeScript configuration

├── drizzle.config.ts                       # Drizzle configuration

├── bunfig.toml                             # Bun configuration

├── mdx.config.ts                           # MDX configuration

└── tailwind.config.js                      # Tailwind configuration

```



\---



\## 2.2 Dependency Graph



```

┌─────────────────────────────────────────────────────────────────────┐

│                        DEPENDENCY DIRECTION                         │

│                         (Services never import up)                  │

├─────────────────────────────────────────────────────────────────────┤

│                                                                     │

│   ┌─────────────────────────────────────────────────────────────────┐│

│   │  APP (Web)          SERVER (API)        MOBILE (Expo)         ││

│   │  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐   ││

│   │  │   Actions     │  │   Routes      │  │   API Client     │   ││

│   │  │   Components  │  │   Middleware  │  │   Screens        │   ││

│   │  │   Hooks       │  │   RBAC        │  │   Store          │   ││

│   │  │   Content     │  │   Index       │  │                  │   ││

│   │  └───────┬───────┘  └───────┬───────┘  └──────────────────┘   ││

│   │          │                  │                                   ││

│   │          ▼                  ▼                                   ││

│   │  ┌───────────────────────────────────────────────────────────┐  ││

│   │  │              SHARED-TYPES (TypeScript types)             │  ││

│   │  └───────────────────────────────────────────────────────────┘  ││

│   │                                                                 ││

│   │  ┌───────────────────────────────────────────────────────────┐  ││

│   │  │                    LIB (Utilities)                        │  ││

│   │  │  • Validation (Zod)  • JWT    • Logger    • Crypto      │  ││

│   │  │  • NIMC Client       • Mailer  • Metrics   • MDX        │  ││

│   │  │  • RBAC (CASL)       • Roles   • Permissions            │  ││

│   │  └───────────────────────────────────────────────────────────┘  ││

│   │                                                                 ││

│   │  ┌───────────────────────────────────────────────────────────┐  ││

│   │  │                 SERVICES (Business Logic)                │  ││

│   │  │  Case   Evidence   Vote   Poll   Lawyer   Moderation    │  ││

│   │  │  Auth   Verification   Blog   Notification   RBAC       │  ││

│   │  │  Audit                                                │  ││

│   │  └───────────────────────────────────────────────────────────┘  ││

│   │                                                                 ││

│   │  ┌───────────────────────────────────────────────────────────┐  ││

│   │  │                CACHE \& RATE-LIMIT (SQLite)               │  ││

│   │  │  Session   Query   Poll   Hash   Verification   Blog     │  ││

│   │  │  RBAC      Token   Sliding                               │  ││

│   │  └───────────────────────────────────────────────────────────┘  ││

│   │                                                                 ││

│   │  ┌───────────────────────────────────────────────────────────┐  ││

│   │  │            DB (PostgreSQL + Drizzle ORM)                 │  ││

│   │  │  Schema   Migrations   Client   Queries                  │  ││

│   │  │  Blog     Legal-Literacy   RBAC   Audit                  │  ││

│   │  └───────────────────────────────────────────────────────────┘  ││

│   └─────────────────────────────────────────────────────────────────┘│

│                                                                     │

│   IMPORT RULE: APP → SERVICES → DB                                   │

│   IMPORT RULE: API → SERVICES → DB                                  │

│   IMPORT RULE: SERVICES ══╪══ APP (No reverse imports)            │

│                                                                     │

└─────────────────────────────────────────────────────────────────────┘

```



\---



\# 3. ENTRY POINTS



\## 3.1 Web Application — TanStack Start



\### 3.1.1 Server Functions



Server Functions are the web app's entry point for mutations and data loading. They call services directly in-process.



\*\*Characteristics:\*\*

\- No HTTP overhead for web app operations

\- Type-safe with `createServerFn`

\- Shared validation with API layer via Zod schemas

\- SSR-compatible

\- RBAC enforcement at the service layer



\*\*Structure:\*\*

```typescript

// app/actions/blog.actions.ts

import { requirePermission } from '\~/lib/rbac/middleware'



export const getBlogPostsAction = createServerFn({ method: 'GET' })

&#x20; .validator(blogFiltersSchema)

&#x20; .handler(async ({ data }) => {

&#x20;   // 1. Call blog service

&#x20;   // 2. Return result

&#x20; })



export const publishBlogPostAction = createServerFn({ method: 'POST' })

&#x20; .validator(publishSchema)

&#x20; .handler(async ({ data, context }) => {

&#x20;   // 1. Auth check (context.user)

&#x20;   // 2. RBAC: require 'blog:publish' permission

&#x20;   await requirePermission(context.user, 'blog:publish')

&#x20;   // 3. Call blog service

&#x20;   // 4. Return result

&#x20; })

```



\### 3.1.2 Routing with RBAC Protection



```

app/routes/

├── \_\_root.tsx          # Root layout with RBAC provider

├── index.tsx           # Home page (public)

├── cases/

│   ├── index.tsx       # /cases (authenticated)

│   ├── $caseId.tsx     # /cases/:caseId (authenticated + case access)

│   └── new.tsx         # /cases/new (authenticated)

├── polls/

│   ├── policy/

│   │   ├── index.tsx   # /polls/policy (public)

│   │   └── $pollId.tsx # /polls/policy/:pollId (public)

│   └── confidence/

│       ├── index.tsx   # /polls/confidence (public)

│       └── $officialId.tsx # /polls/confidence/:officialId (public)

├── lawyers/

│   ├── index.tsx       # /lawyers (public)

│   └── $lawyerId.tsx   # /lawyers/:lawyerId (public)

├── blog/

│   ├── index.tsx       # /blog (public)

│   ├── category/

│   │   └── $category.tsx # /blog/category/:category (public)

│   ├── author/

│   │   └── $authorId.tsx # /blog/author/:authorId (public)

│   └── $slug.tsx       # /blog/:slug (public)

├── admin/              # All admin routes require 'admin' role

│   ├── dashboard.tsx   # /admin/dashboard (admin only)

│   ├── polls.tsx       # /admin/polls (moderator+)

│   ├── lawyers.tsx     # /admin/lawyers (moderator+)

│   ├── moderation.tsx  # /admin/moderation (moderator+)

│   ├── blog.tsx        # /admin/blog (writer+)

│   └── users.tsx       # /admin/users (admin only)

└── profile/            # Authenticated users only

&#x20;   ├── index.tsx       # /profile (authenticated)

&#x20;   └── settings.tsx    # /profile/settings (authenticated)

```



\### 3.1.3 SSR and Hydration



| Aspect | Implementation |

|--------|----------------|

| Rendering | Server-side rendering (SSR) |

| Hydration | TanStack Start's client hydration |

| Data Loading | Server Functions + TanStack Query |

| Caching | HTTP cache headers + Cache layer |

| Blog Content | MDX compiled at build time, SSR for dynamic data |

| RBAC | Permissions checked on server, hydrated to client |



\---



\## 3.2 API Layer — Hono



\### 3.2.1 Overview



Hono is mounted as a JSON API layer inside the TanStack Start server, handling `/api/\*` requests. This serves:

\- Mobile application (Expo)

\- Webhook endpoints (Paystack, NIMC, Onfido)

\- Third-party integrations

\- Future public API consumers



\### 3.2.2 Middleware Stack



```

┌─────────────────────────────────────────────────────────────────────┐

│                      API MIDDLEWARE STACK                          │

├─────────────────────────────────────────────────────────────────────┤

│                                                                     │

│   Request                                                           │

│      │                                                              │

│      ▼                                                              │

│   1. CORS (hono/cors)                                                │

│      - Configured for mobile app origins, allows credentials         │

│      ▼                                                              │

│   2. Request Logger                                                  │

│      - Logs method, path, status, duration, request ID for tracing   │

│      ▼                                                              │

│   3. Rate Limiter                                                    │

│      - SQLite-backed, per user / per IP / per endpoint               │

│      ▼                                                              │

│   4. Authentication (JWT)                                            │

│      - Extracts + validates token, attaches user to context,         │

│        checks session cache                                          │

│      ▼                                                              │

│   5. RBAC Middleware                                                 │

│      - Checks permissions via CASL ability, caches result in SQLite, │

│        denies with 403 if insufficient                               │

│      ▼                                                              │

│   6. Cache Check                                                     │

│      - GET requests only; returns cached response if available       │

│      ▼                                                              │

│   7. Route Handler                                                   │

│      - Calls services layer, stores response in cache\_entries        │

│      ▼                                                              │

│   8. Audit Logger                                                     │

│      - Logs all mutations and sensitive reads                        │

│      ▼                                                              │

│   9. Error Handler                                                    │

│      - Catches exceptions, returns consistent error format           │

│      ▼                                                              │

│   Response                                                           │

│                                                                     │

└─────────────────────────────────────────────────────────────────────┘

```



\### 3.2.3 API Routes with RBAC Requirements



```

/api

├── /auth                    # Public (no RBAC)

│   ├── POST /register

│   ├── POST /login

│   ├── POST /logout

│   ├── POST /verify-email

│   ├── POST /verify-id      # Requires 'auth:verify' permission

│   └── GET /me              # Requires authenticated

│

├── /cases                   # Authenticated users

│   ├── GET /                # Requires 'cases:read' permission

│   ├── POST /               # Requires 'cases:create' permission

│   ├── GET /:caseId         # Requires 'cases:read' + case access

│   ├── PUT /:caseId         # Requires 'cases:update' + case access

│   ├── POST /:caseId/evidence # Requires 'evidence:create'

│   ├── POST /:caseId/consent  # Requires 'cases:update'

│   └── GET /:caseId/status  # Requires 'cases:read'

│

├── /evidence                # Authenticated users

│   ├── POST /upload         # Requires 'evidence:create'

│   ├── GET /:evidenceId     # Requires 'evidence:read'

│   ├── GET /:evidenceId/verify # Requires 'evidence:verify'

│   └── POST /:evidenceId/appeal # Requires 'evidence:appeal'

│

├── /polls                   # Mixed public/authenticated

│   ├── GET /policy          # Public

│   ├── POST /policy         # Requires 'polls:create' (moderator+)

│   ├── GET /policy/:pollId  # Public

│   ├── POST /policy/:pollId/vote # Requires 'polls:vote'

│   ├── GET /confidence      # Public

│   ├── GET /confidence/:officialId # Public

│   └── POST /confidence/:officialId/vote # Requires 'polls:vote'

│

├── /lawyers                 # Mixed public/authenticated

│   ├── GET /                # Public

│   ├── POST /               # Requires 'lawyer:register'

│   ├── GET /:lawyerId       # Public

│   ├── POST /:lawyerId/match # Requires 'lawyer:match'

│   ├── GET /:lawyerId/reviews # Public

│   └── POST /:lawyerId/review # Requires 'review:create'

│

├── /blog                    # Public read, authenticated write

│   ├── GET /                # Public

│   ├── GET /:slug           # Public

│   ├── GET /category/:category # Public

│   ├── GET /author/:authorId # Public

│   ├── POST /               # Requires 'blog:create' (writer+)

│   ├── PUT /:slug           # Requires 'blog:update' (writer+)

│   ├── DELETE /:slug        # Requires 'blog:delete' (moderator+)

│   ├── GET /:slug/comments  # Public

│   └── POST /:slug/comments # Requires 'blog:comment'

│

├── /legal-literacy          # Mixed public/authenticated

│   ├── GET /                # Public

│   ├── GET /:slug           # Public

│   ├── POST /:slug/enroll   # Requires 'literacy:enroll'

│   ├── GET /:slug/progress  # Requires 'literacy:progress'

│   └── POST /:slug/quiz     # Requires 'literacy:quiz'

│

├── /admin                   # All endpoints require admin/moderator

│   ├── GET /dashboard       # Requires 'admin:dashboard'

│   ├── GET /users           # Requires 'admin:users' (admin only)

│   ├── PUT /users/:userId   # Requires 'admin:users' (admin only)

│   ├── GET /moderation-queue # Requires 'admin:moderation'

│   ├── POST /moderate       # Requires 'admin:moderation'

│   ├── GET /polls           # Requires 'admin:polls'

│   ├── POST /polls          # Requires 'admin:polls'

│   ├── GET /blog            # Requires 'admin:blog'

│   ├── POST /blog           # Requires 'admin:blog'

│   ├── GET /permissions     # Requires 'admin:permissions' (admin only)

│   └── PUT /permissions     # Requires 'admin:permissions' (admin only)

│

└── /webhooks                # Public (signature verified)

&#x20;   ├── POST /paystack

&#x20;   ├── POST /nimc

&#x20;   └── POST /onfido

```



\---



\## 3.3 Mobile Application — Expo



\### 3.3.1 Architecture



The mobile app consumes the Hono API over HTTP/JSON. It's a React Native Expo application with:



| Component | Technology |

|-----------|------------|

| Framework | Expo SDK 50+ |

| Navigation | Expo Router (file-based) |

| State | Zustand + TanStack Query |

| API Client | fetch (with interceptors) |

| Storage | Expo SecureStore + AsyncStorage |

| Push Notifications | Expo Notifications |

| Blog | In-app webview or native rendering |

| RBAC | Client-side permission checks + API enforcement |



\### 3.3.2 API Client with RBAC



```typescript

// mobile/api/client.ts

const API\_BASE = process.env.EXPO\_PUBLIC\_API\_URL



const apiClient = {

&#x20; async request<T>(endpoint: string, options?: RequestInit): Promise<T> {

&#x20;   const response = await fetch(`${API\_BASE}${endpoint}`, {

&#x20;     ...options,

&#x20;     headers: {

&#x20;       'Content-Type': 'application/json',

&#x20;       ...(await getAuthHeaders()),

&#x20;       ...options?.headers,

&#x20;     },

&#x20;   })



&#x20;   if (response.status === 403) {

&#x20;     throw new PermissionError('You do not have permission to perform this action')

&#x20;   }



&#x20;   if (!response.ok) {

&#x20;     const error = await response.json()

&#x20;     throw new ApiError(response.status, error.message)

&#x20;   }



&#x20;   return response.json()

&#x20; }

}



// Hook for checking permissions in UI

export function usePermissions() {

&#x20; const user = useUserStore(state => state.user)



&#x20; const hasPermission = (permission: string) => {

&#x20;   return user?.permissions?.includes(permission) ?? false

&#x20; }



&#x20; const hasRole = (role: string) => {

&#x20;   return user?.role === role

&#x20; }



&#x20; return { hasPermission, hasRole }

}

```



\### 3.3.3 Offline Capabilities



| Feature | Implementation |

|---------|----------------|

| Evidence Upload Queue | AsyncStorage queue with retry |

| Cached Poll Results | Query client persistence |

| Offline Voting | Local vote storage, sync on reconnect |

| Blog Reading | Sync posts for offline reading |

| Legal Literacy | Sync modules for offline access |

| Permissions Cache | Cache permissions for offline UI rendering |



\---



\# 4. ROLE-BASED ACCESS CONTROL (RBAC)



\## 4.1 Overview



The platform implements a comprehensive RBAC system using CASL. Permissions are defined at a granular level, allowing fine-grained control over user actions.



\### 4.1.1 RBAC Principles



| Principle | Description |

|-----------|-------------|

| \*\*Least Privilege\*\* | Users have only the permissions they need |

| \*\*Role-Based\*\* | Permissions are assigned through roles |

| \*\*Resource-Based\*\* | Permissions are defined per resource |

| \*\*Action-Based\*\* | Permissions define specific actions (CRUD + custom) |

| \*\*Condition-Based\*\* | Permissions can include conditions (e.g., "own case") |

| \*\*Auditable\*\* | All permission checks are logged |

| \*\*Cacheable\*\* | Permissions are cached for performance |



\---



\## 4.2 User Roles



\### 4.2.1 Role Hierarchy



```

┌─────────────────────────────────────────────────────────────────────┐

│                         ROLE HIERARCHY                             │

├─────────────────────────────────────────────────────────────────────┤

│                                                                     │

│   ADMIN (highest)                                                  │

│   ───────────────                                                  │

│   • Full system access                                             │

│   • Can manage users, roles, permissions                          │

│   • Can view all data                                             │

│   • System configuration                                          │

│                                                                     │

│   MODERATOR                                                        │

│   ───────────                                                      │

│   • Can manage content (polls, comments, evidence)                │

│   • Can review and moderate flagged content                       │

│   • Can view moderation queue                                     │

│   • Cannot manage users or system configuration                   │

│                                                                     │

│   WRITER                                                           │

│   ───────────                                                      │

│   • Can create and edit blog posts                                │

│   • Can create legal literacy modules                             │

│   • Cannot publish without moderation approval                    │

│   • Cannot manage other users                                     │

│                                                                     │

│   LAWYER                                                           │

│   ───────────                                                      │

│   • Can register as legal professional                            │

│   • Can view and accept cases                                     │

│   • Can provide legal advice                                      │

│   • Can view evidence in assigned cases                           │

│                                                                     │

│   CITIZEN (default)                                                │

│   ───────────────                                                  │

│   • Can participate in polls                                       │

│   • Can create and manage own cases                              │

│   • Can upload evidence                                           │

│   • Can read blog content                                         │

│   • Can comment on blog posts                                     │

│                                                                     │

└─────────────────────────────────────────────────────────────────────┘

```



> \*\*Note on hierarchy vs. inheritance:\*\* `ROLE\_HIERARCHY` (below) is a numeric ranking used for display/ordering and simple "at least this seniority" checks. Actual permission grants are defined explicitly per-role in `defineAbilityFor` (§4.4.1) rather than inherited automatically from the number — a lawyer does not automatically get everything a citizen has just because 40 > 10. Keeping these two mechanisms distinct (rather than letting the numeric hierarchy silently drive grants) is intentional so permission changes stay explicit and auditable.



\### 4.2.2 Role Definitions



```typescript

// lib/rbac/roles.ts

export const ROLES = {

&#x20; ADMIN: 'admin',

&#x20; MODERATOR: 'moderator',

&#x20; WRITER: 'writer',

&#x20; LAWYER: 'lawyer',

&#x20; CITIZEN: 'citizen',

} as const



export type UserRole = typeof ROLES\[keyof typeof ROLES]



export const ROLE\_HIERARCHY: Record<UserRole, number> = {

&#x20; \[ROLES.ADMIN]: 100,

&#x20; \[ROLES.MODERATOR]: 70,

&#x20; \[ROLES.WRITER]: 50,

&#x20; \[ROLES.LAWYER]: 40,

&#x20; \[ROLES.CITIZEN]: 10,

}



export const DEFAULT\_ROLE = ROLES.CITIZEN

```



\---



\## 4.3 Permissions Matrix



\### 4.3.1 Resource-Based Permissions



This is the canonical permissions matrix for the platform. It is referenced (not repeated) elsewhere in this document — see §12.2.



| Resource | Citizen | Lawyer | Writer | Moderator | Admin |

|----------|---------|--------|--------|-----------|-------|

| \*\*Profile\*\* | | | | | |

| profile:read | ✅ Self | ✅ Self | ✅ Self | ✅ Self | ✅ All |

| profile:update | ✅ Self | ✅ Self | ✅ Self | ✅ Self | ✅ All |

| profile:verify | ❌ | ❌ | ❌ | ❌ | ✅ |

| \*\*Cases\*\* | | | | | |

| cases:read | ✅ Own | ✅ Own+ | ✅ Own | ✅ All | ✅ All |

| cases:create | ✅ | ✅ | ✅ | ✅ | ✅ |

| cases:update | ✅ Own | ✅ Own+ | ❌ | ✅ All | ✅ All |

| cases:delete | ❌ | ❌ | ❌ | ❌ | ✅ |

| cases:consent | ✅ Own | ❌ | ❌ | ❌ | ✅ |

| \*\*Evidence\*\* | | | | | |

| evidence:create | ✅ Own | ✅ Own+ | ❌ | ✅ All | ✅ All |

| evidence:read | ✅ Own | ✅ Own+ | ❌ | ✅ All | ✅ All |

| evidence:verify | ❌ | ❌ | ❌ | ✅ | ✅ |

| evidence:appeal | ✅ | ❌ | ❌ | ❌ | ✅ |

| \*\*Polls\*\* | | | | | |

| polls:read | ✅ | ✅ | ✅ | ✅ | ✅ |

| polls:vote | ✅ | ✅ | ✅ | ✅ | ✅ |

| polls:create | ❌ | ❌ | ❌ | ✅ | ✅ |

| polls:update | ❌ | ❌ | ❌ | ✅ | ✅ |

| polls:delete | ❌ | ❌ | ❌ | ✅ | ✅ |

| \*\*Confidence\*\* | | | | | |

| confidence:read | ✅ | ✅ | ✅ | ✅ | ✅ |

| confidence:vote | ✅ | ✅ | ✅ | ✅ | ✅ |

| confidence:create | ❌ | ❌ | ❌ | ✅ | ✅ |

| \*\*Lawyers\*\* | | | | | |

| lawyer:read | ✅ | ✅ | ✅ | ✅ | ✅ |

| lawyer:register | ❌ | ✅ | ❌ | ❌ | ✅ |

| lawyer:match | ✅ | ✅ | ❌ | ✅ | ✅ |

| lawyer:verify | ❌ | ❌ | ❌ | ✅ | ✅ |

| lawyer:delete | ❌ | ❌ | ❌ | ❌ | ✅ |

| \*\*Reviews\*\* | | | | | |

| review:create | ✅ | ❌ | ❌ | ❌ | ✅ |

| review:read | ✅ | ✅ | ✅ | ✅ | ✅ |

| review:moderate | ❌ | ❌ | ❌ | ✅ | ✅ |

| review:delete | ❌ | ❌ | ❌ | ❌ | ✅ |

| \*\*Blog\*\* | | | | | |

| blog:read | ✅ | ✅ | ✅ | ✅ | ✅ |

| blog:comment | ✅ | ✅ | ✅ | ✅ | ✅ |

| blog:create | ❌ | ❌ | ✅ | ✅ | ✅ |

| blog:update | ❌ | ❌ | ✅ Own | ✅ All | ✅ All |

| blog:delete | ❌ | ❌ | ❌ | ✅ | ✅ |

| blog:publish | ❌ | ❌ | ❌ | ✅ | ✅ |

| \*\*Legal Literacy\*\* | | | | | |

| literacy:read | ✅ | ✅ | ✅ | ✅ | ✅ |

| literacy:enroll | ✅ | ✅ | ✅ | ✅ | ✅ |

| literacy:quiz | ✅ | ✅ | ✅ | ✅ | ✅ |

| literacy:create | ❌ | ❌ | ✅ | ✅ | ✅ |

| literacy:update | ❌ | ❌ | ✅ Own | ✅ All | ✅ All |

| literacy:delete | ❌ | ❌ | ❌ | ✅ | ✅ |

| \*\*Moderation\*\* | | | | | |

| moderation:view | ❌ | ❌ | ❌ | ✅ | ✅ |

| moderation:act | ❌ | ❌ | ❌ | ✅ | ✅ |

| moderation:appeal | ❌ | ❌ | ❌ | ❌ | ✅ |

| \*\*Admin\*\* | | | | | |

| admin:dashboard | ❌ | ❌ | ❌ | ✅ | ✅ |

| admin:users | ❌ | ❌ | ❌ | ❌ | ✅ |

| admin:permissions | ❌ | ❌ | ❌ | ❌ | ✅ |

| admin:system | ❌ | ❌ | ❌ | ❌ | ✅ |

| admin:audit | ❌ | ❌ | ❌ | ❌ | ✅ |



\---



\## 4.4 Permission Definitions



\### 4.4.1 CASL Ability Definition



```typescript

// lib/rbac/ability.ts

import { AbilityBuilder, createMongoAbility } from '@casl/ability'

import { UserRole } from './roles'



export type Actions =

&#x20; | 'read' | 'create' | 'update' | 'delete'

&#x20; | 'manage' | 'publish' | 'vote' | 'verify'

&#x20; | 'match' | 'register' | 'moderate' | 'appeal'

&#x20; | 'enroll' | 'quiz' | 'consent'



export type Subjects =

&#x20; | 'Profile' | 'Case' | 'Evidence' | 'Poll'

&#x20; | 'Confidence' | 'Lawyer' | 'Review' | 'Blog'

&#x20; | 'LegalLiteracy' | 'Moderation' | 'Admin'

&#x20; | 'User' | 'Permission' | 'all'



export type Ability = ReturnType<typeof createMongoAbility>



export function defineAbilityFor(user: {

&#x20; id: string

&#x20; role: UserRole

&#x20; permissions: string\[]

}) {

&#x20; const { can, build } = new AbilityBuilder(createMongoAbility)



&#x20; const isAdmin = user.role === 'admin'

&#x20; const isModerator = user.role === 'moderator' || isAdmin

&#x20; const isWriter = user.role === 'writer' || isModerator

&#x20; const isLawyer = user.role === 'lawyer'

&#x20; // Citizen-level grants also apply to lawyers, since a lawyer is a

&#x20; // verified citizen with additional case-side permissions layered on top.

&#x20; const isCitizen = user.role === 'citizen' || isLawyer



&#x20; // Admin: full access to everything

&#x20; if (isAdmin) {

&#x20;   can('manage', 'all')

&#x20;   return build()

&#x20; }



&#x20; // Profile: self-management for all authenticated users

&#x20; can('read', 'Profile', { userId: user.id })

&#x20; can('update', 'Profile', { userId: user.id })



&#x20; // Cases: citizens can manage their own cases

&#x20; if (isCitizen) {

&#x20;   can('read', 'Case', { complainantId: user.id })

&#x20;   can('read', 'Case', { respondentId: user.id })

&#x20;   can('create', 'Case')

&#x20;   can('update', 'Case', { complainantId: user.id, status: { $in: \['draft', 'consent\_pending'] } })

&#x20;   can('consent', 'Case', { respondentId: user.id })

&#x20; }



&#x20; // Lawyers: additional case access for assigned cases

&#x20; if (isLawyer) {

&#x20;   can('read', 'Case', { lawyerId: user.id })

&#x20;   can('update', 'Case', { lawyerId: user.id })

&#x20; }



&#x20; // Moderators: full case access for moderation

&#x20; if (isModerator) {

&#x20;   can('read', 'Case', 'all')

&#x20;   can('update', 'Case', 'all')

&#x20; }



&#x20; // Evidence: own evidence management

&#x20; if (isCitizen) {

&#x20;   can('create', 'Evidence')

&#x20;   can('read', 'Evidence', { uploaderId: user.id })

&#x20;   can('appeal', 'Evidence', { uploaderId: user.id })

&#x20; }



&#x20; if (isLawyer) {

&#x20;   can('read', 'Evidence', { case: { lawyerId: user.id } })

&#x20; }



&#x20; if (isModerator) {

&#x20;   can('read', 'Evidence', 'all')

&#x20;   can('verify', 'Evidence')

&#x20; }



&#x20; // Polls: voting for all, creation for moderators

&#x20; can('read', 'Poll', 'all')

&#x20; can('vote', 'Poll')



&#x20; if (isModerator) {

&#x20;   can('create', 'Poll')

&#x20;   can('update', 'Poll')

&#x20;   can('delete', 'Poll')

&#x20; }



&#x20; // Confidence votes: voting for all

&#x20; can('read', 'Confidence', 'all')

&#x20; can('vote', 'Confidence')



&#x20; if (isModerator) {

&#x20;   can('create', 'Confidence')

&#x20; }



&#x20; // Lawyers: registration and matching

&#x20; if (isLawyer) {

&#x20;   can('read', 'Lawyer', 'all')

&#x20;   can('match', 'Lawyer')

&#x20; }



&#x20; if (isCitizen) {

&#x20;   can('read', 'Lawyer', 'all')

&#x20;   can('match', 'Lawyer')

&#x20;   can('create', 'Review')

&#x20; }



&#x20; if (isModerator) {

&#x20;   can('verify', 'Lawyer')

&#x20;   can('delete', 'Lawyer')

&#x20; }



&#x20; // Blog: reading for all, writing for writers

&#x20; can('read', 'Blog', 'all')

&#x20; can('comment', 'Blog')



&#x20; if (isWriter) {

&#x20;   can('create', 'Blog')

&#x20;   can('update', 'Blog', { authorId: user.id })

&#x20; }



&#x20; if (isModerator) {

&#x20;   can('update', 'Blog', 'all')

&#x20;   can('delete', 'Blog')

&#x20;   can('publish', 'Blog')

&#x20; }



&#x20; // Legal Literacy: reading for all

&#x20; can('read', 'LegalLiteracy', 'all')

&#x20; can('enroll', 'LegalLiteracy')

&#x20; can('quiz', 'LegalLiteracy')



&#x20; if (isWriter) {

&#x20;   can('create', 'LegalLiteracy')

&#x20;   can('update', 'LegalLiteracy', { authorId: user.id })

&#x20; }



&#x20; if (isModerator) {

&#x20;   can('update', 'LegalLiteracy', 'all')

&#x20;   can('delete', 'LegalLiteracy')

&#x20; }



&#x20; // Moderation: only moderators

&#x20; if (isModerator) {

&#x20;   can('view', 'Moderation')

&#x20;   can('act', 'Moderation')

&#x20; }



&#x20; return build()

}



// lib/rbac/permissions.ts

export function hasPermission(user: User, permission: string): boolean {

&#x20; const ability = defineAbilityFor(user)

&#x20; const \[action, resource] = permission.split(':')

&#x20; return ability.can(action as Actions, resource as Subjects)

}

```



\### 4.4.2 Permission Cache



```typescript

// cache/rbac.ts

export async function getCachedPermissions(

&#x20; userId: string

): Promise<Permission\[]> {

&#x20; const cacheKey = `permissions:${userId}`

&#x20; const cached = await getCachedValue<Permission\[]>(cacheKey)



&#x20; if (cached) return cached



&#x20; // Fetch from database

&#x20; const permissions = await db

&#x20;   .select()

&#x20;   .from(userPermissions)

&#x20;   .where(eq(userPermissions.userId, userId))



&#x20; // Cache for 1 hour, tagged so it can be invalidated per-user

&#x20; await setCachedValue(cacheKey, 'rbac', permissions, 3600, \[

&#x20;   `user:${userId}`,

&#x20; ])



&#x20; return permissions

}



export async function invalidatePermissionsCache(

&#x20; userId: string

): Promise<void> {

&#x20; const cacheKey = `permissions:${userId}`

&#x20; await invalidateCache(cacheKey)

}

```



\---



\## 4.5 RBAC Middleware



\### 4.5.1 API RBAC Middleware



```typescript

// server/api/middleware/rbac.ts

import { Context } from 'hono'

import { defineAbilityFor } from '\~/lib/rbac/ability'

import { logger } from '\~/lib/logger'



export function requirePermission(permission: string) {

&#x20; return async (c: Context, next: () => Promise<void>) => {

&#x20;   const user = c.get('user')



&#x20;   if (!user) {

&#x20;     return c.json({

&#x20;       success: false,

&#x20;       error: {

&#x20;         code: 'AUTHENTICATION\_REQUIRED',

&#x20;         message: 'Authentication required to perform this action',

&#x20;       },

&#x20;     }, 401)

&#x20;   }



&#x20;   const ability = defineAbilityFor(user)

&#x20;   const \[action, resource] = permission.split(':')



&#x20;   if (!ability.can(action as any, resource as any)) {

&#x20;     logger.warn('Permission denied', {

&#x20;       userId: user.id,

&#x20;       permission,

&#x20;       action: 'rbac:denied',

&#x20;     })



&#x20;     return c.json({

&#x20;       success: false,

&#x20;       error: {

&#x20;         code: 'PERMISSION\_DENIED',

&#x20;         message: `You do not have permission to perform "${permission}"`,

&#x20;       },

&#x20;     }, 403)

&#x20;   }



&#x20;   await next()

&#x20; }

}



export function requireRole(role: string) {

&#x20; return async (c: Context, next: () => Promise<void>) => {

&#x20;   const user = c.get('user')



&#x20;   if (!user) {

&#x20;     return c.json({

&#x20;       success: false,

&#x20;       error: {

&#x20;         code: 'AUTHENTICATION\_REQUIRED',

&#x20;         message: 'Authentication required to perform this action',

&#x20;       },

&#x20;     }, 401)

&#x20;   }



&#x20;   if (user.role !== role \&\& user.role !== 'admin') {

&#x20;     logger.warn('Role required', {

&#x20;       userId: user.id,

&#x20;       requiredRole: role,

&#x20;       actualRole: user.role,

&#x20;       action: 'rbac:role\_required',

&#x20;     })



&#x20;     return c.json({

&#x20;       success: false,

&#x20;       error: {

&#x20;         code: 'PERMISSION\_DENIED',

&#x20;         message: `This action requires the "${role}" role`,

&#x20;       },

&#x20;     }, 403)

&#x20;   }



&#x20;   await next()

&#x20; }

}

```



\### 4.5.2 Route-Level RBAC



```typescript

// server/api/routes/admin.routes.ts

import { Hono } from 'hono'

import { requirePermission, requireRole } from '../middleware/rbac'



const admin = new Hono()



// All admin routes require role check

admin.use('\*', requireRole('moderator'))



// Dashboard: Moderator+

admin.get('/dashboard',

&#x20; requirePermission('admin:dashboard'),

&#x20; async (c) => {

&#x20;   // Dashboard data

&#x20; }

)



// User management: Admin only

admin.get('/users',

&#x20; requireRole('admin'),

&#x20; requirePermission('admin:users'),

&#x20; async (c) => {

&#x20;   // User list

&#x20; }

)



admin.put('/users/:userId',

&#x20; requireRole('admin'),

&#x20; requirePermission('admin:users'),

&#x20; async (c) => {

&#x20;   // Update user

&#x20; }

)



// Permissions: Admin only

admin.get('/permissions',

&#x20; requireRole('admin'),

&#x20; requirePermission('admin:permissions'),

&#x20; async (c) => {

&#x20;   // List permissions

&#x20; }

)



admin.put('/permissions',

&#x20; requireRole('admin'),

&#x20; requirePermission('admin:permissions'),

&#x20; async (c) => {

&#x20;   // Update permissions

&#x20; }

)



// Moderation: Moderator+

admin.get('/moderation-queue',

&#x20; requirePermission('admin:moderation'),

&#x20; async (c) => {

&#x20;   // Moderation queue

&#x20; }

)



admin.post('/moderate',

&#x20; requirePermission('admin:moderation'),

&#x20; async (c) => {

&#x20;   // Moderate content

&#x20; }

)



export default admin

```



\### 4.5.3 Role-Based UI Elements



```tsx

// app/components/admin/AdminPanel.tsx

import { PermissionGuard } from '\~/components/auth/PermissionGuard'



export function AdminPanel() {

&#x20; return (

&#x20;   <div>

&#x20;     <h2>Admin Panel</h2>



&#x20;     <PermissionGuard permission="admin:users">

&#x20;       <UserManagement />

&#x20;     </PermissionGuard>



&#x20;     <PermissionGuard permission="admin:moderation">

&#x20;       <ModerationQueue />

&#x20;     </PermissionGuard>



&#x20;     <PermissionGuard permission="admin:polls">

&#x20;       <PollManagement />

&#x20;     </PermissionGuard>



&#x20;     <PermissionGuard permission="admin:blog">

&#x20;       <BlogManagement />

&#x20;     </PermissionGuard>



&#x20;     <PermissionGuard permission="admin:permissions">

&#x20;       <PermissionManagement />

&#x20;     </PermissionGuard>

&#x20;   </div>

&#x20; )

}

```



\---



\# 5. IDENTITY VERIFICATION



\## 5.1 NIMC NVS API Integration



\### 5.1.1 Overview



The National Identity Management Commission (NIMC) National Verification Service (NVS) API is the primary identity verification method for citizens. It provides government-recognized verification through Nigeria's national identity database.



\### 5.1.2 Verification Flow



```

┌─────────────────────────────────────────────────────────────────────┐

│                    NIMC NVS VERIFICATION FLOW                      │

├─────────────────────────────────────────────────────────────────────┤

│                                                                     │

│   User submits: NIN + Date of Birth + Full Name                    │

│      │                                                              │

│      ▼                                                              │

│   Platform validates NIN format (11 digits, not previously used)   │

│      │                                                              │

│      ▼                                                              │

│   Platform sends request to NIMC NVS API                           │

│      │                                                              │

│      ▼                                                              │

│   NIMC NVS API checks NIN against national database, matches DOB   │

│   and full name                                                    │

│      │                                                              │

│      ├───────────────────────┬─────────────────────────────────────│

│      ▼                       ▼                                     │

│   Match Found           No Match                                   │

│      │                       │                                     │

│      ▼                       ▼                                     │

│   Verified, profile      Failed — user notified, retry allowed,    │

│   updated, cache set     falls through to Onfido                  │

│                                                                     │

└─────────────────────────────────────────────────────────────────────┘

```



\### 5.1.3 NIMC NVS API Specifications



| Element | Specification |

|---------|---------------|

| \*\*API Version\*\* | NIMC NVS v2.0 |

| \*\*Authentication\*\* | Client ID + Client Secret + Timestamp |

| \*\*Request Format\*\* | JSON over HTTPS |

| \*\*Response Format\*\* | JSON |

| \*\*Timeout\*\* | 10 seconds |

| \*\*Retry Policy\*\* | 3 retries with exponential backoff |

| \*\*Cache TTL\*\* | 30 days (non-sensitive data) |



\---



\## 5.2 Onfido Integration



\### 5.2.1 Overview



Onfido serves as a secondary/fallback verification method when NIMC verification fails or for users who do not have a NIN. It provides document-based identity verification.



\### 5.2.2 Onfido Verification Flow



```

┌─────────────────────────────────────────────────────────────────────┐

│                     ONFIDO VERIFICATION FLOW                       │

├─────────────────────────────────────────────────────────────────────┤

│                                                                     │

│   User submits: government-issued ID + selfie                      │

│      │                                                              │

│      ▼                                                              │

│   Platform uploads documents to Onfido                              │

│      │                                                              │

│      ▼                                                              │

│   Onfido validates document (real/fake detection), runs OCR,       │

│   compares selfie to document photo, checks liveness                │

│      │                                                              │

│      ├───────────────────────┬─────────────────────────────────────│

│      ▼                       ▼                                     │

│   Verification Clear    Verification Failed                        │

│      │                       │                                     │

│      ▼                       ▼                                     │

│   Verified, profile      Failed — user notified, retry allowed,    │

│   updated, cache set     falls through to manual review            │

│                                                                     │

└─────────────────────────────────────────────────────────────────────┘

```



\### 5.2.3 Onfido Webhook Events



| Event | Description | Action |

|-------|-------------|--------|

| `check.completed` | Verification check completed | Update user status |

| `check.failed` | Verification check failed | Notify user, allow retry |

| `report.completed` | Verification report generated | Process results |



\---



\## 5.3 Verification Strategy



\### 5.3.1 Verification Priority



```

Level 1: NIMC NVS API        — primary, government-recognized, preferred for all citizens

Level 2: Onfido (fallback)   — for users without a NIN, or NIMC failures; document-based

Level 3: Manual verification — edge cases and appeals, staff-assisted

```



\### 5.3.2 Verification States



```

UNVERIFIED

&#x20;  │

&#x20;  ▼

NIMC VERIFICATION PENDING

&#x20;  │

&#x20;  ▼

NIMC VERIFIED ──────► NIMC FAILED ──────► ONFIDO PENDING

&#x20;  │                                          │

&#x20;  ▼                                          ▼

VERIFIED                          ONFIDO VERIFIED / ONFIDO FAILED

&#x20;                                               │

&#x20;                                               ▼

&#x20;                                    MANUAL REVIEW → VERIFIED / REJECTED

```



\### 5.3.3 Verification Cache



| Cache Type | Key Pattern | TTL | Purpose |

|------------|-------------|-----|---------|

| NIMC Result | `nimc:{userId}` | 30 days | Cached verification results |

| NIMC Validation | `nimc:validate:{nin}` | 1 hour | Validate NIN format |

| Onfido Result | `onfido:{userId}` | 30 days | Cached verification results |

| Verification Status | `verification:{userId}` | 1 hour | Current verification status |



\---



\# 6. CACHE LAYER



\## 6.1 Overview



The cache layer uses SQLite with Bun.sql for high-performance, low-latency caching. All cache types share a single \*\*`cache\_entries`\*\* table, keyed by `cache\_type` and tagged for bulk invalidation, rather than one table per feature.



\### 6.1.1 Cache Types



| Cache Type | Purpose | TTL | Strategy |

|------------|---------|-----|----------|

| \*\*Session Cache\*\* | User session storage | 1 hour | Read-through |

| \*\*Query Cache\*\* | Database query results | 5 minutes | Write-through |

| \*\*Poll Cache\*\* | Computed poll results | 1 hour | Scheduled refresh |

| \*\*Hash Cache\*\* | Evidence hash verification | Indefinite | Lookup on-demand |

| \*\*Config Cache\*\* | Platform configuration | 1 day | Lazy load |

| \*\*Verification Cache\*\* | NIMC/Onfido results | 30 days | Read-through |

| \*\*Blog Cache\*\* | Blog posts and content | 1 hour | Write-through |

| \*\*MDX Cache\*\* | Compiled MDX content | 1 day | Lazy load |

| \*\*RBAC Cache\*\* | User permissions and roles | 1 hour | Write-through |



\---



\## 6.2 `cache\_entries` Table



\### 6.2.1 Table Schema



```typescript

// db/schema/cache.schema.ts  (SQLite, managed via Bun.sql — not the Postgres/Drizzle schema in §8)

export const cacheEntries = sqliteTable(

&#x20; 'cache\_entries',

&#x20; {

&#x20;   key: text('key').primaryKey(),

&#x20;   data: text('data').notNull(),              // JSON-serialized payload

&#x20;   cacheType: text('cache\_type').notNull(),   // 'session' | 'query' | 'poll' | 'hash' |

&#x20;                                               // 'config' | 'verification' | 'blog' | 'mdx' | 'rbac'

&#x20;   tags: text('tags'),                        // fenced string, e.g. ",user:123,case:456,"

&#x20;   hits: integer('hits').default(0),

&#x20;   lastAccessed: integer('last\_accessed'),

&#x20;   expiresAt: integer('expires\_at'),

&#x20;   createdAt: integer('created\_at').notNull(),

&#x20; },

&#x20; (table) => \[

&#x20;   index('idx\_cache\_expires').on(table.expiresAt),

&#x20;   index('idx\_cache\_tags').on(table.tags),

&#x20;   index('idx\_cache\_type').on(table.cacheType),

&#x20;   index('idx\_cache\_hits').on(table.hits),

&#x20;   index('idx\_cache\_last\_accessed').on(table.lastAccessed),

&#x20; ],

)

```



\### 6.2.2 Cache Operations



```

get<T>(key: string): T | null

────────────────────────────────

1\. Query cache\_entries by key

2\. Check expires\_at > now

3\. Bump hits, last\_accessed

4\. Return deserialized value, or null if not found/expired



set<T>(key: string, cacheType: string, value: T, ttlSeconds: number, tags?: string\[]): void

────────────────────────────────────────────────────────────────────────────────────────

1\. Serialize value to JSON

2\. Upsert into cache\_entries with cache\_type, fenced tags string, expires\_at = now + ttl



invalidate(key: string): void

──────────────────────────────

1\. Delete row from cache\_entries by key



invalidateByTag(tag: string): void

───────────────────────────────────

1\. SELECT key FROM cache\_entries WHERE tags LIKE '%,' || $tag || ',%'

2\. DELETE FROM cache\_entries WHERE key IN (...)



invalidateByType(cacheType: string): void

───────────────────────────────────────────

1\. DELETE FROM cache\_entries WHERE cache\_type = $cacheType



clearExpired(): void

─────────────────────

1\. DELETE FROM cache\_entries WHERE expires\_at IS NOT NULL AND expires\_at < now

```



\### 6.2.3 Cache Key Patterns



| Pattern | Example | Cache Type |

|---------|---------|------------|

| `session:{userId}` | `session:usr\_9f2a` | session |

| `query:{hash-of-sql+params}` | `query:a1b2c3d4` | query |

| `permissions:{userId}` | `permissions:usr\_9f2a` | rbac |

| `poll:results:{pollId}` | `poll:results:pll\_44` | poll |

| `evidence:hash:{sha256}` | `evidence:hash:9e107d9d...` | hash |

| `config:{key}` | `config:blog.posts\_per\_page` | config |

| `nimc:{userId}` / `onfido:{userId}` | `nimc:usr\_9f2a` | verification |

| `blog:post:{slug}` | `blog:post:know-your-rights-101` | blog |

| `blog:list:{filtersHash}` | `blog:list:c1a2` | blog |

| `mdx:compiled:{contentHash}` | `mdx:compiled:8f3e...` | mdx |



Keys are namespaced `resource:identifier\[:subresource]` so that `invalidateByTag` and prefix-based lookups stay predictable across cache types.



\---



\## 6.3 Bun SQL Implementation



\### 6.3.1 Cache Client



```typescript

// cache/client.ts

import { sql } from 'bun'



export const cacheDb = sql({

&#x20; path: process.env.CACHE\_DB\_PATH ?? './cache.db',

&#x20; wal: true,

&#x20; cache: true,

&#x20; busyTimeout: 5000,

})



// cache/entries.ts

export async function getCachedValue<T>(key: string): Promise<T | null> {

&#x20; const now = Math.floor(Date.now() / 1000)



&#x20; const rows = await cacheDb`

&#x20;   SELECT data, expires\_at FROM cache\_entries

&#x20;   WHERE key = ${key}

&#x20; `



&#x20; const row = rows\[0]

&#x20; if (!row) return null

&#x20; if (row.expires\_at !== null \&\& row.expires\_at < now) {

&#x20;   await cacheDb`DELETE FROM cache\_entries WHERE key = ${key}`

&#x20;   return null

&#x20; }



&#x20; await cacheDb`

&#x20;   UPDATE cache\_entries

&#x20;   SET hits = hits + 1, last\_accessed = ${now}

&#x20;   WHERE key = ${key}

&#x20; `



&#x20; return JSON.parse(row.data) as T

}



export async function setCachedValue<T>(

&#x20; key: string,

&#x20; cacheType: string,

&#x20; value: T,

&#x20; ttlSeconds: number,

&#x20; tags: string\[] = \[]

): Promise<void> {

&#x20; const now = Math.floor(Date.now() / 1000)

&#x20; const fencedTags = tags.length ? `,${tags.join(',')},` : null



&#x20; await cacheDb`

&#x20;   INSERT INTO cache\_entries (

&#x20;     key, data, cache\_type, tags, hits, last\_accessed, expires\_at, created\_at

&#x20;   ) VALUES (

&#x20;     ${key}, ${JSON.stringify(value)}, ${cacheType}, ${fencedTags},

&#x20;     0, ${now}, ${now + ttlSeconds}, ${now}

&#x20;   )

&#x20;   ON CONFLICT (key) DO UPDATE SET

&#x20;     data = excluded.data,

&#x20;     cache\_type = excluded.cache\_type,

&#x20;     tags = excluded.tags,

&#x20;     expires\_at = excluded.expires\_at

&#x20; `

}



export async function invalidateCache(key: string): Promise<void> {

&#x20; await cacheDb`DELETE FROM cache\_entries WHERE key = ${key}`

}



export async function invalidateCacheByTag(tag: string): Promise<void> {

&#x20; await cacheDb`DELETE FROM cache\_entries WHERE tags LIKE ${'%,' + tag + ',%'}`

}



export async function clearExpired(): Promise<void> {

&#x20; const now = Math.floor(Date.now() / 1000)

&#x20; await cacheDb`

&#x20;   DELETE FROM cache\_entries

&#x20;   WHERE expires\_at IS NOT NULL AND expires\_at < ${now}

&#x20; `

}

```



\---



\# 7. RATE LIMITING LAYER



\## 7.1 Overview



The rate limiting layer uses SQLite with Bun.sql for fast, distributed rate limiting. It implements a sliding window algorithm with configurable limits per endpoint/user.



\### 7.1.1 Rate Limit Tables



```sql

\-- Rate Limit Tracking

CREATE TABLE rate\_limits (

&#x20; id TEXT PRIMARY KEY,

&#x20; key TEXT NOT NULL,             -- user\_id + endpoint + window

&#x20; count INTEGER NOT NULL DEFAULT 0,

&#x20; window\_start INTEGER NOT NULL,

&#x20; reset\_at INTEGER NOT NULL

);



CREATE INDEX idx\_rate\_limit\_key ON rate\_limits (key);

CREATE INDEX idx\_rate\_limit\_reset ON rate\_limits (reset\_at);



\-- Rate Limit Configurations

CREATE TABLE rate\_limit\_config (

&#x20; id TEXT PRIMARY KEY,

&#x20; endpoint\_pattern TEXT NOT NULL UNIQUE,

&#x20; max\_requests INTEGER NOT NULL,

&#x20; window\_seconds INTEGER NOT NULL,

&#x20; created\_at INTEGER NOT NULL,

&#x20; updated\_at INTEGER NOT NULL

);

```



> Note: `INDEX (...)` declared inline inside `CREATE TABLE` is not valid PostgreSQL or SQLite syntax — indexes must be created with standalone `CREATE INDEX` statements, as above.



\### 7.1.2 Default Rate Limits



| Category | Endpoint Pattern | Max Requests | Window |

|----------|------------------|--------------|--------|

| Authentication | /api/auth/\* | 5 | 60s |

| Voting | /api/votes/\* | 10 | 60s |

| Evidence Upload | /api/evidence/upload | 5 | 3600s |

| Lawyer Matching | /api/lawyers/\*/match | 10 | 3600s |

| Poll Creation | /api/polls/policy | 2 | 3600s |

| Blog Content Creation | /api/blog | 5 | 3600s |

| Blog Comments | /api/blog/\*/comments | 10 | 60s |

| General API | /api/\* | 100 | 60s |

| Webhooks | /api/webhooks/\* | 50 | 60s |

| Public Pages | /\* (non-api) | 500 | 60s |



\---



\## 7.2 Sliding Window Algorithm



```

┌─────────────────────────────────────────────────────────────────────┐

│                   SLIDING WINDOW ALGORITHM                        │

├─────────────────────────────────────────────────────────────────────┤

│                                                                     │

│  Requests are counted over a rolling window ending "now", not a    │

│  fixed calendar bucket — so a burst that straddles a window        │

│  boundary is still counted correctly.                              │

│                                                                     │

│  Example (limit = 10 per 60s):                                     │

│    Window ending now contains 7 requests   → 7 < 10  → ALLOW       │

│    Window ending now contains 10 requests  → 10 = 10 → ALLOW       │

│    Window ending now contains 11 requests  → 11 > 10 → DENY (429)  │

│                                                                     │

└─────────────────────────────────────────────────────────────────────┘

```



\## 7.3 Bun SQL Implementation



```typescript

// rate-limit/client.ts

import { sql } from 'bun'



const rlDb = sql({

&#x20; path: process.env.RATE\_LIMIT\_DB\_PATH ?? './rate-limit.db',

&#x20; wal: true,

&#x20; cache: true,

&#x20; busyTimeout: 5000,

})



// rate-limit/sliding.ts

export interface RateLimitResult {

&#x20; allowed: boolean

&#x20; remaining: number

&#x20; resetAt: number

&#x20; limit: number

&#x20; retryAfter?: number

}



export async function checkRateLimit(

&#x20; key: string,

&#x20; limit: number,

&#x20; windowSeconds: number

): Promise<RateLimitResult> {

&#x20; const now = Math.floor(Date.now() / 1000)

&#x20; const windowStart = now - windowSeconds



&#x20; // Clean up expired entries

&#x20; await rlDb`DELETE FROM rate\_limits WHERE reset\_at < ${now}`



&#x20; // Get current count in window

&#x20; const result = await rlDb`

&#x20;   SELECT COUNT(\*) as count

&#x20;   FROM rate\_limits

&#x20;   WHERE key = ${key}

&#x20;     AND window\_start >= ${windowStart}

&#x20;     AND window\_start <= ${now}

&#x20; `



&#x20; const currentCount = Number(result\[0]?.count ?? 0)

&#x20; const allowed = currentCount < limit

&#x20; const remaining = limit - currentCount



&#x20; if (allowed) {

&#x20;   await rlDb`

&#x20;     INSERT INTO rate\_limits (id, key, count, window\_start, reset\_at)

&#x20;     VALUES (${crypto.randomUUID()}, ${key}, 1, ${now}, ${now + windowSeconds})

&#x20;   `

&#x20; }



&#x20; const resetAt = now + windowSeconds

&#x20; const retryAfter = allowed ? 0 : resetAt - now



&#x20; return {

&#x20;   allowed,

&#x20;   remaining: Math.max(0, remaining - 1),

&#x20;   resetAt,

&#x20;   limit,

&#x20;   retryAfter: retryAfter > 0 ? retryAfter : undefined,

&#x20; }

}

```



\---



\# 8. DATABASE LAYER



\## 8.1 Schema Design



The primary datastore is PostgreSQL, managed through Drizzle ORM. Schema files live in `db/schema/\*.ts`, one file per domain, and are composed into a single schema graph consumed by `drizzle.config.ts` (§8.2.1).



\### 8.1.1 Core Entities



| Schema file | Key tables | Notes |

|-------------|-----------|-------|

| `users.schema.ts` | `users` | Core identity: email, password hash, verification status, role |

| `cases.schema.ts` | `cases`, `case\_status\_history` | Complainant/respondent/lawyer references, status enum, consent flags |

| `evidence.schema.ts` | `evidence` | Case-linked uploads, hash for integrity checks, verification status |

| `votes.schema.ts` | `votes` | Poll/confidence vote records, one per user per target |

| `polls.schema.ts` | `polls`, `poll\_options` | Policy polls with options and aggregated results |

| `officials.schema.ts` | `officials` | Public officials that confidence polls target |

| `lawyers.schema.ts` | `lawyer\_profiles`, `lawyer\_reviews` | Registration, verification status, matching metadata |

| `jurisdictions.schema.ts` | `jurisdictions` | Geographic/legal jurisdiction reference data |

| `blog.schema.ts` | `blog\_posts`, `blog\_comments`, `blog\_categories` | MDX-backed content, authorship, moderation status |

| `legal-literacy.schema.ts` | `literacy\_modules`, `literacy\_enrollments`, `literacy\_quiz\_attempts` | Course-style content and progress tracking |

| `rbac.schema.ts` | `roles`, `permissions`, `user\_permissions` | Explicit per-user permission overrides on top of role defaults |

| `audit.schema.ts` | `audit\_logs` | Append-only log of mutations and sensitive reads |

| `relationships.schema.ts` | join tables (e.g. `case\_evidence`, `lawyer\_case\_assignments`) | Cross-entity many-to-many/one-to-many links not owned by a single domain schema |

| `moderation.schema.ts` | `moderation\_queue`, `moderation\_actions` | Flagged content awaiting review, and the actions taken on it |



\### 8.1.2 Design Conventions



| Convention | Rule |

|------------|------|

| Primary keys | Prefixed text IDs (e.g. `usr\_`, `cse\_`, `pll\_`) generated at the application layer, not serial integers |

| Timestamps | `created\_at` / `updated\_at` on every table, stored as `timestamptz` |

| Soft state | Status columns use Postgres enums rather than free-text strings |

| Foreign keys | Always indexed; cascade behavior documented per-table in the schema file itself |

| RBAC data | Role defaults live in code (§4.4.1); `user\_permissions` only stores \*overrides\*, keeping the common case cheap to evaluate |



\---



\## 8.2 Migration Strategy



\### 8.2.1 Drizzle Configuration



```typescript

// drizzle.config.ts

import { defineConfig } from 'drizzle-kit'



export default defineConfig({

&#x20; schema: './db/schema/\*.ts',

&#x20; out: './db/migrations',

&#x20; dialect: 'postgresql',

&#x20; dbCredentials: {

&#x20;   url: process.env.DATABASE\_URL!,

&#x20; },

&#x20; verbose: true,

&#x20; strict: true,

})

```



\### 8.2.2 Migration Workflow



```

1\. Modify Schema        → Edit schema/\*.ts files

2\. Generate Migration   → bun drizzle-kit generate

3\. Review Migration     → Check migrations/\*.sql for correctness

4\. Test Migration       → Run against test database

5\. Apply Migration      → bun drizzle-kit migrate

6\. Verify               → Run tests, check schema

7\. Commit               → Commit schema + migrations + tests

```



\---



\# 9. OBSERVABILITY



\## 9.1 Logging



\### 9.1.1 Log Levels



| Level | Use Case |

|-------|----------|

| \*\*ERROR\*\* | System failures, database errors, service failures |

| \*\*WARN\*\* | Rate limit exceeded, validation failures, performance warnings, permission denied |

| \*\*INFO\*\* | User actions, API calls, background jobs |

| \*\*DEBUG\*\* | Detailed request tracing, service calls (development only) |



\### 9.1.2 Structured Logging



```typescript

// lib/logger.ts

export const logger = {

&#x20; error: (message: string, meta?: Record<string, any>) => {

&#x20;   console.error(JSON.stringify({

&#x20;     level: 'error',

&#x20;     timestamp: new Date().toISOString(),

&#x20;     message,

&#x20;     ...meta,

&#x20;   }))

&#x20; },

&#x20; info: (message: string, meta?: Record<string, any>) => {

&#x20;   console.info(JSON.stringify({

&#x20;     level: 'info',

&#x20;     timestamp: new Date().toISOString(),

&#x20;     message,

&#x20;     ...meta,

&#x20;   }))

&#x20; },

&#x20; warn: (message: string, meta?: Record<string, any>) => {

&#x20;   console.warn(JSON.stringify({

&#x20;     level: 'warn',

&#x20;     timestamp: new Date().toISOString(),

&#x20;     message,

&#x20;     ...meta,

&#x20;   }))

&#x20; },

}

```



\### 9.1.3 Logging Examples



```

{"level":"info","timestamp":"2026-07-20T10:30:00.000Z","message":"API request","method":"POST","path":"/api/cases","status":201,"duration":124,"userId":"usr\_123","requestId":"req\_abc123"}



{"level":"warn","timestamp":"2026-07-20T10:30:01.000Z","message":"Rate limit exceeded","userId":"usr\_123","endpoint":"/api/votes","limit":10,"window":60,"attempts":11}



{"level":"error","timestamp":"2026-07-20T10:30:02.000Z","message":"Database error","error":"Connection timeout","query":"SELECT \* FROM cases WHERE id = $1","userId":"usr\_123","requestId":"req\_abc123"}



{"level":"info","timestamp":"2026-07-20T10:30:03.000Z","message":"NIMC verification completed","userId":"usr\_123","status":"success","provider":"nimc","duration":2345}



{"level":"warn","timestamp":"2026-07-20T10:30:04.000Z","message":"Permission denied","userId":"usr\_123","permission":"admin:users","action":"rbac:denied"}



{"level":"info","timestamp":"2026-07-20T10:30:05.000Z","message":"Blog post published","postSlug":"my-first-post","authorId":"usr\_456","category":"civic-engagement"}

```



\---



\## 9.2 Metrics



\### 9.2.1 Key Metrics



| Metric | Description | Alert Threshold |

|--------|-------------|-----------------|

| \*\*Request Count\*\* | Total requests per endpoint | N/A |

| \*\*Request Duration (P95)\*\* | 95th percentile response time | > 500ms |

| \*\*Error Rate\*\* | Percentage of error responses | > 5% |

| \*\*Cache Hit Rate\*\* | Percentage of cache hits | < 80% |

| \*\*Rate Limit Breaches\*\* | Number of rate limit violations | > 10/hour |

| \*\*Database Connections\*\* | Active DB connections | > 80% of pool |

| \*\*Active Users\*\* | Concurrent active users | N/A |

| \*\*Poll Participation\*\* | Votes per poll | N/A |

| \*\*Verification Success Rate\*\* | NIMC/Onfido success rate | < 80% |

| \*\*Blog Engagement\*\* | Views, comments, shares per post | N/A |

| \*\*Legal Literacy Completion\*\* | Module completion rate | N/A |

| \*\*RBAC Checks\*\* | Permission checks per second | N/A |

| \*\*Permission Denied Rate\*\* | Percentage of denied requests | > 5% |



\### 9.2.2 Business Metrics



| Metric | Description |

|--------|-------------|

| \*\*Daily Active Users\*\* | Unique users per day |

| \*\*Cases Created\*\* | New cases per day/week |

| \*\*Evidence Uploads\*\* | Evidence uploads per day |

| \*\*Poll Votes\*\* | Votes per poll |

| \*\*Lawyer Matches\*\* | New matches per day |

| \*\*User Registrations\*\* | New users per day |

| \*\*Verification Requests\*\* | NIMC/Onfido requests per day |

| \*\*Blog Page Views\*\* | Daily blog traffic |

| \*\*Newsletter Subscribers\*\* | Growth in email subscribers |

| \*\*Legal Literacy Enrollments\*\* | New module enrollments |

| \*\*Role Changes\*\* | Role assignments/removals per day |



\---



\## 9.3 Monitoring



\### 9.3.1 Health Checks



```

GET /health

{

&#x20; "status": "healthy",

&#x20; "timestamp": "2026-07-20T10:30:00.000Z",

&#x20; "checks": {

&#x20;   "database": "healthy",

&#x20;   "cache": "healthy",

&#x20;   "rate\_limit": "healthy",

&#x20;   "storage": "healthy",

&#x20;   "nimc\_api": "healthy",

&#x20;   "onfido\_api": "healthy",

&#x20;   "rbac": "healthy"

&#x20; }

}

```



\### 9.3.2 Alerting Rules



| Condition | Severity | Action |

|-----------|----------|--------|

| Error rate > 5% | P1 | Alert on-call engineer |

| Response time > 1s for 5 minutes | P2 | Alert engineering team |

| Cache hit rate < 60% | P3 | Review cache configuration |

| Database connection pool > 80% | P2 | Scale connections |

| Rate limit breaches > 100/hour | P2 | Investigate abuse pattern |

| Disk usage > 80% | P3 | Clean up logs/cache |

| NIMC API failure > 5% | P1 | Check NIMC integration |

| Onfido API failure > 5% | P2 | Check Onfido integration |

| Permission denied rate > 10% | P2 | Review RBAC configuration |



\---



\# 10. DEPLOYMENT



\## 10.1 Environment Configuration



\### 10.1.1 Environment Variables



```

\# .env

NODE\_ENV=production

PORT=3000



\# Database

DATABASE\_URL=postgresql://user:pass@localhost:5432/najia

DATABASE\_POOL\_SIZE=20

DATABASE\_IDLE\_TIMEOUT=10000



\# Cache

CACHE\_DB\_PATH=./cache.db

CACHE\_MAX\_SIZE=1GB

CACHE\_DEFAULT\_TTL=300



\# Rate Limit

RATE\_LIMIT\_DB\_PATH=./rate-limit.db

RATE\_LIMIT\_WINDOW=60

RATE\_LIMIT\_DEFAULT=100



\# JWT

JWT\_SECRET=your-super-secret-key

JWT\_EXPIRY=86400



\# NIMC NVS API

NIMC\_API\_BASE\_URL=https://api.nimc.gov.ng/nvs

NIMC\_CLIENT\_ID=your-client-id

NIMC\_CLIENT\_SECRET=your-client-secret



\# Onfido

ONFIDO\_API\_KEY=xxx

ONFIDO\_API\_URL=https://api.onfido.com/v3



\# Payments

PAYSTACK\_SECRET\_KEY=xxx



\# Storage

BUNNY\_CDN\_KEY=xxx

STORAGE\_BUCKET=najia-evidence



\# Blog

BLOG\_POSTS\_PER\_PAGE=10

BLOG\_CACHE\_TTL=3600

MDX\_COMPILER\_CACHE=true



\# Legal Literacy

LEGAL\_MODULES\_PER\_PAGE=12



\# RBAC

RBAC\_CACHE\_TTL=3600

RBAC\_AUDIT\_ENABLED=true



\# Monitoring

LOG\_LEVEL=info



\# VPN Server Configuration

VPN\_INTERFACE=eth0

VPN\_PRIVATE\_IP=10.0.0.1

```



\### 10.1.2 Configuration by Environment



| Setting | Development | Staging | Production |

|---------|-------------|---------|------------|

| LOG\_LEVEL | debug | info | warn |

| CACHE\_DEFAULT\_TTL | 60 | 300 | 600 |

| RATE\_LIMIT\_WINDOW | 60 | 60 | 60 |

| RATE\_LIMIT\_DEFAULT | 1000 | 200 | 100 |

| DATABASE\_POOL\_SIZE | 5 | 10 | 20 |

| BLOG\_CACHE\_TTL | 300 | 1800 | 3600 |

| RBAC\_CACHE\_TTL | 300 | 1800 | 3600 |



\---



\## 10.2 Deployment Process



\### 10.2.1 Self-Hosted VPN Server Setup



```

1\. Server Provisioning     → Ubuntu 22.04 LTS / Debian 12

2\. VPN Setup (WireGuard)   → Secure tunnel for all connections

3\. Install Bun             → curl -fsSL https://bun.sh/install | bash

4\. Install PostgreSQL      → sudo apt install postgresql-14

5\. Configure Firewall      → UFW: allow 3000, 5432 (internal only), 51820 (WireGuard)

6\. Deploy Application      → bun run deploy

7\. Configure Systemd       → Create najia.service for auto-start

8\. Setup Monitoring        → Health checks, log rotation, alerts

```



\### 10.2.2 Build Process



```

1\. Install Dependencies    → bun install

2\. Generate Types          → bun typegen

3\. Build Web App           → bun run build:web

4\. Bundle Server           → bun build server/entry.ts --outfile dist/server.js

5\. Build MDX Content       → bun run mdx-build

6\. Run Migrations          → bun drizzle-kit migrate

7\. Seed Database           → bun run seed \&\& bun run seed-rbac

8\. Optimize Assets         → bun run optimize:assets

9\. Create Deployment Bundle → tar -czf deployment.tar.gz dist/ cache.db rate-limit.db

```



\### 10.2.3 Deployment Strategies



| Strategy | Description | When to Use |

|----------|-------------|-------------|

| \*\*Blue-Green\*\* | Two identical environments, swap on deploy | Production |

| \*\*Canary\*\* | Gradual rollout to subset of users | High-risk changes |

| \*\*Rolling\*\* | Gradual replacement of instances | Routine updates |

| \*\*Recreate\*\* | Stop old, start new | Development |



\---



\## 10.3 Scaling



\### 10.3.1 Horizontal Scaling



```

&#x20;                    ┌───────────────────────┐

&#x20;                    │     Load Balancer     │

&#x20;                    └───────────┬───────────┘

&#x20;                 ┌──────────────┴──────────────┐

&#x20;                 ▼                              ▼

&#x20;      ┌─────────────────────┐        ┌─────────────────────┐

&#x20;      │  Server Instance 1  │        │  Server Instance 2  │

&#x20;      │  • Postgres (RO)    │        │  • Postgres (RO)    │

&#x20;      │  • SQLite (local)   │        │  • SQLite (local)   │

&#x20;      └──────────┬──────────┘        └──────────┬──────────┘

&#x20;                 │                              │

&#x20;                 └──────────────┬───────────────┘

&#x20;                                ▼

&#x20;                 ┌───────────────────────────────┐

&#x20;                 │  Primary PostgreSQL (Write)   │

&#x20;                 └───────────────────────────────┘



&#x20; All instance-to-instance and instance-to-database traffic runs over

&#x20; the WireGuard VPN tunnel.

```



\### 10.3.2 Cache Replication



| Strategy | Description | Complexity |

|----------|-------------|------------|

| \*\*Shared SQLite\*\* | SQLite on shared storage | High |

| \*\*Per-Instance\*\* | Each instance has its own cache | Low (current approach) |

| \*\*Redis\*\* | Dedicated Redis cluster | Medium (candidate for a future version if multi-instance cache coherence becomes a bottleneck) |



\---



\# 11. DISASTER RECOVERY



\## 11.1 Backup Strategy



\### 11.1.1 Database Backups



| Backup Type | Frequency | Retention |

|-------------|-----------|-----------|

| \*\*Full PostgreSQL\*\* | Daily | 30 days |

| \*\*WAL Archiving\*\* | Continuous | 7 days |

| \*\*SQLite Cache\*\* | Daily | 7 days |

| \*\*Rate Limit Data\*\* | Never (regeneratable) | N/A |

| \*\*Blog Content\*\* | Daily | 30 days |

| \*\*MDX Content\*\* | Daily | 30 days |

| \*\*RBAC Configuration\*\* | Daily | 30 days |



\### 11.1.2 Recovery Point Objectives



| Component | RPO | RTO |

|-----------|-----|-----|

| PostgreSQL Database | 1 hour | 30 minutes |

| SQLite Cache | 24 hours | 15 minutes |

| File Storage | 24 hours | 1 hour |

| Blog Content | 24 hours | 15 minutes |

| RBAC Configuration | 24 hours | 15 minutes |



\---



\## 11.2 Recovery Procedures



```

Database Failure:

&#x20; 1. Stop application

&#x20; 2. Restore latest backup

&#x20; 3. Apply WAL (if available)

&#x20; 4. Verify data integrity

&#x20; 5. Start application



Cache Failure:

&#x20; 1. Delete cache.db

&#x20; 2. Restart application (will rebuild cache)



Rate Limit Failure:

&#x20; 1. Delete rate-limit.db

&#x20; 2. Restart application (will rebuild)



Blog Content Failure:

&#x20; 1. Restore from backup

&#x20; 2. Rebuild MDX content

&#x20; 3. Clear blog cache



RBAC Configuration Failure:

&#x20; 1. Restore from backup

&#x20; 2. Invalidate all RBAC caches

&#x20; 3. Verify permissions



VPN Failure:

&#x20; 1. Restart WireGuard service

&#x20; 2. Verify tunnel is established

&#x20; 3. Check application connectivity



Application Failure:

&#x20; 1. Roll back to previous version

&#x20; 2. Restart with older version

&#x20; 3. Investigate root cause

```



\---



\# 12. SECURITY



\## 12.1 Authentication Flow



```

User Registration

&#x20; 1. User submits email/password

&#x20; 2. Password hashed with Bun.password

&#x20; 3. User created in database

&#x20; 4. Verification email sent

&#x20; 5. JWT token generated

&#x20; 6. Session stored in SQLite

&#x20; 7. User logged in



User Login

&#x20; 1. User submits email/password

&#x20; 2. User looked up in database

&#x20; 3. Password verified with Bun.password

&#x20; 4. JWT token generated

&#x20; 5. Session stored in SQLite

&#x20; 6. User logged in



Request Authentication

&#x20; 1. Token extracted from header/cookie

&#x20; 2. Token validated

&#x20; 3. Session checked in SQLite

&#x20; 4. User attached to request

```



\---



\## 12.2 Authorization Matrix



See the resource-based permissions matrix in \*\*§4.3.1\*\* — it is the single source of truth for role/permission grants and is intentionally not duplicated here.



\---



\## 12.3 Data Encryption



\### 12.3.1 Encryption at Rest



| Data Type | Encryption Method |

|-----------|-------------------|

| User passwords | Bun.password (bcrypt/argon2) |

| Government IDs | SHA-256 hash |

| NIN Data | AES-256 encryption |

| Evidence files | Server-side encryption |

| User PII | Database encryption (PGP) |

| Session data | JWT + SQLite |

| Rate limit data | Plain (non-sensitive) |

| Cache data | Plain (non-sensitive) |

| Blog content | Plain (non-sensitive) |

| RBAC data | Plain (non-sensitive) |



\### 12.3.2 Encryption in Transit



| Connection | Protocol |

|------------|----------|

| Web traffic | TLS 1.3 |

| API traffic | TLS 1.3 |

| Database connections | TLS 1.3 |

| CDN connections | TLS 1.3 |

| NIMC NVS API | TLS 1.3 |

| Onfido API | TLS 1.3 |

| VPN Tunnel | WireGuard |



\---



\## 12.4 VPN Security



```

WireGuard Configuration:

&#x20; • Private key stored securely

&#x20; • Public key distributed to clients

&#x20; • Allowed IPs restricted to application subnet

&#x20; • Persistent keepalive enabled

&#x20; • MTU optimized for performance



Firewall Rules:

&#x20; • Only allow VPN traffic from trusted IPs

&#x20; • Rate limiting on VPN ports

&#x20; • DDoS protection enabled

&#x20; • Unauthorized port access blocked



Monitoring:

&#x20; • VPN connection status monitoring

&#x20; • Bandwidth usage tracking

&#x20; • Connection attempt logging

&#x20; • Anomaly detection

```



\---



\# 13. API DOCUMENTATION



\## 13.1 Response Format



\### 13.1.1 Success Response



```json

{

&#x20; "success": true,

&#x20; "data": {

&#x20;   // Response data

&#x20; },

&#x20; "meta": {

&#x20;   "timestamp": "2026-07-20T10:30:00.000Z",

&#x20;   "requestId": "req\_abc123",

&#x20;   "cache": "HIT"

&#x20; }

}

```



\### 13.1.2 Error Response



```json

{

&#x20; "success": false,

&#x20; "error": {

&#x20;   "code": "RATE\_LIMIT\_EXCEEDED",

&#x20;   "message": "Too many requests. Please try again in 45 seconds.",

&#x20;   "details": {

&#x20;     "limit": 10,

&#x20;     "remaining": 0,

&#x20;     "resetAt": "2026-07-20T10:30:45.000Z"

&#x20;   }

&#x20; },

&#x20; "meta": {

&#x20;   "timestamp": "2026-07-20T10:30:00.000Z",

&#x20;   "requestId": "req\_abc123"

&#x20; }

}

```



\### 13.1.3 Permission Denied Response



```json

{

&#x20; "success": false,

&#x20; "error": {

&#x20;   "code": "PERMISSION\_DENIED",

&#x20;   "message": "You do not have permission to perform \\"admin:users\\"",

&#x20;   "details": {

&#x20;     "permission": "admin:users",

&#x20;     "role": "moderator",

&#x20;     "requiredRole": "admin"

&#x20;   }

&#x20; },

&#x20; "meta": {

&#x20;   "timestamp": "2026-07-20T10:30:00.000Z",

&#x20;   "requestId": "req\_abc123"

&#x20; }

}

```



\### 13.1.4 Error Codes



| Code | HTTP Status | Description |

|------|-------------|-------------|

| VALIDATION\_ERROR | 400 | Invalid input data |

| AUTHENTICATION\_REQUIRED | 401 | Missing/invalid authentication |

| PERMISSION\_DENIED | 403 | Insufficient permissions |

| NOT\_FOUND | 404 | Resource not found |

| CONFLICT | 409 | Resource conflict (duplicate vote, etc.) |

| RATE\_LIMIT\_EXCEEDED | 429 | Too many requests |

| VERIFICATION\_FAILED | 422 | Identity verification failed |

| INTERNAL\_ERROR | 500 | Internal server error |

| SERVICE\_UNAVAILABLE | 503 | Service temporarily unavailable |



\---



\## 13.2 Rate Limit Headers



| Header | Description |

|--------|-------------|

| X-RateLimit-Limit | Maximum requests allowed in window |

| X-RateLimit-Remaining | Requests remaining in window |

| X-RateLimit-Reset | Time when window resets (Unix timestamp) |

| Retry-After | Seconds until next request allowed |



\---



\## 13.3 Cache Headers



| Header | Description |

|--------|-------------|

| X-Cache | HIT or MISS |

| X-Cache-Key | Cache key used for lookup |

| X-Cache-TTL | Time-to-live remaining in seconds |

| Cache-Control | Standard HTTP cache headers |



\---



\# 14. PERFORMANCE TARGETS



\## 14.1 API Performance



| Endpoint Type | P95 Response Time | P99 Response Time |

|---------------|-------------------|-------------------|

| \*\*Read (Cache Hit)\*\* | < 50ms | < 100ms |

| \*\*Read (Cache Miss)\*\* | < 200ms | < 500ms |

| \*\*Write (Simple)\*\* | < 100ms | < 300ms |

| \*\*Write (Complex)\*\* | < 500ms | < 1s |

| \*\*Evidence Upload\*\* | < 5s | < 10s |

| \*\*Poll Results\*\* | < 200ms | < 500ms |

| \*\*NIMC Verification\*\* | < 3s | < 5s |

| \*\*Onfido Verification\*\* | < 10s | < 20s |

| \*\*Blog Post (MDX)\*\* | < 100ms | < 300ms |

| \*\*RBAC Check\*\* | < 10ms | < 25ms |



\## 14.2 Database Performance



| Metric | Target |

|--------|--------|

| Query Execution | < 50ms (P95) |

| Connection Time | < 10ms |

| Migration Time | < 5s per migration |

| Backup Time | < 5 minutes |



\## 14.3 Cache Performance



| Metric | Target |

|--------|--------|

| Read Latency | < 5ms |

| Write Latency | < 10ms |

| Hit Rate | > 80% |

| Invalidation Time | < 100ms |



\## 14.4 Rate Limit Performance



| Metric | Target |

|--------|--------|

| Check Latency | < 5ms |

| Update Latency | < 10ms |

| Cleanup Time | < 100ms |



\## 14.5 Blog Performance



| Metric | Target |

|--------|--------|

| MDX Compilation Time | < 500ms |

| Blog List Load Time | < 200ms |

| Individual Post Load Time | < 100ms |

| Search Query Time | < 300ms |



\## 14.6 RBAC Performance



| Metric | Target |

|--------|--------|

| Permission Check (Cached) | < 5ms |

| Permission Check (Uncached) | < 50ms |

| Role Assignment | < 100ms |

| Permission Cache Invalidation | < 50ms |



\---



\# 15. ERROR HANDLING



\## 15.1 Error Hierarchy



```

Error

&#x20; ├── ValidationError

&#x20; │   ├── InvalidInputError

&#x20; │   ├── MissingFieldError

&#x20; │   └── FormatError

&#x20; ├── AuthenticationError

&#x20; │   ├── InvalidTokenError

&#x20; │   ├── ExpiredTokenError

&#x20; │   └── InvalidCredentialsError

&#x20; ├── AuthorizationError

&#x20; │   ├── InsufficientPermissionError

&#x20; │   ├── ResourceAccessError

&#x20; │   └── RoleRequiredError

&#x20; ├── BusinessError

&#x20; │   ├── DuplicateVoteError

&#x20; │   ├── PollClosedError

&#x20; │   ├── CaseStatusError

&#x20; │   └── InsufficientEvidenceError

&#x20; ├── VerificationError

&#x20; │   ├── NIMCVerificationError

&#x20; │   ├── OnfidoVerificationError

&#x20; │   └── ManualVerificationError

&#x20; ├── RateLimitError

&#x20; │   ├── LimitExceededError

&#x20; │   └── BlockedError

&#x20; ├── BlogError

&#x20; │   ├── PostNotFoundError

&#x20; │   ├── InvalidMDXError

&#x20; │   └── DuplicateSlugError

&#x20; └── SystemError

&#x20;     ├── DatabaseError

&#x20;     ├── CacheError

&#x20;     ├── StorageError

&#x20;     └── ExternalServiceError

```



\## 15.2 Error Handling Strategy



```

Service Layer

&#x20; • Throw typed errors

&#x20; • Include context

&#x20; • Log before throwing (with correlation IDs)



API Layer

&#x20; • Catch all service errors

&#x20; • Map to HTTP status codes

&#x20; • Format consistent error response

&#x20; • Add rate limit headers (if applicable)

&#x20; • Add permission details (for 403 errors)



Web Layer

&#x20; • Catch errors in server functions

&#x20; • Show user-friendly messages

&#x20; • Log with stack traces

```



\---



\# 16. APPENDICES



\## Appendix A: Technology Version Matrix



| Component | Version | Notes |

|-----------|---------|-------|

| Bun | 1.0+ | Runtime |

| TanStack Start | Latest | Web framework |

| Hono | Latest | API framework |

| React | 18+ | UI library |

| React Native | 0.72+ | Mobile framework |

| Expo | 50+ | Mobile toolchain |

| Drizzle ORM | Latest | Database ORM |

| PostgreSQL | 14+ | Primary database |

| SQLite | 3+ | Cache + rate limits |

| TypeScript | 5+ | Language |

| WireGuard | Latest | VPN protocol (primary) |

| MDX | 2.0+ | Blog content format |

| CASL | Latest | RBAC library |



\## Appendix B: Ports and Services



| Service | Port | Description |

|---------|------|--------------|

| Web Application | 3000 | Main web server |

| API Layer | 3000 | Same port, `/api` route |

| PostgreSQL | 5432 | Primary database (internal only) |

| SQLite Cache | N/A | File-based, `./cache.db` |

| SQLite Rate Limit | N/A | File-based, `./rate-limit.db` |

| WireGuard | 51820 | VPN tunnel |

| SSH | 22 | Administration (restricted) |



\## Appendix C: External API Dependencies



| Service | Purpose | Reliability Target |

|---------|---------|---------------------|

| NIMC NVS API | Identity verification | 99.9% |

| Onfido API | Document verification | 99.9% |

| Paystack API | Payment processing | 99.9% |

| Bunny CDN | File storage/delivery | 99.9% |



\## Appendix D: Core Dependencies



```json

{

&#x20; "dependencies": {

&#x20;   "@tanstack/react-start": "latest",

&#x20;   "hono": "latest",

&#x20;   "drizzle-orm": "latest",

&#x20;   "postgres": "latest",

&#x20;   "react": "latest",

&#x20;   "react-dom": "latest",

&#x20;   "zod": "latest",

&#x20;   "tailwindcss": "latest",

&#x20;   "shadcn/ui": "latest",

&#x20;   "@mdx-js/react": "latest",

&#x20;   "@mdx-js/mdx": "latest",

&#x20;   "remark": "latest",

&#x20;   "rehype": "latest",

&#x20;   "@casl/ability": "latest",

&#x20;   "@casl/react": "latest"

&#x20; },

&#x20; "devDependencies": {

&#x20;   "@types/bun": "latest",

&#x20;   "drizzle-kit": "latest",

&#x20;   "typescript": "5+",

&#x20;   "@types/react": "latest",

&#x20;   "@types/react-dom": "latest"

&#x20; }

}

```



\## Appendix E: Changelog



| Version | Date | Notes |

|---------|------|-------|

| 1.0.0 | 2026-07-20 | First consolidated release. Removed duplicated §12.2 permissions matrix (now references §4.3.1). Filled in previously empty Cache Client (§6.3.1), Cache Key Patterns (§6.2.3), Clarified role-hierarchy vs. explicit-grant semantics in RBAC (§4.2.1). Removed the unreachable `isAdmin` branch inside `defineAbilityFor`'s per-resource checks, since the function returns early for admins. |



\---



\*Document Version: 1.0.0\*

\*Last Updated: July 20, 2026\*

\*Prepared by: Najia Community Bridge Technical Team\*

