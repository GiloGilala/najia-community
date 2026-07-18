# 04 — Unsupported types & validation rejection

**What to build:** Users get honest feedback about which files can and cannot be integrity-verified, and bad uploads are rejected cleanly. Unsupported-but-accepted file types resolve to a `not_applicable` verification status (so users are not falsely reassured), while oversized or disallowed uploads are rejected with a clear reason and no evidence row is created. Validation lives in a single shared schema reused across entry points. Demoable: upload an unsupported type → `not_applicable`; upload an oversized/disallowed file → clear rejection, nothing persisted.

**Blocked by:** 02 — Upload & fingerprint evidence

**Status:** ready-for-agent

- [ ] A shared validation schema in `lib/validation/` defines allowed MIME types and max size
- [ ] Supported types (images JPG/PNG/WebP, video MP4/AVI/WebM, audio MP3/WAV/M4A, docs PDF/DOCX/TXT) are accepted
- [ ] An accepted-but-unsupported type resolves to `verification_status` = `not_applicable`
- [ ] Oversized uploads are rejected with a clear validation error and no evidence row is created
- [ ] Disallowed MIME types are rejected with a clear validation error and no evidence row is created
