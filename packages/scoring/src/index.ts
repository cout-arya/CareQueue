// ─── Types ───────────────────────────────────────────

export interface ScoringPatient {
  reliabilityScore: number;
  lat?: number | null;
  lng?: number | null;
}

export interface ScoringWaitlistEntry {
  urgency: "ROUTINE" | "FOLLOW_UP" | "URGENT";
  joinedAt: Date;
}

export interface ScoringClinic {
  lat?: number | null;
  lng?: number | null;
}

// ─── Weights ─────────────────────────────────────────

const WEIGHTS = {
  urgency: 0.35,
  proximity: 0.25,
  waitTime: 0.2,
  reliability: 0.15,
} as const;

const URGENCY_SCORES: Record<string, number> = {
  URGENT: 100,
  FOLLOW_UP: 60,
  ROUTINE: 30,
};

// ─── Helpers ─────────────────────────────────────────

/**
 * Compute days since a given date.
 */
export function daysSince(date: Date, now: Date = new Date()): number {
  const ms = now.getTime() - date.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

/**
 * Haversine distance between two lat/lng points in kilometers.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Fetch real driving distance from OpenRouteService.
 * Returns null if the request fails or API key is missing.
 */
export async function fetchOrsDistanceKm(
  patientLng: number,
  patientLat: number,
  clinicLng: number,
  clinicLat: number
): Promise<number | null> {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openrouteservice.org/v2/matrix/driving-car", {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locations: [
          [patientLng, patientLat],
          [clinicLng, clinicLat],
        ],
        metrics: ["distance"],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json() as any;

    const distMeters = data.distances?.[0]?.[1];
    if (typeof distMeters === "number") {
      return distMeters / 1000;
    }
  } catch (err) {
    console.error("ORS Distance Fetch Error:", err);
  }
  return null;
}

/**
 * Compute a 0–100 proximity score.
 * - 0 km → 100
 * - 50+ km → 0
 * If coordinates are missing, returns 50 (neutral).
 */
export function computeProximityScore(
  patient: ScoringPatient,
  clinic: ScoringClinic,
  overrideDistKm?: number
): number {
  if (overrideDistKm != null) {
    return Math.max(0, Math.min(100, 100 - overrideDistKm * 2));
  }
  if (
    patient.lat == null ||
    patient.lng == null ||
    clinic.lat == null ||
    clinic.lng == null
  ) {
    return 50; // neutral when location unknown
  }

  const distKm = haversineDistanceKm(
    patient.lat,
    patient.lng,
    clinic.lat,
    clinic.lng
  );

  // Linear decay: 100 at 0 km → 0 at 50 km
  return Math.max(0, Math.min(100, 100 - distKm * 2));
}

// ─── Main Scoring Function ──────────────────────────

/**
 * Compute a rank score for a waitlist entry.
 * Higher score = higher priority for being offered the slot.
 *
 * Weights:
 * - Urgency:     35%  (URGENT=100, FOLLOW_UP=60, ROUTINE=30)
 * - Proximity:   25%  (0–100 based on Haversine distance)
 * - Wait time:   20%  (5 pts/day, capped at 100)
 * - Reliability: 15%  (patient's reliability score 0–100)
 */
export function computeRankScore(
  entry: ScoringWaitlistEntry,
  patient: ScoringPatient,
  clinic: ScoringClinic,
  now: Date = new Date(),
  overrideDistKm?: number
): number {
  const urgencyScore = URGENCY_SCORES[entry.urgency] ?? 30;
  const waitScore = Math.min(daysSince(entry.joinedAt, now) * 5, 100);
  const reliabilityScore = patient.reliabilityScore;
  const proximityScore = computeProximityScore(patient, clinic, overrideDistKm);

  return (
    urgencyScore * WEIGHTS.urgency +
    proximityScore * WEIGHTS.proximity +
    waitScore * WEIGHTS.waitTime +
    reliabilityScore * WEIGHTS.reliability
  );
}

/**
 * Rank a list of waitlist entries and return them sorted by score (descending).
 */
export function rankWaitlist<
  T extends { entry: ScoringWaitlistEntry; patient: ScoringPatient }
>(items: T[], clinic: ScoringClinic, now: Date = new Date()): (T & { rankScore: number })[] {
  return items
    .map((item) => ({
      ...item,
      rankScore: computeRankScore(item.entry, item.patient, clinic, now),
    }))
    .sort((a, b) => b.rankScore - a.rankScore);
}
