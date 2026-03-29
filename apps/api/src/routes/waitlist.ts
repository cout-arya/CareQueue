import { FastifyInstance } from "fastify";
import { prisma } from "@carequeue/db";
import { computeRankScore, fetchOrsDistanceKm } from "@carequeue/scoring";

export async function waitlistRoutes(app: FastifyInstance) {
  // ── Join Waitlist ──
  app.post<{
    Params: { id: string };
    Body: {
      patientId: string;
      doctorId?: string;
      specialty?: string;
      urgency?: string;
    };
  }>("/:id/waitlist", async (request, reply) => {
    const { id: clinicId } = request.params;
    const { patientId, doctorId, specialty, urgency } = request.body;

    // Validate clinic
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });
    if (!clinic) {
      return reply.status(404).send({ error: "Clinic not found" });
    }

    // Validate patient
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      return reply.status(404).send({ error: "Patient not found" });
    }

    // Check if already on waitlist
    const existing = await prisma.waitlistEntry.findFirst({
      where: {
        patientId,
        clinicId,
        status: { in: ["WAITING", "OFFERED"] },
      },
    });
    if (existing) {
      return reply.status(409).send({
        error: "Patient already on waitlist",
        existingEntryId: existing.id,
      });
    }

    // Compute initial rank score
    const entry = {
      urgency: (urgency as any) || "ROUTINE",
      joinedAt: new Date(),
    };

    let distKm: number | undefined;
    if (patient.lng != null && patient.lat != null && clinic.lng != null && clinic.lat != null) {
      const fetched = await fetchOrsDistanceKm(patient.lng, patient.lat, clinic.lng, clinic.lat);
      if (fetched != null) distKm = fetched;
    }

    const rankScore = computeRankScore(entry, patient, clinic, new Date(), distKm);

    const waitlistEntry = await prisma.waitlistEntry.create({
      data: {
        patientId,
        clinicId,
        doctorId: doctorId || null,
        specialty: specialty || null,
        urgency: (urgency as any) || "ROUTINE",
        status: "WAITING",
        rankScore,
      },
      include: {
        patient: { select: { name: true, phone: true, reliabilityScore: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        clinicId,
        actorId: "api",
        action: "WAITLIST_JOINED",
        metadata: { waitlistEntryId: waitlistEntry.id, patientId },
      },
    });

    return reply.status(201).send(waitlistEntry);
  });

  // ── Get Ranked Waitlist ──
  app.get<{
    Params: { id: string };
    Querystring: { doctorId?: string; status?: string };
  }>("/:id/waitlist", async (request, reply) => {
    const { id: clinicId } = request.params;
    const { doctorId, status } = request.query;

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });
    if (!clinic) {
      return reply.status(404).send({ error: "Clinic not found" });
    }

    const entries = await prisma.waitlistEntry.findMany({
      where: {
        clinicId,
        ...(doctorId ? { doctorId } : {}),
        ...(status ? { status: status as any } : { status: { in: ["WAITING", "OFFERED"] } }),
      },
      include: {
        patient: {
          select: {
            name: true,
            phone: true,
            reliabilityScore: true,
            lat: true,
            lng: true,
          },
        },
        doctor: { select: { name: true, specialty: true } },
      },
      orderBy: { rankScore: "desc" },
    });

    // Recompute scores for live view
    const rankedEntries = entries.map((e) => ({
      ...e,
      rankScore: computeRankScore(
        { urgency: e.urgency, joinedAt: e.joinedAt },
        {
          reliabilityScore: e.patient.reliabilityScore,
          lat: e.patient.lat,
          lng: e.patient.lng,
        },
        clinic
      ),
    }));

    rankedEntries.sort((a, b) => b.rankScore - a.rankScore);

    return reply.send({
      clinicId,
      total: rankedEntries.length,
      entries: rankedEntries,
    });
  });

  // ── Remove from Waitlist ──
  app.delete<{
    Params: { id: string; entryId: string };
  }>("/:id/waitlist/:entryId", async (request, reply) => {
    const { id: clinicId, entryId } = request.params;

    const entry = await prisma.waitlistEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.clinicId !== clinicId) {
      return reply.status(404).send({ error: "Waitlist entry not found" });
    }

    await prisma.waitlistEntry.update({
      where: { id: entryId },
      data: { status: "REMOVED" },
    });

    return reply.send({ message: "Removed from waitlist", entryId });
  });
}
