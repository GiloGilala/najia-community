# Product Planning

*Phase 2 of the Najia Community Bridge documentation flow*
*Status: ✅ Phase 2 complete — ready for Phase 3 sign-off*

> This folder contains the **product planning** artifacts: the committed pilot scope, the user model, the user journeys, the UX and design rules, and the roadmap. It sits between the "why" (business) and the "how" (technical). The PRD is the commitment; the personas, journeys, UX, and roadmap are the supporting artifacts that make the commitment coherent.

---

## Phase 2 Documents

| Document | Purpose | Owner |
|----------|---------|-------|
| [PRD.md](./PRD.md) | The committed pilot scope — what we will ship for the Lagos launch, and what we explicitly will not | Product Lead |
| [Personas.md](./Personas.md) | User archetypes for the pilot (Amara, Tunde, Ngozi, Kemi) and sketch personas for later phases | Product Lead |
| [User Journeys.md](./User%20Journeys.md) | Eight end-to-end journeys covering the three pillars, identity, lawyer registration, and moderation | Product Lead |
| [UX & Design.md](./UX%20%26%20Design.md) | Operational design principles, 50-screen inventory, design system foundations, and the Amara test | Design Lead |
| [Roadmap.md](./Roadmap.md) | Feature-level roadmap across four horizons (Pilot / Phase 2 / Year 2 / Year 3) with priorities and the election freeze | Product Lead |

---

## How to Read These Documents

If you are new to the project, read in this order:

1. **PRD** — start here. It tells you what we are committing to ship and what success looks like.
2. **Personas** — who we are building for, in concrete enough terms to make tradeoffs.
3. **User Journeys** — what each persona actually does, end-to-end, with steps, decision points, and failure modes.
4. **UX & Design** — how it looks and feels, with a 50-screen inventory and the design system foundations.
5. **Roadmap** — what we are building, in what order, across four horizons.

If you are looking for a specific answer:

- **"What are we shipping for the pilot?"** → PRD §4 and §7, Roadmap §2
- **"Who is the user?"** → Personas §3 (primary) and §4 (secondary)
- **"How does a user accomplish X?"** → User Journeys §3–§10
- **"What does screen Y look like?"** → UX & Design §3 (50-screen inventory); wireframes in `docs/wireframes/` (forthcoming)
- **"Why is feature X in or out of scope?"** → PRD §1.5, Roadmap §2.2, §6.4
- **"What are we building next?"** → Roadmap §3 (Phase 2)
- **"Why is this design this way?"** → UX & Design §1 (design principles), §2.3 (non-binding disclaimer)

---

## The Phase 2 Gate

Per the reference documentation flow, Phase 2 is complete when:

- ✅ The PRD exists and is signed off by the named approvers
- ✅ Personas exist for the primary pilot user roles
- ✅ User journeys cover the pilot-critical flows
- ✅ UX & Design establishes the operational principles and the screen inventory
- ✅ The roadmap covers at least Pilot and Phase 2 with priorities

**Current status:** Drafts of all five documents exist. The gate is "✅ Product Defined" once the PRD is formally signed off by the Project Sponsor, Engineering Lead, Design Lead, Legal Director, and Operations Director. The other documents (Personas, Journeys, UX, Roadmap) accompany the PRD and are living documents.

**Next step:** Move to **Phase 3 — Module Planning**, where each Must-have feature in the PRD becomes one or more module specifications.

---

## The Pilot at a Glance

For a one-page summary of what we are committing to in the pilot, this is the picture:

| | |
|--|--|
| **Scope** | Lagos only |
| **Languages** | English only |
| **Pillars shipped** | All three (civic engagement, evidence integrity, lawyer marketplace), plus identity foundation |
| **Screens committed** | 50 (per UX & Design §3) |
| **Features committed** | 33 Must, 2 Should, 0 Could at pilot end (per Roadmap §2.1) |
| **Target users (Month 6)** | 500 verified MAU, 1,000 poll participants, 20 matched cases |
| **Hard gate before launch** | Year 1 funding gap closed (Business Case §7.1); pre-pilot research complete (PRD §2.2); all PRD §7 criteria met |
| **Hard constraint during pilot** | Election freeze begins Month 10; feature and marketing freeze apply |

---

## Living Documents in This Folder

| Document | Update cadence |
|----------|----------------|
| PRD | At end of each phase, or at any scope change |
| Personas | Quarterly, after major user research, or when a new role is added |
| User Journeys | When a flow changes, or when a new flow is added |
| UX & Design | When a screen is added/removed, or when a design system change affects many screens |
| Roadmap | End of each phase, quarterly, or at any major constraint change |

---

## How Phase 2 Connects to Other Phases

| Phase | Connection |
|-------|------------|
| **Phase 1 — Business** | The PRD's "what" is constrained by the Business Case's "how much." The personas reflect the user research in Market Research. |
| **Phase 3 — Module Planning** | The PRD §4 functional requirements become Module Specifications, one per Must-have feature. The user journeys feed the module specs' "user stories" sections. |
| **Phase 4 — Technical Design** | The UX & Design 50-screen inventory drives the frontend architecture. The personas' RBAC role mappings (Personas §5) feed the technical RBAC document. |
| **Phase 5 — Build** | The PRD §7 release criteria are the gate. The user journeys are the test plan. |
| **Phase 6 — Release** | The PRD §7.6 communications commitments and the user guide deferred from Phase 7 become inputs. |
| **Phase 7 — Customer** | The personas drive the user guide. The user journeys drive the FAQ. The UX & Design disclaimer placement becomes part of the marketing messaging. |

---

## Related Folders

| Folder | Phase | Contents |
|--------|-------|----------|
| [`../templates/`](../templates/) | Phase 0 | Reusable templates used across all phases |
| [`../business/`](../business/) | Phase 1 | Project Charter, Business Case, Market Research, Decision Log |
| [`../modules/`](../modules/) | Phase 3 (next) | One file per product module (Authentication, Polls, Evidence, etc.) |
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

For the *business case* (which constrains what the product can do):

- [Business Case](../business/Business.md) — financial model
- [Project Charter](../business/Project%20Charter.md) — strategic boundaries

---

## Contact

For questions about any document in this folder, contact the document owner listed in the table at the top. For questions about the documentation flow itself, contact the Project Lead.