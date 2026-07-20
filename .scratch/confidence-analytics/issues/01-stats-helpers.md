# 01 — Confidence analytics stats helpers

**What to build:** The pure, unit-testable statistics the analytics views need. Adds `lib/confidence-stats.ts` with a Wilson 95% confidence-interval helper and regional roll-up leaf detection. No service logic yet — this ticket makes the math exist and is tested in isolation.

**Blocked by:** None — can start immediately (reuses jurisdictions table shape)

**Status:** ready-for-agent

- [x] `lib/confidence-stats.ts` exports `wilsonInterval(successes, n, z?)` returning { low, high } within (0,1), narrowing as n grows, and handling n=0
- [x] A `isLeafLga(jurisdiction)` / descendant-walk helper to find leaf LGAs under an official's jurisdiction
- [x] Unit tests assert known Wilson values, the n=0 guard, and leaf detection
