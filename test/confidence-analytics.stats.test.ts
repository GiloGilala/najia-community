import {
  expect,
  test,
  describe,
  beforeAll,
  afterAll,
  beforeEach,
} from "bun:test";

import { createTestHarness, type TestHarness } from "./harness.ts";
import { wilsonInterval, isLeafLga } from "../lib/confidence-stats.ts";
import { descendantLeafIds } from "../lib/jurisdiction.ts";
import { jurisdictions } from "../db/schema/jurisdictions.ts";

describe("confidence-analytics ticket 01 — stats helpers", () => {
  let harness: TestHarness;

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

  describe("wilsonInterval", () => {
    test("returns full [0,1] when n is 0", () => {
      expect(wilsonInterval(0, 0)).toEqual({ low: 0, high: 1 });
    });

    test("centre is the sample proportion for moderate n", () => {
      const { low, high } = wilsonInterval(50, 100);
      // 50/100 = 0.5; interval should straddle 0.5
      expect(low).toBeLessThan(0.5);
      expect(high).toBeGreaterThan(0.5);
    });

    test("interval narrows as n grows (fixed proportion)", () => {
      const small = wilsonInterval(5, 10);
      const large = wilsonInterval(500, 1000);
      const smallWidth = small.high - small.low;
      const largeWidth = large.high - large.low;
      expect(largeWidth).toBeLessThan(smallWidth);
    });

    test("bounds stay within [0,1]", () => {
      const extreme = wilsonInterval(0, 5);
      expect(extreme.low).toBeGreaterThanOrEqual(0);
      expect(extreme.high).toBeLessThanOrEqual(1);
    });

    test("centre shifts toward 0.5 for small n (conservative)", () => {
      // 1/1 = 1.0 raw; Wilson pulls the lower bound well below 1
      const { low, high } = wilsonInterval(1, 1);
      expect(low).toBeLessThan(1);
      expect(high).toBeLessThanOrEqual(1);
    });
  });

  describe("isLeafLga", () => {
    test("true for local", () => expect(isLeafLga("local")).toBe(true));
    test("false for state", () => expect(isLeafLga("state")).toBe(false));
    test("false for national", () => expect(isLeafLga("national")).toBe(false));
  });

  describe("descendantLeafIds", () => {
    test("a local scope returns just itself", async () => {
      await harness.db.insert(jurisdictions).values([
        { id: "11111111-1111-4111-8111-111111111111", name: "Lagos", level: "state", parentId: null },
        { id: "22222222-2222-4222-8222-222222222222", name: "Ikeja", level: "local", parentId: "11111111-1111-4111-8111-111111111111" },
      ]);
      const leaves = await descendantLeafIds(harness.db, "22222222-2222-4222-8222-222222222222");
      expect(leaves).toEqual(["22222222-2222-4222-8222-222222222222"]);
    });

    test("a state scope returns its LGAs, not itself", async () => {
      await harness.db.insert(jurisdictions).values([
        { id: "11111111-1111-4111-8111-111111111111", name: "Lagos", level: "state", parentId: null },
        { id: "22222222-2222-4222-8222-222222222222", name: "Ikeja", level: "local", parentId: "11111111-1111-4111-8111-111111111111" },
        { id: "33333333-3333-4333-8333-333333333333", name: "Agege", level: "local", parentId: "11111111-1111-4111-8111-111111111111" },
        { id: "44444444-4444-4444-8444-444444444444", name: "Kano", level: "state", parentId: null },
        { id: "55555555-5555-4555-8555-555555555555", name: "Kano LGA", level: "local", parentId: "44444444-4444-4444-8444-444444444444" },
      ]);
      const leaves = await descendantLeafIds(harness.db, "11111111-1111-4111-8111-111111111111");
      expect(leaves.sort()).toEqual([
        "22222222-2222-4222-8222-222222222222",
        "33333333-3333-4333-8333-333333333333",
      ]);
    });

    test("a national scope returns all LGAs", async () => {
      await harness.db.insert(jurisdictions).values([
        { id: "11111111-1111-4111-8111-111111111111", name: "Nigeria", level: "national", parentId: null },
        { id: "22222222-2222-4222-8222-222222222222", name: "Lagos", level: "state", parentId: "11111111-1111-4111-8111-111111111111" },
        { id: "33333333-3333-4333-8333-333333333333", name: "Ikeja", level: "local", parentId: "22222222-2222-4222-8222-222222222222" },
        { id: "44444444-4444-4444-8444-444444444444", name: "Kano", level: "state", parentId: "11111111-1111-4111-8111-111111111111" },
        { id: "55555555-5555-4555-8555-555555555555", name: "Kano LGA", level: "local", parentId: "44444444-4444-4444-8444-444444444444" },
      ]);
      const leaves = await descendantLeafIds(harness.db, "11111111-1111-4111-8111-111111111111");
      expect(leaves.sort()).toEqual([
        "33333333-3333-4333-8333-333333333333",
        "55555555-5555-4555-8555-555555555555",
      ]);
    });
  });
});
