import { z } from "zod";

/**
 * Shared validation for evidence uploads.
 *
 * Single source of truth for which files may be uploaded and how large they may
 * be. Both web actions and API routes are expected to reuse this schema so
 * validation is not duplicated across entry points (architecture doc 6.1.3).
 */

/** Maximum accepted upload size. 100 MB per the performance target (6.7.1). */
export const MAX_EVIDENCE_SIZE_BYTES = 100 * 1024 * 1024;

/**
 * MIME types for which SHA-256 hash verification is meaningful and reported.
 * These resolve to a `verified` / `altered` status.
 */
export const VERIFIABLE_MIME_TYPES = [
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
] as const;

/**
 * MIME types that are allowed to be uploaded but for which hash verification is
 * reported as `not_applicable` (documents, per spec 4.3.2).
 */
export const UNVERIFIABLE_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

/** Every MIME type that may be uploaded at all. */
export const ALLOWED_MIME_TYPES = [
  ...VERIFIABLE_MIME_TYPES,
  ...UNVERIFIABLE_ALLOWED_MIME_TYPES,
] as const;

const verifiableSet = new Set<string>(VERIFIABLE_MIME_TYPES);

/** Whether hash verification applies to this MIME type. */
export function isVerifiableMimeType(mimeType: string): boolean {
  return verifiableSet.has(mimeType);
}

/** Raised when an upload fails validation. Carries no side effects. */
export class EvidenceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceValidationError";
  }
}

export const evidenceUploadSchema = z.object({
  caseId: z.uuid(),
  uploaderId: z.uuid(),
  filename: z.string().min(1),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  bytes: z
    .instanceof(Uint8Array)
    .refine((b) => b.length > 0, { message: "File is empty" })
    .refine((b) => b.length <= MAX_EVIDENCE_SIZE_BYTES, {
      message: "File exceeds the maximum allowed size",
    }),
});

export type ValidatedEvidenceUpload = z.infer<typeof evidenceUploadSchema>;

/**
 * Validate an upload, throwing {@link EvidenceValidationError} on failure. No
 * persistence happens on the rejection path.
 */
export function validateEvidenceUpload(input: unknown): ValidatedEvidenceUpload {
  const result = evidenceUploadSchema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new EvidenceValidationError(
      first ? `${first.path.join(".")}: ${first.message}` : "Invalid upload",
    );
  }
  return result.data;
}
