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
import { createAuthService } from "../services/auth.service.ts";
import {
  FakeIdVerificationProvider,
  type IdVerificationResult,
} from "../lib/verification/id-verification-provider.ts";
import { CapturingNotifier } from "../lib/notify/notifier.ts";
import { IdentityVerificationError } from "../services/auth.service.ts";
import { users } from "../db/schema/users.ts";

/**
 * Auth ticket 03 — Government ID verification.
 * Seam: the auth service layer, with injected clock + ID-verification provider.
 */
describe("auth service — government ID verification", () => {
  let harness: TestHarness;
  let provider: FakeIdVerificationProvider;
  let notifier: CapturingNotifier;

  const makeService = () =>
    createAuthService({
      db: harness.db,
      clock: harness.clock,
      idProvider: provider,
      notifier,
    });

  const registerUser = async (email: string) => {
    const service = makeService();
    return service.register({ email, password: "correct horse" });
  };

  /** Registers then completes contact verification -> email_verified. */
  const registerContactVerifiedUser = async (email: string) => {
    const service = makeService();
    const user = await service.register({ email, password: "correct horse" });
    await service.issueContactVerification({ userId: user.id });
    const code = notifier.lastCode!;
    return service.confirmContactVerification({ userId: user.id, code });
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
    provider = new FakeIdVerificationProvider();
    notifier = new CapturingNotifier();
  });

  test("a passing provider check advances the account to id_verified", async () => {
    provider.nextResult = { verified: true };
    const service = makeService();
    const user = await registerContactVerifiedUser("ada@example.com");

    const result = await service.submitIdentityVerification({
      userId: user.id,
      governmentId: "A12345678",
    });

    expect(result.verified).toBe(true);
    const [row] = await harness.db.select().from(users).where(eq(users.id, user.id));
    expect(row?.verificationStatus).toBe("id_verified");
    expect(row?.governmentIdHash).not.toBeNull();
    expect(row?.governmentIdHash).not.toContain("A12345678");
  });

  test("a failing provider check leaves status unchanged and returns a reason", async () => {
    const reason = "Document could not be read";
    provider.nextResult = { verified: false, reason };
    const service = makeService();
    const user = await registerContactVerifiedUser("grace@example.com");

    const result = await service.submitIdentityVerification({
      userId: user.id,
      governmentId: "B98765432",
    });

    expect(result.verified).toBe(false);
    expect(result.reason).toBe(reason);
    const [row] = await harness.db.select().from(users).where(eq(users.id, user.id));
    expect(row?.verificationStatus).toBe("email_verified");
    expect(row?.governmentIdHash).toBeNull();
  });

  test("the raw government ID is never stored", async () => {
    provider.nextResult = { verified: true };
    const service = makeService();
    const user = await registerContactVerifiedUser("x@example.com");
    await service.submitIdentityVerification({
      userId: user.id,
      governmentId: "SECRETID001",
    });

    const rows = await harness.db.select().from(users);
    const serialized = JSON.stringify(rows);
    expect(serialized).not.toContain("SECRETID001");
    expect(serialized).not.toContain("secretid001");
  });

  test("a second account with the same government ID is rejected", async () => {
    provider.nextResult = { verified: true };
    const service = makeService();
    const a = await registerContactVerifiedUser("a1@example.com");
    const b = await registerContactVerifiedUser("a2@example.com");
    await service.submitIdentityVerification({
      userId: a.id,
      governmentId: "SAMEID999",
    });

    await expect(
      service.submitIdentityVerification({
        userId: b.id,
        governmentId: "SAMEID999",
      }),
    ).rejects.toBeInstanceOf(IdentityVerificationError);
  });

  test("the provider receives the government ID", async () => {
    provider.nextResult = { verified: true };
    const service = makeService();
    const user = await registerContactVerifiedUser("y@example.com");
    await service.submitIdentityVerification({
      userId: user.id,
      governmentId: "PROVIDED123",
    });
    expect(provider.lastGovernmentId).toBe("PROVIDED123");
  });

  test("identity verification is rejected before contact verification (forward-only)", async () => {
    provider.nextResult = { verified: true };
    const service = makeService();
    const user = await registerUser("z@example.com");
    const result = await service.submitIdentityVerification({
      userId: user.id,
      governmentId: "NEEDSCONTACT1",
    });
    expect(result.verified).toBe(false);
    const [row] = await harness.db.select().from(users).where(eq(users.id, user.id));
    expect(row?.verificationStatus).toBe("unverified");
  });
});
