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
import { CapturingNotifier } from "../lib/notify/notifier.ts";
import { ContactVerificationError } from "../services/auth.service.ts";
import { users } from "../db/schema/users.ts";
import { contactVerifications } from "../db/schema/contact-verifications.ts";

/**
 * Auth ticket 02 — Contact channel verification (one-time code).
 * Seam: the auth service layer, with injected clock + notifier.
 */
describe("auth service — contact verification", () => {
  let harness: TestHarness;
  let notifier: CapturingNotifier;

  const makeService = () =>
    createAuthService({ db: harness.db, clock: harness.clock, notifier });

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
    notifier = new CapturingNotifier();
  });

  test("issuing a code sends it through the notifier and stores a hash", async () => {
    const service = makeService();
    const user = await registerUser("ada@example.com");

    await service.issueContactVerification({ userId: user.id });

    expect(notifier.lastCode).toMatch(/^\d{6}$/);
    expect(notifier.lastUserId).toBe(user.id);
    const rows = await harness.db.select().from(contactVerifications);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.codeHash).not.toBe(notifier.lastCode);
  });

  test("confirming the correct, unexpired code advances to email_verified", async () => {
    harness.clock.set(new Date("2025-01-01T00:00:00.000Z"));
    const service = makeService();
    const user = await registerUser("grace@example.com");

    await service.issueContactVerification({ userId: user.id });
    const code = notifier.lastCode!;

    const updated = await service.confirmContactVerification({
      userId: user.id,
      code,
    });

    expect(updated.verificationStatus).toBe("email_verified");
    const [row] = await harness.db.select().from(users).where(eq(users.id, user.id));
    expect(row?.verificationStatus).toBe("email_verified");
  });

  test("a wrong code is rejected and status is unchanged", async () => {
    const service = makeService();
    const user = await registerUser("x@example.com");
    await service.issueContactVerification({ userId: user.id });

    await expect(
      service.confirmContactVerification({ userId: user.id, code: "000000" }),
    ).rejects.toBeInstanceOf(ContactVerificationError);

    const [row] = await harness.db.select().from(users).where(eq(users.id, user.id));
    expect(row?.verificationStatus).toBe("unverified");
  });

  test("an expired code is rejected", async () => {
    harness.clock.set(new Date("2025-01-01T00:00:00.000Z"));
    const service = makeService();
    const user = await registerUser("y@example.com");
    await service.issueContactVerification({ userId: user.id });
    const code = notifier.lastCode!;

    harness.clock.set(new Date("2025-01-01T00:30:00.000Z")); // past 15-min expiry

    await expect(
      service.confirmContactVerification({ userId: user.id, code }),
    ).rejects.toBeInstanceOf(ContactVerificationError);
  });

  test("a consumed code cannot be reused", async () => {
    harness.clock.set(new Date("2025-01-01T00:00:00.000Z"));
    const service = makeService();
    const user = await registerUser("z@example.com");
    await service.issueContactVerification({ userId: user.id });
    const code = notifier.lastCode!;
    await service.confirmContactVerification({ userId: user.id, code });

    await expect(
      service.confirmContactVerification({ userId: user.id, code }),
    ).rejects.toBeInstanceOf(ContactVerificationError);
  });
});
