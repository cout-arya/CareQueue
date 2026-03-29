import { Queue, Worker, Job } from "bullmq";
import { prisma } from "@carequeue/db";
import { rankWaitlist } from "@carequeue/scoring";
import { sendSlotOffer } from "@carequeue/whatsapp";
import { getRedisConnection } from "./connection.js";

// ─── Types ──────────────────────────────────────────

export interface RecoveryJobData {
  appointmentId: string;
  doctorId: string;
  clinicId: string;
  slotStart: string; // ISO string
  slotEnd: string;   // ISO string
}

// ─── Queue ──────────────────────────────────────────

const QUEUE_NAME = "recovery";

export function createRecoveryQueue() {
  return new Queue<RecoveryJobData, any, string>(QUEUE_NAME, {
    connection: getRedisConnection() as any,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    },
  });
}

// ─── Worker ─────────────────────────────────────────

export function createRecoveryWorker() {
  const worker = new Worker<RecoveryJobData, any, string>(
    QUEUE_NAME,
    async (job: Job<RecoveryJobData, any, string>) => {
      if (job.name === "recovery-timeout") return;
      const { appointmentId, doctorId, clinicId, slotStart, slotEnd } = job.data;

      console.log(`\n🔄 [Recovery] Processing job for appointment ${appointmentId}`);

      // 1. Fetch clinic for proximity scoring
      const clinic = await prisma.clinic.findUniqueOrThrow({
        where: { id: clinicId },
      });

      // 2. Find all WAITING waitlist entries for this clinic/doctor
      const waitlistEntries = await prisma.waitlistEntry.findMany({
        where: {
          clinicId,
          status: "WAITING",
          OR: [
            { doctorId },
            { doctorId: null }, // any-doctor entries
          ],
        },
        include: { patient: true },
      });

      if (waitlistEntries.length === 0) {
        console.log("   ⚠️ No waitlist entries found. Logging as unrecovered.");

        await prisma.recoveryEvent.create({
          data: {
            cancelledAppointmentId: appointmentId,
            offeredToPatientIds: [],
            filledByPatientId: null,
          },
        });
        return;
      }

      // 3. Score and rank
      const scoringItems = waitlistEntries.map((we) => ({
        entry: {
          urgency: we.urgency,
          joinedAt: we.joinedAt,
        },
        patient: {
          reliabilityScore: we.patient.reliabilityScore,
          lat: we.patient.lat,
          lng: we.patient.lng,
        },
        waitlistEntry: we,
      }));

      const ranked = rankWaitlist(scoringItems, clinic);

      // 4. Pick top 3
      const topCandidates = ranked.slice(0, 3);

      console.log(`   📊 Ranked ${ranked.length} entries. Top ${topCandidates.length}:`);
      topCandidates.forEach((c, i) => {
        console.log(`      ${i + 1}. ${c.waitlistEntry.patient.name} (score: ${c.rankScore.toFixed(1)})`);
      });

      // 5. Set status to OFFERED
      const offeredIds = topCandidates.map((c) => c.waitlistEntry.id);
      const offeredPatientIds = topCandidates.map((c) => c.waitlistEntry.patientId);

      await prisma.waitlistEntry.updateMany({
        where: { id: { in: offeredIds } },
        data: { status: "OFFERED", offeredAt: new Date() },
      });

      // 6. Send WhatsApp offers
      const slotDate = new Date(slotStart);
      const doctor = await prisma.doctor.findUniqueOrThrow({
        where: { id: doctorId },
      });

      const timeStr = slotDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });

      const dateStr = slotDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });

      for (const candidate of topCandidates) {
        await sendSlotOffer({
          to: candidate.waitlistEntry.patient.phone,
          patientName: candidate.waitlistEntry.patient.name,
          doctorName: doctor.name,
          slotTime: timeStr,
          slotDate: dateStr,
          clinicName: clinic.name,
        });
      }

      // 7. Create recovery event
      await prisma.recoveryEvent.create({
        data: {
          cancelledAppointmentId: appointmentId,
          offeredToPatientIds: offeredPatientIds,
        },
      });

      // 8. Schedule timeout job (10 minutes)
      const recoveryQueue = createRecoveryQueue();
      await recoveryQueue.add(
        "recovery-timeout",
        { appointmentId, doctorId, clinicId, slotStart, slotEnd },
        {
          delay: 10 * 60 * 1000, // 10 minutes
          jobId: `timeout-${appointmentId}`,
        }
      );

      console.log(`   ✅ Offers sent. Timeout set for 10 minutes.`);
    },
    {
      connection: getRedisConnection() as any,
      concurrency: 5,
    }
  );

  worker.on("completed", (job) => {
    console.log(`✅ [Recovery] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ [Recovery] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

// ─── Timeout Handler ────────────────────────────────

export function createTimeoutWorker() {
  const worker = new Worker<RecoveryJobData, any, string>(
    QUEUE_NAME,
    async (job: Job<RecoveryJobData, any, string>) => {
      if (job.name !== "recovery-timeout") return;

      const { appointmentId } = job.data;

      console.log(`\n⏰ [Recovery Timeout] Checking appointment ${appointmentId}`);

      // Check if any waitlist entry was already confirmed for this slot
      const recoveryEvent = await prisma.recoveryEvent.findFirst({
        where: { cancelledAppointmentId: appointmentId },
        orderBy: { createdAt: "desc" },
      });

      if (recoveryEvent?.filledByPatientId) {
        console.log("   ✅ Slot already filled. Skipping timeout.");
        return;
      }

      // Reset all OFFERED entries back to WAITING
      if (recoveryEvent) {
        await prisma.waitlistEntry.updateMany({
          where: {
            patientId: { in: recoveryEvent.offeredToPatientIds },
            status: "OFFERED",
          },
          data: { status: "WAITING", offeredAt: null },
        });
      }

      console.log("   ⚠️ No response. All offers reset to WAITING.");
    },
    {
      connection: getRedisConnection() as any,
      concurrency: 5,
    }
  );

  return worker;
}
