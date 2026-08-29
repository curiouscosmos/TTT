import { describe, expect, it } from "vitest";

import { computeRetainerHealth } from "../src/domain/retainer-health.js";

const now = new Date("2026-08-29T12:00:00.000Z");

describe("computeRetainerHealth", () => {
  it("returns red when the latest check-in is red", () => {
    expect(computeRetainerHealth([
      { date: "2026-08-20T12:00:00.000Z", ragStatus: "green" },
      { date: "2026-08-28T12:00:00.000Z", ragStatus: "red" },
    ], now)).toEqual({
      status: "red",
      reason: "The most recent check-in is red.",
    });
  });

  it("returns red when the latest check-in is older than 14 days", () => {
    expect(computeRetainerHealth([
      { date: "2026-08-14T11:59:59.999Z", ragStatus: "green" },
    ], now)).toEqual({
      status: "red",
      reason: "No check-in has been recorded in the past 14 days.",
    });
  });

  it("returns amber when the latest check-in is amber", () => {
    expect(computeRetainerHealth([
      { date: "2026-08-28T12:00:00.000Z", ragStatus: "amber" },
      { date: "2026-08-20T12:00:00.000Z", ragStatus: "green" },
    ], now)).toEqual({
      status: "amber",
      reason: "One of the two most recent check-ins is amber.",
    });
  });

  it("returns amber when the second latest check-in is amber", () => {
    expect(computeRetainerHealth([
      { date: "2026-08-28T12:00:00.000Z", ragStatus: "green" },
      { date: "2026-08-27T12:00:00.000Z", ragStatus: "amber" },
    ], now)).toEqual({
      status: "amber",
      reason: "One of the two most recent check-ins is amber.",
    });
  });

  it("returns green for recent green check-ins", () => {
    expect(computeRetainerHealth([
      { date: "2026-08-20T12:00:00.000Z", ragStatus: "green" },
      { date: "2026-08-28T12:00:00.000Z", ragStatus: "green" },
    ], now)).toEqual({
      status: "green",
      reason: "Recent check-ins are green.",
    });
  });

  it("returns red before amber rules", () => {
    expect(computeRetainerHealth([
      { date: "2026-08-28T12:00:00.000Z", ragStatus: "red" },
      { date: "2026-08-27T12:00:00.000Z", ragStatus: "amber" },
    ], now)).toEqual({
      status: "red",
      reason: "The most recent check-in is red.",
    });
  });

  it("returns red when there are no check-ins", () => {
    expect(computeRetainerHealth([], now)).toEqual({
      status: "red",
      reason: "No check-ins have been recorded yet.",
    });
  });
});
