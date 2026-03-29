import { Queue, Worker, Job } from "bullmq";
import { prisma } from "@carequeue/db";
import { sendReminder } from "@carequeue/whatsapp";
import { getRedisConnection } from "./connection.js";

// ─── Types ──────────────────────────────────────────

export interface ReminderJobData {
  appointmentId: string;
  type: "T_24H" | "T_2H" | "T_30M" | "NO_SHOW_CHECK";
}

// ─── Queue ──────────────────────────────────────────

const QUEUE_NAME = "reminders";

export function createReminderQueue() {
  return new Queue<ReminderJobData, any, string>(QUEUE_NAME, {
    connection: getRedisConnection() as any,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 2,
      backoff: { type: "fixed", delay: 10000 },
    },
  });
}

/**
 * Schedule all reminder jobs when an appointment is created.
 */
export async function scheduleReminders(
  appointmentId: string,
  startTime: Date
) {
  const queue = createReminderQueue();
  const now = Date.now();

  // T-24h reminder
  const t24h = startTime.getTime() - 24 * 60 * 60 * 1000;
  if (t24h > now) {
    await queue.add(
      "reminder-24h",
      { appointmentId, type: "T_24H" },
      { delay: t24h - now, jobId: `rem-24h-${appointmentId}` }
    );
  }

  // T-2h reminder
  const t2h = startTime.getTime() - 2 * 60 * 60 * 1000;
  if (t2h > now) {
    await queue.add(
      "reminder-2h",
      { appointmentId, type: "T_2H" },
      { delay: t2h - now, jobId: `rem-2h-${appointmentId}` }
    );
  }

  // T-30m reminder
  const t30m = startTime.getTime() - 30 * 60 * 1000;
  if (t30m > now) {
    await queue.add(
      "reminder-30m",
      { appointmentId, type: "T_30M" },
      { delay: t30m - now, jobId: `rem-30m-${appointmentId}` }
    );
  }

  // T+15m no-show check
  const t15m = startTime.getTime() + 15 * 60 * 1000;
  if (t15m > now) {
    await queue.add(
      "no-show-check",
      { appointmentId, type: "NO_SHOW_CHECK" },
      { delay: t15m - now, jobId: `noshow-${appointmentId}` }
    );
  }

  console.log(`⏰ [Reminders] Scheduled for appointment ${appointmentId}`);
}

/**
 * Cancel all reminder jobs for a cancelled appointment.
 */
export async function cancelReminders(appointmentId: string) {
  const queue = createReminderQueue();

  const jobIds = [
    `rem-24h-${appointmentId}`,
    `rem-2h-${appointmentId}`,
    `rem-30m-${appointmentId}`,
    `noshow-${appointmentId}`,
  ];

  for (const jobId of jobIds) {
    try {
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
      }
    } catch {
      // Job may have already been processed or doesn't exist
    }
  }

  console.log(`🚫 [Reminders] Cancelled for appointment ${appointmentId}`);
}

// ─── Worker ─────────────────────────────────────────

export function createReminderWorker() {
  const worker = new Worker<ReminderJobData, any, string>(
    QUEUE_NAME,
    async (job: Job<ReminderJobData, any, string>) => {
      const { appointmentId, type } = job.data;

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: true,
          doctor: true,
          clinic: true,
        },
      });

      if (!appointment) {
        console.log(`⚠️ [Reminder] Appointment ${appointmentId} not found`);
        return;
      }

      // Skip if already cancelled/completed
      if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appointment.status)) {
        console.log(`⚠️ [Reminder] Appointment ${appointmentId} is ${appointment.status}, skipping`);
        return;
      }

      const timeStr = appointment.startTime.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });

      const dateStr = appointment.startTime.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });

      const mapsLink =
        appointment.clinic.lat && appointment.clinic.lng
          ? `https://www.google.com/maps?q=${appointment.clinic.lat},${appointment.clinic.lng}`
          : undefined;

      // ── No-show check ──
      if (type === "NO_SHOW_CHECK") {
        // If still SCHEDULED (not checked in / confirmed), mark as no-show
        if (appointment.status === "SCHEDULED") {
          await prisma.$transaction([
            prisma.appointment.update({
              where: { id: appointmentId },
              data: { status: "NO_SHOW" },
            }),
            prisma.patient.update({
              where: { id: appointment.patientId },
              data: {
                reliabilityScore: Math.max(
                  0,
                  appointment.patient.reliabilityScore - 10
                ),
              },
            }),
          ]);

          console.log(
            `🚫 [No-Show] ${appointment.patient.name} — reliability: ${appointment.patient.reliabilityScore} → ${Math.max(0, appointment.patient.reliabilityScore - 10)}`
          );

          // Import recovery queue dynamically to avoid circular dep
          const { createRecoveryQueue } = await import("./recovery.job.js");
          const recoveryQueue = createRecoveryQueue();
          await recoveryQueue.add("recovery", {
            appointmentId,
            doctorId: appointment.doctorId,
            clinicId: appointment.clinicId,
            slotStart: appointment.startTime.toISOString(),
            slotEnd: appointment.endTime.toISOString(),
          });

          console.log(`🔄 [No-Show] Recovery job enqueued for ${appointmentId}`);
        }
        return;
      }

      // ── Send reminder with SMS Fallback ──
      try {
        await sendReminder({
          to: appointment.patient.phone,
          patientName: appointment.patient.name,
          doctorName: appointment.doctor.name,
          slotTime: timeStr,
          slotDate: dateStr,
          clinicName: appointment.clinic.name,
          clinicAddress: appointment.clinic.address,
          mapsLink,
          type,
        });
        console.log(`📱 [Reminder ${type}] Sent via WhatsApp to ${appointment.patient.name}`);
      } catch (err: any) {
        console.error(`❌ [Reminder ${type}] WhatsApp failed for ${appointment.patient.name}, falling back to SMS.`);
        
        try {
          const { sendSms } = await import("@carequeue/sms");
          const msg = `Reminder: Appointment with ${appointment.doctor.name} at ${timeStr} on ${dateStr}. ${appointment.clinic.name}.`;
          await sendSms(appointment.patient.phone, msg);
          console.log(`💬 [Reminder ${type}] Fallback SMS sent to ${appointment.patient.name}`);
        } catch (smsErr: any) {
          console.error(`❌ [Reminder ${type}] SMS fallback also failed for ${appointment.patient.name}:`, smsErr.message);
        }
      }
    },
    {
      connection: getRedisConnection() as any,
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    console.log(`✅ [Reminder] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ [Reminder] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
