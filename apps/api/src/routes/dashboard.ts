import { FastifyInstance } from "fastify";
import { prisma } from "@carequeue/db";

export async function dashboardRoutes(app: FastifyInstance) {
  // ── Today's Dashboard ──
  app.get<{
    Params: { id: string };
    Querystring: { date?: string };
  }>("/:id/dashboard", async (request, reply) => {
    const { id: clinicId } = request.params;
    const dateStr = request.query.date;

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch today's appointments
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

    // Stats
    const total = appointments.length;
    const confirmed = appointments.filter((a) => a.status === "CONFIRMED").length;
    const cancelled = appointments.filter((a) => a.status === "CANCELLED").length;
    const noShows = appointments.filter((a) => a.status === "NO_SHOW").length;
    const completed = appointments.filter((a) => a.status === "COMPLETED").length;
    const scheduled = appointments.filter((a) => a.status === "SCHEDULED").length;

    // Active waitlist count
    const waitlistCount = await prisma.waitlistEntry.count({
      where: {
        clinicId,
        status: { in: ["WAITING", "OFFERED"] },
      },
    });

    // Today's recoveries
    const todayRecoveries = await prisma.recoveryEvent.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        appointment: { clinicId },
      },
    });

    const slotsRecovered = todayRecoveries.filter((r) => r.filledByPatientId).length;
    const avgRecoveryTimeSec =
      todayRecoveries
        .filter((r) => r.recoveryTimeSeconds)
        .reduce((sum, r) => sum + (r.recoveryTimeSeconds || 0), 0) /
        (slotsRecovered || 1);

    return reply.send({
      date: targetDate.toISOString().split("T")[0],
      stats: {
        total,
        scheduled,
        confirmed,
        cancelled,
        noShows,
        completed,
        waitlistActive: waitlistCount,
        slotsRecovered,
        avgRecoveryTimeSec: Math.round(avgRecoveryTimeSec),
      },
      appointments,
    });
  });

  // ── Recovery Report ──
  app.get<{
    Params: { id: string };
    Querystring: { month?: string; year?: string };
  }>("/:id/reports/recovery", async (request, reply) => {
    const { id: clinicId } = request.params;
    const now = new Date();
    const month = parseInt(request.query.month || String(now.getMonth() + 1), 10);
    const year = parseInt(request.query.year || String(now.getFullYear()), 10);

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // All recovery events for this clinic in the month
    const recoveries = await prisma.recoveryEvent.findMany({
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        appointment: { clinicId },
      },
      include: {
        appointment: {
          include: {
            doctor: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalSlotsCancelled = recoveries.length;
    const slotsFilled = recoveries.filter((r) => r.filledByPatientId).length;
    const fillRate =
      totalSlotsCancelled > 0
        ? Math.round((slotsFilled / totalSlotsCancelled) * 100)
        : 0;

    const totalRevenueRecovered = recoveries
      .filter((r) => r.revenueRecovered)
      .reduce((sum, r) => sum + (r.revenueRecovered || 0), 0);

    const avgRecoveryTimeSec =
      recoveries
        .filter((r) => r.recoveryTimeSeconds)
        .reduce((sum, r) => sum + (r.recoveryTimeSeconds || 0), 0) /
        (slotsFilled || 1);

    // Group by doctor
    const byDoctor: Record<
      string,
      { doctorName: string; cancelled: number; filled: number; revenue: number }
    > = {};

    for (const r of recoveries) {
      const doctorName = r.appointment.doctor.name;
      if (!byDoctor[doctorName]) {
        byDoctor[doctorName] = {
          doctorName,
          cancelled: 0,
          filled: 0,
          revenue: 0,
        };
      }
      byDoctor[doctorName].cancelled++;
      if (r.filledByPatientId) byDoctor[doctorName].filled++;
      byDoctor[doctorName].revenue += r.revenueRecovered || 0;
    }

    return reply.send({
      period: `${year}-${String(month).padStart(2, "0")}`,
      summary: {
        totalSlotsCancelled,
        slotsFilled,
        fillRate: `${fillRate}%`,
        totalRevenueRecovered: `₹${totalRevenueRecovered.toLocaleString("en-IN")}`,
        avgRecoveryTimeSec: Math.round(avgRecoveryTimeSec),
        avgRecoveryTimeFormatted: `${Math.round(avgRecoveryTimeSec / 60)} min ${Math.round(avgRecoveryTimeSec % 60)} sec`,
      },
      byDoctor: Object.values(byDoctor),
      events: recoveries,
    });
  });
}
