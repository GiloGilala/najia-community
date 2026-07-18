/**
 * File storage collaborator.
 *
 * The evidence-integrity pipeline persists the raw bytes of uploaded evidence
 * through this interface. Production implementations target an object store /
 * CDN; tests inject the in-memory fake so that tampering can be simulated by
 * overwriting stored bytes.
 *
 * See docs/adr/0001-evidence-integrity-stack.md and
 * .scratch/evidence-integrity/spec.md.
 */
export interface FileStorage {
  /** Persist bytes under a storage key, overwriting any existing value. */
  put(key: string, bytes: Uint8Array): Promise<void>;
  /** Retrieve the bytes stored under a key. Rejects if the key is absent. */
  get(key: string): Promise<Uint8Array>;
  /** Report whether a key currently has bytes stored. */
  exists(key: string): Promise<boolean>;
}

export class StorageKeyNotFoundError extends Error {
  constructor(key: string) {
    super(`No object stored under key: ${key}`);
    this.name = "StorageKeyNotFoundError";
  }
}
