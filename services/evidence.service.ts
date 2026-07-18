import { randomUUID, createHash } from "node:crypto";
import { eq, asc } from "drizzle-orm";

import type { DbClient } from "../db/client.ts";
import type { FileStorage } from "../lib/storage/file-storage.ts";
import type { Clock } from "../lib/clock/clock.ts";
import {
  evidence,
  evidenceAuditEvents,
  type EvidenceRow,
  type EvidenceAuditEventRow,
  type VerificationStatus,
} from "../db/schema/evidence.ts";

/** MIME types for which cryptographic hash verification is meaningful. */
const SUPPORTED_MIME_TYPES = new Set<string>([
  // images
  "image/jpeg",
  "image/png",
  "image/webp",
  // video
  "video/mp4",
  "video/x-msvideo",
  "video/webm",
  // audio
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  // documents
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

export interface UploadEvidenceInput {
  caseId: string;
  uploaderId: string;
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
}

export interface EvidenceServiceDeps {
  db: DbClient;
  storage: FileStorage;
  clock: Clock;
}

export interface VerificationResult {
  status: VerificationStatus;
  /** The hash captured at upload time; never changes on verification. */
  originalHash: string;
}

export class EvidenceNotFoundError extends Error {
  constructor(evidenceId: string) {
    super(`No evidence found with id: ${evidenceId}`);
    this.name = "EvidenceNotFoundError";
  }
}

export interface EvidenceService {
  uploadEvidence(input: UploadEvidenceInput): Promise<EvidenceRow>;
  verifyEvidence(args: { evidenceId: string }): Promise<VerificationResult>;
  getAuditTrail(args: { evidenceId: string }): Promise<EvidenceAuditEventRow[]>;
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function createEvidenceService(
  deps: EvidenceServiceDeps,
): EvidenceService {
  const { db, storage, clock } = deps;

  return {
    async uploadEvidence(input) {
      const now = clock.now();
      const hash = sha256Hex(input.bytes);
      const storageKey = `evidence/${randomUUID()}`;
      const verificationStatus: VerificationStatus = SUPPORTED_MIME_TYPES.has(
        input.mimeType,
      )
        ? "verified"
        : "not_applicable";

      // Persist the raw bytes before recording the row so a stored key always
      // resolves to real bytes.
      await storage.put(storageKey, input.bytes);

      const [row] = await db
        .insert(evidence)
        .values({
          caseId: input.caseId,
          uploaderId: input.uploaderId,
          filename: input.filename,
          mimeType: input.mimeType,
          sizeBytes: input.bytes.length,
          sha256Hash: hash,
          storageKey,
          verificationStatus,
          createdAt: now,
        })
        .returning();

      if (!row) {
        throw new Error("Failed to insert evidence row");
      }

      await db.insert(evidenceAuditEvents).values({
        evidenceId: row.id,
        eventType: "uploaded",
        actorId: input.uploaderId,
        outcome: null,
        createdAt: now,
      });

      return row;
    },

    async verifyEvidence({ evidenceId }) {
      const [row] = await db
        .select()
        .from(evidence)
        .where(eq(evidence.id, evidenceId))
        .limit(1);

      if (!row) {
        throw new EvidenceNotFoundError(evidenceId);
      }

      let status: VerificationStatus;
      if (!SUPPORTED_MIME_TYPES.has(row.mimeType)) {
        // Hash verification does not apply to this file type; do not re-hash.
        status = "not_applicable";
      } else {
        const storedBytes = await storage.get(row.storageKey);
        const currentHash = sha256Hex(storedBytes);
        status = currentHash === row.sha256Hash ? "verified" : "altered";
      }

      await db.insert(evidenceAuditEvents).values({
        evidenceId: row.id,
        eventType: "verified",
        actorId: null,
        outcome: status,
        createdAt: clock.now(),
      });

      return { status, originalHash: row.sha256Hash };
    },

    async getAuditTrail({ evidenceId }) {
      return db
        .select()
        .from(evidenceAuditEvents)
        .where(eq(evidenceAuditEvents.evidenceId, evidenceId))
        .orderBy(asc(evidenceAuditEvents.createdAt));
    },
  };
}
