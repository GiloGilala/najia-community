# Operational Runbooks

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Active*
*Owner: Engineering Lead + Operations Director*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial set. Consolidates the runbooks from technical/Infrastructure.md §7, adds the post-mortem template, the complete incident response checklists, the communication templates, the escalation matrix, and the recovery verification procedures.

> **How to read this document:** This is the **on-call engineer's master runbook**. Use it under pressure. Every runbook is a checklist. If a runbook doesn't work, **stop and ask for help** (the escalation matrix in §3 tells you who). Then update the runbook after the incident is resolved.

> **Related documents:**
> - [Operations.md §6](./Operations.md#6-incident-response) — the incident response workflow
> - [../technical/Infrastructure.md §7](../technical/Infrastructure.md#7-operational-runbooks) — the infrastructure-specific runbooks (some duplication by design — the on-call engineer should be able to find what they need in this document alone)
> - [../technical/Security.md §10](../technical/Security.md#10-incident-response) — the security incident response
> - [Release.md](./Release.md) — the release process (also relevant during and after deployments)

---

## 1. The On-Call Engineer's First 5 Minutes

When an alert fires or a user reports an issue, the on-call engineer follows this checklist in the first 5 minutes:

### 1.1 Acknowledge the Alert

- [ ] Acknowledge the alert in the alerting system (PagerDuty, OpsGenie, or similar)
- [ ] Note the time of acknowledgment (for the post-incident timeline)
- [ ] Open the incident channel (the engineering Slack channel or a dedicated incident channel)

### 1.2 Assess the Severity

- [ ] Check the health check endpoint: `curl -fsS https://najiacommunitybridge.com/health`
- [ ] Check the monitoring dashboard for the affected service(s)
- [ ] Classify the severity:
  - **P1:** Service is down or a critical feature is broken; a security breach has occurred or is suspected
  - **P2:** A non-critical feature is broken or significantly degraded
  - **P3:** A minor issue or a question

### 1.3 Start Communicating

- [ ] For P1: post in the incident channel within 30 minutes (per [Operations.md §6.3](./Operations.md#63-the-communication-plan))
- [ ] For P2: post in the engineering channel within 1 hour
- [ ] Use the communication templates in §5 below
- [ ] Update the status every 30 minutes (P1) or 2 hours (P2)

### 1.4 Begin Investigation

- [ ] Follow the appropriate runbook from §4 below
- [ ] If the runbook doesn't cover the situation, follow the general investigation procedure in §2 below
- [ ] If you're stuck for more than 15 minutes, escalate (per §3 below)

---

## 2. The General Investigation Procedure

When the specific runbook doesn't apply, use this general procedure.

### 2.1 The Investigation Checklist

- [ ] **Check the health check endpoint:** `curl -fsS https://najiacommunitybridge.com/health`
- [ ] **Check the error rate:** look at the last 1 hour of logs for the affected endpoint
- [ ] **Check the response time:** is it degraded or fully broken?
- [ ] **Check the recent changes:** was a deployment made in the last 24 hours?
- [ ] **Check the database:** is the connection pool healthy? Are there slow queries?
- [ ] **Check the cache:** is the hit rate normal?
- [ ] **Check the rate limit:** are there unusual breaches?
- [ ] **Check the external services:** is NIMC, Onfido, or Paystack degraded?
- [ ] **Check the audit log:** are there any unusual actions?

### 2.2 The Escalation Decision

If after 15 minutes of investigation the root cause is not identified, escalate:

- [ ] **Engineering Lead** — for technical issues
- [ ] **Operations Director** — for cross-team issues
- [ ] **Legal Director** — for compliance or NDPR issues
- [ ] **Project Sponsor** — for decisions that require Board awareness

The escalation matrix is in §3 below.

### 2.3 The Mitigation Decision

Before fixing the root cause, **mitigate first**:

- [ ] **Disable the affected feature** (if a feature flag exists, use it; otherwise, set up an emergency feature flag)
- [ ] **Redirect traffic** (if applicable; e.g., to a maintenance page)
- [ ] **Pause automated processes** (e.g., the AI detection pipeline if it's causing the issue)
- [ ] **Document the mitigation** (for the post-mortem)

Then fix the root cause.

### 2.4 The Communication During Investigation

- [ ] Post an initial status (P1 within 30 min, P2 within 1 hour)
- [ ] Update every 30 minutes (P1) or 2 hours (P2)
- [ ] Be honest about what you know and what you don't know
- [ ] Don't speculate publicly; say "we're investigating" if you're not sure

---

## 3. The Escalation Matrix

### 3.1 When to Escalate

| Situation | Escalate to | Time to escalate |
|----------|-------------|------------------|
| **P1 incident, root cause unknown after 15 min** | Engineering Lead | Immediate |
| **P1 incident, root cause known but fix requires changes** | Engineering Lead + Operations Director | Immediate |
| **P2 incident, root cause unknown after 1 hour** | Engineering Lead | Within 1 hour |
| **P3 incident** | (no escalation needed; handle in normal flow) | — |
| **Security incident (any severity)** | Engineering Lead + Legal Director | Within 1 hour |
| **NDPR data breach (suspected or confirmed)** | Legal Director | Immediate (within 1 hour) |
| **Election-adjacent issue** | Project Lead | Immediate |
| **Bar Association complaint** | Legal Director | Within 1 business day |
| **Donor / funder inquiry** | Project Sponsor | Within 1 business day |
| **Press inquiry** | Project Sponsor | Within 1 business day (do not respond directly) |
| **User complaint about a moderation decision** | Moderation Lead | Within 1 business day |
| **Financial anomaly (revenue or cost)** | Finance Director | Within 1 business day |
| **Vendor outage (NIMC, Onfido, Paystack, storage)** | Engineering Lead | Immediate |

### 3.2 Who to Call

| Role | Person | Contact (when available) |
|------|--------|--------------------------|
| Engineering Lead | [Name] | engineering@, [phone] |
| Operations Director | [Name] | ops@, [phone] |
| Legal Director | [Name] | legal@, [phone] |
| Project Lead | [Name] | project@, [phone] |
| Project Sponsor | [Name] | sponsor@, [phone] |
| Finance Director | [Name] | finance@, [phone] |
| Moderation Lead | [Name] | moderation@, [phone] |

If the primary contact is unreachable, escalate to their backup (per [Operations.md §2.2](./Operations.md#22-the-role-responsibilities)).

### 3.3 The Escalation Decision Tree
Is this a security incident?
├── Yes → Legal Director within 1 hour
│ └── Is this a confirmed NDPR breach?
│ ├── Yes → NDPC within 72 hours (Legal Director)
│ └── No → Continue investigation
└── No
├── Is this P1?
│ ├── Root cause unknown after 15 min → Engineering Lead
│ ├── Root cause known, fix requires changes → Engineering Lead + Operations Director
│ └── Root cause known, fix is simple → Handle directly
└── Is this P2?
├── Root cause unknown after 1 hour → Engineering Lead
└── Root cause known → Handle directly

text


---

## 4. The Scenario-Specific Runbooks

Each runbook is a checklist. Follow it step by step. If a step doesn't apply or doesn't work, **stop and ask for help**.

### 4.1 RB-001: Platform is Unreachable (P1)

**Symptoms:**
- Health check returns non-200
- Users report they cannot access the platform
- All endpoints returning 5xx errors

**Investigation:**
- [ ] Check the Bun process: `sudo systemctl status najia-blue` and `sudo systemctl status najia-green`
- [ ] Check the server: `ssh najia@10.0.0.1 "uptime; free -h; df -h"`
- [ ] Check the network: `ping najiacommunitybridge.com` from an external network
- [ ] Check the recent changes: any deployment in the last 24 hours?
- [ ] Check the logs: `sudo journalctl -u najia-blue --since "1 hour ago" | tail -100`

**Mitigation:**
- [ ] If a recent deployment caused the issue, roll back (per [Release.md §5](./Release.md#5-rollback))
- [ ] If the Bun process is down, restart it: `sudo systemctl restart najia-blue`
- [ ] If the server is overloaded, scale up (if possible) or restart services
- [ ] If the database is unreachable, check the database server (per RB-002)

**Communication:**
- [ ] Post the initial status (P1 within 30 min) using the P1 platform-down template (§5.1)
- [ ] Update every 30 minutes
- [ ] Update the status page (if available)

**Verification:**
- [ ] Health check returns 200
- [ ] All endpoints responding normally
- [ ] No errors in the logs for 15 minutes
- [ ] Users can complete key flows (login, vote, upload)

**Post-incident:**
- [ ] Write a post-mortem (per §6)
- [ ] Identify the root cause
- [ ] Define action items to prevent recurrence

### 4.2 RB-002: Database Connection Failure (P1)

**Symptoms:**
- All API endpoints returning 500 errors
- Error logs show "Connection refused" or "Connection pool exhausted"
- Health check returns 500 with `database: "unhealthy"`

**Investigation:**
- [ ] Check the database server: `sudo systemctl status postgresql`
- [ ] Check the connection pool: `psql -U najia_app -d najia -c "SELECT count(*) FROM pg_stat_activity;"`
- [ ] Check for long-running queries: `psql -U najia_app -d najia -c "SELECT pid, state, query_start, query FROM pg_stat_activity WHERE state != 'idle' ORDER BY query_start;"`
- [ ] Check the database logs: `sudo tail -100 /var/log/postgresql/postgresql-14-main.log`
- [ ] Check the disk space: `df -h /var/lib/postgresql/`

**Mitigation:**
- [ ] If a long-running query is blocking connections, kill it: `SELECT pg_cancel_backend(pid);`
- [ ] If the connection pool is exhausted, increase the max connections (temporary fix)
- [ ] If the database is down, restart it: `sudo systemctl restart postgresql`
- [ ] If the disk is full, clear the WAL archives: `rm /var/lib/postgresql/wal_archive/*.{old,backup}`

**Communication:**
- [ ] Post the initial status (P1 within 30 min) using the P1 database-failure template (§5.2)
- [ ] Update every 30 minutes
- [ ] Users may experience login failures; communicate this in the status

**Verification:**
- [ ] Database is responding: `psql -U najia_app -d najia -c "SELECT 1;"`
- [ ] All endpoints are responding
- [ ] Connection pool is healthy (utilization < 50%)
- [ ] No long-running queries

**Post-incident:**
- [ ] Write a post-mortem
- [ ] Identify the root cause
- [ ] Consider connection pool tuning or query optimization

### 4.3 RB-003: High Error Rate (>5%) (P1/P2)

**Symptoms:**
- Monitoring alerts on error rate > 5%
- Users report errors
- Logs show increased 4xx and 5xx responses

**Investigation:**
- [ ] Identify the affected endpoint(s): filter logs by endpoint, count errors
- [ ] Identify the error type: 4xx (client error) vs 5xx (server error)
- [ ] Check for patterns: same user? Same IP? Same time?
- [ ] Check for rate limit breaches: are users being throttled?
- [ ] Check the recent changes: any deployment in the last 24 hours?
- [ ] Check the database: are there slow queries?
- [ ] Check the external services: is NIMC, Onfido, or Paystack degraded?

**Mitigation:**
- [ ] If a specific endpoint is failing, consider temporarily disabling it (feature flag)
- [ ] If a deployment caused the issue, roll back
- [ ] If an external service is degraded, activate the fallback (e.g., Onfido for NIMC)
- [ ] If rate limiting is too aggressive, adjust the limits (temporary fix)

**Communication:**
- [ ] Post the initial status (P1 or P2 per the severity)
- [ ] Update regularly
- [ ] If users are affected, communicate via the in-app banner

**Verification:**
- [ ] Error rate returns to normal (< 1%)
- [ ] Logs show no new errors for 15 minutes
- [ ] Monitoring confirms the recovery

**Post-incident:**
- [ ] Write a post-mortem
- [ ] Identify the root cause
- [ ] Define action items (e.g., better monitoring, more graceful degradation, etc.)

### 4.4 RB-004: NIMC API Outage (P1/P2)

**Symptoms:**
- Users cannot complete NIMC verification
- Error logs show NIMC API timeouts or 5xx errors
- Health check shows `nimc_api: "unhealthy"`

**Investigation:**
- [ ] Check the NIMC API directly (if test endpoint exists)
- [ ] Check the recent NIMC API status (NIMC has a public status page or contact)
- [ ] Check the timeout configuration: is it 10 seconds as designed?
- [ ] Check the retry logic: are retries being exhausted?

**Mitigation:**
- [ ] **The platform automatically falls back to Onfido for new verifications** (per [Auth module §3.4](../modules/Authentication%20%26%20Identity%20Verification.md))
- [ ] Users attempting NIMC are shown a clear message and offered the Onfido path
- [ ] If Onfido is also down, users are added to a manual review queue

**Communication:**
- [ ] Post in the engineering channel
- [ ] If users are affected, communicate via the in-app banner: "We're having trouble with identity verification. Please try again later or use the document verification option."

**Verification:**
- [ ] NIMC API is back to normal
- [ ] Health check shows `nimc_api: "healthy"`
- [ ] Users can complete verification (via NIMC or Onfido)

**Post-incident:**
- [ ] Write a post-mortem
- [ ] Identify the root cause (NIMC outage, our timeout, our retry logic)
- [ ] Define action items

### 4.5 RB-005: Onfido API Outage (P1/P2)

**Symptoms:**
- Users cannot complete Onfido verification
- Error logs show Onfido API timeouts or 5xx errors
- Health check shows `onfido_api: "unhealthy"`

**Investigation:**
- [ ] Check the Onfido status page: https://status.onfido.com/
- [ ] Check the recent Onfido API errors: are they network issues or API errors?

**Mitigation:**
- [ ] Users attempting Onfido are added to a manual review queue
- [ ] The team processes the manual review queue within 5 business days
- [ ] If both NIMC and Onfido are down, all verifications go to manual review

**Communication:**
- [ ] Post in the engineering channel
- [ ] If users are affected, communicate via the in-app banner

**Verification:**
- [ ] Onfido API is back to normal
- [ ] Manual review queue is being processed

**Post-incident:**
- [ ] Write a post-mortem
- [ ] Identify the root cause

### 4.6 RB-006: Evidence Integrity Mismatch (P1)

**Symptoms:**
- An evidence file is flagged with `INTEGRITY_COMPROMISED`
- The alert "evidence integrity mismatch" fires
- A user cannot access their evidence

**Investigation:**
- [ ] Identify the affected evidence file: get the file ID from the alert
- [ ] Check the storage layer: is the file actually corrupted?
- [ ] Check the recent access log: who accessed the file recently?
- [ ] Check the storage provider's status: any storage incidents?
- [ ] Check the audit log: any suspicious activity?

**Mitigation:**
- [ ] **Move the affected file to a quarantine bucket immediately** (the file is not served, but is preserved for investigation)
- [ ] Notify the user: "Your file is temporarily unavailable. We're investigating."
- [ ] Notify the admin team (the alert goes to the on-call)
- [ ] If the storage layer is compromised, rotate the storage credentials

**Communication:**
- [ ] If this is a confirmed breach (not just a corruption), follow the security incident response (per [Security.md §10.3](../technical/Security.md#103-security-incident-specifics))
- [ ] Legal Director within 1 hour
- [ ] NDPC within 72 hours (if NDPR data was breached)
- [ ] User notification within 72 hours

**Verification:**
- [ ] The affected file is quarantined
- [ ] No other files are affected (check the storage layer integrity)
- [ ] The storage layer is secure

**Post-incident:**
- [ ] Write a post-mortem (with Legal Director sign-off)
- [ ] Identify the root cause (storage corruption, malicious access, etc.)
- [ ] Define action items (e.g., additional integrity checks, storage layer improvements)

### 4.7 RB-007: Voter Token Pepper Compromise (P1)

**Symptoms:**
- The voter token pepper self-test fails at server startup
- Or: a staff member with database access has left and we suspect the pepper was exposed
- Or: a security audit identifies the pepper as compromised

**Investigation:**
- [ ] Verify the compromise: is it confirmed or suspected?
- [ ] If suspected, do not panic; do not rotate yet (rotation is a drastic action)
- [ ] Consult the Legal Director before any action

**Mitigation (if confirmed):**
- [ ] **Rotate the pepper immediately** (this invalidates all existing votes; users must re-vote on active polls)
- [ ] Update the environment variable on the production server
- [ ] Restart the application
- [ ] Mark all existing votes in active polls as INVALID (the system can detect this via the old hash)
- [ ] Notify active poll participants: "Your previous vote was invalidated. Please re-vote."
- [ ] Notify the Advisory Board: the integrity of past polls is preserved (results are unchanged), but in-flight polls are affected

**Communication:**
- [ ] Legal Director within 1 hour
- [ ] Board within 4 hours
- [ ] NDPC within 72 hours (if the compromise is a breach under NDPR)
- [ ] Users affected by invalidated votes within 72 hours
- [ ] Public statement (if appropriate) via the Project Sponsor

**Verification:**
- [ ] The new pepper is in use
- [ ] The self-test passes at the next server restart
- [ ] The old hashes are correctly identified as invalid (the system can tell them apart)

**Post-incident:**
- [ ] Write a post-mortem (with Legal Director sign-off)
- [ ] Identify the compromise vector and close it
- [ ] Consider HSM-backed pepper storage (Y2)
- [ ] Update the runbook based on lessons learned

### 4.8 RB-008: Fee Model CI Grep Failure (PR-blocked)

**Symptoms:**
- The CI build fails with the fee model grep error
- The PR cannot be merged

**Investigation:**
- [ ] Identify the file and line that triggered the grep
- [ ] Is it a false positive or a real violation?

**Mitigation:**
- [ ] If a real violation: the PR is rejected; the developer is told to redesign the code
- [ ] If a false positive: the Legal Director reviews and adds an explicit allowlist to the grep configuration

**Communication:**
- [ ] Notify the PR author via PR comment
- [ ] If a real violation, notify the Legal Director

**Verification:**
- [ ] The PR is either corrected or the false positive is allowlisted (with Legal Director sign-off)
- [ ] The CI build passes on the corrected PR

**Post-incident:**
- [ ] Update the grep configuration if a new pattern was added
- [ ] No further action needed (this is a process control, not an incident)

### 4.9 RB-009: Database Connection Pool Exhaustion (P2)

**Symptoms:**
- API endpoints slow or return 500
- Health check shows `database: "unhealthy"` or `database: "degraded"`
- Monitoring alerts on connection pool > 80%

**Investigation:**
- [ ] Check the current connection count: `psql -U najia_app -d najia -c "SELECT count(*) FROM pg_stat_activity;"`
- [ ] Check for connection leaks: are there long-running connections that should have closed?
- [ ] Check for slow queries: are there queries holding connections?
- [ ] Check the recent traffic: is there a traffic spike?

**Mitigation:**
- [ ] Kill long-running queries: `SELECT pg_cancel_backend(pid);`
- [ ] If the traffic spike is the cause, consider rate limiting more aggressively (temporary)
- [ ] If the connection leak is the cause, restart the Bun process: `sudo systemctl restart najia-blue`
- [ ] Increase the max connections temporarily: edit `postgresql.conf` and reload

**Communication:**
- [ ] Post in the engineering channel
- [ ] If users are affected, communicate via the in-app banner

**Verification:**
- [ ] Connection pool utilization < 50%
- [ ] API endpoints responding normally
- [ ] No slow queries

**Post-incident:**
- [ ] Write a post-mortem
- [ ] Consider connection pool tuning or query optimization

### 4.10 RB-010: Rate Limit Surge (P2)

**Symptoms:**
- Monitoring alerts on rate limit breaches > 100/hour
- Users report being throttled unexpectedly
- The rate limit metrics show unusual patterns

**Investigation:**
- [ ] Check the rate limit metrics: who's being throttled? Same user? Same IP? Same endpoint?
- [ ] Check for bot patterns: are the requests automated?
- [ ] Check for legitimate traffic spikes: a poll just went live?

**Mitigation:**
- [ ] If it's a bot attack: block the offending IPs (at the firewall level)
- [ ] If it's a legitimate spike: consider increasing the rate limits (temporary)
- [ ] If it's a coordinated attack: activate the incident response for coordinated abuse

**Communication:**
- [ ] Post in the engineering channel
- [ ] If users are affected, communicate via the in-app banner: "We're seeing high traffic. Please try again."

**Verification:**
- [ ] Rate limit breaches return to normal (< 10/hour)
- [ ] Users can complete their intended actions

**Post-incident:**
- [ ] Write a post-mortem
- [ ] Consider rate limit tuning or additional abuse detection

### 4.11 RB-011: Backup Failure (P1)

**Symptoms:**
- The nightly backup fails (the alert fires)
- The backup verification reports an issue

**Investigation:**
- [ ] Check the backup logs: `/var/log/najia-backup.log`
- [ ] Check the disk space on the backup destination
- [ ] Check the encryption passphrase (if rotated)
- [ ] Check the rclone configuration (for off-site upload)
- [ ] Check the network: can the server reach the off-site destination?

**Mitigation:**
- [ ] If the local backup failed but the previous backup exists, no immediate action (the previous backup is still valid)
- [ ] If the off-site upload failed, retry manually
- [ ] If the disk is full, clear old backups
- [ ] If the passphrase was rotated, update the backup script

**Communication:**
- [ ] Post in the engineering channel
- [ ] The Legal Director and Operations Director are notified (backup failures are P1 because they affect NDPR compliance)

**Verification:**
- [ ] The backup completes successfully
- [ ] The backup can be restored (test in a staging environment)
- [ ] The off-site copy is verified

**Post-incident:**
- [ ] Write a post-mortem
- [ ] Identify the root cause
- [ ] Update the backup procedure if needed

### 4.12 RB-012: Server Disk Full (P2/P3)

**Symptoms:**
- The disk usage alert fires (> 80%)
- API endpoints start failing due to write errors
- The database logs show disk-related errors

**Investigation:**
- [ ] Check the disk usage: `df -h`
- [ ] Check the largest directories: `du -sh /var/log/* | sort -h | tail -10`
- [ ] Check the database size: `psql -U najia_app -d najia -c "SELECT pg_size_pretty(pg_database_size('najia'));"`
- [ ] Check the file storage: Cloudflare R2 / Bunny CDN dashboard

**Mitigation:**
- [ ] Clear old logs: `find /var/log -name "*.gz" -mtime +30 -delete`
- [ ] Clear old backups (after verifying they're not needed): `find /backups -name "*.dump*" -mtime +30 -delete`
- [ ] If the database is large, consider vacuuming: `psql -U najia_app -d najia -c "VACUUM FULL;"`
- [ ] If file storage is large, identify and archive old files

**Communication:**
- [ ] Post in the engineering channel
- [ ] If users are affected, communicate via the in-app banner

**Verification:**
- [ ] Disk usage < 60%
- [ ] API endpoints responding normally
- [ ] Monitoring is healthy

**Post-incident:**
- [ ] Write a post-mortem
- [ ] Consider increasing the disk size (Y2)

### 4.13 RB-013: Webhook Signature Verification Failure (P1)

**Symptoms:**
- A webhook (e.g., Paystack) is rejected with INVALID_SIGNATURE (401)
- The webhook is not processed
- Users may see subscription issues

**Investigation:**
- [ ] Check the webhook source: is it from a legitimate source?
- [ ] Check the signature: is the signature header present?
- [ ] Check the webhook secret: has it been rotated?
- [ ] Check the webhook payload: is it well-formed?

**Mitigation:**
- [ ] If the secret was rotated, update the webhook configuration in the source system (e.g., Paystack dashboard)
- [ ] If the source is legitimate but the signature is failing, investigate the signing process
- [ ] If the source is malicious, block the IP and document the attempt

**Communication:**
- [ ] Post in the engineering channel
- [ ] If users are affected (e.g., subscription not updated), notify them

**Verification:**
- [ ] The webhook processes successfully
- [ ] The subscription state is consistent

**Post-incident:**
- [ ] Write a post-mortem
- [ ] If a malicious attempt, log the IP and consider blocking

### 4.14 RB-014: Moderation Queue SLA Breach (P2)

**Symptoms:**
- The moderation queue size alert fires
- The SLA compliance metric drops below 95%
- A specific queue type is backed up

**Investigation:**
- [ ] Check the queue size per queue type: which type is backed up?
- [ ] Check the moderator workload: are moderators overloaded?
- [ ] Check the AI flagging: are there false positives overwhelming the queue?
- [ ] Check the recent content: is there a spike in user-generated content?

**Mitigation:**
- [ ] If moderators are overloaded: add more moderators (notify the Moderation Lead)
- [ ] If AI flagging has false positives: adjust the threshold (Engineering)
- [ ] If a specific queue type is backed up: notify the relevant sub-role moderators

**Communication:**
- [ ] Post in the engineering channel
- [ ] Notify the Moderation Lead
- [ ] If content moderation is delayed, communicate to users via the in-app banner: "Your content is being reviewed. This usually takes 24 hours."

**Verification:**
- [ ] Queue size returns to normal
- [ ] SLA compliance returns to > 95%

**Post-incident:**
- [ ] Write a post-mortem
- [ ] Consider staffing or process improvements

---

## 5. Communication Templates

Pre-written templates for the most common communications. Fill in the placeholders and post.

### 5.1 P1: Platform Down (Internal)
🚨 P1 INCIDENT — Platform Unreachable

Time detected: [TIME]
Detected by: [ALERT or USER REPORT]
On-call engineer: [NAME]

Current status: [INVESTIGATING / IDENTIFIED / MITIGATING / MONITORING / RESOLVED]

What we know:

[BRIEF DESCRIPTION OF THE ISSUE]
What we're doing:

[ACTION 1]
[ACTION 2]
Next update: [TIME, ~30 MIN FROM NOW]

text


### 5.2 P1: Platform Down (External — User-Facing)
We're currently experiencing an issue that is preventing some users from accessing the platform. Our team is actively investigating and working to resolve this as quickly as possible.

What we know: [BRIEF, NON-TECHNICAL DESCRIPTION]

What you can do: [e.g., "Please try again in a few minutes" or "Your data is safe"]

We'll update you as we learn more. Thank you for your patience.

text


### 5.3 P1: Database Failure (Internal)
🚨 P1 INCIDENT — Database Connection Failure

Time detected: [TIME]
Detected by: [ALERT or USER REPORT]
On-call engineer: [NAME]

Current status: [INVESTIGATING / IDENTIFIED / MITIGATING / MONITORING / RESOLVED]

What we know:

Database connection pool is [EXHAUSTED / UNREACHABLE]
API endpoints are returning 500 errors
[ANY OTHER OBSERVATIONS]
What we're doing:

Killing long-running queries if any
Restarting the database service if needed
Investigating the root cause
Next update: [TIME, ~30 MIN FROM NOW]

text


### 5.4 P1: Security Incident (Internal — Legal Director + Board)
🚨 P1 SECURITY INCIDENT

Time detected: [TIME]
Detected by: [ALERT or USER REPORT]
On-call engineer: [NAME]
Legal Director: [NAME] (notified at [TIME])

Nature of the incident:

[BRIEF DESCRIPTION — e.g., "Evidence integrity mismatch detected; suspected storage layer compromise"]
[AFFECTED DATA — e.g., "User-uploaded evidence files; potentially 100–500 users affected"]
[CONFIRMED OR SUSPECTED — e.g., "Confirmed breach" or "Suspected; under investigation"]
Immediate actions:

Affected file(s) quarantined
Storage layer credentials rotation in progress
User notifications being drafted (Legal Director to approve)
Next update: [TIME, ~1 HOUR FROM NOW]

This is being treated as a potential NDPR breach. NDPC notification will be made within 72 hours if confirmed.

text


### 5.5 P2: Degraded Service (Internal)
⚠️ P2 INCIDENT — Degraded Service

Time detected: [TIME]
Detected by: [ALERT or USER REPORT]
On-call engineer: [NAME]

Current status: [INVESTIGATING / IDENTIFIED / MITIGATING / MONITORING / RESOLVED]

What we know:

[BRIEF DESCRIPTION]
Affected endpoint(s): [ENDPOINTS]
User impact: [DESCRIPTION]
What we're doing:

[ACTION 1]
[ACTION 2]
Next update: [TIME, ~2 HOURS FROM NOW]

text


### 5.6 Resolution (Internal)
✅ RESOLVED — [BRIEF DESCRIPTION]

Time resolved: [TIME]
Total duration: [DURATION]
On-call engineer: [NAME]

Root cause: [BRIEF DESCRIPTION]

Actions taken:

[ACTION 1]
[ACTION 2]
Post-mortem: [LINK OR "To be written within 1 week"]

Action items: [TO BE TRACKED IN THE ISSUE TRACKER]

text


### 5.7 Resolution (External — User-Facing)
✅ Resolved — [BRIEF DESCRIPTION]

The issue that was affecting [SERVICE/FEATURE] has been resolved.

What happened: [BRIEF, NON-TECHNICAL DESCRIPTION]
What we did: [BRIEF DESCRIPTION]
What you can do now: [ACTION, IF ANY]

If you continue to experience issues, please contact support@najiacommunitybridge.com.

Thank you for your patience.

text


---

## 6. The Post-Mortem Template

Every P1 and P2 incident requires a post-mortem within 1 week. The post-mortem is **blameless** — the goal is to learn, not to blame.

### 6.1 The Template

```markdown
# Post-Mortem: [Incident Title]

*Date: [YYYY-MM-DD]*
*Author: [On-call engineer name]*
*Reviewers: [Engineering Lead, Operations Director, Legal Director (if security)]*
*Severity: [P1 / P2]*
*Duration: [Start time] → [End time] ([Total duration])*

> **Status:** Draft / Under Review / Final

---

## Summary

[One-paragraph summary of what happened, who was affected, and how it was resolved.]

## Timeline

All times in UTC.

| Time | Event |
|------|-------|
| [TIME] | [EVENT] |
| [TIME] | [EVENT] |
| [TIME] | [EVENT] |
| [TIME] | [EVENT — e.g., "Issue detected"] |
| [TIME] | [EVENT — e.g., "On-call paged"] |
| [TIME] | [EVENT — e.g., "Root cause identified"] |
| [TIME] | [EVENT — e.g., "Mitigation applied"] |
| [TIME] | [EVENT — e.g., "Issue resolved"] |
| [TIME] | [EVENT — e.g., "Post-mortem started"] |

## Root Cause

[What was the underlying cause? Not just the symptoms — the actual root cause. Use the "5 Whys" technique if helpful.]

## What Went Well

- [THING 1]
- [THING 2]
- [THING 3]

## What Went Poorly

- [THING 1]
- [THING 2]
- [THING 3]

## Where We Got Lucky

- [THING 1 — e.g., "The issue happened during business hours when the on-call was at their desk"]

## Action Items

| # | Action | Owner | Deadline | Status |
|---|--------|-------|----------|--------|
| 1 | [ACTION] | [OWNER] | [DATE] | [Open / In Progress / Done] |
| 2 | [ACTION] | [OWNER] | [DATE] | [Open / In Progress / Done] |
| 3 | [ACTION] | [OWNER] | [DATE] | [Open / In Progress / Done] |

## Lessons Learned

[What did we learn that we didn't know before? This is the most important section — the action items are the implementation, but the lessons are the understanding.]

## Related

- [Related incident 1]
- [Related runbook 1]
- [Related ADR 1]
6.2 The Post-Mortem Process
The on-call engineer writes the post-mortem within 1 week of the incident resolution
The Engineering Lead reviews the post-mortem
If the incident was a security incident, the Legal Director also reviews
The post-mortem is finalized
The action items are tracked in the issue tracker
The post-mortem is reviewed at the next incident of a similar type
The post-mortem is reviewed in the quarterly operations review
6.3 The Blameless Principle
Post-mortems are blameless. The goal is to learn, not to blame.

Focus on systems and processes, not individuals
Ask "what allowed this to happen?" not "who did this?"
Recognize that humans make mistakes; the question is how the system should have prevented the mistake or caught it earlier
Avoid language like "X should have done Y" or "X failed to do Y"
Use language like "the system could have prevented this by..." or "the runbook could be improved by..."
If a person made a serious error, the post-mortem can identify the system that allowed the error (e.g., "the runbook was unclear at this step"). The post-mortem is not a personnel review.

7. Recovery Verification Procedures
Every recovery operation ends with a verification. "I think it's fixed" is not the same as "I verified it's fixed."

7.1 The General Verification Procedure
After any recovery operation:

Wait 5 minutes — don't immediately declare victory; some issues take time to manifest
Check the health check endpoint — curl -fsS https://najiacommunitybridge.com/health
Check the monitoring dashboard — error rate, response time, connection pool, etc.
Check the error rate — is it < 1%? Is it trending down?
Check a representative user flow — can a user log in? Can they vote? Can they upload?
Check the logs — are there new errors in the last 5 minutes?
Document the recovery time — for the post-mortem
7.2 The Specific Verification Procedures
7.2.1 After a Bun Process Restart
 Process is running: sudo systemctl status najia-blue shows active (running)
 Health check returns 200
 All endpoints responding normally
 No new errors in the logs for 5 minutes
 Connection pool is healthy (utilization < 50%)
7.2.2 After a Database Recovery
 Database is responding: psql -U najia_app -d najia -c "SELECT 1;"
 All endpoints responding normally
 Data integrity is preserved (run a sanity check on critical tables)
 Backups are running (the next scheduled backup succeeds)
 No slow queries
7.2.3 After a Backup Recovery (Restore)
 The restored database has the expected data (compare with the original)
 All endpoints responding normally
 The application can read the restored data
 The next scheduled backup succeeds
 The audit log shows the restoration event
7.2.4 After a Configuration Change
 The application has loaded the new configuration (check the logs)
 The behavior matches the expected new behavior
 No errors in the logs for 5 minutes
 The change is documented in the change log
7.2.5 After a Pepper Rotation (Voter Token)
 The new pepper is in use (the server has reloaded)
 The self-test passes
 New votes are accepted
 Old votes are correctly identified as invalid (where applicable)
 The audit log shows the rotation event
7.2.6 After a Feature Flag Toggle
 The new behavior is active (the feature flag is in effect)
 No errors in the logs
 The change is documented in the change log
 The toggle is reversible (the previous state can be restored)
8. The Runbook Maintenance
8.1 When to Update the Runbooks
Update the runbooks:

After every incident — the post-mortem identifies gaps in the runbooks
Quarterly — a review of all runbooks for accuracy and freshness
After every major change — a new feature, a new vendor, a new architecture
8.2 The Review Process
The Engineering Lead reviews the runbooks quarterly
The on-call engineer reviews the runbooks after every incident
Suggested changes are submitted as PRs
The PR is reviewed by the Engineering Lead
The PR is merged and the runbooks are updated
8.3 The Test Process
Some runbooks can be tested in a staging environment. The CI pipeline includes:

Verification that the runbook commands work (e.g., the database backup script)
Verification that the health check endpoint returns the expected format
Verification that the alerting rules are configured correctly
If a runbook command fails in the CI test, the runbook is flagged for review.

Appendix A: The On-Call Engineer's Quick Reference
A.1 The First 5 Minutes
Acknowledge the alert
Check the health check endpoint
Assess the severity (P1/P2/P3)
Post the initial communication (P1 within 30 min, P2 within 1 hour)
Begin investigation per the appropriate runbook
A.2 The Escalation Triggers
Situation	Escalate to	When
P1, root cause unknown	Engineering Lead	After 15 min
P1, security incident	Legal Director	Within 1 hour
P2, root cause unknown	Engineering Lead	After 1 hour
NDPR breach (suspected)	Legal Director	Immediate
Election-adjacent issue	Project Lead	Immediate
Bar Association complaint	Legal Director	Within 1 business day
Press inquiry	Project Sponsor	Within 1 business day
A.3 The Key Endpoints
Health check: https://najiacommunitybridge.com/health
Admin dashboard: https://najiacommunitybridge.com/admin
Open API: https://api.najiacommunitybridge.com
Status page (forthcoming): https://status.najiacommunitybridge.com
A.4 The Key Commands
Bash

# SSH into the production server
ssh najia@10.0.0.1

# Check the Bun process
sudo systemctl status najia-blue
sudo systemctl status najia-green

# Restart the Bun process
sudo systemctl restart najia-blue

# Check the database
sudo systemctl status postgresql
psql -U najia_app -d najia -c "SELECT 1;"

# Check the disk
df -h

# Check the logs
sudo journalctl -u najia-blue --since "1 hour ago" | tail -100
sudo tail -100 /var/log/postgresql/postgresql-14-main.log

# Check the backup status
ls -lt /backups/ | head -5

# Check the health check endpoint
curl -fsS https://najiacommunitybridge.com/health
Appendix B: Runbook Revision History
Version	Date	Author	Changes
1.0.0	2026-07-20	Engineering Lead + Operations Director	Initial set. Consolidates the runbooks from technical/Infrastructure.md §7, adds the first-5-minutes checklist, the general investigation procedure, the escalation matrix (with the decision tree), the scenario-specific runbooks (RB-001 through RB-014), the communication templates (7 templates for the most common scenarios), the post-mortem template (with the blameless principle), the recovery verification procedures (for the most common recovery operations), and the runbook maintenance process. The first-5-minutes checklist and the escalation matrix are the most important additions — they ensure consistent response under pressure.