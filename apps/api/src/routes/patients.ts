import { FastifyInstance } from "fastify";
import { prisma } from "@carequeue/db";
import { sendWelcome } from "@carequeue/whatsapp";

export async function patientRoutes(app: FastifyInstance) {
  // ── List Patients (with search) ──
  app.get<{
    Params: { id: string };
    Querystring: { search?: string; limit?: string };
  }>("/:id/patients", async (request, reply) => {
    const { id: clinicId } = request.params;
    const { search, limit } = request.query;
    const take = parseInt(limit || "50", 10);

    const where: any = { clinicId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            appointments: true,
            waitlistEntries: { where: { status: { in: ["WAITING", "OFFERED"] } } },
          },
        },
        appointments: {
          take: 1,
          orderBy: { startTime: "desc" },
          select: { startTime: true, status: true },
        },
      },
    });

    const result = patients.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      lat: p.lat,
      lng: p.lng,
      reliabilityScore: p.reliabilityScore,
      totalAppointments: p._count.appointments,
      activeWaitlist: p._count.waitlistEntries,
      lastVisit: p.appointments[0]?.startTime || null,
      createdAt: p.createdAt,
    }));

    return reply.send(result);
  });

  // ── Get Single Patient ──
  app.get<{
    Params: { id: string; patientId: string };
  }>("/:id/patients/:patientId", async (request, reply) => {
    const { id: clinicId, patientId } = request.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        appointments: {
          orderBy: { startTime: "desc" },
          take: 10,
          include: {
            doctor: { select: { name: true, specialty: true } },
          },
        },
        waitlistEntries: {
          where: { status: { in: ["WAITING", "OFFERED"] } },
          include: {
            doctor: { select: { name: true } },
          },
        },
      },
    });

    if (!patient || patient.clinicId !== clinicId) {
      return reply.status(404).send({ error: "Patient not found" });
    }

    return reply.send(patient);
  });

  // ── Create Patient ──
  app.post<{
    Params: { id: string };
    Body: {
      name: string;
      phone: string;
      lat?: number;
      lng?: number;
    };
  }>("/:id/patients", async (request, reply) => {
    const { id: clinicId } = request.params;
    const { name, phone, lat, lng } = request.body;

    if (!name || !phone) {
      return reply.status(400).send({ error: "Name and phone are required" });
    }

    // Normalize phone
    const normalizedPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;

    // Check if phone already exists
    const existing = await prisma.patient.findUnique({
      where: { phone: normalizedPhone },
    });
    if (existing) {
      return reply.status(409).send({
        error: "Patient with this phone number already exists",
        existingPatient: { id: existing.id, name: existing.name },
      });
    }

    // Validate clinic
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) {
      return reply.status(404).send({ error: "Clinic not found" });
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        phone: normalizedPhone,
        clinicId,
        lat: lat ?? null,
        lng: lng ?? null,
        reliabilityScore: 80,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        clinicId,
        actorId: "receptionist",
        action: "PATIENT_REGISTERED",
        metadata: { patientId: patient.id, name: patient.name },
      },
    });

    // Send Welcome Message
    try {
      await sendWelcome({
        to: patient.phone,
        patientName: patient.name,
        clinicName: clinic.name,
      });
    } catch (err: any) {
      console.error("[Twilio/WhatsApp] Failed to send welcome message:", err?.message || err);
    }

    return reply.status(201).send(patient);
  });

  // ── Update Patient ──
  app.patch<{
    Params: { id: string; patientId: string };
    Body: {
      name?: string;
      phone?: string;
      lat?: number;
      lng?: number;
    };
  }>("/:id/patients/:patientId", async (request, reply) => {
    const { id: clinicId, patientId } = request.params;
    const { name, phone, lat, lng } = request.body;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient || patient.clinicId !== clinicId) {
      return reply.status(404).send({ error: "Patient not found" });
    }

    const data: any = {};
    if (name) data.name = name;
    if (phone) data.phone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
    if (lat !== undefined) data.lat = lat;
    if (lng !== undefined) data.lng = lng;

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data,
    });

    return reply.send(updated);
  });

  // ── List Doctors (for dropdowns) ──
  app.get<{
    Params: { id: string };
  }>("/:id/doctors", async (request, reply) => {
    const { id: clinicId } = request.params;

    const doctors = await prisma.doctor.findMany({
      where: { clinicId },
      select: {
        id: true,
        name: true,
        specialty: true,
        slotDuration: true,
        workingHours: true,
      },
      orderBy: { name: "asc" },
    });

    return reply.send(doctors);
  });
}
