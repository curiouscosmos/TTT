import type { PrismaClient } from "@prisma/client";
import type { Express } from "express";

import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

let app: Express;
let prisma: PrismaClient;

beforeAll(async () => {
  const databasePath = join(mkdtempSync(join(tmpdir(), "retainers-api-")), "test.db");
  // eslint-disable-next-line node/no-process-env
  process.env.DATABASE_URL = `file:${databasePath}`;

  execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
    // eslint-disable-next-line node/no-process-env
    env: process.env,
    stdio: "inherit",
  });

  app = (await import("../src/app.js")).default;
  prisma = (await import("../src/db.js")).prisma;
});

beforeEach(async () => {
  await prisma.checkIn.deleteMany();
  await prisma.retainer.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("retainers api", () => {
  it("lists retainers with latest check-in date and computed health", async () => {
    const retainer = await createRetainer();
    await prisma.checkIn.createMany({
      data: [
        {
          retainerId: retainer.id,
          date: new Date("2026-08-20T12:00:00.000Z"),
          summary: "Going well.",
          ragStatus: "green",
        },
        {
          retainerId: retainer.id,
          date: new Date(),
          summary: "Some delivery risk.",
          ragStatus: "amber",
        },
      ],
    });

    const response = await request(app)
      .get("/api/v1/retainers")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toMatchObject([{
      id: retainer.id,
      clientName: "Acme Co",
      status: "active",
      leadEngineer: "Dana",
      health: {
        status: "amber",
        reason: "One of the two most recent check-ins is amber.",
      },
    }]);
    expect(response.body[0].latestCheckInDate).toEqual(expect.any(String));
  });

  it("lists only at-risk retainers ordered by severity then oldest latest check-in", async () => {
    const oldRed = await createRetainer("Old Red", "Dana");
    const newRed = await createRetainer("New Red", "Sam");
    const oldAmber = await createRetainer("Old Amber", "Riley");
    const newAmber = await createRetainer("New Amber", "Jo");
    const green = await createRetainer("Green", "Lee");

    await prisma.checkIn.createMany({
      data: [
        {
          retainerId: oldRed.id,
          date: new Date("2026-08-01T12:00:00.000Z"),
          summary: "Old red.",
          ragStatus: "red",
        },
        {
          retainerId: newRed.id,
          date: new Date("2026-08-20T12:00:00.000Z"),
          summary: "New red.",
          ragStatus: "red",
        },
        {
          retainerId: oldAmber.id,
          date: new Date("2026-08-20T11:00:00.000Z"),
          summary: "Old amber.",
          ragStatus: "amber",
        },
        {
          retainerId: newAmber.id,
          date: new Date(),
          summary: "New amber.",
          ragStatus: "amber",
        },
        {
          retainerId: green.id,
          date: new Date(),
          summary: "Green.",
          ragStatus: "green",
        },
      ],
    });

    const response = await request(app)
      .get("/api/v1/retainers/at-risk")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body.map((retainer: { clientName: string }) => retainer.clientName)).toEqual([
      "Old Red",
      "New Red",
      "Old Amber",
      "New Amber",
    ]);
    expect(response.body[0]).toEqual({
      id: oldRed.id,
      clientName: "Old Red",
      leadEngineer: "Dana",
      latestCheckInDate: "2026-08-01T12:00:00.000Z",
      health: {
        status: "red",
        reason: "The most recent check-in is red.",
      },
    });
  });

  it("returns retainer detail with recent check-ins and health reason", async () => {
    const retainer = await createRetainer();
    await prisma.checkIn.createMany({
      data: [
        {
          retainerId: retainer.id,
          date: new Date("2026-08-01T12:00:00.000Z"),
          summary: "Older check-in.",
          ragStatus: "green",
        },
        {
          retainerId: retainer.id,
          date: new Date(),
          summary: "Latest check-in.",
          ragStatus: "green",
        },
      ],
    });

    const response = await request(app)
      .get(`/api/v1/retainers/${retainer.id}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toMatchObject({
      id: retainer.id,
      health: {
        status: "green",
        reason: "Recent check-ins are green.",
      },
      checkIns: [
        {
          summary: "Latest check-in.",
          ragStatus: "green",
        },
        {
          summary: "Older check-in.",
          ragStatus: "green",
        },
      ],
    });
  });

  it("returns 404 for a missing retainer", () =>
    request(app)
      .get("/api/v1/retainers/missing")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(404));

  it("creates a retainer", async () => {
    const response = await request(app)
      .post("/api/v1/retainers")
      .send({
        clientName: "Beta LLC",
        startDate: "2026-08-29T00:00:00.000Z",
        leadEngineer: "Sam",
      })
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(201);

    expect(response.body).toMatchObject({
      clientName: "Beta LLC",
      status: "active",
      leadEngineer: "Sam",
      latestCheckInDate: null,
      health: {
        status: "red",
        reason: "No check-ins have been recorded yet.",
      },
      checkIns: [],
    });
  });

  it("returns 400 for invalid create input", () =>
    request(app)
      .post("/api/v1/retainers")
      .send({
        clientName: "",
        startDate: "not-a-date",
        leadEngineer: "",
      })
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(400));

  it("returns 400 when create input uses non-string dates", () =>
    request(app)
      .post("/api/v1/retainers")
      .send({
        clientName: "Beta LLC",
        startDate: null,
        leadEngineer: "Sam",
      })
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(400));

  it("updates retainer fields", async () => {
    const retainer = await createRetainer();

    const response = await request(app)
      .patch(`/api/v1/retainers/${retainer.id}`)
      .send({
        status: "archived",
        leadEngineer: "Riley",
      })
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toMatchObject({
      id: retainer.id,
      status: "archived",
      leadEngineer: "Riley",
    });
  });

  it("returns 404 when updating a missing retainer", () =>
    request(app)
      .patch("/api/v1/retainers/missing")
      .send({
        clientName: "Missing",
      })
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(404));

  it("creates a check-in for an existing retainer", async () => {
    const retainer = await createRetainer();

    const response = await request(app)
      .post(`/api/v1/retainers/${retainer.id}/check-ins`)
      .send({
        date: "2026-08-29T12:00:00.000Z",
        summary: "Weekly update.",
        ragStatus: "green",
        riskNote: "Watch staffing.",
      })
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(201);

    expect(response.body).toMatchObject({
      retainerId: retainer.id,
      summary: "Weekly update.",
      ragStatus: "green",
      riskNote: "Watch staffing.",
    });
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.date).toEqual("2026-08-29T12:00:00.000Z");
    expect(response.body.createdAt).toEqual(expect.any(String));
  });

  it("returns 404 when creating a check-in for a missing retainer", () =>
    request(app)
      .post("/api/v1/retainers/missing/check-ins")
      .send({
        date: "2026-08-29T12:00:00.000Z",
        summary: "Weekly update.",
        ragStatus: "green",
      })
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(404));

  it("returns 400 for invalid check-in input", async () => {
    const retainer = await createRetainer();

    return request(app)
      .post(`/api/v1/retainers/${retainer.id}/check-ins`)
      .send({
        date: "not-a-date",
        summary: "",
        ragStatus: "blue",
      })
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(400);
  });

  it("returns 400 when check-in input uses non-string dates", async () => {
    const retainer = await createRetainer();

    return request(app)
      .post(`/api/v1/retainers/${retainer.id}/check-ins`)
      .send({
        date: null,
        summary: "Weekly update.",
        ragStatus: "green",
      })
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(400);
  });

  it("derives updated health after creating a red check-in", async () => {
    const retainer = await createRetainer();

    await request(app)
      .post(`/api/v1/retainers/${retainer.id}/check-ins`)
      .send({
        date: new Date().toISOString(),
        summary: "Blocked by a production issue.",
        ragStatus: "red",
      })
      .set("Accept", "application/json")
      .expect(201);

    const response = await request(app)
      .get(`/api/v1/retainers/${retainer.id}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body.health).toEqual({
      status: "red",
      reason: "The most recent check-in is red.",
    });
  });
});

function createRetainer(clientName = "Acme Co", leadEngineer = "Dana") {
  return prisma.retainer.create({
    data: {
      clientName,
      startDate: new Date("2026-08-01T00:00:00.000Z"),
      leadEngineer,
    },
  });
}
