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
import { users } from "../db/schema/index.ts";

/**
 * Auth ticket 05 — Session validation & logout.
 * Seam: the auth service layer, with injected clock + token signer.
 */
describe("auth service — session validation & logout", () => {
  let harness: TestHarness;
  let signer: TokenSigner;

  const makeService = () =>
    createAuthService({
      db: harness.db,
      clock: harness.clock,
      tokenSigner: signer,
    });

  const loginAda = async () => {
    const service = makeService();
    await service.register({ email: "ada@example.com", password: "correct horse" });
    return service.login({ identifier: "ada@example.com", password: "correct horse" });
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

  test("a freshly issued token validates to its user", async () => {
    const service = makeService();
    const { token } = await loginAda();
    const user = await service.validateSession({ token });
    expect(user.email).toBe("ada@example.com");
  });

  test("an unknown token is rejected", async () => {
    const service = makeService();
    await expect(
      service.validateSession({ token: "not-a-real.token" }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  test("an expired session (past expires_at) is rejected", async () => {
    harness.clock.set(new Date("2025-01-01T00:00:00.000Z"));
    const service = makeService();
    const { token } = await loginAda();
    // Advance past the 7-day session TTL.
    harness.clock.set(new Date("2025-01-20T00:00:00.000Z"));
    await expect(service.validateSession({ token })).rejects.toBeInstanceOf(
      AuthError,
    );
  });

  test("a revoked session is rejected after logout", async () => {
    const service = makeService();
    const { token } = await loginAda();
    await service.logout({ token });

    await expect(service.validateSession({ token })).rejects.toBeInstanceOf(
      AuthError,
    );
  });

  test("logout only invalidates its own session", async () => {
    const service = makeService();
    const ada = await loginAda();
    // A second user/session remains valid after ada logs out.
    await service.register({ email: "grace@example.com", password: "correct horse" });
    const grace = await service.login({
      identifier: "grace@example.com",
      password: "correct horse",
    });

    await service.logout({ token: ada.token });

    await expect(service.validateSession({ token: ada.token })).rejects.toBeInstanceOf(AuthError);
    const stillUser = await service.validateSession({ token: grace.token });
    expect(stillUser.email).toBe("grace@example.com");
  });
});
