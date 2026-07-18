import {
  expect,
  test,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";
import { createHash } from "node:crypto";

import { createTestHarness, type TestHarness } from "./harness.ts";
import { createEvidenceService } from "../services/evidence.service.ts";

/**
 * Ticket 02 — Upload & fingerprint evidence.
 * Seam under test: the evidence service layer. Collaborators (storage, clock)
 * are injected from the harness; the database is live (PGlite by default).
 */
describe("evidence service — upload & fingerprint", () => {
  let harness: TestHarness;

  const supportedUpload = () => ({
    caseId: "11111111-1111-1111-1111-111111111111",
    uploaderId: "22222222-2222-2222-2222-222222222222",
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

  test("a fresh supported upload is verified and carries a SHA-256 hash", async () => {
    const service = makeService();
    const input = supportedUpload();

    const record = await service.uploadEvidence(input);

    const expectedHash = createHash("sha256")
      .update(input.bytes)
      .digest("hex");
    expect(record.verificationStatus).toBe("verified");
    expect(record.sha256Hash).toBe(expectedHash);
    expect(record.id).toBeString();
    expect(record.caseId).toBe(input.caseId);
    expect(record.uploaderId).toBe(input.uploaderId);
    expect(record.sizeBytes).toBe(input.bytes.length);
  });

  test("the uploaded bytes are persisted in storage under the record's key", async () => {
    const service = makeService();
    const input = supportedUpload();

    const record = await service.uploadEvidence(input);

    expect(await harness.storage.exists(record.storageKey)).toBe(true);
    expect(Array.from(await harness.storage.get(record.storageKey))).toEqual(
      Array.from(input.bytes),
    );
  });

  test("an 'uploaded' audit event is written, timestamped via the injected clock", async () => {
    harness.clock.set(new Date("2025-03-04T05:06:07.000Z"));
    const service = makeService();

    const record = await service.uploadEvidence(supportedUpload());
    const trail = await service.getAuditTrail({ evidenceId: record.id });

    const uploaded = trail.filter((e) => e.eventType === "uploaded");
    expect(uploaded).toHaveLength(1);
    expect(uploaded[0]?.createdAt.toISOString()).toBe(
      "2025-03-04T05:06:07.000Z",
    );
  });

  test("two different files produce two distinct hashes", async () => {
    const service = makeService();

    const a = await service.uploadEvidence({
      ...supportedUpload(),
      bytes: new Uint8Array([1, 2, 3]),
    });
    const b = await service.uploadEvidence({
      ...supportedUpload(),
      bytes: new Uint8Array([9, 9, 9]),
    });

    expect(a.sha256Hash).not.toBe(b.sha256Hash);
    expect(a.storageKey).not.toBe(b.storageKey);
  });
});
