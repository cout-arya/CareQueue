"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Building2,
  UserPlus,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Stethoscope,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface ClinicData {
  name: string;
  address: string;
  city: string;
  phone: string;
  lat: string;
  lng: string;
}

interface DoctorData {
  name: string;
  specialty: string;
  slotDuration: string;
  workStart: string;
  workEnd: string;
}

const STEPS = [
  { id: 1, label: "Clinic Details", icon: Building2 },
  { id: 2, label: "First Doctor", icon: UserPlus },
  { id: 3, label: "All Set!", icon: CheckCircle },
];

const SPECIALTIES = [
  "General Medicine",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "Cardiology",
  "ENT",
  "Ophthalmology",
  "Gynecology",
  "Dental",
  "Psychiatry",
  "Other",
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdClinicName, setCreatedClinicName] = useState("");
  const router = useRouter();

  const [clinic, setClinic] = useState<ClinicData>({
    name: "",
    address: "",
    city: "",
    phone: "",
    lat: "",
    lng: "",
  });

  const [doctor, setDoctor] = useState<DoctorData>({
    name: "",
    specialty: "General Medicine",
    slotDuration: "30",
    workStart: "09:00",
    workEnd: "17:00",
  });

  function updateClinic(field: keyof ClinicData, value: string) {
    setClinic((prev) => ({ ...prev, [field]: value }));
  }

  function updateDoctor(field: keyof DoctorData, value: string) {
    setDoctor((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreateClinic() {
    setLoading(true);
    setError("");

    try {
      const body = {
        clinic: {
          name: clinic.name,
          address: clinic.address,
          city: clinic.city,
          phone: clinic.phone.startsWith("+") ? clinic.phone : `+91${clinic.phone.replace(/\D/g, "")}`,
          lat: clinic.lat ? parseFloat(clinic.lat) : null,
          lng: clinic.lng ? parseFloat(clinic.lng) : null,
        },
        doctor: {
          name: doctor.name,
          specialty: doctor.specialty,
          slotDuration: parseInt(doctor.slotDuration, 10),
          workingHours: {
            mon: { start: doctor.workStart, end: doctor.workEnd },
            tue: { start: doctor.workStart, end: doctor.workEnd },
            wed: { start: doctor.workStart, end: doctor.workEnd },
            thu: { start: doctor.workStart, end: doctor.workEnd },
            fri: { start: doctor.workStart, end: doctor.workEnd },
            sat: { start: doctor.workStart, end: doctor.workEnd },
          },
        },
      };

      const res = await fetch("/api/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create clinic");
      }

      const data = await res.json();
      // Store the clinic ID for all future API calls
      localStorage.setItem("carequeue_clinic_id", data.id);
      setCreatedClinicName(data.name);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (step === 1) {
      if (!clinic.name || !clinic.address || !clinic.city || !clinic.phone) {
        setError("Please fill in all required fields");
        return;
      }
      setError("");
      setStep(2);
    } else if (step === 2) {
      if (!doctor.name || !doctor.specialty) {
        setError("Please fill in the doctor's name and specialty");
        return;
      }
      handleCreateClinic();
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top bar */}
      <div className="border-b border-outline-variant/20 bg-white/60 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-headline text-lg font-bold text-on-surface">
              CareQueue
            </span>
          </Link>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step >= s.id
                      ? "bg-primary text-white shadow-md"
                      : "bg-surface-container-high text-outline"
                  }`}
                >
                  {step > s.id ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    s.id
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-8 h-0.5 rounded-full transition-all duration-300 ${
                      step > s.id ? "bg-primary" : "bg-surface-container-high"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-xl">
          {error && (
            <div className="bg-error-container text-on-error-container p-3.5 rounded-xl text-sm mb-6 flex items-start gap-2.5 animate-fade-up">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* ── Step 1: Clinic Details ── */}
          {step === 1 && (
            <div className="animate-fade-up">
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <h1 className="font-headline text-2xl font-bold text-on-surface">
                  Set up your clinic
                </h1>
                <p className="text-sm text-on-surface-variant mt-1.5">
                  Tell us about your clinic so we can personalize your experience
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">
                    Clinic Name *
                  </label>
                  <input
                    id="clinic-name"
                    type="text"
                    value={clinic.name}
                    onChange={(e) => updateClinic("name", e.target.value)}
                    className="auth-input"
                    placeholder="Sunrise Family Clinic"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">
                    Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline/50" />
                    <input
                      id="clinic-address"
                      type="text"
                      value={clinic.address}
                      onChange={(e) => updateClinic("address", e.target.value)}
                      className="auth-input !pl-10"
                      placeholder="123 Main Street, Suite 4"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">
                      City *
                    </label>
                    <input
                      id="clinic-city"
                      type="text"
                      value={clinic.city}
                      onChange={(e) => updateClinic("city", e.target.value)}
                      className="auth-input"
                      placeholder="Mumbai"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">
                      Phone *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline/50" />
                      <input
                        id="clinic-phone"
                        type="tel"
                        value={clinic.phone}
                        onChange={(e) => updateClinic("phone", e.target.value)}
                        className="auth-input !pl-10"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>
                </div>

                <details className="group">
                  <summary className="text-xs font-medium text-on-surface-variant cursor-pointer hover:text-on-surface transition flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Add GPS Coordinates (optional)
                  </summary>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <input
                      type="text"
                      value={clinic.lat}
                      onChange={(e) => updateClinic("lat", e.target.value)}
                      className="auth-input"
                      placeholder="Latitude (e.g., 19.076)"
                    />
                    <input
                      type="text"
                      value={clinic.lng}
                      onChange={(e) => updateClinic("lng", e.target.value)}
                      className="auth-input"
                      placeholder="Longitude (e.g., 72.877)"
                    />
                  </div>
                </details>
              </div>
            </div>
          )}

          {/* ── Step 2: First Doctor ── */}
          {step === 2 && (
            <div className="animate-fade-up">
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Stethoscope className="w-6 h-6 text-primary" />
                </div>
                <h1 className="font-headline text-2xl font-bold text-on-surface">
                  Add your first doctor
                </h1>
                <p className="text-sm text-on-surface-variant mt-1.5">
                  You can add more doctors later from the Settings page
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">
                    Doctor&apos;s Name *
                  </label>
                  <input
                    id="doctor-name"
                    type="text"
                    value={doctor.name}
                    onChange={(e) => updateDoctor("name", e.target.value)}
                    className="auth-input"
                    placeholder="Dr. Priya Sharma"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">
                    Specialty *
                  </label>
                  <select
                    id="doctor-specialty"
                    value={doctor.specialty}
                    onChange={(e) => updateDoctor("specialty", e.target.value)}
                    className="auth-input appearance-none cursor-pointer"
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">
                      Slot Duration
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline/50" />
                      <select
                        id="doctor-slot-duration"
                        value={doctor.slotDuration}
                        onChange={(e) => updateDoctor("slotDuration", e.target.value)}
                        className="auth-input !pl-10 appearance-none cursor-pointer"
                      >
                        <option value="15">15 min</option>
                        <option value="20">20 min</option>
                        <option value="30">30 min</option>
                        <option value="45">45 min</option>
                        <option value="60">60 min</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">
                      Work Start
                    </label>
                    <input
                      id="doctor-work-start"
                      type="time"
                      value={doctor.workStart}
                      onChange={(e) => updateDoctor("workStart", e.target.value)}
                      className="auth-input cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">
                      Work End
                    </label>
                    <input
                      id="doctor-work-end"
                      type="time"
                      value={doctor.workEnd}
                      onChange={(e) => updateDoctor("workEnd", e.target.value)}
                      className="auth-input cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="text-center animate-fade-up">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary/15 to-primary-light/10 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h1 className="font-headline text-3xl font-bold text-on-surface mb-3">
                You&apos;re all set! 🎉
              </h1>
              <p className="text-on-surface-variant mb-2">
                <strong className="text-on-surface">{createdClinicName}</strong> has been created successfully.
              </p>
              <p className="text-sm text-on-surface-variant mb-10 max-w-sm mx-auto">
                Your clinic dashboard is ready. Start adding patients, booking appointments, and recovering lost slots.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="landing-btn-primary inline-flex items-center gap-2 group"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Navigation buttons */}
          {step < 3 && (
            <div className="flex items-center justify-between mt-10">
              {step > 1 ? (
                <button
                  onClick={() => { setError(""); setStep(step - 1); }}
                  className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={handleNext}
                disabled={loading}
                className="landing-btn-primary flex items-center gap-2 group disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : step === 2 ? (
                  <>
                    Create Clinic
                    <CheckCircle className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
