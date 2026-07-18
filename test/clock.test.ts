import { expect, test, describe } from "bun:test";

import { FixedClock, systemClock } from "../lib/clock/clock.ts";

describe("FixedClock", () => {
  test("returns the initial instant", () => {
    const clock = new FixedClock(new Date("2025-01-01T00:00:00.000Z"));
    expect(clock.now().toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });

  test("set moves the clock to a new instant", () => {
    const clock = new FixedClock(new Date("2025-01-01T00:00:00.000Z"));
    clock.set(new Date("2025-06-15T12:00:00.000Z"));
    expect(clock.now().toISOString()).toBe("2025-06-15T12:00:00.000Z");
  });

  test("advance moves the clock forward by milliseconds", () => {
    const clock = new FixedClock(new Date("2025-01-01T00:00:00.000Z"));
    clock.advance(5000);
    expect(clock.now().toISOString()).toBe("2025-01-01T00:00:05.000Z");
  });

  test("returns copies so callers cannot mutate internal time by reference", () => {
    const clock = new FixedClock(new Date("2025-01-01T00:00:00.000Z"));
    const t = clock.now();
    t.setFullYear(1999);
    expect(clock.now().toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });
});

describe("systemClock", () => {
  test("returns a time close to the real now", () => {
    const before = Date.now();
    const value = systemClock.now().getTime();
    const after = Date.now();
    expect(value).toBeGreaterThanOrEqual(before);
    expect(value).toBeLessThanOrEqual(after);
  });
});
