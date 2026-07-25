# Business Planning

*Phase 1 of the Najia Community Bridge documentation flow*
*Status: ✅ Phase 1 complete — ready for Phase 2 sign-off*

> This folder contains the **business planning** artifacts: the strategic rationale, the business case, the market context, and the running decision log. It is the foundation for everything that follows. The "why" before the "what" before the "how."

---

## Phase 1 Documents

| Document | Purpose | Owner |
|----------|---------|-------|
| [Project Charter](./Project%20Charter.md) | Strategic purpose, boundaries, success criteria, governance, milestone summary, and approval | Project Sponsor |
| [Business Case](./Business.md) | Revenue model, cost structure, 3-year projections, unit economics, funding strategy, decision triggers | Finance Director |
| [Market Research](./Market%20Research.md) | Market sizing (TAM/SAM/SOM), competitive landscape, user research, market trends, strategic implications | Project Lead |
| [Decision Log](./Decision%20Log.md) | Chronological index of every meaningful decision, with links to the source of truth | Project Lead |

---

## How to Read These Documents

If you are new to the project, read in this order:

1. **Project Charter** — start here. It tells you what the project is, what it isn't, who the stakeholders are, and what success looks like.
2. **Business Case** — how the project is funded, what the unit economics are, and what the path to sustainability looks like.
3. **Market Research** — who else is doing this, what users actually want, and what trends we're betting on.
4. **Decision Log** — not for a first read. Use it as a reference when you need to know *why* a particular choice was made.

If you are looking for a specific answer:

- **"What is this project trying to do?"** → Project Charter §2
- **"What does success look like?"** → Project Charter §4
- **"What is the path to sustainability?"** → Business Case §6
- **"What is the funding gap and how do we close it?"** → Business Case §7
- **"Who are the competitors?"** → Market Research §3
- **"Who is the user?"** → Market Research §4 (deferred to Phase 2 Personas.md for full detail)
- **"Why did we choose X?"** → Decision Log, then follow the link to the source document

---

## The Phase 1 Gate

Per the reference documentation flow, Phase 1 is complete when:

- ✅ The Project Charter exists and is approved
- ✅ The Business Case exists with defensible financials
- ✅ Market Research exists with cited sources
- ✅ A Decision Log is established with at least the decisions embedded in the above

**Current status:** Drafts of all four documents exist. The gate is "✅ Business Approved" once the Project Charter and Business Case are formally signed off by the Project Sponsor and the Board of Directors. The Decision Log is a living document and does not require sign-off to enter Phase 2.

**Next step:** Move to **Phase 2 — Product Planning**, beginning with `product/PRD.md`.

---

## Living Documents in This Folder

| Document | Update cadence |
|----------|----------------|
| Project Charter | At major scope changes or annually, whichever comes first |
| Business Case | Quarterly (re-forecast), and at any funding event |
| Market Research | Annually (full refresh), bi-annually (competitive landscape), quarterly (trends) |
| Decision Log | Continuously — add entries on the day a decision is made |

---

## Related Folders

| Folder | Phase | Contents |
|--------|-------|----------|
| [`../templates/`](../templates/) | Phase 0 | Reusable templates used across all phases |
| [`../product/`](../product/) | Phase 2 (next) | PRD, Personas, User Journeys, UX & Design, Roadmap |
| [`../modules/`](../modules/) | Phase 3 | One file per product module (Authentication, User Management, etc.) |
| [`../technical/`](../technical/) | Phase 4 | Tech Stack, Architecture, Database, API, Security, Engineering, Infrastructure, ADRs, QA |
| [`../operations/`](../operations/) | Phase 6 | Operations, Runbooks, Release, Support |
| [`../customer/`](../customer/) | Phase 7 | Marketing, User Guide, FAQ, Troubleshooting |
| [`../growth/`](../growth/) | Phase 8 | Analytics & Experiments |

---

## Pointers to the Strategic Documents

For the platform's *mission, scope, features, and policies*, see the project-wide document:

- [PLATFORM.md](../PLATFORM.md) — the comprehensive platform document (mission, pillars, features, governance, monetization, risk, roadmap)

For the platform's *technical architecture*:

- [ARCHITECTURE.md](../ARCHITECTURE.md) — the technical architecture document
- [RBAC.md](../technical/RBAC.md) — role-based access control (forthcoming in Phase 4)

---

## Contact

For questions about any document in this folder, contact the document owner listed in the table at the top. For questions about the documentation flow itself, contact the Project Lead.