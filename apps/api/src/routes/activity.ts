import { FastifyInstance } from "fastify";
import { prisma } from "@carequeue/db";

export async function activityRoutes(app: FastifyInstance) {
  // ── Recent Activity Feed ──
  app.get<{
    Params: { id: string };
    Querystring: { limit?: string };
  }>("/:id/activity", async (request, reply) => {
    const { id: clinicId } = request.params;
    const limit = parseInt(request.query.limit || "30", 10);

    const logs = await prisma.auditLog.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Transform into human-readable activity items
    const activities = logs.map((log) => {
      const meta = (log.metadata as Record<string, any>) || {};
      let icon = "📋";
      let message = log.action;

      switch (log.action) {
        case "APPOINTMENT_CREATED":
          icon = "📅";
          message = `New appointment booked`;
          break;
        case "APPOINTMENT_CANCELLED":
          icon = "❌";
          message = `Appointment cancelled${meta.reason ? `: ${meta.reason}` : ""}`;
          break;
        case "SLOT_RECOVERED":
          icon = "✅";
          message = `Slot recovered in ${meta.recoveryTimeSeconds || "?"}s`;
          break;
        case "WAITLIST_JOINED":
          icon = "📋";
          message = `Patient added to waitlist`;
          break;
        case "PATIENT_REGISTERED":
          icon = "👤";
          message = `New patient registered: ${meta.name || "Unknown"}`;
          break;
        case "WHATSAPP_REMINDER_SENT":
          icon = "📱";
          message = `WhatsApp reminder sent to ${meta.patientName || "patient"} (${meta.type || "reminder"})`;
          break;
        case "SMS_FALLBACK_SENT":
          icon = "💬";
          message = `SMS fallback sent to ${meta.patientName || "patient"}`;
          break;
        case "WHATSAPP_OFFER_SENT":
          icon = "🔔";
          message = `Slot offer sent to ${meta.patientName || "patient"} via WhatsApp`;
          break;
        case "RECOVERY_TRIGGERED":
          icon = "🔄";
          message = `Slot recovery triggered for ${meta.doctorName || "doctor"}`;
          break;
        default:
          icon = "📋";
          message = log.action.replace(/_/g, " ").toLowerCase();
      }

      return {
        id: log.id,
        icon,
        message,
        action: log.action,
        actorId: log.actorId,
        metadata: meta,
        createdAt: log.createdAt,
      };
    });

    return reply.send(activities);
  });
}
