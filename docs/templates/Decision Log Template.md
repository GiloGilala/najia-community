# Decision Log

*Last Updated: [YYYY-MM-DD]*
*Owner: [Name, Role]*

> The Decision Log is the **chronological record of every meaningful decision** made on the project, both business and technical. It is the index; the details live in PRDs, ADRs, and meeting notes — not here.

---

## How to Use

1. **When you make a decision** (in a meeting, in a review, in a PR), add a one-line entry here.
2. **Link to the source of truth** for the decision (PRD section, ADR, meeting notes file, PR).
3. **If the decision reverses or supersedes a prior decision**, link to both.
4. **Status is a quick indicator only.** The linked document is the truth.

### Status Values

| Status | Meaning |
|--------|---------|
| 🟡 Proposed | Under discussion, not yet final |
| ✅ Accepted | Decision is in effect |
| ⛔ Deprecated | No longer applies, but kept for history |
| 🔄 Superseded | Replaced by a newer decision (link to it) |
| ❌ Rejected | Considered and not adopted (kept so we don't relitigate) |

---

## Decision Index

| ID | Date | Decision | Category | Status | Owner | Link |
|----|------|----------|----------|--------|-------|------|

### Category Values
`Business` · `Product` · `Technical` · `Security` · `Legal/Compliance` · `Operations` · `People/Timeline` · `Other`

---

## Recent Decisions (last 30 days)

| Date | ID | Decision | Status |
|------|----|----------|--------|

---

## Search by Category

### Business
[Filter the index]

### Product
[Filter the index]

### Technical
[Filter the index]

[...etc.]

---

## Conventions

- IDs follow `[CATEGORY]-[YYYYMMDD]-[NN]` (e.g., `TECH-20260720-01`).
- One entry per decision. Compound decisions get separate IDs.
- Never delete entries. Use status to mark them as Deprecated/Superseded.