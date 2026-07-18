import {
  expect,
  test,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";

import { createTestHarness, type TestHarness } from "./harness.ts";
import { createAuthService } from "../services/auth.service.ts";
import { RegistrationValidationError } from "../lib/validation/registration.ts";
import { users } from "../db/schema/users.ts";

/**
 * Auth ticket 01 — User registration & password hashing.
 * Seam: the auth service layer, with injected clock and password hasher.
 */
describe("auth service — registration", () => {
  let harness: TestHarness;

  const makeService = () =>
    createAuthService({ db: harness.db, clock: harness.clock });

  const countUsers = async () => (await harness.db.select().from(users)).length;

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

  test("registers a user as unverified", async () => {
    const service = makeService();
    const user = await service.register({
      email: "ada@example.com",
      password: "correct horse",
    });
    expect(user.verificationStatus).toBe("unverified");
    expect(user.email).toBe("ada@example.com");
    expect(await countUsers()).toBe(1);
  });

  test("stores the password only as a hash, never plaintext", async () => {
    const service = makeService();
    const password = "correct horse battery";
    const user = await service.register({
      email: "grace@example.com",
      password,
    });
    expect(user.passwordHash).not.toBe(password);
    expect(user.passwordHash).not.toContain(password);
    // The stored hash must actually verify against the original password.
    expect(await Bun.password.verify(password, user.passwordHash)).toBe(true);
  });

  test("allows registration with phone only", async () => {
    const service = makeService();
    const user = await service.register({
      phone: "+2348012345678",
      password: "correct horse",
    });
    expect(user.phone).toBe("+2348012345678");
    expect(user.email).toBeNull();
  });

  test("rejects registration with neither email nor phone", async () => {
    const service = makeService();
    await expect(
      service.register({ password: "correct horse" }),
    ).rejects.toBeInstanceOf(RegistrationValidationError);
    expect(await countUsers()).toBe(0);
  });

  test("rejects too-short passwords", async () => {
    const service = makeService();
    await expect(
      service.register({ email: "x@example.com", password: "short" }),
    ).rejects.toBeInstanceOf(RegistrationValidationError);
    expect(await countUsers()).toBe(0);
  });

  test("rejects a duplicate email and creates no row", async () => {
    const service = makeService();
    await service.register({ email: "dup@example.com", password: "correct horse" });
    await expect(
      service.register({ email: "dup@example.com", password: "another one!" }),
    ).rejects.toThrow();
    expect(await countUsers()).toBe(1);
  });

  test("rejects a duplicate phone and creates no row", async () => {
    const service = makeService();
    await service.register({ phone: "+2348000000000", password: "correct horse" });
    await expect(
      service.register({ phone: "+2348000000000", password: "another one!" }),
    ).rejects.toThrow();
    expect(await countUsers()).toBe(1);
  });

  test("allows multiple phone-only users (null emails are distinct)", async () => {
    const service = makeService();
    await service.register({ phone: "+2348011111111", password: "correct horse" });
    await service.register({ phone: "+2348022222222", password: "correct horse" });
    expect(await countUsers()).toBe(2);
  });
});
