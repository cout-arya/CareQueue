import { FastifyInstance } from "fastify";
import { prisma } from "@carequeue/db";
import { claimSlot } from "../services/slot-claim.js";
import type { WhatsAppWebhookPayload } from "@carequeue/whatsapp";

export async function webhookRoutes(app: FastifyInstance) {
  // ── Webhook Handler (POST) ──
  // Receives incoming WhatsApp messages from Twilio
  app.post("/webhook", async (request, reply) => {
    // Acknowledge immediately based on Twilio expectations (200 OK)
    reply.status(200).send("OK");

    try {
      // Twilio sends application/x-www-form-urlencoded
      const body = request.body as Record<string, any>;
      
      const from = body.From;
      const textBody = body.Body;

      if (!from || !textBody) {
        return; // non-message event (e.g. status)
      }

      // Format: "whatsapp:+919111111111" => "+919111111111"
      const phone = from.replace("whatsapp:", "").trim();
      const text = textBody.trim().toUpperCase();

      console.log(`\n📩 [Twilio WhatsApp] From: ${phone}, Text: "${text}"`);

      if (text === "YES") {
        await handleYesReply(phone);
      } else if (text === "CONFIRM") {
        await handleConfirmReply(phone);
      } else if (text === "CANCEL") {
        await handleCancelReply(phone);
      } else {
        console.log(`   ℹ️ Ignoring non-command message: "${text}"`);
      }
    } catch (err) {
      console.error("❌ Webhook processing error:", err);
    }
  });

  // ── Simulated Webhook (for development/testing) ──
  app.post("/webhook/simulate", async (request, reply) => {
    const { phone, text } = request.body as {
      phone: string;
      text: string;
    };

    console.log(`\n🧪 [Simulated] From: ${phone}, Text: "${text}"`);

    const normalizedText = text.trim().toUpperCase();

    if (normalizedText === "YES") {
      const result = await handleYesReply(phone);
      return reply.send(result);
    } else if (normalizedText === "CONFIRM") {
      const result = await handleConfirmReply(phone);
      return reply.send(result);
    } else if (normalizedText === "CANCEL") {
      const result = await handleCancelReply(phone);
      return reply.send(result);
    }

    return reply.send({ message: "No action taken" });
  });
}

// ─── Handlers ───────────────────────────────────────

async function handleYesReply(phone: string) {
  // Find the patient by phone
  // Phone format from WhatsApp: "919111111111" (no +)
  const normalizedPhone = phone.startsWith("+") ? phone : `+${phone}`;

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [{ phone: normalizedPhone }, { phone }],
    },
  });

  if (!patient) {
    console.log(`   ⚠️ Patient not found for phone: ${phone}`);
    return { success: false, message: "Patient not found" };
  }

  // Find OFFERED waitlist entry
  const entry = await prisma.waitlistEntry.findFirst({
    where: {
      patientId: patient.id,
      status: "OFFERED",
    },
    orderBy: { offeredAt: "desc" },
  });

  if (!entry) {
    console.log(`   ⚠️ No active offer for patient: ${patient.name}`);
    return { success: false, message: "No active offer" };
  }

  // Claim the slot
  const result = await claimSlot(entry.id, patient.id);
  console.log(`   ${result.success ? "✅" : "❌"} ${result.message}`);
  return result;
}

async function handleConfirmReply(phone: string) {
  const normalizedPhone = phone.startsWith("+") ? phone : `+${phone}`;

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [{ phone: normalizedPhone }, { phone }],
    },
  });

  if (!patient) {
    return { success: false, message: "Patient not found" };
  }

  // Find upcoming SCHEDULED appointment
  const appointment = await prisma.appointment.findFirst({
    where: {
      patientId: patient.id,
      status: "SCHEDULED",
      startTime: { gt: new Date() },
    },
    orderBy: { startTime: "asc" },
  });

  if (!appointment) {
    return { success: false, message: "No upcoming appointment found" };
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CONFIRMED" },
  });

  console.log(`   ✅ Appointment ${appointment.id} confirmed by ${patient.name}`);
  return { success: true, message: "Appointment confirmed" };
}

async function handleCancelReply(phone: string) {
  const normalizedPhone = phone.startsWith("+") ? phone : `+${phone}`;

  const patient = await prisma.patient.findFirst({
    where: {
      OR: [{ phone: normalizedPhone }, { phone }],
    },
  });

  if (!patient) {
    return { success: false, message: "Patient not found" };
  }

  // Find upcoming appointment
  const appointment = await prisma.appointment.findFirst({
    where: {
      patientId: patient.id,
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      startTime: { gt: new Date() },
    },
    orderBy: { startTime: "asc" },
  });

  if (!appointment) {
    return { success: false, message: "No upcoming appointment found" };
  }

  // Import queue to trigger recovery
  const { createRecoveryQueue, cancelReminders } = await import(
    "@carequeue/queue"
  );

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELLED" },
  });

  await cancelReminders(appointment.id);

  const recoveryQueue = createRecoveryQueue();
  await recoveryQueue.add("recovery", {
    appointmentId: appointment.id,
    doctorId: appointment.doctorId,
    clinicId: appointment.clinicId,
    slotStart: appointment.startTime.toISOString(),
    slotEnd: appointment.endTime.toISOString(),
  });

  console.log(
    `   🚫 Appointment ${appointment.id} cancelled by ${patient.name} via WhatsApp. Recovery triggered.`
  );
  return { success: true, message: "Appointment cancelled. Recovery initiated." };
}
