import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

/**
 * Evidence records. One row per uploaded file. Immutable after insert except
 * `verificationStatus`, which is a cached convenience value — the authoritative
 * integrity answer always comes from re-hashing the stored bytes.
 *
 * See .scratch/evidence-integrity/spec.md.
 */
export const evidence = pgTable("evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseId: uuid("case_id").notNull(),
  uploaderId: uuid("uploader_id").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  sha256Hash: text("sha256_hash").notNull(),
  storageKey: text("storage_key").notNull(),
  verificationStatus: text("verification_status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

/**
 * Append-only audit trail of custody events for each piece of evidence. No
 * update or delete paths are exposed by the services layer.
 */
export const evidenceAuditEvents = pgTable(
  "evidence_audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    evidenceId: uuid("evidence_id")
      .notNull()
      .references(() => evidence.id),
    eventType: text("event_type").notNull(),
    actorId: uuid("actor_id"),
    outcome: text("outcome"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("evidence_audit_events_evidence_id_idx").on(table.evidenceId)],
);

export type EvidenceRow = typeof evidence.$inferSelect;
export type EvidenceAuditEventRow = typeof evidenceAuditEvents.$inferSelect;

/** Verification status values. `verified` for a fresh supported upload. */
export type VerificationStatus =
  | "verified"
  | "altered"
  | "pending"
  | "not_applicable";

/** Audit event kinds recorded in the custody trail. */
export type AuditEventType = "uploaded" | "verified" | "accessed";
