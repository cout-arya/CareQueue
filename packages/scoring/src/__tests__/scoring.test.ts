import { describe, it, expect } from "vitest";
import {
  computeRankScore,
  computeProximityScore,
  haversineDistanceKm,
  daysSince,
  rankWaitlist,
} from "../index.js";

const NOW = new Date("2026-03-23T12:00:00Z");

const BANGALORE_CLINIC = { lat: 12.9716, lng: 77.5946 };

describe("daysSince", () => {
  it("returns 0 for same time", () => {
    expect(daysSince(NOW, NOW)).toBe(0);
  });

  it("returns correct days", () => {
    const threeDaysAgo = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000);
    expect(daysSince(threeDaysAgo, NOW)).toBeCloseTo(3, 1);
  });

  it("returns 0 for future dates", () => {
    const future = new Date(NOW.getTime() + 86400000);
    expect(daysSince(future, NOW)).toBe(0);
  });
});

describe("haversineDistanceKm", () => {
  it("returns 0 for same point", () => {
    expect(haversineDistanceKm(12.97, 77.59, 12.97, 77.59)).toBe(0);
  });

  it("returns reasonable distance for Bangalore points", () => {
    // Indiranagar to Whitefield (~15 km)
    const dist = haversineDistanceKm(12.9716, 77.5946, 12.9698, 77.7500);
    expect(dist).toBeGreaterThan(10);
    expect(dist).toBeLessThan(25);
  });
});

describe("computeProximityScore", () => {
  it("returns 100 for same location", () => {
    const patient = { reliabilityScore: 80, lat: 12.9716, lng: 77.5946 };
    expect(computeProximityScore(patient, BANGALORE_CLINIC)).toBe(100);
  });

  it("returns 50 when coordinates missing", () => {
    const patient = { reliabilityScore: 80, lat: null, lng: null };
    expect(computeProximityScore(patient, BANGALORE_CLINIC)).toBe(50);
  });

  it("returns 0 for far-away patient", () => {
    // Delhi is ~1700 km from Bangalore
    const patient = { reliabilityScore: 80, lat: 28.6139, lng: 77.209 };
    expect(computeProximityScore(patient, BANGALORE_CLINIC)).toBe(0);
  });
});

describe("computeRankScore", () => {
  it("URGENT scores higher than ROUTINE", () => {
    const patient = { reliabilityScore: 80, lat: 12.97, lng: 77.59 };
    const urgentEntry = { urgency: "URGENT" as const, joinedAt: NOW };
    const routineEntry = { urgency: "ROUTINE" as const, joinedAt: NOW };

    const urgentScore = computeRankScore(urgentEntry, patient, BANGALORE_CLINIC, NOW);
    const routineScore = computeRankScore(routineEntry, patient, BANGALORE_CLINIC, NOW);

    expect(urgentScore).toBeGreaterThan(routineScore);
  });

  it("longer wait gives higher score (same urgency)", () => {
    const patient = { reliabilityScore: 80, lat: 12.97, lng: 77.59 };
    const oldEntry = {
      urgency: "ROUTINE" as const,
      joinedAt: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000),
    };
    const newEntry = { urgency: "ROUTINE" as const, joinedAt: NOW };

    const oldScore = computeRankScore(oldEntry, patient, BANGALORE_CLINIC, NOW);
    const newScore = computeRankScore(newEntry, patient, BANGALORE_CLINIC, NOW);

    expect(oldScore).toBeGreaterThan(newScore);
  });

  it("higher reliability gives higher score", () => {
    const reliablePatient = { reliabilityScore: 95, lat: 12.97, lng: 77.59 };
    const unreliablePatient = { reliabilityScore: 30, lat: 12.97, lng: 77.59 };
    const entry = { urgency: "ROUTINE" as const, joinedAt: NOW };

    const highScore = computeRankScore(entry, reliablePatient, BANGALORE_CLINIC, NOW);
    const lowScore = computeRankScore(entry, unreliablePatient, BANGALORE_CLINIC, NOW);

    expect(highScore).toBeGreaterThan(lowScore);
  });

  it("closer patient scores higher", () => {
    const nearPatient = { reliabilityScore: 80, lat: 12.9716, lng: 77.5946 };
    const farPatient = { reliabilityScore: 80, lat: 13.08, lng: 77.57 };
    const entry = { urgency: "ROUTINE" as const, joinedAt: NOW };

    const nearScore = computeRankScore(entry, nearPatient, BANGALORE_CLINIC, NOW);
    const farScore = computeRankScore(entry, farPatient, BANGALORE_CLINIC, NOW);

    expect(nearScore).toBeGreaterThan(farScore);
  });

  it("returns score in expected range (0–100)", () => {
    const patient = { reliabilityScore: 50, lat: 12.97, lng: 77.59 };
    const entry = { urgency: "ROUTINE" as const, joinedAt: NOW };
    const score = computeRankScore(entry, patient, BANGALORE_CLINIC, NOW);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("rankWaitlist", () => {
  it("sorts entries by score descending", () => {
    const items = [
      {
        id: "a",
        entry: { urgency: "ROUTINE" as const, joinedAt: NOW },
        patient: { reliabilityScore: 50, lat: 13.08, lng: 77.57 },
      },
      {
        id: "b",
        entry: { urgency: "URGENT" as const, joinedAt: NOW },
        patient: { reliabilityScore: 90, lat: 12.97, lng: 77.59 },
      },
      {
        id: "c",
        entry: { urgency: "FOLLOW_UP" as const, joinedAt: NOW },
        patient: { reliabilityScore: 80, lat: 12.97, lng: 77.60 },
      },
    ];

    const ranked = rankWaitlist(items, BANGALORE_CLINIC, NOW);

    expect(ranked[0].id).toBe("b"); // URGENT + high reliability + close
    expect(ranked.length).toBe(3);
    expect(ranked[0].rankScore).toBeGreaterThan(ranked[1].rankScore);
    expect(ranked[1].rankScore).toBeGreaterThan(ranked[2].rankScore);
  });
});
