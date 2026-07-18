import {
  type FileStorage,
  StorageKeyNotFoundError,
} from "./file-storage.ts";

/**
 * In-memory {@link FileStorage} for tests.
 *
 * Stored bytes are copied on write and read so callers cannot mutate internal
 * state by reference. Tests can call {@link InMemoryFileStorage.overwrite} to
 * simulate silent tampering with an already-stored object.
 */
export class InMemoryFileStorage implements FileStorage {
  private readonly objects = new Map<string, Uint8Array>();

  async put(key: string, bytes: Uint8Array): Promise<void> {
    this.objects.set(key, Uint8Array.from(bytes));
  }

  async get(key: string): Promise<Uint8Array> {
    const bytes = this.objects.get(key);
    if (bytes === undefined) {
      throw new StorageKeyNotFoundError(key);
    }
    return Uint8Array.from(bytes);
  }

  async exists(key: string): Promise<boolean> {
    return this.objects.has(key);
  }

  /**
   * Test helper: replace the bytes under an existing key without going through
   * the normal upload path, simulating tampering. Throws if the key is absent.
   */
  overwrite(key: string, bytes: Uint8Array): void {
    if (!this.objects.has(key)) {
      throw new StorageKeyNotFoundError(key);
    }
    this.objects.set(key, Uint8Array.from(bytes));
  }
}
