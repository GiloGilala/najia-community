/**
 * Password hashing for authentication.
 *
 * Wraps a memory-hard hashing algorithm behind a small interface so the auth
 * service depends on this module, not a specific vendor. Uses Bun's built-in
 * argon2id implementation (`Bun.password`).
 *
 * SECURITY-AUDIT-REQUIRED: see docs/adr/0002-custom-auth-security.md. Custom
 * auth for a platform holding government-ID hashes and votes must pass a
 * security review before launch.
 */
export interface PasswordHasher {
  hash(plaintext: string): Promise<string>;
  verify(plaintext: string, hash: string): Promise<boolean>;
}

export const argon2PasswordHasher: PasswordHasher = {
  hash(plaintext) {
    return Bun.password.hash(plaintext, { algorithm: "argon2id" });
  },
  verify(plaintext, hash) {
    return Bun.password.verify(plaintext, hash);
  },
};
