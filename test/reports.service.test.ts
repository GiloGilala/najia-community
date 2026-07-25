import { describe, it, beforeEach, afterEach, expect } from "bun:test";
import { createTestHarness } from "./harness";
import { createReportsService } from "../services/reports.service";
import { FixedClock } from "../lib/clock/clock";

const DEFAULT_CLOCK_START = new Date("2025-01-01T00:00:00.000Z");

describe("ReportsService", () => {
  let harness: ReturnType<typeof createTestHarness>;
  let clock: FixedClock;
  let service: ReturnType<typeof createReportsService>;

  beforeEach(async () => {
    harness = createTestHarness();
    await harness.migrate();
    await harness.reset();
    clock = new FixedClock(DEFAULT_CLOCK_START);
    service = createReportsService({ db: harness.db, clock });
  });

  afterEach(async () => {
    await harness.close();
  });

  it("creates template", async () => {
    const tmpl = await service.createTemplate({
      name: `Template ${Date.now()}`,
      reportType: "quarterly",
      sections: [{ title: "Platform Activity", dataSource: "users", order: 0 }],
    });
    expect(tmpl.id.startsWith("rpttpl_")).toBeTrue();
    expect(tmpl.name).toBeTruthy();
  });

  it("lists templates", async () => {
    await service.createTemplate({
      name: `T1 ${Date.now()}`,
      reportType: "quarterly",
      sections: [{ title: "A", order: 0 }],
    });
    const { templates, total } = await service.listTemplates({ page: 1, limit: 10 });
    expect(total).toBeGreaterThanOrEqual(1);
    expect(templates.length).toBeGreaterThanOrEqual(1);
  });

  it("generates report", async () => {
    const tmpl = await service.createTemplate({
      name: `Gen T ${Date.now()}`,
      reportType: "quarterly",
      sections: [{ title: "Activity", dataSource: "users", order: 0 }],
    });
    const report = await service.generateReport({ reportType: "quarterly", templateId: tmpl.id });
    expect(report.id.startsWith("rpt_")).toBeTrue();
    expect(report.status).toBe("draft");
    expect(report.title).toBeTruthy();
  });

  it("publishes report", async () => {
    const report = await service.generateReport({ reportType: "quarterly" });
    const { randomUUID } = await import("node:crypto");
    const publisherId = randomUUID();
    const { users } = await import("../db/schema/users.ts");
    const now = new Date(DEFAULT_CLOCK_START);
    await harness.db.insert(users).values({
      id: publisherId,
      email: `pub-${Date.now()}@example.com`,
      passwordHash: "hashed",
      verificationStatus: "email_verified",
      createdAt: now,
      updatedAt: now,
    });
    const published = await service.publishReport({ reportId: report.id, publishedBy: publisherId });
    expect(published.status).toBe("published");
    expect(published.publishedAt).toBeTruthy();
  });

  it("gets report sections", async () => {
    const report = await service.generateReport({ reportType: "quarterly" });
    const sections = await service.getReportSections(report.id);
    expect(sections.length).toBeGreaterThanOrEqual(1);
    expect(sections[0].title).toBeTruthy();
  });

  it("creates and runs schedule", async () => {
    const tmpl = await service.createTemplate({
      name: `Sched T ${Date.now()}`,
      reportType: "quarterly",
      sections: [{ title: "Activity", order: 0 }],
    });
    const past = new Date(DEFAULT_CLOCK_START.getTime() - 1000 * 60 * 60); // 1 hour ago
    const sched = await service.createSchedule({
      templateId: tmpl.id,
      reportType: "quarterly",
      schedule: "0 0 1 */3 *",
      nextRunAt: past,
    });
    expect(sched.id.startsWith("rptsch_")).toBeTrue();
    const ran = await service.runScheduledReports();
    expect(ran).toBeGreaterThanOrEqual(1);
  });

  it("exports report data as json and csv", async () => {
    const report = await service.generateReport({ reportType: "quarterly" });
    const json = await service.exportReportData(report.id, "json");
    expect(json.length).toBeGreaterThan(0);
    const csv = await service.exportReportData(report.id, "csv");
    expect(csv.length).toBeGreaterThan(0);
    const csvStr = new TextDecoder().decode(csv);
    expect(csvStr).toContain("key,value");
  });

  it("audit logs are created", async () => {
    const report = await service.generateReport({ reportType: "quarterly" });
    const logs = await service.getReportAuditLogs(report.id);
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].action).toBe("created");
  });
});
