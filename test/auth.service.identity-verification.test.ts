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
import { IdentityVerificationError } from "../services/auth.service.ts";
import { users } from "../db/schema/users.ts";

/**
 * Auth ticket 03 — Government ID verification.
 * Seam: the auth service layer, with injected clock + ID-verification provider.
 */
describe("auth service — government ID verification", () => {
  let harness: TestHarness;
  let provider: FakeIdVerificationProvider;

  const makeService = () =>
    createAuthService({ db: harness.db, clock: harness.clock, idProvider: provider });

  const registerUser = async (email: string) => {
    const service = makeService();
    return service.register({ email, password: "correct horse" });
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
  });

  test("a passing provider check advances the account to id_verified", async () => {
    provider.nextResult = { verified: true };
    const service = makeService();
    const user = await registerUser("ada@example.com");

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
    const user = await registerUser("grace@example.com");

    const result = await service.submitIdentityVerification({
      userId: user.id,
      governmentId: "B98765432",
    });

    expect(result.verified).toBe(false);
    expect(result.reason).toBe(reason);
    const [row] = await harness.db.select().from(users).where(eq(users.id, user.id));
    expect(row?.verificationStatus).toBe("unverified");
    expect(row?.governmentIdHash).toBeNull();
  });

  test("the raw government ID is never stored", async () => {
    provider.nextResult = { verified: true };
    const service = makeService();
    const user = await registerUser("x@example.com");
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
    const a = await registerUser("a1@example.com");
    const b = await registerUser("a2@example.com");
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
    const user = await registerUser("y@example.com");
    await service.submitIdentityVerification({
      userId: user.id,
      governmentId: "PROVIDED123",
    });
    expect(provider.lastGovernmentId).toBe("PROVIDED123");
  });
});
