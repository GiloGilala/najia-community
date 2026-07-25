# Module Spec — [Module Name]

*Document Version: [X.Y.Z]*
*Last Updated: [YYYY-MM-DD]*
*Status: Draft | In Review | Approved | Superseded*
*Owner: [Name, Role]*
*Parent PRD: [Link to PRD.md]*

> **Changelog:** [Brief note about this version's changes]

---

## 1. Overview

### 1.1 Module Name
### 1.2 Purpose
[One paragraph: what this module does and why it exists]

### 1.3 In Scope
### 1.4 Out of Scope
[Be explicit — what's deferred to a later module or PRD iteration?]

### 1.5 Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|--------------------|

---

## 2. User Stories

| As a... | I want to... | So that... | Priority |
|---------|--------------|------------|----------|

---

## 3. Functional Specification

### 3.1 Data Model
[Reference the Database spec; summarize key entities and relationships here]

### 3.2 API Surface
[Reference the API spec; summarize key endpoints here]

### 3.3 Business Rules
[Numbered list of explicit rules. If a rule says "depends on the user's role", reference the RBAC spec instead of redefining permissions here.]

### 3.4 State Machine (if applicable)
[State A] ──[trigger]──► [State B]
│ │
└──[trigger]──► [State C] └──[trigger]──► [State A]

text


### 3.5 Edge Cases and Error Handling

| Scenario | Expected Behavior | Error Code |
|----------|-------------------|------------|

---

## 4. Permissions

Reference [RBAC.md](../technical/RBAC.md) and the project's permission grant matrix. List the specific permissions this module requires:

| Permission | Roles | Notes |
|------------|-------|-------|

If this module introduces a new permission, it must be added to RBAC.md *and* to the corresponding `defineAbilityFor` branch.

---

## 5. User Experience

### 5.1 Key Screens
### 5.2 User Flows
### 5.3 Empty / Loading / Error States

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|

---

## 7. Dependencies

| Depends On | Type | Notes |
|-----------|------|-------|
| [Other Module] | Module | |
| [External API] | External | |

---

## 8. Acceptance Criteria

Testable checklist. Every item must be verifiable.

- [ ] ...
- [ ] ...

---

## 9. Test Plan Summary

Reference [QA.md](../technical/QA.md) for the testing strategy. Briefly note:
- Unit test focus areas
- Integration test scenarios
- E2E scenarios
- Manual test scenarios

---

## 10. Rollout Plan

### 10.1 Feature Flags
### 10.2 Migration (if applicable)
### 10.3 Rollback Plan

---

## 11. Open Questions

| # | Question | Owner | Status | Decision |
|---|----------|-------|--------|----------|

---

## Appendix A: Glossary
## Appendix B: References
## Appendix C: Changelog