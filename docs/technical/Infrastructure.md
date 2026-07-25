# Infrastructure and Operations

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Active*
*Owner: Engineering Lead + Operations Director*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial set. Consolidates the infrastructure and operations architecture from ARCHITECTURE.md §10 and §11, with the deployment process, the backup and disaster recovery procedures, the scaling strategy, and the operational monitoring.

> **How to read this document:** This is the **operational reference** for the platform. It consolidates the deployment design from [ARCHITECTURE.md §10](../ARCHITECTURE.md#10-deployment) and the backup and recovery design from [ARCHITECTURE.md §11](../ARCHITECTURE.md#11-disaster-recovery). For the security operations, see [Security.md §12](./Security.md#12-security-operations).

> **Related documents:**
> - [ARCHITECTURE.md §10](../ARCHITECTURE.md#10-deployment) — the high-level deployment architecture
> - [ARCHITECTURE.md §11](../ARCHITECTURE.md#11-disaster-recovery) — the backup and recovery design
> - [ADR-008](../ADRs.md#adr-008--self-hosted-vps-behind-wireguard-vpn) — the self-hosted VPS decision
> - [Security.md §12](./Security.md#12-security-operations) — security operations
> - [QA.md](./QA.md) — the testing strategy (referenced in the deployment process)

---

## 1. Infrastructure Overview

### 1.1 Architecture
text

                          Internet
                             │
                             ▼
                   ┌─────────────────────┐
                   │   DDoS Protection   │
                   │   (Provider)        │
                   └──────────┬──────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │   WireGuard VPN     │
                   │   (Public key only) │
                   └──────────┬──────────┘
                              │ WireGuard tunnel
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Self-Hosted VPS (Nigeria) │
│ │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Bun Process (systemd) │ │
│ │ │ │
│ │ ┌────────────────┐ ┌────────────────────────────┐ │ │
│ │ │ TanStack Start │ │ Hono API │ │ │
│ │ │ (web app) │ │ (mobile + webhooks) │ │ │
│ │ └────────┬───────┘ └──────────┬─────────────┘ │ │
│ │ │ │ │ │
│ │ └──────────┬───────────┘ │ │
│ │ ▼ │ │
│ │ ┌──────────────────────┐ │ │
│ │ │ Services Layer │ │ │
│ │ │ (Business Logic) │ │ │
│ │ └──────────┬───────────┘ │ │
│ │ │ │ │
│ │ ┌──────────┴───────────┐ │ │
│ │ ▼ ▼ │ │
│ │ ┌──────────────┐ ┌──────────────┐ │ │
│ │ │ PostgreSQL │ │ SQLite Cache │ │ │
│ │ │ (Drizzle) │ │ (bun:sql) │ │ │
│ │ └──────────────┘ └──────────────┘ │ │
│ │ │ │
│ └──────────────────────────────────────────────────────┘ │
│ │
│ File storage: Cloudflare R2 / Bunny CDN / ImageKit │
│ (external; accessed via signed URLs) │
│ │
└─────────────────────────────────────────────────────────────┘

text


### 1.2 Components

| Component | Technology | Hosting | Purpose |
|-----------|------------|---------|---------|
| **Web app + API** | Bun + TanStack Start + Hono | Self-hosted VPS | The single deployable service |
| **Primary database** | PostgreSQL 14+ | Self-hosted VPS | Relational data, complex queries, full-text search |
| **Cache** | SQLite (via `bun:sql`) | Self-hosted VPS (file) | Verification cache, query cache, poll results |
| **Rate limit** | SQLite (via `bun:sql`) | Self-hosted VPS (file) | Per-endpoint and per-user rate limits |
| **File storage** | Cloudflare R2 / Bunny CDN / ImageKit | External CDN | Evidence files, profile photos, blog images |
| **VPN** | WireGuard | Self-hosted VPS | Secure access to the VPS |
| **DDoS protection** | Provider (e.g., Cloudflare) | External | L3/L4 DDoS protection at the network edge |
| **Backups** | Encrypted, off-site | External | PostgreSQL backups, configuration backups |

### 1.3 Infrastructure Decisions

| Decision | Choice | Rationale | ADR |
|----------|--------|-----------|-----|
| Hosting | Self-hosted VPS in Nigeria | Data sovereignty (NDPR), full control, cost predictability | [ADR-008](../ADRs.md#adr-008--self-hosted-vps-behind-wireguard-vpn) |
| Database | PostgreSQL 14+ | Relational integrity, complex queries, full-text search | [ADR-003](../ADRs.md#adr-003--postgresql-as-the-primary-database) |
| Cache | SQLite | Sub-millisecond reads, no separate service | [ADR-004](../ADRs.md#adr-004--sqlite-for-cache-and-rate-limiting) |
| VPN | WireGuard | Modern, fast, simple, well-audited | [ADR-008](../ADRs.md#adr-008--self-hosted-vps-behind-wireguard-vpn) |
| Architecture | Single deployable service | Operational simplicity for a small team | [ADR-007](../ADRs.md#adr-007--single-deployable-service-with-two-entry-points) |
| Service supervisor | systemd | Standard on Linux, well-understood | (No ADR; standard) |
| Deployment | Blue-green with manual swap | Low risk, easy rollback | (No ADR; operational choice) |
| Backups | Encrypted, off-site, tested monthly | NDPR + operational best practice | (No ADR; standard) |

---

## 2. Server Provisioning

### 2.1 Server Specifications (Pilot)

| Resource | Specification | Notes |
|----------|---------------|-------|
| **Provider** | Nigerian VPS provider (Hetzner FSN1, Leaseweb, or local provider) | Data sovereignty for NDPR |
| **vCPU** | 4 vCPUs | Headroom for the pilot; can scale up |
| **RAM** | 8 GB | Postgres + Bun + cache; can scale up |
| **Storage** | 200 GB SSD | DB + cache + logs + backups (local) |
| **Bandwidth** | 10 TB/month | Generous for the pilot |
| **OS** | Ubuntu 22.04 LTS | Long-term support, well-understood |
| **Location** | Nigeria (Lagos or Abuja) | NDPR data sovereignty |

### 2.2 Initial Setup

```bash
# 1. Update the system
sudo apt update && sudo apt upgrade -y

# 2. Install required packages
sudo apt install -y postgresql-14 wireguard nginx fail2ban ufw

# 3. Install Bun
curl -fsSL https://bun.sh/install | bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc

# 4. Create the application user
sudo useradd -m -s /bin/bash najia
sudo mkdir -p /opt/najia
sudo chown najia:najia /opt/najia

# 5. Configure the firewall (UFW)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 51820/udp  # WireGuard
sudo ufw enable

# 6. Set up WireGuard
# (see WireGuard configuration below)

# 7. Set up PostgreSQL
# (see PostgreSQL configuration below)

# 8. Deploy the application
# (see Deployment Process below)
2.3 WireGuard Configuration
ini

# /etc/wireguard/wg0.conf
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = <server_private_key>
# AllowedIPs: only the VPN subnet
# MTU optimized for performance

# Post-up: enable IP forwarding and NAT
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
Client configuration (for each operator):

ini

[Interface]
PrivateKey = <client_private_key>
Address = 10.0.0.100/24
DNS = 10.0.0.1

[Peer]
PublicKey = <server_public_key>
Endpoint = <server_public_ip>:51820
AllowedIPs = 10.0.0.0/24
PersistentKeepalive = 25
2.4 PostgreSQL Configuration
ini

# /etc/postgresql/14/main/postgresql.conf (key settings)

# Connections
max_connections = 100
# (PgBouncer handles connection pooling at the application layer)

# Memory
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 64MB
maintenance_work_mem = 512MB

# WAL
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
max_wal_senders = 3

# Logging
log_min_duration_statement = 1000  # Log slow queries (> 1s)
log_connections = on
log_disconnections = on
log_line_prefix = '%t [%p]: db=%d,user=%u,app=%a '

# SSL
ssl = on
ssl_cert_file = '/etc/postgresql/ssl/server.crt'
ssl_key_file = '/etc/postgresql/ssl/server.key'
ini

# /etc/postgresql/14/main/pg_hba.conf (key settings)

# Local connections (via the application)
hostssl najia najia_app 10.0.0.0/24 md5

# Replication
hostssl replication najia_replica 10.0.0.0/24 md5
2.5 Application User and Database
SQL

-- Create the application user
CREATE USER najia_app WITH PASSWORD '<strong_password>';

-- Create the database
CREATE DATABASE najia OWNER najia_app;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE najia TO najia_app;
GRANT USAGE ON SCHEMA public TO najia_app;
GRANT CREATE ON SCHEMA public TO najia_app;
2.6 Backup User
SQL

-- Create a backup user (read-only)
CREATE USER najia_backup WITH REPLICATION PASSWORD '<strong_password>';
3. Deployment Process
3.1 The Deployment Pipeline
text

┌──────────────┐
│  Code merged │
│  to main     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  CI runs:    │
│  - typecheck │
│  - lint      │
│  - tests     │
│  - fee model │
│    grep      │
│  - security  │
│    tests     │
└──────┬───────┘
       │ all pass
       ▼
┌──────────────┐
│  Build       │
│  artifact    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Deploy to   │
│  STAGING     │
└──────┬───────┘
       │ smoke tests pass
       ▼
┌──────────────┐
│  Deploy to   │
│  PRODUCTION  │
│  (blue-green)│
└──────┬───────┘
       │ health checks pass
       ▼
┌──────────────┐
│  Swap        │
│  (cutover)   │
└──────┬───────┘
       │ monitor for 1 hour
       ▼
┌──────────────┐
│  Decommission│
│  old version │
└──────────────┘
3.2 Staging Deployment
Bash

# 1. SSH into the staging server (via WireGuard)
ssh najia@10.0.0.10

# 2. Pull the latest code
cd /opt/najia
git pull origin main

# 3. Install dependencies
bun install --production

# 4. Run migrations
bun run migrate

# 5. Build the application
bun run build

# 6. Restart the service (with the staging service name)
sudo systemctl restart najia-staging

# 7. Wait for the service to be healthy
sleep 10
curl -fsS https://staging.najiacommunitybridge.com/health

# 8. Run smoke tests
bun run test:smoke

# 9. Verify the staging environment
# - Check the dashboard
# - Check the API
# - Check the queue
# - Check the rate limits
3.3 Production Deployment (Blue-Green)
Bash

# 1. SSH into the production server (via WireGuard)
ssh najia@10.0.0.1

# 2. Identify the current "blue" and "green" environments
ls /opt/najia-{blue,green}

# 3. Deploy the new version to the "green" environment
cd /opt/najia-green
git pull origin main
bun install --production
bun run migrate
bun run build
sudo systemctl restart najia-green

# 4. Wait for green to be healthy
sleep 10
curl -fsS http://localhost:3001/health  # Green is on port 3001

# 5. Run smoke tests against green
bun run test:smoke -- --target=green

# 6. If green is healthy, swap the load balancer to point to green
sudo ln -sf /etc/nginx/sites-available/najia-green /etc/nginx/sites-enabled/najia
sudo systemctl reload nginx

# 7. Wait and monitor
sleep 60
# Check error rates, response times, etc.

# 8. If everything is healthy, stop the old "blue" environment
sudo systemctl stop najia-blue

# 9. The next deployment will deploy to "blue" (now the "green" for the swap)
3.4 Rollback
If a deployment goes wrong:

Bash

# 1. Immediately swap back to the previous "blue" environment
sudo ln -sf /etc/nginx/sites-available/najia-blue /etc/nginx/sites-enabled/najia
sudo systemctl reload nginx

# 2. Verify the rollback
sleep 30
curl -fsS https://najiacommunitybridge.com/health

# 3. Investigate the failure
# - Check the logs of the failed deployment
# - Check the monitoring dashboards
# - Identify the root cause

# 4. If a database migration caused the issue, coordinate with the Engineering Lead
# Migrations may require a separate rollback plan
3.5 Deployment Approval
Staging: no approval required; automatic on merge to main
Production: requires approval from the Engineering Lead
Hotfix: requires approval from the Engineering Lead + Project Sponsor
The approval is recorded in the deployment log.

3.6 Feature Flags and Gradual Rollout
For non-trivial changes:

Deploy behind a feature flag (default: off)
Enable for internal users (the team)
Enable for a small percentage of production users (e.g., 5%)
Monitor for issues
Gradually increase the percentage
Remove the feature flag once 100% rolled out
The feature flags are managed via the admin endpoint (per Admin module §3.2).

4. Backup and Disaster Recovery
4.1 Backup Strategy
Backup type	Frequency	Retention	Storage
Full PostgreSQL	Daily at 02:00 UTC	30 days	Encrypted, off-site (e.g., Backblaze B2)
WAL archiving	Continuous	7 days	Encrypted, off-site
SQLite cache	Daily at 03:00 UTC	7 days	Encrypted, off-site
Application configuration	On change	Indefinite	Git (in a private repo)
Secrets	On change	Indefinite	Password manager (1Password or similar)
Blog content (MDX)	Daily at 04:00 UTC	30 days	Encrypted, off-site
RBAC configuration	Daily at 04:00 UTC	30 days	Encrypted, off-site
Audit log	Daily at 05:00 UTC	7 years (NDPR)	Encrypted, off-site (cold storage)
4.2 Backup Commands
Bash

# PostgreSQL full backup
pg_dump -U najia_backup -h localhost -Fc najia > /backups/najia-$(date +%Y%m%d).dump

# SQLite cache backup
cp /opt/najia/cache.db /backups/cache-$(date +%Y%m%d).db
cp /opt/najia/rate-limit.db /backups/rate-limit-$(date +%Y%m%d).db

# Application configuration
tar -czf /backups/config-$(date +%Y%m%d).tar.gz /opt/najia/.env /opt/najia/config/

# Encrypt and upload to off-site storage
gpg --symmetric --cipher-algo AES256 /backups/najia-$(date +%Y%m%d).dump
rclone copy /backups/najia-$(date +%Y%m%d).dump.gpg remote:backblaze:najia/
4.3 Backup Script (Automated)
Bash

#!/bin/bash
# /opt/najia/scripts/backup.sh
# Runs nightly via cron

set -euo pipefail

BACKUP_DIR=/backups
DATE=$(date +%Y%m%d)
RETENTION_DAYS=30

# PostgreSQL backup
pg_dump -U najia_backup -h localhost -Fc najia > "$BACKUP_DIR/najia-$DATE.dump"

# SQLite backups
cp /opt/najia/cache.db "$BACKUP_DIR/cache-$DATE.db"
cp /opt/najia/rate-limit.db "$BACKUP_DIR/rate-limit-$DATE.db"

# Encrypt and upload
gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase-file /root/.backup-passphrase \
    "$BACKUP_DIR/najia-$DATE.dump"
rclone copy "$BACKUP_DIR/najia-$DATE.dump.gpg" remote:backblaze:najia/

# Cleanup old local backups
find "$BACKUP_DIR" -name "*.dump*" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "*.db" -mtime +7 -delete

# Verify the backup
rclone ls remote:backblaze:najia/najia-$DATE.dump.gpg

# Alert on failure
if [ $? -ne 0 ]; then
    echo "Backup failed for $DATE" | mail -s "Backup Failure" ops@najiacommunitybridge.com
fi
Cron entry:

text

0 2 * * * /opt/najia/scripts/backup.sh >> /var/log/najia-backup.log 2>&1
4.4 Recovery Point and Time Objectives
Component	RPO (max data loss)	RTO (max downtime)
PostgreSQL database	1 hour (WAL archiving)	30 minutes
SQLite cache	24 hours	15 minutes (rebuild on access)
File storage	24 hours	1 hour
Blog content	24 hours	15 minutes
RBAC configuration	24 hours	15 minutes
Application configuration	0 (in Git)	5 minutes
Secrets	0 (in password manager)	5 minutes
4.5 Recovery Procedures
4.5.1 Database Recovery (PostgreSQL)
Bash

# 1. Stop the application
sudo systemctl stop najia-blue
sudo systemctl stop najia-green

# 2. Identify the latest good backup
ls -lt /backups/najia-*.dump | head -1

# 3. Decrypt the backup
gpg --decrypt /backups/najia-20260720.dump.gpg > /tmp/najia-restore.dump

# 4. Drop the existing database (after confirmation)
dropdb -U postgres najia

# 5. Create a new database
createdb -U postgres -O najia_app najia

# 6. Restore the backup
pg_restore -U najia_app -h localhost -d najia /tmp/najia-restore.dump

# 7. Apply WAL archives (if needed)
# This is more complex; coordinate with the Engineering Lead

# 8. Verify the data
psql -U najia_app -d najia -c "SELECT count(*) FROM users;"

# 9. Start the application
sudo systemctl start najia-green
# Or the appropriate environment

# 10. Verify the application
curl -fsS https://najiacommunitybridge.com/health
4.5.2 Cache Recovery (SQLite)
The cache is rebuildable — losing it just means slower responses until it's warm again. To rebuild:

Bash

# 1. Stop the application
sudo systemctl stop najia-blue

# 2. Delete the cache files (the cache will rebuild on access)
rm /opt/najia/cache.db
rm /opt/najia/rate-limit.db

# 3. Optionally, restore from the latest backup
cp /backups/cache-20260720.db /opt/najia/cache.db
cp /backups/rate-limit-20260720.db /opt/najia/rate-limit.db

# 4. Start the application
sudo systemctl start najia-blue

# 5. The cache will be rebuilt as users access the platform
4.5.3 File Storage Recovery
File storage is on Cloudflare R2 / Bunny CDN / ImageKit. To recover:

Bash

# 1. Identify the affected files (from the audit log)
# The storage provider's dashboard can also show recent activity

# 2. Contact the storage provider's support (if the issue is on their side)
# Most providers have a 99.9% SLA and replicate data

# 3. If the data is truly lost, notify affected users within 72 hours (NDPR)
4.5.4 Complete Server Loss
If the entire VPS is lost (e.g., data center incident):

Bash

# 1. Provision a new VPS (in the same or different Nigerian data center)

# 2. Set up the server (per §2)

# 3. Restore from the latest backup
# - Restore the PostgreSQL database
# - Restore the SQLite cache
# - Restore the file storage (from the storage provider's replication)
# - Restore the application configuration from Git
# - Restore the secrets from the password manager

# 4. Update the DNS (if the server's IP changed)

# 5. Verify the application
curl -fsS https://najiacommunitybridge.com/health

# 6. Notify the team and the users (if there's a significant delay)
4.6 Backup Testing
Backups are tested monthly. The test:

Restore the latest backup to a staging environment
Verify the data integrity (e.g., user count, case count, evidence count)
Verify the application works against the restored data
Document the test result
If the test fails, the issue is investigated and resolved before the next production backup.

5. Scaling Strategy
5.1 Pilot Scale (Months 1–6)
Resource	Specification	Notes
VPS	4 vCPU, 8 GB RAM, 200 GB SSD	As specified in §2.1
Expected traffic	500 MAU, 1,000 poll participants, 20 cases	Per Business Case §6.1
Database size	~5 GB	Small for a relational database
Cache size	~500 MB	Within SQLite's easy reach
File storage	~50 GB	With 100 MB file size limit and 500 evidence uploads
At pilot scale, a single VPS is sufficient. The architecture supports horizontal scaling later (per §5.3).

5.2 Phase 2 Scale (Months 7–12)
Resource	Specification	Notes
VPS	8 vCPU, 16 GB RAM, 500 GB SSD	Scale up vertically
Expected traffic	2,000 MAU, 50 cases	Per Business Case §6.2
Database size	~20 GB	Still small
Cache size	~2 GB	SQLite can handle this
File storage	~500 GB	
Phase 2 stays on a single VPS but with more resources. No architectural changes needed.

5.3 Year 2 Scale (Year 2)
Resource	Specification	Notes
VPS	16 vCPU, 32 GB RAM, 1 TB SSD	Scale up vertically (still single VPS)
Expected traffic	50,000 MAU, 500 cases	Per Business Case §6.3
Database size	~100 GB	May need query optimization, indexing review
Cache size	~10 GB	May need to migrate to Redis
File storage	~5 TB	Cloudflare R2 / Bunny CDN scale easily
At Year 2 scale, vertical scaling on a single VPS may reach its limits. The migration to horizontal scaling is a Y2 ADR (forthcoming).

5.4 Horizontal Scaling (Y2/Y3)
When single-VPS capacity is exceeded, the architecture supports horizontal scaling:

text

                    Load Balancer
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ VPS 1   │    │ VPS 2   │    │ VPS 3   │
    │ (Bun)   │    │ (Bun)   │    │ (Bun)   │
    └────┬────┘    └────┬────┘    └────┬────┘
         │              │              │
         └──────────────┼──────────────┘
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
      ┌──────────────┐    ┌──────────────┐
      │ PostgreSQL   │    │ Redis (Y2+)  │
      │ (Primary +   │    │ (shared      │
      │  Replica)    │    │  cache)      │
      └──────────────┘    └──────────────┘
Key changes for horizontal scaling:

PostgreSQL: primary + read replica; PgBouncer for connection pooling
Cache: migrate from SQLite to Redis (shared across instances)
Rate limit: migrate from SQLite to Redis (shared state)
Session storage: move from local SQLite to Redis (so sessions are shared)
File storage: already on a CDN (no change)
Voter token pepper: same pepper across all instances (centralized secret)
5.5 Capacity Planning
Phase	MAU	DB Size	Cache Size	File Storage	Notes
Pilot	500	5 GB	500 MB	50 GB	Single VPS
Phase 2	2,000	20 GB	2 GB	500 GB	Single VPS, more resources
Year 2	50,000	100 GB	10 GB	5 TB	Single VPS (vertical scaling) or horizontal
Year 3	100,000+	500 GB	50 GB	20+ TB	Horizontal scaling (multiple VPS + Redis)
6. Operational Monitoring
6.1 Health Checks
Bash

# Health check endpoint
curl -fsS https://najiacommunitybridge.com/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2026-07-20T10:30:00.000Z",
  "checks": {
    "database": "healthy",
    "cache": "healthy",
    "rate_limit": "healthy",
    "storage": "healthy",
    "nimc_api": "healthy",
    "onfido_api": "healthy",
    "rbac": "healthy"
  }
}
The health check is called every 30 seconds by the monitoring system and by the load balancer.

6.2 Key Metrics
The key metrics are documented in ARCHITECTURE.md §9.2. The dashboards include:

Service health: uptime, error rate, P95 response time
Database: connection pool usage, query time, slow query count
Cache: hit rate, eviction rate, size
Rate limit: breaches per hour, top offenders
Business metrics: DAU, MAU, polls completed, cases matched, consultations completed
Operational alerts: active alerts, acknowledged vs. unresolved
6.3 Alerting Rules
Condition	Severity	Action
Error rate > 5%	P1	Alert on-call engineer
Response time > 1s (P95) for 5 minutes	P2	Alert engineering team
Cache hit rate < 60%	P3	Review cache configuration
Database connection pool > 80%	P2	Scale connections
Rate limit breaches > 100/hour	P2	Investigate abuse pattern
Disk usage > 80%	P3	Clean up logs/cache
NIMC API failure > 5%	P1	Check NIMC integration
Onfido API failure > 5%	P2	Check Onfido integration
Backup failure	P1	Investigate immediately
Integrity mismatch (evidence)	P1	Quarantine, investigate
Permission denied rate > 10%	P2	Review RBAC configuration
Voter token pepper self-test fails	P1	Stop startup, investigate
6.4 Log Rotation
Bash

# /etc/logrotate.d/najia
/var/log/najia/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 najia najia
    sharedscripts
    postrotate
        systemctl reload najia-blue || true
        systemctl reload najia-green || true
    endscript
}
7. Operational Runbooks
7.1 NIMC API Outage
Detect: the health check fails or the error rate spikes
Mitigate: the platform automatically falls back to Onfido for new verifications (per Auth module §3.4)
Communicate: notify the team via the incident channel
Investigate: contact NIMC if the outage is on their side; wait for restoration
Document: post-mortem (for outages > 1 hour)
7.2 Onfido API Outage
Detect: the health check fails or the error rate spikes
Mitigate: users attempting Onfido verification are put in a queue; manual review is offered as a fallback
Communicate: notify the team
Investigate: contact Onfido support if needed
Document: post-mortem
7.3 Database Connection Pool Exhaustion
Detect: the alert fires (connection pool > 80%)
Mitigate: identify the source of the connection leak; restart the affected service
Investigate: check for unclosed connections, long-running queries, or a traffic spike
Document: post-mortem (if it caused user-facing impact)
7.4 Evidence Integrity Mismatch
This is a P1 incident. Per Evidence module §10.3:

Detect: the integrity check fails on access; alert fires
Mitigate: the affected file is quarantined; the user is notified; admin is alerted
Investigate: check the storage layer for corruption; check the audit log for unauthorized access
Notify: if the breach is confirmed, notify the Legal Director within 1 hour; notify the NDPC within 72 hours
Document: post-mortem with the Legal Director's sign-off
7.5 Voter Token Pepper Compromise
This is the catastrophic case. Per Engineering.md §7:

Detect: the compromise is discovered (or strongly suspected)
Mitigate: rotate the pepper immediately; mark all existing votes as INVALID; the platform requires users to re-vote on active polls
Notify: notify the Legal Director within 1 hour; notify the Board; notify the NDPC if required
Document: post-mortem with the Legal Director's sign-off
Prevent: identify the compromise vector; close it
7.6 Fee Model CI Grep Failure
The CI grep audit fails on a PR. Per Engineering.md §6:

Detect: the CI check fails
Block: the PR cannot be merged
Investigate: is this a false positive or a real violation?
If false positive: the Legal Director reviews and adds an allowlist
If real violation: the PR is rejected; the violation is documented
8. Capacity Planning and Cost
8.1 Cost Estimate (Pilot, Monthly)
Component	Cost (NGN)	Notes
VPS (4 vCPU, 8 GB, 200 GB)	~₦50,000	Self-hosted in Nigeria
DDoS protection	~₦10,000	Cloudflare Pro or equivalent
Cloudflare R2 (file storage)	~₦5,000	50 GB + egress
Backup storage (Backblaze B2)	~₦2,000	100 GB
Monitoring (Datadog or similar)	~₦20,000	Basic plan
Email service (Resend)	~₦5,000	50K emails/month
Domain + DNS	~₦2,000	
Total infrastructure	~₦94,000	Within the Year 1 cost projection
8.2 Cost Scaling
Phase	Monthly cost (est.)	Notes
Pilot	₦94,000	As above
Phase 2	₦150,000	More storage, more monitoring
Year 2	₦400,000	May need a second VPS or upgrade
Year 3	₦800,000+	Horizontal scaling
These are within the operating cost projections in Business Case §4.1.

9. Open Infrastructure Questions
#	Question	Owner	Status
1	Which specific Nigerian VPS provider should we use? (Hetzner FSN1, Leaseweb, local)	Engineering Lead	Open — needs cost comparison
2	Which DDoS protection service? (Cloudflare, Path, local)	Engineering Lead	Open — depends on provider
3	Which monitoring service? (Datadog, Sentry, PostHog, self-hosted)	Engineering Lead	Open — depends on cost and operational fit
4	When do we need to migrate to horizontal scaling? (What's the trigger?)	Engineering Lead	Open — based on capacity monitoring
5	Should we use a managed PostgreSQL service (RDS, etc.) or self-host?	Engineering Lead	Open — NDPR may require self-hosting
Resolved questions move to the Decision Log. Decisions that affect the deployment or the budget require the Project Sponsor's sign-off.

Appendix A: Server Access
Who	Access level	Method
Engineering Lead	Full (root via sudo)	WireGuard + SSH key
Senior engineers	Limited (deploy and monitor)	WireGuard + SSH key
Operators (on-call)	Limited (deploy, monitor, restart)	WireGuard + SSH key
Legal Director	Read-only (for audits)	WireGuard + SSH key
External auditors	Read-only (time-limited)	WireGuard + SSH key + MFA
All access is logged. SSH keys are rotated annually.

Appendix B: Deployment Schedule
Day	Time (UTC)	Action	Owner
Weekdays	10:00	Daily deployment window	Engineering Lead
Weekdays	14:00	Hotfix window (if needed)	Engineering Lead
Saturdays	10:00	Weekly deployment window	Engineering Lead
Sundays	(no deployments)	—	—
Deployments outside these windows require explicit approval from the Engineering Lead and the Project Sponsor.

Appendix C: Related Documents
ARCHITECTURE.md §10 — the deployment architecture
ARCHITECTURE.md §11 — the backup and recovery design
ADR-007 — the single-service architecture
ADR-008 — the self-hosted VPS decision
Security.md §12 — security operations
QA.md — the testing strategy
Business Case §4 — the cost model
Appendix D: Infrastructure Revision History
Version	Date	Author	Changes
1.0.0	2026-07-20	Engineering Lead + Operations Director	Initial set. Consolidates the infrastructure and operations architecture from ARCHITECTURE.md §10 and §11, with the server provisioning, the deployment process, the backup and disaster recovery procedures, the scaling strategy, the operational monitoring, and the runbooks. The blue-green deployment and the RPO/RTO targets are the most important operational commitments.