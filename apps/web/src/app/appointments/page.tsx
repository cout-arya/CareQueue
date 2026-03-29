"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAppointments,
  cancelAppointment,
  updateAppointmentStatus,
  createAppointment,
  getPatients,
  getDoctors,
  type Appointment,
  type PatientListItem,
  type DoctorItem,
} from "@/lib/api";
import { formatTime, formatDate, getStatusColor, cn } from "@/lib/utils";
import {
  CalendarDays,
  AlertTriangle,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Search,
  CheckCircle,
} from "lucide-react";

const CLINIC_ID_KEY = "carequeue_clinic_id";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [clinicId, setClinicId] = useState("");
  const [showBookModal, setShowBookModal] = useState(false);
  const [toast, setToast] = useState("");

  const fetchData = useCallback(
    async (cId: string, d: string) => {
      try {
        setLoading(true);
        const data = await getAppointments(cId, d);
        setAppointments(data);
        setError("");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const cId = localStorage.getItem(CLINIC_ID_KEY) || "";
    if (cId) {
      setClinicId(cId);
      fetchData(cId, date);
    } else {
      setLoading(false);
      setError("No Clinic ID set. Go to Dashboard first.");
    }
  }, [date, fetchData]);

  const changeDate = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().split("T")[0]);
  };

  const handleCancel = async (apptId: string) => {
    if (!confirm("Cancel this appointment? Recovery will be triggered automatically.")) return;
    try {
      await cancelAppointment(clinicId, apptId);
      setToast("Appointment cancelled. Recovery triggered!");
      setTimeout(() => setToast(""), 3000);
      await fetchData(clinicId, date);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatus = async (apptId: string, status: string) => {
    try {
      await updateAppointmentStatus(clinicId, apptId, status);
      setToast(`Appointment marked as ${status.toLowerCase()}`);
      setTimeout(() => setToast(""), 3000);
      await fetchData(clinicId, date);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 card bg-primary text-white flex items-center gap-2 shadow-lg animate-in slide-in-from-right">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Appointments
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Manage and track patient visits
          </p>
        </div>
        <button
          onClick={() => setShowBookModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Appointment
        </button>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center gap-3">
        <button onClick={() => changeDate(-1)} className="btn-secondary p-2">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="card-flat px-4 py-2 text-sm font-medium text-on-surface">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent outline-none cursor-pointer"
          />
        </div>
        <button onClick={() => changeDate(1)} className="btn-secondary p-2">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setDate(new Date().toISOString().split("T")[0])}
          className="btn-secondary text-xs"
        >
          Today
        </button>
        <div className="flex-1" />
        <button
          onClick={() => fetchData(clinicId, date)}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="card bg-error-container/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-error" />
          <p className="text-sm text-on-error-container">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && appointments.length === 0 && !error && (
        <div className="card text-center py-16">
          <CalendarDays className="w-12 h-12 text-outline mx-auto mb-3" />
          <h3 className="font-headline text-lg font-bold text-on-surface">
            No appointments
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            No appointments found for {formatDate(date + "T00:00:00")}
          </p>
          <button
            onClick={() => setShowBookModal(true)}
            className="btn-primary mt-4"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Book First Appointment
          </button>
        </div>
      )}

      {/* Appointments Table */}
      {!loading && appointments.length > 0 && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Time</th>
                <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Patient</th>
                <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Doctor</th>
                <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-on-surface-variant px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr
                  key={appt.id}
                  className="border-t border-outline-variant/10 hover:bg-surface-container-low/50 transition"
                >
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-on-surface">{formatTime(appt.startTime)}</p>
                    <p className="text-[11px] text-outline">to {formatTime(appt.endTime)}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-on-surface">{appt.patient.name}</p>
                    <p className="text-[11px] text-on-surface-variant">{appt.patient.phone}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-on-surface">{appt.doctor.name}</td>
                  <td className="px-5 py-3">
                    <span className="badge-routine">{appt.appointmentType.replace("_", " ")}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={getStatusColor(appt.status)}>{appt.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {appt.status === "SCHEDULED" && (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleStatus(appt.id, "CONFIRMED")}
                          className="text-[11px] px-2.5 py-1 rounded bg-primary-fixed text-primary-dark hover:bg-primary-fixed-dim transition font-medium"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleCancel(appt.id)}
                          className="text-[11px] px-2.5 py-1 rounded bg-error-container text-on-error-container hover:bg-error/20 transition font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {appt.status === "CONFIRMED" && (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleStatus(appt.id, "COMPLETED")}
                          className="text-[11px] px-2.5 py-1 rounded bg-primary-fixed text-primary-dark hover:bg-primary-fixed-dim transition font-medium"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleCancel(appt.id)}
                          className="text-[11px] px-2.5 py-1 rounded bg-error-container text-on-error-container hover:bg-error/20 transition font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Modal */}
      {showBookModal && (
        <BookingModal
          clinicId={clinicId}
          defaultDate={date}
          onClose={() => setShowBookModal(false)}
          onBooked={() => {
            setShowBookModal(false);
            setToast("Appointment booked! Reminders scheduled automatically 📱");
            setTimeout(() => setToast(""), 4000);
            fetchData(clinicId, date);
          }}
        />
      )}
    </div>
  );
}

// ── Booking Modal ──
function BookingModal({
  clinicId,
  defaultDate,
  onClose,
  onBooked,
}: {
  clinicId: string;
  defaultDate: string;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [apptDate, setApptDate] = useState(defaultDate);
  const [apptTime, setApptTime] = useState("10:00");
  const [apptType, setApptType] = useState("ROUTINE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  useEffect(() => {
    getDoctors(clinicId).then(setDoctors).catch(console.error);
  }, [clinicId]);

  useEffect(() => {
    if (patientSearch.length >= 2) {
      getPatients(clinicId, patientSearch).then(setPatients).catch(console.error);
      setShowPatientDropdown(true);
    } else {
      setShowPatientDropdown(false);
    }
  }, [patientSearch, clinicId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient) {
      setError("Please select a patient");
      return;
    }
    if (!selectedDoctor) {
      setError("Please select a doctor");
      return;
    }

    setLoading(true);
    setError("");

    const doctor = doctors.find((d) => d.id === selectedDoctor);
    const duration = doctor?.slotDuration || 30;
    const startTime = new Date(`${apptDate}T${apptTime}:00`);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    try {
      await createAppointment(clinicId, {
        patientId: selectedPatient.id,
        doctorId: selectedDoctor,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        appointmentType: apptType,
      });
      onBooked();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="card w-full max-w-lg mx-4 relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-surface-container-high transition"
        >
          <X className="w-4 h-4 text-on-surface-variant" />
        </button>

        <h2 className="font-headline text-lg font-bold text-on-surface mb-1">
          Book New Appointment
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Schedule a patient visit — reminders will be sent automatically
        </p>

        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm mb-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-on-surface mb-1">
              Patient *
            </label>
            {selectedPatient ? (
              <div className="input-field flex items-center justify-between">
                <span>
                  {selectedPatient.name} ({selectedPatient.phone})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatient(null);
                    setPatientSearch("");
                  }}
                  className="text-error hover:text-error/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Search patient by name or phone..."
                  />
                </div>
                {showPatientDropdown && patients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-surface-container-lowest rounded-clinical shadow-lg border border-outline-variant/20 max-h-40 overflow-y-auto">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(p);
                          setShowPatientDropdown(false);
                          setPatientSearch("");
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container-low transition"
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-on-surface-variant ml-2">{p.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Doctor */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Doctor *</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select a doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialty} ({d.slotDuration}min slots)
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Date *</label>
              <input
                type="date"
                value={apptDate}
                onChange={(e) => setApptDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Time *</label>
              <input
                type="time"
                value={apptTime}
                onChange={(e) => setApptTime(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Appointment Type</label>
            <div className="flex gap-2">
              {["ROUTINE", "FOLLOW_UP", "URGENT", "PROCEDURE"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setApptType(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition",
                    apptType === t
                      ? "bg-primary text-white"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                  )}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Booking..." : "Book Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
