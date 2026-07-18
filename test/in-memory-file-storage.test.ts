import { expect, test, describe } from "bun:test";

import { InMemoryFileStorage } from "../lib/storage/in-memory-file-storage.ts";
import { StorageKeyNotFoundError } from "../lib/storage/file-storage.ts";

describe("InMemoryFileStorage", () => {
  test("stores and retrieves bytes", async () => {
    const storage = new InMemoryFileStorage();
    await storage.put("a", new Uint8Array([10, 20, 30]));
    expect(Array.from(await storage.get("a"))).toEqual([10, 20, 30]);
  });

  test("reports existence", async () => {
    const storage = new InMemoryFileStorage();
    expect(await storage.exists("missing")).toBe(false);
    await storage.put("present", new Uint8Array([1]));
    expect(await storage.exists("present")).toBe(true);
  });

  test("rejects reads of absent keys", async () => {
    const storage = new InMemoryFileStorage();
    await expect(storage.get("nope")).rejects.toBeInstanceOf(
      StorageKeyNotFoundError,
    );
  });

  test("copies bytes so callers cannot mutate stored state by reference", async () => {
    const storage = new InMemoryFileStorage();
    const input = new Uint8Array([1, 2, 3]);
    await storage.put("k", input);
    input[0] = 99;
    expect(Array.from(await storage.get("k"))).toEqual([1, 2, 3]);
  });

  test("overwrite simulates tampering with an existing key", async () => {
    const storage = new InMemoryFileStorage();
    await storage.put("k", new Uint8Array([1, 1, 1]));
    storage.overwrite("k", new Uint8Array([9, 9, 9]));
    expect(Array.from(await storage.get("k"))).toEqual([9, 9, 9]);
  });

  test("overwrite rejects absent keys", () => {
    const storage = new InMemoryFileStorage();
    expect(() => storage.overwrite("absent", new Uint8Array([1]))).toThrow(
      StorageKeyNotFoundError,
    );
  });
});
