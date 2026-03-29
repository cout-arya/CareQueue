const API_BASE = "/api";

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "API error");
  }
  return res.json();
}

// ── Dashboard ──
export function getDashboard(clinicId: string, date?: string) {
  const q = date ? `?date=${date}` : "";
  return fetcher<DashboardResponse>(`/clinics/${clinicId}/dashboard${q}`);
}

// ── Appointments ──
export function getAppointments(clinicId: string, date?: string) {
  const q = date ? `?date=${date}` : "";
  return fetcher<Appointment[]>(`/clinics/${clinicId}/appointments${q}`);
}

export function createAppointment(clinicId: string, data: CreateAppointmentInput) {
  return fetcher<Appointment>(`/clinics/${clinicId}/appointments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function cancelAppointment(clinicId: string, apptId: string, reason?: string) {
  return fetcher<{ message: string }>(`/clinics/${clinicId}/appointments/${apptId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function updateAppointmentStatus(clinicId: string, apptId: string, status: string) {
  return fetcher<Appointment>(`/clinics/${clinicId}/appointments/${apptId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ── Waitlist ──
export function getWaitlist(clinicId: string) {
  return fetcher<WaitlistResponse>(`/clinics/${clinicId}/waitlist`);
}

export function joinWaitlist(clinicId: string, data: JoinWaitlistInput) {
  return fetcher<WaitlistEntry>(`/clinics/${clinicId}/waitlist`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function removeFromWaitlist(clinicId: string, entryId: string) {
  return fetcher<{ message: string }>(`/clinics/${clinicId}/waitlist/${entryId}`, {
    method: "DELETE",
  });
}

// ── Reports ──
export function getRecoveryReport(clinicId: string, month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.set("month", String(month));
  if (year) params.set("year", String(year));
  const q = params.toString() ? `?${params}` : "";
  return fetcher<RecoveryReport>(`/clinics/${clinicId}/reports/recovery${q}`);
}

// ── Patients ──
export function getPatients(clinicId: string, search?: string) {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return fetcher<PatientListItem[]>(`/clinics/${clinicId}/patients${q}`);
}

export function getPatient(clinicId: string, patientId: string) {
  return fetcher<PatientDetail>(`/clinics/${clinicId}/patients/${patientId}`);
}

export function createPatient(clinicId: string, data: CreatePatientInput) {
  return fetcher<PatientDetail>(`/clinics/${clinicId}/patients`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePatient(clinicId: string, patientId: string, data: Partial<CreatePatientInput>) {
  return fetcher<PatientDetail>(`/clinics/${clinicId}/patients/${patientId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Doctors ──
export function getDoctors(clinicId: string) {
  return fetcher<DoctorItem[]>(`/clinics/${clinicId}/doctors`);
}

// ── Activity ──
export function getActivity(clinicId: string, limit?: number) {
  const q = limit ? `?limit=${limit}` : "";
  return fetcher<ActivityItem[]>(`/clinics/${clinicId}/activity${q}`);
}

// ── Health ──
export function getHealth() {
  return fetcher<{ status: string }>("/health");
}

// ── Types ──
export interface DashboardResponse {
  date: string;
  stats: {
    total: number;
    scheduled: number;
    confirmed: number;
    cancelled: number;
    noShows: number;
    completed: number;
    waitlistActive: number;
    slotsRecovered: number;
    avgRecoveryTimeSec: number;
  };
  appointments: Appointment[];
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  clinicId: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "NO_SHOW" | "COMPLETED";
  appointmentType: "ROUTINE" | "FOLLOW_UP" | "URGENT" | "PROCEDURE";
  doctor: { name: string; specialty?: string };
  patient: { name: string; phone: string };
}

export interface CreateAppointmentInput {
  doctorId: string;
  patientId: string;
  startTime: string;
  endTime: string;
  appointmentType?: string;
}

export interface WaitlistEntry {
  id: string;
  patientId: string;
  clinicId: string;
  doctorId: string | null;
  urgency: "ROUTINE" | "FOLLOW_UP" | "URGENT";
  status: "WAITING" | "OFFERED" | "CONFIRMED" | "EXPIRED" | "REMOVED";
  rankScore: number;
  joinedAt: string;
  patient: { name: string; phone: string; reliabilityScore: number };
  doctor?: { name: string; specialty?: string } | null;
}

export interface WaitlistResponse {
  clinicId: string;
  total: number;
  entries: WaitlistEntry[];
}

export interface JoinWaitlistInput {
  patientId: string;
  doctorId?: string;
  specialty?: string;
  urgency?: string;
}

export interface RecoveryReport {
  period: string;
  summary: {
    totalSlotsCancelled: number;
    slotsFilled: number;
    fillRate: string;
    totalRevenueRecovered: string;
    avgRecoveryTimeSec: number;
    avgRecoveryTimeFormatted: string;
  };
  byDoctor: { doctorName: string; cancelled: number; filled: number; revenue: number }[];
  events: unknown[];
}

export interface PatientListItem {
  id: string;
  name: string;
  phone: string;
  lat: number | null;
  lng: number | null;
  reliabilityScore: number;
  totalAppointments: number;
  activeWaitlist: number;
  lastVisit: string | null;
  createdAt: string;
}

export interface PatientDetail {
  id: string;
  name: string;
  phone: string;
  lat: number | null;
  lng: number | null;
  reliabilityScore: number;
  clinicId: string;
  createdAt: string;
  appointments: Array<{
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    appointmentType: string;
    doctor: { name: string; specialty: string };
  }>;
  waitlistEntries: Array<{
    id: string;
    urgency: string;
    status: string;
    doctor?: { name: string } | null;
  }>;
}

export interface CreatePatientInput {
  name: string;
  phone: string;
  lat?: number;
  lng?: number;
}

export interface DoctorItem {
  id: string;
  name: string;
  specialty: string;
  slotDuration: number;
  workingHours: any;
}

export interface ActivityItem {
  id: string;
  icon: string;
  message: string;
  action: string;
  actorId: string;
  metadata: Record<string, any>;
  createdAt: string;
}
