# Quality Assurance and Testing Strategy

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Active*
*Owner: QA Lead (TBD) / Engineering Lead*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial set. Establishes the testing strategy, the test pyramid, the negative test rule, the security testing requirements, and the QA processes that support the pilot launch.

> **How to read this document:** This is the **"how we verify the code works"** document. It complements [Engineering.md](./Engineering.md) (the "how we write code") and the module specs (the "what we built"). Every module spec has a "Test Plan Summary" section that references this document; this document references the module specs back.

> **Related documents:**
> - [Engineering.md](./Engineering.md) — the engineering standards
> - [ARCHITECTURE.md §9](../ARCHITECTURE.md#9-observability) — observability
> - [ADRs.md](../ADRs.md) — the architectural decisions
> - [Module Specs](../modules/) — each module has a test plan summary

---

## 1. Testing Philosophy

The platform's testing strategy is guided by these principles:

| Principle | Application |
|-----------|-------------|
| **Test the behavior, not the implementation** | Tests should describe what the code does, not how. When the implementation changes, the tests should not need to change. |
| **Test the security boundary** | Every endpoint, every file upload, every authentication flow is tested for security. |
| **Test the privacy guarantee** | The Amara test, the Tunde test, the Ngozi test, and the Kemi test are applied to every module. |
| **Negative tests are first-class** | For every "user can do X" test, there is a matching "user cannot do X" test. |
| **The pyramid, not the iceberg** | Many unit tests, fewer integration tests, fewer e2e tests. Don't invert the pyramid. |
| **Manual testing is real testing** | Some things can only be tested manually (UX, real users, real networks). Manual testing is part of the strategy, not a fallback. |
| **Security tests are required, not optional** | Every module with security-sensitive code has required security tests. |
| **Tests are documentation** | A well-written test describes what the code is supposed to do. |

---

## 2. The Test Pyramid
text

     /\
    /  \        Manual tests (UX, real users, real networks)
   /----\       
  / E2E  \      E2E tests (full user journeys)
 /--------\     
/Integration\   Integration tests (API endpoints, DB)
/--------------\
/ Unit tests \ Unit tests (services, utilities, business logic)
/------------------\

text


### 2.1 Volume Targets

| Layer | Target | Rationale |
|-------|--------|-----------|
| Unit | 70% of total tests | Many small, fast, focused tests |
| Integration | 20% of total tests | Fewer, slower, more comprehensive |
| E2E | 8% of total tests | Few, slow, full-flow |
| Manual | 2% of total tests | Few, real-world |

### 2.2 Coverage Targets

| Layer | Coverage target |
|-------|-----------------|
| Unit tests (services) | ≥ 85% line coverage |
| Unit tests (critical code: anonymization, hashing, fee model) | ≥ 95% line coverage |
| Unit tests (lib) | ≥ 90% line coverage |
| Integration tests (API) | ≥ 70% of endpoints |
| E2E tests (user journeys) | All 8 journeys from [User Journeys.md](../product/User%20Journeys.md) |

The coverage targets are enforced in CI. A PR that drops coverage below the target is blocked.

### 2.3 Speed Targets

| Layer | Speed target |
|-------|--------------|
| Unit tests | < 5 seconds total |
| Integration tests | < 60 seconds total |
| E2E tests | < 5 minutes total |
| Full CI | < 15 minutes total |

Slow tests are a smell. If a test is slow, it should be moved down the pyramid (faster layer) or made faster.

---

## 3. Unit Tests

Unit tests are the foundation. They test individual functions or classes in isolation.

### 3.1 What to Test

For each service or utility:
- **Happy path:** the main use case works
- **Edge cases:** boundary conditions, empty inputs, large inputs
- **Error paths:** the service returns the right error in the right circumstances
- **State transitions:** the state machine transitions correctly
- **Invariants:** things that should always be true

### 3.2 What NOT to Test

- Implementation details (internal helpers that aren't part of the public API)
- Third-party code (the third party tests their code)
- Trivial getters and setters (unless they have logic)

### 3.3 Patterns

- **Arrange-Act-Assert (AAA):** structure each test in three parts
- **One assertion per test:** focus on one behavior per test (when practical)
- **Descriptive names:** the test name describes the behavior, not the implementation
- **No test interdependence:** each test sets up its own state
- **No I/O:** unit tests don't touch the database, the file system, or the network (use mocks or stubs)

### 3.4 Tools

- **Test runner:** Bun's built-in test runner (or Jest if Bun's runner is insufficient)
- **Assertions:** `expect` from Bun test (or Jest)
- **Mocks:** Built-in `mock` from Bun test (or Jest mocks)
- **Coverage:** `c8` (or similar)

### 3.5 Example

```typescript
// services/verification.service.test.ts

import { describe, test, expect, mock } from 'bun:test';
import { generateVoterTokenHash } from './voter-token';

describe('generateVoterTokenHash', () => {
  const pepper = 'test-pepper-do-not-use-in-prod';

  test('generates a 64-character SHA-256 hash', () => {
    const hash = generateVoterTokenHash('usr_1', 'pll_44', pepper);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('produces different hashes for different users', () => {
    const hash1 = generateVoterTokenHash('usr_1', 'pll_44', pepper);
    const hash2 = generateVoterTokenHash('usr_2', 'pll_44', pepper);
    expect(hash1).not.toBe(hash2);
  });

  test('produces different hashes for different polls', () => {
    const hash1 = generateVoterTokenHash('usr_1', 'pll_44', pepper);
    const hash2 = generateVoterTokenHash('usr_1', 'pll_55', pepper);
    expect(hash1).not.toBe(hash2);
  });

  test('produces the same hash for the same inputs', () => {
    const hash1 = generateVoterTokenHash('usr_1', 'pll_44', pepper);
    const hash2 = generateVoterTokenHash('usr_1', 'pll_44', pepper);
    expect(hash1).toBe(hash2);
  });

  test('cannot be reversed to identify the user', () => {
    // This is a property test, not a unit test, but we can check the obvious:
    // the hash does not contain the user ID.
    const hash = generateVoterTokenHash('usr_1', 'pll_44', pepper);
    expect(hash).not.toContain('usr_1');
    expect(hash).not.toContain('usr');
  });
});
3.6 Negative Tests Are First-Class
For every "user can do X" test, there is a matching "user cannot do X" test. This is the most important test pattern in the project. Examples:

"A verified user can vote" → "An unverified user cannot vote"
"A user can see their own evidence" → "A user cannot see another user's evidence"
"A moderator can decide on a queue item" → "A non-moderator cannot decide"
"A lawyer can see evidence in their assigned case" → "A lawyer cannot see evidence outside their assigned case"
The negative tests are where the privacy and security guarantees are verified. They are the most important tests in the project.

4. Integration Tests
Integration tests test the API endpoints and the database together. They verify that the components work together correctly.

4.1 What to Test
Endpoint behavior: the endpoint returns the right data for the right inputs
Status codes: the endpoint returns the right HTTP status code
Error codes: the endpoint returns the right error code in the right circumstances
Database state: the database is updated correctly
Side effects: the right events are emitted, the right notifications are sent
RBAC enforcement: the endpoint enforces the right permissions
Rate limiting: the endpoint enforces the right rate limits
4.2 What NOT to Test
Implementation details (covered by unit tests)
E2E flows (covered by e2e tests)
Manual scenarios (covered by manual tests)
4.3 Patterns
Test against a real database (not a mock): use a test database with the same schema
Reset state between tests: use transactions or truncation
Test one endpoint per test: don't test multiple endpoints in one test
Test both happy and error paths
Use the same request/response format as the API
4.4 Tools
Test runner: Bun's test runner
HTTP testing: Hono's test client (app.request())
Database: A separate test database (Postgres test instance)
Test data: Factories or fixtures (no hard-coded IDs)
4.5 Example
TypeScript

// server/api/routes/polls.test.ts

import { describe, test, expect, beforeEach } from 'bun:test';
import { app } from '../index';
import { resetDatabase, createTestUser, createTestPoll } from '../../test-utils';

describe('POST /api/polls/:pollId/vote', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  test('a verified user can vote on an active poll', async () => {
    const user = await createTestUser({ verified: true, jurisdiction: 'lagos' });
    const poll = await createTestPoll({ status: 'ACTIVE', jurisdiction: 'lagos' });
    const token = user.token;

    const res = await app.request(`/api/polls/${poll.id}/vote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ optionId: poll.options[0].id }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.voteRecorded).toBe(true);
  });

  // NEGATIVE TEST: the most important test pattern in the project
  test('an unverified user cannot vote', async () => {
    const user = await createTestUser({ verified: false });
    const poll = await createTestPoll({ status: 'ACTIVE' });
    const token = user.token;

    const res = await app.request(`/api/polls/${poll.id}/vote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ optionId: poll.options[0].id }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('VERIFICATION_REQUIRED');
  });

  test('a user cannot vote twice on the same poll', async () => {
    const user = await createTestUser({ verified: true, jurisdiction: 'lagos' });
    const poll = await createTestPoll({ status: 'ACTIVE', jurisdiction: 'lagos' });
    const token = user.token;

    // First vote succeeds
    await app.request(`/api/polls/${poll.id}/vote`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId: poll.options[0].id }),
    });

    // Second vote fails
    const res = await app.request(`/api/polls/${poll.id}/vote`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId: poll.options[0].id }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe('ALREADY_VOTED');
  });
});
4.6 Database Testing
Use a separate test database (not the development or production database)
Reset the database between tests (use transactions or TRUNCATE)
Use factories to create test data (not hard-coded IDs)
Test the actual SQL behavior, not the Drizzle abstraction (Drizzle has its own tests)
5. E2E Tests
E2E tests test full user journeys through the actual application (web or mobile). They verify that the entire system works together.

5.1 What to Test
The 8 user journeys from User Journeys.md:

J1 — First-time user becomes a verified citizen
J2 — Verified citizen votes on a policy poll
J3 — Verified citizen votes on a confidence question
J4 — Citizen with a dispute gets matched to a lawyer
J5 — Lawyer registers and gets the first match
J6 — Citizen uploads evidence and verifies it
J7 — Moderator publishes a poll
J8 — User appeals a moderation decision
Each journey is tested in a real browser (web) or on a real device (mobile). The tests interact with the actual UI, not the API.

5.2 What NOT to Test
Implementation details (covered by unit and integration tests)
Visual regressions (covered by visual testing tools)
Performance (covered by performance tests)
Security (covered by security tests)
5.3 Patterns
One journey per test file: each journey is its own test
Independent setup: each test sets up its own data
Real environment: use a staging-like environment, not production
Clean up after: the test cleans up its data (or uses a separate test database)
5.4 Tools
Web: Playwright (or Cypress)
Mobile: Maestro (or Detox)
Environment: Staging or a dedicated E2E environment
Test data: Created via the API (not the UI) for speed
5.5 Example (Playwright, J2)
TypeScript

// tests/e2e/j2-vote-on-policy-poll.spec.ts

import { test, expect } from '@playwright/test';
import { createTestUserViaApi, createTestPollViaApi } from '../utils/api-helpers';

test('J2: verified citizen votes on a policy poll', async ({ page }) => {
  // Setup via API (faster than UI)
  const user = await createTestUserViaApi({ verified: true, jurisdiction: 'lagos' });
  const poll = await createTestPollViaApi({ status: 'ACTIVE', jurisdiction: 'lagos' });

  // Log in via UI
  await page.goto('/login');
  await page.fill('[name="email"]', user.email);
  await page.fill('[name="password"]', user.password);
  await page.click('[type="submit"]');

  // Navigate to the poll
  await page.goto(`/polls/${poll.id}`);
  await expect(page.locator('[data-testid="non-binding-disclaimer"]')).toBeVisible();

  // Vote
  await page.click('[data-testid="option-yes"]');
  await page.click('[data-testid="submit-vote"]');

  // Verify the confirmation
  await expect(page.locator('[data-testid="vote-confirmation"]')).toContainText(
    'Your vote has been recorded anonymously'
  );
});
6. Manual Tests
Some things can only be tested manually. The manual tests are documented and tracked, not ad-hoc.

6.1 What to Test Manually
UX: the experience is good (subjective but important)
Real users: real users behave differently than synthetic data
Real networks: low-bandwidth, high-latency, offline
Real devices: iOS, Android, various models
Edge cases: things that are hard to test in code (e.g., a corrupted file)
App Store review: the iOS / Android submission process
6.2 When to Test Manually
Before each major release
After significant UX changes
After platform-level changes (e.g., new feature flag, new external service)
During the pilot (continuously, with real users)
After any incident
6.3 Documentation
Each manual test is documented with:

What: the scenario being tested
How: the steps to perform
Expected: the expected outcome
Owner: who performs the test
Frequency: how often it's performed
Manual tests live in tests/manual/ as Markdown documents.

7. Security Tests
Security tests are a first-class layer. They verify the platform's security guarantees.

7.1 The Required Security Tests
Every module with "Security Tests (required)" in its spec must pass those tests before launch. The security tests are listed per module:

Module	Security test focus
Authentication & Identity Verification	Password storage, JWT handling, NIMC/Onfido integration, rate limits
Policy Polls	Voter anonymization (reversal, cross-table correlation), non-binding disclaimer visibility, rate limits
Confidence Votes	Voter anonymization (cross-table correlation with Policy Polls), rate limits
Evidence Upload & Integrity	Integrity hash (modification detection), AI detection bypass, file access control
Lawyer Onboarding & Verification	Fee model grep (no percentage), Paystack webhook signature, bar number uniqueness
Lawyer Matching & Consultation	Identity protection (lawyer cannot see citizen before consultation), consultation room access
Lawyer Reviews	Review submission access, engagement confirmation, review response access
Moderation	Reviewer reassignment (no self-appeal-decide), moderation action RBAC
Blog & Content	MDX sandboxing (no code injection), comment access, quiz progress access
Admin & Operations	Self-protection (cannot suspend self, cannot change own role), senior admin approval, audit log access
Mobile App	Token storage (SecureStore, encrypted), certificate pinning, offline behavior
The bolded items are the highest-stakes tests. They are the most important to get right.

7.2 Penetration Testing
For the pilot launch, a penetration test is performed by an external firm (or a senior engineer acting as an internal red team). The test covers:

Authentication and authorization: attempt to bypass login, JWT validation, RBAC
Privacy: attempt to correlate anonymized data, retrieve DSAR-protected data
Fee model: attempt to introduce a percentage-of-fees code path
Voter anonymization: attempt to reverse the voter token hash
Evidence integrity: attempt to modify evidence without detection
Input validation: attempt to inject code, SQL, or commands
Rate limiting: attempt to bypass rate limits
Webhooks: attempt to forge webhook signatures
The penetration test report is reviewed by the Engineering Lead and the Legal Director. Findings are triaged and addressed before launch.

7.3 The Voter Anonymization Test
This is the most important security test in the project. It verifies the ADR-009 design:

No user_id column: verify the poll_votes and confidence_votes tables have no user_id column
Hash cannot be reversed: attempt to reverse a sample hash to a user_id (must fail)
Cross-table correlation: create votes in both poll_votes and confidence_votes for the same user, attempt to correlate them by hash analysis (must fail because the pepper is shared)
DSAR response: request a DSAR, verify the response explicitly states that poll votes are not retrievable
Eligibility check logs: verify that eligibility check logs do not contain the user's choice
7.4 The Fee Model Test
This is the most important compliance test in the project. It verifies ADR-011:

The CI grep passes: the fee model grep (§6 of Engineering.md) finds no violations
No method takes a percentage: review the subscription service for any method that calculates a percentage
No field is a percentage: review the schema for any field that represents a percentage of a fee
Code review sign-off: the Legal Director has signed off on the fee model code
8. The Negative Test Rule
This is the most important test pattern in the project. It deserves its own section.

8.1 The Rule
For every "user can do X" test, there must be a matching "user cannot do X" test. The "user cannot" test is the more important one.

8.2 Why
Most bugs are missing denials, not missing grants. A feature that works correctly for the intended user is great, but a feature that grants unintended access to the wrong user is a security or privacy incident.

The negative tests are where the platform's security and privacy guarantees are verified. Without them, we don't know if the guards work.

8.3 Examples by Module
Module	Positive test	Negative test
Authentication	A verified user can log in	An unverified user cannot access gated features
Policy Polls	A verified user in the jurisdiction can vote	An unverified user cannot vote; a user outside the jurisdiction cannot vote; a user cannot vote twice
Evidence	A user can upload evidence	A user cannot upload unsupported types; a user cannot access another user's evidence
Lawyer Matching	A citizen can be matched to a lawyer	A lawyer cannot see the citizen's identity before the consultation
Lawyer Reviews	A citizen can submit a review	A user cannot review a consultation they did not complete; a user cannot review without engagement confirmation
Moderation	A moderator can decide on a queue item	The original moderator cannot decide on the appeal; a non-moderator cannot access the queue
Admin	An admin can suspend a user	An admin cannot suspend themselves; an admin cannot remove the last admin
Mobile	A mobile user can submit a vote	A mobile user cannot bypass certificate pinning; a mobile user cannot access cached content after logout
8.4 The 1:1 Ratio
The test suite should have approximately a 1:1 ratio of positive to negative tests. If a module has many positive tests but few negative tests, the negative test coverage is a gap.

9. Test Data Management
9.1 Test Data Principles
Realistic but not real: test data looks like production data but doesn't contain real PII
Isolated: each test has its own data, no shared state
Reset between tests: the database is reset between tests
Factories: use factories to create test data (not hard-coded values)
No production data in tests: production data is never copied to test environments
9.2 Factories
Factories are functions that create test data:

TypeScript

// tests/factories/user.ts

import { faker } from '@faker-js/faker';
import { db } from '../../db';
import { users } from '../../db/schema';

export async function createTestUser(overrides: Partial<User> = {}) {
  const user = {
    id: `usr_${faker.string.alphanumeric(8)}`,
    email: faker.internet.email(),
    fullName: faker.person.fullName(),
    role: 'citizen',
    verificationStatus: 'UNVERIFIED',
    createdAt: new Date(),
    ...overrides,
  };

  await db.insert(users).values(user);
  return user;
}
9.3 Sensitive Test Data
Some tests require sensitive data (e.g., test users with NINs, test lawyers with bar numbers). For these:

Use obviously fake values (e.g., 11111111111 for NIN, with a test-mode marker)
Document the test-mode marker in the NIMC and Onfido test environments
Never use real production data, even for testing
10. Test Environments
Environment	Purpose	Data	External services
Local (developer)	Development and unit tests	Synthetic	Mocked
CI	Automated tests on every PR	Synthetic	Mocked
Staging	Integration and e2e tests, manual testing	Synthetic (anonymized production-like)	Sandbox / test mode
Production	Real users	Real	Real
Each environment has its own database, its own cache, and its own secrets. Environments are isolated.

11. CI Pipeline
11.1 The Pipeline
text

┌──────────────┐
│  PR opened   │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────────────────────────┐
│  Type check  │────►│  Fail: block PR                 │
└──────┬───────┘     └──────────────────────────────────┘
       │ pass
       ▼
┌──────────────┐     ┌──────────────────────────────────┐
│   Lint       │────►│  Fail: block PR                 │
└──────┬───────┘     └──────────────────────────────────┘
       │ pass
       ▼
┌──────────────┐     ┌──────────────────────────────────┐
│ Fee model    │────►│  Fail: block PR                 │
│ grep audit   │     │  (notify Legal Director)        │
└──────┬───────┘     └──────────────────────────────────┘
       │ pass
       ▼
┌──────────────┐     ┌──────────────────────────────────┐
│ Unit tests   │────►│  Fail: block PR                 │
└──────┬───────┘     └──────────────────────────────────┘
       │ pass
       ▼
┌──────────────┐     ┌──────────────────────────────────┐
│ Integration  │────►│  Fail: block PR                 │
│ tests        │     │                                  │
└──────┬───────┘     └──────────────────────────────────┘
       │ pass
       ▼
┌──────────────┐     ┌──────────────────────────────────┐
│ E2E tests    │────►│  Fail: block PR                 │
│ (on main)    │     │  (run on merge to main)        │
└──────┬───────┘     └──────────────────────────────────┘
       │ pass
       ▼
┌──────────────┐
│  PR merged  │
└──────────────┘
11.2 The PR Gate
A PR cannot be merged if:

Type check fails
Lint fails
Fee model grep fails
Unit tests fail
Integration tests fail
Coverage drops below the target
The required reviewers have not approved
The PR is not up-to-date with main (or is rebased)
11.3 The Pre-Deploy Gate
Before deploying to staging or production:

All tests pass on main
The deployment is approved by the Engineering Lead
The deployment is communicated to the team
12. Bug Tracking
12.1 The Bug Workflow
Reported: a bug is found (by anyone: developer, QA, user)
Triaged: the Engineering Lead prioritizes the bug (P1, P2, P3)
Assigned: the bug is assigned to a developer
Fixed: the developer fixes the bug and adds a regression test
Verified: the fix is verified (by the developer and by QA)
Closed: the bug is closed; the regression test stays
12.2 Severity Levels
Severity	Definition	Response time
P1	Service is down or a critical feature is broken	Immediate
P2	A non-critical feature is broken or significantly degraded	< 1 business day
P3	A minor issue or a question	< 1 week
12.3 Regression Tests
Every bug fix must include a regression test. The test:

Reproduces the bug (fails before the fix)
Verifies the fix (passes after the fix)
Stays in the suite (prevents re-introduction)
This is the platform's commitment to not making the same mistake twice.

13. Performance Testing
Performance is a first-class concern, not a "we'll fix it later" concern.

13.1 What to Test
API response time: P95, P99 per endpoint
Database query time: P95 per query
Cache hit rate: percentage of cache hits
Rate limit performance: overhead of the rate limit check
Mobile app load time: cold start, screen transition
Web app load time: initial load, route transition
13.2 The Performance Budget
Per ARCHITECTURE.md §14:

Metric	Target
API P95 (read, cache hit)	< 50ms
API P95 (read, cache miss)	< 200ms
API P95 (write, simple)	< 100ms
API P95 (write, complex)	< 500ms
API P95 (evidence upload)	< 5s
API P95 (NIMC verification)	< 3s
Mobile app cold start	< 3s
Mobile API P95	< 1s
13.3 Load Testing
Before the pilot launch, a load test is performed to verify the platform handles the expected traffic:

Expected load: 500 MAU, 1,000 poll participants, 20 cases, 50 consultations
Peak load: 3x expected (e.g., during a major poll)
Stress test: 10x expected (to find breaking points)
The load test results are reviewed by the Engineering Lead. Any issues are addressed before launch.

14. The Definition of Done
A feature is "done" when:

 The code is written and follows the engineering standards
 Unit tests are written and pass (with the coverage target met)
 Integration tests are written and pass
 E2E tests are written and pass (if applicable)
 Security tests are written and pass (if applicable)
 The code is reviewed and approved (including the required reviewers)
 The fee model grep passes
 The documentation is updated (module spec, API doc, etc.)
 The feature is deployed to staging and manually tested
 The feature is behind a feature flag (for non-trivial features)
 The change is communicated to the team (in the changelog or standup)
A feature is NOT done if:

It only has positive tests (no negative tests)
It has "I'll add tests later" comments
It has console.log debugging statements
It has commented-out code
It has any types without justification
It has secrets in the code or in the env file
It hasn't been deployed to staging
15. The Pilot Launch Gate
The pilot cannot launch until all of the following are true:

 All Must-have features are implemented and accepted
 All Must-have acceptance criteria (from PRD.md §8) are verified
 All required security tests pass
 The penetration test report is reviewed and findings are addressed
 The performance test passes (load test at expected traffic)
 The fee model grep passes
 The voter anonymization tests pass
 The Amara, Tunde, Ngozi, and Kemi tests pass for every relevant module
 The Documentation Gate (from PRD.md §7.5) is met
 The Operations Gate (from PRD.md §7.4) is met
 The Communications Gate (from PRD.md §7.6) is met
 The Security and Compliance Gate (from PRD.md §7.3) is met
 The Quality Gate (from PRD.md §7.2) is met
This is the platform's commitment to not launching until we're ready.

16. Open Standards Practices
16.1 Open Testing Practices
Test names are descriptive (the test name describes the behavior)
Tests are organized by module and layer
Tests are versioned with the code
The test suite is reproducible (no flaky tests)
The test suite is fast (CI < 15 minutes)
16.2 Test Review
Every test is reviewed in the PR
The reviewer checks that the test actually tests what it claims to test
The reviewer checks that the test follows the patterns in this document
The reviewer checks that the negative tests are present
16.3 Test Maintenance
Tests are deleted when the code they test is deleted
Tests are updated when the code they test changes
Tests are not skipped without justification (use test.skip with a comment, or test.todo)
Flaky tests are fixed, not ignored
Appendix A: Test Tools
Tool	Purpose	Notes
Bun test	Test runner	Built into Bun; Jest-compatible
Playwright	E2E testing (web)	Cross-browser support
Maestro	E2E testing (mobile)	Expo-friendly
c8	Code coverage	Works with Bun
faker-js	Test data generation	Realistic but synthetic data
Supertest / Hono test	API testing	Hono's built-in test client
Artillery / k6	Load testing	For pre-launch load tests
Appendix B: Related Documents
Engineering.md — the engineering standards
ARCHITECTURE.md §9 — observability
ADRs.md — the architectural decisions
Module Specs — each module has a test plan summary
User Journeys.md — the 8 E2E user journeys
PRD.md §7 — the pilot release criteria
Appendix C: QA Revision History
Version	Date	Author	Changes
1.0.0	2026-07-20	Engineering Lead	Initial set. Establishes the testing strategy, the test pyramid, the negative test rule, the security testing requirements, the pilot launch gate, and the QA processes that support the pilot launch. The most important pattern is the negative test rule (§8), which is the platform's defense against missing denials