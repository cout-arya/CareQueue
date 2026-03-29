import { FastifyInstance } from "fastify";
import { prisma } from "@carequeue/db";
import {
  createRecoveryQueue,
  scheduleReminders,
  cancelReminders,
} from "@carequeue/queue";

export async function appointmentRoutes(app: FastifyInstance) {
  // ── Create Appointment ──
  app.post<{
    Params: { id: string };
    Body: {
      doctorId: string;
      patientId: string;
      startTime: string;
      endTime: string;
      appointmentType?: string;
    };
  }>("/:id/appointments", async (request, reply) => {
    const { id: clinicId } = request.params;
    const { doctorId, patientId, startTime, endTime, appointmentType } =
      request.body;

    // Validate clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });
    if (!clinic) {
      return reply.status(404).send({ error: "Clinic not found" });
    }

    // Check for time conflicts
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        startTime: { lt: new Date(endTime) },
        endTime: { gt: new Date(startTime) },
      },
    });

    if (conflict) {
      return reply.status(409).send({
        error: "Time slot conflict",
        conflictingAppointmentId: conflict.id,
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        doctorId,
        patientId,
        clinicId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        appointmentType: (appointmentType as any) || "ROUTINE",
        status: "SCHEDULED",
      },
      include: {
        doctor: { select: { name: true } },
        patient: { select: { name: true, phone: true } },
      },
    });

    // Schedule reminder jobs
    await scheduleReminders(appointment.id, appointment.startTime);

    // Audit log
    await prisma.auditLog.create({
      data: {
        clinicId,
        actorId: "api",
        action: "APPOINTMENT_CREATED",
        metadata: { appointmentId: appointment.id },
      },
    });

    return reply.status(201).send(appointment);
  });

  // ── Cancel Appointment → triggers recovery ──
  app.post<{
    Params: { id: string; apptId: string };
    Body: { reason?: string };
  }>("/:id/appointments/:apptId/cancel", async (request, reply) => {
    const { id: clinicId, apptId } = request.params;
    const { reason } = request.body || {};

    const appointment = await prisma.appointment.findUnique({
      where: { id: apptId },
      include: { doctor: true },
    });

    if (!appointment || appointment.clinicId !== clinicId) {
      return reply.status(404).send({ error: "Appointment not found" });
    }

    if (appointment.status === "CANCELLED") {
      return reply.status(400).send({ error: "Already cancelled" });
    }

    // Cancel the appointment
    await prisma.appointment.update({
      where: { id: apptId },
      data: { status: "CANCELLED" },
    });

    // Cancel any pending reminders
    await cancelReminders(apptId);

    // Enqueue recovery job
    const recoveryQueue = createRecoveryQueue();
    await recoveryQueue.add("recovery", {
      appointmentId: apptId,
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId,
      slotStart: appointment.startTime.toISOString(),
      slotEnd: appointment.endTime.toISOString(),
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        clinicId,
        actorId: "api",
        action: "APPOINTMENT_CANCELLED",
        metadata: { appointmentId: apptId, reason },
      },
    });

    return reply.send({
      message: "Appointment cancelled. Recovery job enqueued.",
      appointmentId: apptId,
    });
  });

  // ── Update Appointment Status ──
  app.patch<{
    Params: { id: string; apptId: string };
    Body: { status: string };
  }>("/:id/appointments/:apptId", async (request, reply) => {
    const { id: clinicId, apptId } = request.params;
    const { status } = request.body;

    const validStatuses = [
      "SCHEDULED",
      "CONFIRMED",
      "CANCELLED",
      "NO_SHOW",
      "COMPLETED",
    ];
    if (!validStatuses.includes(status)) {
      return reply.status(400).send({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: apptId },
    });

    if (!appointment || appointment.clinicId !== clinicId) {
      return reply.status(404).send({ error: "Appointment not found" });
    }

    const updated = await prisma.appointment.update({
      where: { id: apptId },
      data: { status: status as any },
      include: {
        doctor: { select: { name: true } },
        patient: { select: { name: true, phone: true } },
      },
    });

    return reply.send(updated);
  });

  // ── List Today's Appointments ──
  app.get<{
    Params: { id: string };
    Querystring: { date?: string };
  }>("/:id/appointments", async (request, reply) => {
    const { id: clinicId } = request.params;
    const dateStr = request.query.date;

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        doctor: { select: { name: true, specialty: true } },
        patient: { select: { name: true, phone: true } },
      },
      orderBy: { startTime: "asc" },
    });

    return reply.send(appointments);
  });
}
