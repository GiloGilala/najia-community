/**
 * One-time-code generation and hashing for contact verification.
 *
 * Codes are short numeric strings shown to the user; only their hash is
 * persisted. Uses Bun's sha-256 helper (no plaintext code at rest).
 */
import { createHash } from "node:crypto";

export const CODE_LENGTH = 6;

export function generateNumericCode(length = CODE_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export function hashCode(code: string): string {
  return createHash("sha256").update(`code:${code}`).digest("hex");
}
