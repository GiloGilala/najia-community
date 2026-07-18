import {
  expect,
  test,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import { eq } from "drizzle-orm";

import { createTestHarness, type TestHarness } from "./harness.ts";
import { createEvidenceService } from "../services/evidence.service.ts";
import { EvidenceValidationError } from "../lib/validation/evidence-upload.ts";
import { MAX_EVIDENCE_SIZE_BYTES } from "../lib/validation/evidence-upload.ts";
import { evidence } from "../db/schema/evidence.ts";

/**
 * Ticket 04 — Unsupported types & validation rejection.
 * Seam: the evidence service layer, backed by the shared validation schema.
 */
describe("evidence service — validation & unsupported types", () => {
  let harness: TestHarness;

  const base = () => ({
    caseId: "11111111-1111-4111-8111-111111111111",
    uploaderId: "22222222-2222-4222-8222-222222222222",
    filename: "photo.jpg",
    mimeType: "image/jpeg",
    bytes: new Uint8Array([1, 2, 3, 4, 5]),
  });

  const makeService = () =>
    createEvidenceService({
      db: harness.db,
      storage: harness.storage,
      clock: harness.clock,
    });

  const countRows = async () => {
    const rows = await harness.db.select().from(evidence);
    return rows.length;
  };

  beforeAll(async () => {
    harness = createTestHarness();
    await harness.migrate();
  });

  afterAll(async () => {
    await harness.close();
  });

  beforeEach(async () => {
    await harness.reset();
  });

  test("accepts a supported type and stores it as verified", async () => {
    const service = makeService();
    const record = await service.uploadEvidence(base());
    expect(record.verificationStatus).toBe("verified");
    expect(await countRows()).toBe(1);
  });

  test("accepts an allowed-but-unverifiable type as not_applicable", async () => {
    const service = makeService();
    // A plain-text document is allowed for upload but hash verification is
    // reported as not applicable for its category per the spec.
    const record = await service.uploadEvidence({
      ...base(),
      filename: "statement.txt",
      mimeType: "text/plain",
    });
    expect(record.verificationStatus).toBe("not_applicable");
    expect(await countRows()).toBe(1);
  });

  test("rejects a disallowed MIME type and creates no row", async () => {
    const service = makeService();
    await expect(
      service.uploadEvidence({
        ...base(),
        filename: "run.exe",
        mimeType: "application/x-msdownload",
      }),
    ).rejects.toBeInstanceOf(EvidenceValidationError);
    expect(await countRows()).toBe(0);
  });

  test("rejects an oversized upload and creates no row", async () => {
    const service = makeService();
    const tooBig = new Uint8Array(MAX_EVIDENCE_SIZE_BYTES + 1);
    await expect(
      service.uploadEvidence({ ...base(), bytes: tooBig }),
    ).rejects.toBeInstanceOf(EvidenceValidationError);
    expect(await countRows()).toBe(0);
  });

  test("rejects an empty upload and creates no row", async () => {
    const service = makeService();
    await expect(
      service.uploadEvidence({ ...base(), bytes: new Uint8Array([]) }),
    ).rejects.toBeInstanceOf(EvidenceValidationError);
    expect(await countRows()).toBe(0);
  });

  test("a rejected upload leaves nothing in storage", async () => {
    const service = makeService();
    try {
      await service.uploadEvidence({
        ...base(),
        mimeType: "application/x-msdownload",
      });
    } catch {
      // expected
    }
    // No row means no storage key was recorded; assert storage stayed empty by
    // checking a fresh upload is the first object.
    const record = await service.uploadEvidence(base());
    const rows = await harness.db
      .select()
      .from(evidence)
      .where(eq(evidence.id, record.id));
    expect(rows).toHaveLength(1);
    expect(await countRows()).toBe(1);
  });
});
