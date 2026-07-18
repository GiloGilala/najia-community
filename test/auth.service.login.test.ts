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
import {
  createHmacTokenSigner,
  type TokenSigner,
} from "../lib/crypto/token.ts";
import { AuthError } from "../services/auth.service.ts";
import { users, sessions } from "../db/schema/index.ts";

/**
 * Auth ticket 04 — Login & session issuance.
 * Seam: the auth service layer, with injected clock + token signer.
 */
describe("auth service — login", () => {
  let harness: TestHarness;
  let signer: TokenSigner;

  const makeService = () =>
    createAuthService({
      db: harness.db,
      clock: harness.clock,
      tokenSigner: signer,
    });

  const registerUser = async (email: string, password: string) => {
    const service = makeService();
    return service.register({ email, password });
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
    signer = createHmacTokenSigner("test-secret");
  });

  test("login with correct credentials returns a session token", async () => {
    await registerUser("ada@example.com", "correct horse");
    const service = makeService();

    const session = await service.login({
      identifier: "ada@example.com",
      password: "correct horse",
    });

    expect(session.token).toBeString();
    expect(session.expiresAt).toBeInstanceOf(Date);
    // The raw token decodes to the right claims.
    const claims = signer.verify(session.token);
    expect(claims?.userId).toBeDefined();
    // Only the token hash is stored, never the raw token.
    const rows = await harness.db.select().from(sessions);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenHash).not.toBe(session.token);
  });

  test("a wrong password is rejected with a non-enumerable error", async () => {
    await registerUser("grace@example.com", "correct horse");
    const service = makeService();

    await expect(
      service.login({ identifier: "grace@example.com", password: "wrong pw" }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  test("an unknown identifier is rejected with the same error type", async () => {
    const service = makeService();
    await expect(
      service.login({ identifier: "nobody@example.com", password: "whatever" }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  test("wrong password and unknown identifier produce an identical error", async () => {
    await registerUser("x@example.com", "correct horse");
    const service = makeService();

    const wrongPw = await service
      .login({ identifier: "x@example.com", password: "bad" })
      .catch((e) => e);
    const unknown = await service
      .login({ identifier: "missing@example.com", password: "bad" })
      .catch((e) => e);

    expect(wrongPw).toBeInstanceOf(AuthError);
    expect(unknown).toBeInstanceOf(AuthError);
    expect(wrongPw.message).toBe(unknown.message);
  });

  test("the session row expires in the future relative to the clock", async () => {
    harness.clock.set(new Date("2025-01-01T00:00:00.000Z"));
    await registerUser("y@example.com", "correct horse");
    const service = makeService();

    const session = await service.login({
      identifier: "y@example.com",
      password: "correct horse",
    });
    expect(session.expiresAt.getTime()).toBeGreaterThan(harness.clock.now().getTime());
  });
});
