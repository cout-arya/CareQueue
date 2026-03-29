import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Clinic ──
  const clinic = await prisma.clinic.create({
    data: {
      name: "SmileCare Dental Clinic",
      address: "42 MG Road, Indiranagar",
      phone: "+919876543210",
      city: "Bangalore",
      lat: 12.9716,
      lng: 77.5946,
    },
  });
  console.log(`✅ Clinic: ${clinic.name} (${clinic.id})`);

  // ── Doctors ──
  const drSharma = await prisma.doctor.create({
    data: {
      name: "Dr. Priya Sharma",
      specialty: "General Dentistry",
      clinicId: clinic.id,
      slotDuration: 30,
      workingHours: {
        mon: { start: "09:00", end: "17:00" },
        tue: { start: "09:00", end: "17:00" },
        wed: { start: "09:00", end: "17:00" },
        thu: { start: "09:00", end: "17:00" },
        fri: { start: "09:00", end: "14:00" },
      },
    },
  });

  const drPatel = await prisma.doctor.create({
    data: {
      name: "Dr. Rohit Patel",
      specialty: "Orthodontics",
      clinicId: clinic.id,
      slotDuration: 45,
      workingHours: {
        mon: { start: "10:00", end: "18:00" },
        tue: { start: "10:00", end: "18:00" },
        wed: { start: "10:00", end: "18:00" },
        thu: { start: "10:00", end: "18:00" },
        fri: { start: "10:00", end: "16:00" },
      },
    },
  });
  console.log(`✅ Doctors: ${drSharma.name}, ${drPatel.name}`);

  // ── Patients ──
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        name: "Ananya Gupta",
        phone: "+919111111111",
        clinicId: clinic.id,
        lat: 12.9352,
        lng: 77.6245,
        reliabilityScore: 95,
      },
    }),
    prisma.patient.create({
      data: {
        name: "Vikram Reddy",
        phone: "+919222222222",
        clinicId: clinic.id,
        lat: 12.9698,
        lng: 77.7500,
        reliabilityScore: 70,
      },
    }),
    prisma.patient.create({
      data: {
        name: "Meera Iyer",
        phone: "+919333333333",
        clinicId: clinic.id,
        lat: 12.9850,
        lng: 77.5533,
        reliabilityScore: 85,
      },
    }),
    prisma.patient.create({
      data: {
        name: "Arjun Nair",
        phone: "+919444444444",
        clinicId: clinic.id,
        lat: 13.0200,
        lng: 77.5900,
        reliabilityScore: 60,
      },
    }),
    prisma.patient.create({
      data: {
        name: "Kavya Menon",
        phone: "+919555555555",
        clinicId: clinic.id,
        lat: 12.9100,
        lng: 77.6400,
        reliabilityScore: 90,
      },
    }),
  ]);
  console.log(`✅ Patients: ${patients.map((p) => p.name).join(", ")}`);

  // ── Appointments (today + tomorrow) ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  function slotTime(baseDate: Date, hours: number, minutes: number): Date {
    const d = new Date(baseDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        doctorId: drSharma.id,
        patientId: patients[0].id,
        clinicId: clinic.id,
        startTime: slotTime(today, 10, 0),
        endTime: slotTime(today, 10, 30),
        status: "SCHEDULED",
        appointmentType: "ROUTINE",
      },
    }),
    prisma.appointment.create({
      data: {
        doctorId: drSharma.id,
        patientId: patients[1].id,
        clinicId: clinic.id,
        startTime: slotTime(today, 11, 0),
        endTime: slotTime(today, 11, 30),
        status: "CONFIRMED",
        appointmentType: "FOLLOW_UP",
      },
    }),
    prisma.appointment.create({
      data: {
        doctorId: drPatel.id,
        patientId: patients[2].id,
        clinicId: clinic.id,
        startTime: slotTime(tomorrow, 10, 0),
        endTime: slotTime(tomorrow, 10, 45),
        status: "SCHEDULED",
        appointmentType: "PROCEDURE",
      },
    }),
  ]);
  console.log(`✅ Appointments: ${appointments.length} created`);

  // ── Waitlist Entries ──
  await Promise.all([
    prisma.waitlistEntry.create({
      data: {
        patientId: patients[2].id,
        clinicId: clinic.id,
        doctorId: drSharma.id,
        urgency: "URGENT",
        status: "WAITING",
      },
    }),
    prisma.waitlistEntry.create({
      data: {
        patientId: patients[3].id,
        clinicId: clinic.id,
        specialty: "General Dentistry",
        urgency: "FOLLOW_UP",
        status: "WAITING",
      },
    }),
    prisma.waitlistEntry.create({
      data: {
        patientId: patients[4].id,
        clinicId: clinic.id,
        urgency: "ROUTINE",
        status: "WAITING",
      },
    }),
  ]);
  console.log(`✅ Waitlist: 3 entries created`);

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
