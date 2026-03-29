import { prisma } from "@carequeue/db";
import { sendSlotOffer, sendConfirmation, sendSlotTaken } from "@carequeue/whatsapp";
import type { RecoveryEvent } from "@carequeue/db";

/**
 * Atomic slot claim: when a patient replies "YES" to a slot offer.
 *
 * 1. Find the recovery event for this slot
 * 2. Create new appointment for the winner
 * 3. Set winner's WaitlistEntry → CONFIRMED
 * 4. Set other offered entries → WAITING (back in queue)
 * 5. Log recovery metrics
 * 6. Send confirmation to winner + "slot taken" to others
 */
export async function claimSlot(
  waitlistEntryId: string,
  patientId: string
): Promise<{ success: boolean; message: string }> {
  // Find the offered waitlist entry
  const entry = await prisma.waitlistEntry.findUnique({
    where: { id: waitlistEntryId },
    include: { patient: true },
  });

  if (!entry || entry.status !== "OFFERED") {
    return { success: false, message: "Offer expired or already claimed" };
  }

  // Find the recovery event that offered this slot
  const recoveryEvent = await prisma.recoveryEvent.findFirst({
    where: {
      offeredToPatientIds: { has: patientId },
      filledByPatientId: null,
    },
    include: {
      appointment: {
        include: { doctor: true, clinic: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!recoveryEvent) {
    return { success: false, message: "Recovery event not found or already filled" };
  }

  const cancelledAppt = recoveryEvent.appointment;
  const recoveryStartTime = recoveryEvent.createdAt;

  // ── Atomic transaction ──
  const result = await prisma.$transaction(async (tx) => {
    // Double-check not already filled (race condition guard)
    const freshEvent = await tx.recoveryEvent.findUnique({
      where: { id: recoveryEvent.id },
    });

    if (freshEvent?.filledByPatientId) {
      throw new Error("SLOT_ALREADY_FILLED");
    }

    // 1. Create new appointment for winner
    const newAppointment = await tx.appointment.create({
      data: {
        doctorId: cancelledAppt.doctorId,
        patientId,
        clinicId: cancelledAppt.clinicId,
        startTime: cancelledAppt.startTime,
        endTime: cancelledAppt.endTime,
        status: "CONFIRMED",
        appointmentType: cancelledAppt.appointmentType,
      },
    });

    // 2. Set winner → CONFIRMED
    await tx.waitlistEntry.update({
      where: { id: waitlistEntryId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    // 3. Set others → WAITING
    const otherPatientIds = recoveryEvent.offeredToPatientIds.filter(
      (id) => id !== patientId
    );

    if (otherPatientIds.length > 0) {
      await tx.waitlistEntry.updateMany({
        where: {
          patientId: { in: otherPatientIds },
          status: "OFFERED",
        },
        data: {
          status: "WAITING",
          offeredAt: null,
        },
      });
    }

    // 4. Update recovery event with metrics
    const recoveryTimeSeconds = Math.round(
      (Date.now() - recoveryStartTime.getTime()) / 1000
    );

    await tx.recoveryEvent.update({
      where: { id: recoveryEvent.id },
      data: {
        filledByPatientId: patientId,
        recoveryTimeSeconds,
        revenueRecovered: 500, // placeholder — can be made dynamic
      },
    });

    // 5. Audit log
    await tx.auditLog.create({
      data: {
        clinicId: cancelledAppt.clinicId,
        actorId: "system",
        action: "SLOT_RECOVERED",
        metadata: {
          appointmentId: newAppointment.id,
          cancelledAppointmentId: cancelledAppt.id,
          patientId,
          recoveryTimeSeconds,
        },
      },
    });

    return { newAppointment, otherPatientIds };
  });

  // ── Post-transaction: send messages ──

  const timeStr = cancelledAppt.startTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  const dateStr = cancelledAppt.startTime.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const mapsLink =
    cancelledAppt.clinic.lat && cancelledAppt.clinic.lng
      ? `https://www.google.com/maps?q=${cancelledAppt.clinic.lat},${cancelledAppt.clinic.lng}`
      : undefined;

  // Send confirmation to winner
  await sendConfirmation({
    to: entry.patient.phone,
    patientName: entry.patient.name,
    doctorName: cancelledAppt.doctor.name,
    slotTime: timeStr,
    slotDate: dateStr,
    clinicName: cancelledAppt.clinic.name,
    clinicAddress: cancelledAppt.clinic.address,
    mapsLink,
  });

  // Send "slot taken" to others
  for (const otherId of result.otherPatientIds) {
    const otherPatient = await prisma.patient.findUnique({
      where: { id: otherId },
    });
    if (otherPatient) {
      await sendSlotTaken({
        to: otherPatient.phone,
        patientName: otherPatient.name,
      });
    }
  }

  return {
    success: true,
    message: `Slot claimed by ${entry.patient.name}. Appointment ${result.newAppointment.id} created.`,
  };
}
