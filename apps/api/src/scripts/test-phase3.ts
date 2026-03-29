import "dotenv/config";
import { prisma } from "@carequeue/db";
import { createReminderQueue } from "@carequeue/queue";
import { fetchOrsDistanceKm } from "@carequeue/scoring";

async function run() {
  console.log("=== Testing CareQueue Phase 3 Features ===\n");

  // 1. Test OpenRouteService Mapping Integration
  console.log("📍 Testing OpenRouteService Distance Matrix API...");
  // Using coordinates for a relatively short distance routing (e.g., within a city)
  const dist = await fetchOrsDistanceKm(77.2090, 28.6139, 77.0266, 28.4595);
  if (dist) {
    console.log(`✅ Success! OpenRouteService computed distance: ${dist.toFixed(2)} km`);
  } else {
    console.log(`⚠️ OpenRouteService failed or API key missing. (App will safely fallback to local Haversine formula).`);
  }

  // 2. Test Reminder Queue (WhatsApp -> SMS fallback)
  console.log("\n⏰ Testing Reminder Job Queue & SMS Fallback...");

  const clinic = await prisma.clinic.findFirst();
  const patient = await prisma.patient.findFirst();
  const doctor = await prisma.doctor.findFirst();

  if (!clinic || !patient || !doctor) {
    console.log("❌ Missing seed data. Run 'pnpm db:seed' first.");
    process.exit(1);
  }

  // Create a temporary appointment
  const startTime = new Date(Date.now() + 2 * 60 * 60 * 1000 + 60000);
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      clinicId: clinic.id,
      startTime,
      endTime: new Date(startTime.getTime() + 30 * 60000),
      status: "SCHEDULED"
    }
  });

  console.log(`Created test appointment: ${appointment.id}`);

  const queue = createReminderQueue();
  console.log("Directly enqueueing a T_2H reminder job with a 1-second delay...");

  await queue.add(
    "reminder-2h",
    { appointmentId: appointment.id, type: "T_2H" },
    { delay: 1000, jobId: `test-rem-2h-${appointment.id}` }
  );

  console.log("Job added! Waiting a few seconds for BullMQ worker to process and trigger WhatsApp/SMS...");

  // Clean up after 5 seconds so we don't pollute the DB
  setTimeout(async () => {
    await prisma.appointment.delete({ where: { id: appointment.id } });
    console.log("\nCleaned up test appointment. Exiting.\n");
    console.log("If you saw the BullMQ queue logs in the API server terminal, it was successful!");
    process.exit(0);
  }, 5000);
}

run();
