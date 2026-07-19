# Najia Community Bridge — Domain Model

Najia Community Bridge is a civic-technology platform connecting Nigerian citizens with governance feedback, verified evidence management, and legal access. This glossary captures the domain language for the two slices built so far: the **Evidence Integrity** pipeline and **Authentication & Identity Verification**. Terms for later slices (polls, confidence votes, lawyers, officials, jurisdictions) are added when those slices are built.

## Language

### Accounts & Identity

**User**
A person who holds a platform account. The unit on which verification stages and ownership of evidence are tracked.
_Avoid_: account, citizen-account (use "User"; "citizen" is the civic role, not the account)

**Account Verification Status**
The forward-only lifecycle stage of a User's identity assurance.
Values: `unverified` → `email_verified` → `id_verified`.
_Avoid_: verification status (ambiguous — see Evidence Integrity Status)

**Contact Verification**
Proving a User controls their registered email or phone, by confirming a one-time code. Advances Account Verification Status `unverified` → `email_verified`.
_Avoid_: channel verification

**Identity Verification**
Proving a User's government ID through an external provider (Jumio/Onfido). Requires Contact Verification to be complete first. Advances Account Verification Status `email_verified` → `id_verified`. Only the ID's hash is ever stored.
_Avoid_: ID verification (acceptable colloquially, but "Identity Verification" is canonical)

**Session**
An authenticated, server-controlled period of access for a User, identified by a signed token. Expiry and revocation are tracked server-side; logout revokes it.
_Avoid_: token (the token is the credential; the Session is the entity)

### Evidence Integrity

**Evidence Record**
A single uploaded file (image, video, audio, or document) together with its metadata and integrity state, as submitted by a User in the context of a Case.
_Avoid_: evidence (use the noun phrase when referring to the persisted concept)

**Integrity Fingerprint**
The SHA-256 hash computed over the exact raw bytes of an uploaded file at upload time. Re-computing it later and comparing to the stored fingerprint detects tampering.
_Avoid_: hash, checksum

**Evidence Integrity Status**
The result of checking an Evidence Record's Integrity Fingerprint against its stored value.
Values: `verified` (match), `altered` (mismatch), `not_applicable` (file type not hash-verifiable).
_Avoid_: verification status (ambiguous — see Account Verification Status)

**Custody Record / Audit Trail**
The append-only, chronologically ordered log of events for an Evidence Record (uploaded, verified, accessed). No event can be updated or deleted.
_Avoid_: log (too generic)

### Cross-cutting

**Case**
The civil-dispute context to which an Evidence Record belongs. Used as a foreign key on the Evidence Record; the Case itself is defined by a later slice.
_Avoid_: dispute (use Case as the canonical container)

### Policy Sentiment Polls

**Jurisdiction**
A node in the residency hierarchy (national → state → local/LGA). A User's `jurisdictionId` places them; a poll's `jurisdictionId` scopes who may vote. Residency is satisfied when the voter's jurisdiction equals or is a descendant of the poll's jurisdiction (ancestor walk up `parent_id`).
_Avoid_: region, area (use Jurisdiction)

**Poll**
A non-binding citizen-sentiment question on policy, with 2–5 options and an open/close window. Lifecycle is `scheduled` → `open` → `closed`, derived from the clock against the window (stored `status` is a cached convenience).
_Avoid_: survey, vote (the "vote" is the citizen action, not the poll)

**Vote**
A single citizen's selection on a Poll, one per User per Poll (unique `(poll_id, voter_id)`). Stored with `option_index` and `voter_id` for uniqueness only; results are aggregate and never attribute a Vote to a User.
_Avoid_: ballot

**Poll Results**
Aggregate per-option counts and percentages plus the mandatory disclaimer: "This is citizen sentiment only. It has no legal or electoral weight." Aggregate-only — voters are never exposed.
_Avoid_: tally (use Poll Results)

