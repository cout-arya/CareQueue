"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getDashboard,
  getWaitlist,
  getActivity,
  cancelAppointment,
  updateAppointmentStatus,
  type DashboardResponse,
  type WaitlistEntry,
  type ActivityItem,
} from "@/lib/api";
import { formatTime, getStatusColor, getUrgencyBadge, cn } from "@/lib/utils";
import {
  Activity,
  Clock,
  Users,
  Zap,
  CalendarCheck,
  CalendarX,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";

const CLINIC_ID_KEY = "carequeue_clinic_id";

function getClinicId(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem(CLINIC_ID_KEY) || "";
  }
  return "";
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [clinicId, setClinicId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async (cId: string) => {
    try {
      setLoading(true);
      const [dash, wl, act] = await Promise.all([
        getDashboard(cId),
        getWaitlist(cId),
        getActivity(cId, 20),
      ]);
      setDashboard(dash);
      setWaitlist(wl.entries);
      setActivities(act);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      let cId = getClinicId();
      if (!cId) {
        try {
          const res = await fetch("/api/clinics/discover");
          if (res.ok) {
            const clinic = await res.json();
            cId = clinic.id;
            localStorage.setItem(CLINIC_ID_KEY, cId);
          }
        } catch {
          // API might not be running
        }
      }
      if (cId) {
        setClinicId(cId);
        fetchData(cId);
      } else {
        setLoading(false);
        setError(
          "Could not connect to backend. Make sure the API is running on port 3001."
        );
      }
    }
    init();
  }, [fetchData]);

  const handleCancel = async (apptId: string) => {
    if (!confirm("Cancel this appointment? Recovery will be triggered.")) return;
    try {
      await cancelAppointment(clinicId, apptId);
      await fetchData(clinicId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (apptId: string, status: string) => {
    try {
      await updateAppointmentStatus(clinicId, apptId, status);
      await fetchData(clinicId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-on-surface-variant">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="card text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-error mx-auto mb-3" />
          <h2 className="font-headline text-lg font-bold mb-1">Connection Error</h2>
          <p className="text-sm text-on-surface-variant">{error}</p>
          <button
            onClick={() => {
              localStorage.removeItem(CLINIC_ID_KEY);
              window.location.reload();
            }}
            className="btn-primary mt-4"
          >
            Reset Clinic ID
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const { stats, appointments } = dashboard;

  // Group appointments by doctor
  const byDoctor: Record<string, typeof appointments> = {};
  for (const appt of appointments) {
    const docName = appt.doctor.name;
    if (!byDoctor[docName]) byDoctor[docName] = [];
    byDoctor[docName].push(appt);
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Dashboard
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => fetchData(clinicId)}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} label="Total Appointments" value={stats.total} color="primary" />
        <StatCard icon={Zap} label="Slots Recovered" value={stats.slotsRecovered} subtitle={`of ${stats.cancelled} cancelled`} color="tertiary" />
        <StatCard icon={Clock} label="Avg Recovery Time" value={stats.avgRecoveryTimeSec > 0 ? `${Math.round(stats.avgRecoveryTimeSec / 60)}m` : "—"} color="secondary" />
        <StatCard icon={Users} label="Active Waitlist" value={stats.waitlistActive} color="primary" />
      </div>

      {/* Three-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Left: Appointment Timeline (3/7) */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Today&apos;s Appointments
          </h2>

          {Object.keys(byDoctor).length === 0 && (
            <div className="card text-center py-10">
              <CalendarX className="w-10 h-10 text-outline mx-auto mb-3" />
              <p className="text-on-surface-variant text-sm">
                No appointments scheduled for today
              </p>
            </div>
          )}

          {Object.entries(byDoctor).map(([docName, appts]) => (
            <div key={docName} className="space-y-3">
              <h3 className="text-sm font-semibold text-on-surface-variant flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {docName}
              </h3>
              <div className="space-y-2">
                {appts.map((appt) => (
                  <div key={appt.id} className="card flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="text-right w-20">
                        <p className="text-sm font-semibold text-on-surface">{formatTime(appt.startTime)}</p>
                        <p className="text-[11px] text-outline">{formatTime(appt.endTime)}</p>
                      </div>
                      <div className="w-px h-10 bg-outline-variant/30" />
                      <div>
                        <p className="text-sm font-medium text-on-surface">{appt.patient.name}</p>
                        <p className="text-[11px] text-on-surface-variant">
                          {appt.appointmentType.replace("_", " ")} · {appt.patient.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={getStatusColor(appt.status)}>{appt.status.replace("_", " ")}</span>
                      {appt.status !== "CANCELLED" && appt.status !== "COMPLETED" && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {appt.status === "SCHEDULED" && (
                            <button
                              onClick={() => handleStatusChange(appt.id, "CONFIRMED")}
                              className="text-[11px] px-2 py-1 rounded bg-primary-fixed text-primary-dark hover:bg-primary-fixed-dim transition"
                            >
                              Confirm
                            </button>
                          )}
                          <button
                            onClick={() => handleCancel(appt.id)}
                            className="text-[11px] px-2 py-1 rounded bg-error-container text-on-error-container hover:bg-error/20 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Middle: Live Waitlist (2/7) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-lg font-bold text-on-surface">Live Waitlist</h2>
            <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full">
              {waitlist.length} patients
            </span>
          </div>
          <div className="space-y-3">
            {waitlist.length === 0 && (
              <div className="card-flat text-center py-10">
                <Users className="w-8 h-8 text-outline mx-auto mb-2" />
                <p className="text-sm text-on-surface-variant">Waitlist is empty</p>
              </div>
            )}
            {waitlist.map((entry, idx) => (
              <div key={entry.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-on-surface">{entry.patient.name}</p>
                    <p className="text-[11px] text-on-surface-variant">{entry.doctor?.name || "Any doctor"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={getUrgencyBadge(entry.urgency)}>{entry.urgency.replace("_", " ")}</span>
                  <span className="text-xs font-bold text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-full">
                    {Math.round(entry.rankScore)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Activity Feed (2/7) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline text-lg font-bold text-on-surface">Activity Feed</h2>
            <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full">
              Live
            </span>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {activities.length === 0 && (
              <div className="card-flat text-center py-10">
                <Activity className="w-8 h-8 text-outline mx-auto mb-2" />
                <p className="text-sm text-on-surface-variant">No recent activity</p>
              </div>
            )}
            {activities.map((item) => (
              <div key={item.id} className="card-flat flex items-start gap-3 py-3 px-4">
                <span className="text-lg shrink-0">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-on-surface leading-tight">{item.message}</p>
                  <p className="text-[10px] text-outline mt-0.5">
                    {new Date(item.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                    {" · "}
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card Component ──
function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color = "primary",
}: {
  icon: any;
  label: string;
  value: number | string;
  subtitle?: string;
  color?: "primary" | "secondary" | "tertiary";
}) {
  const bgMap = {
    primary: "bg-primary-fixed/30",
    secondary: "bg-secondary-container",
    tertiary: "bg-tertiary-fixed",
  };
  const iconColorMap = {
    primary: "text-primary",
    secondary: "text-secondary",
    tertiary: "text-tertiary",
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div className={cn("w-9 h-9 rounded-clinical flex items-center justify-center", bgMap[color])}>
          <Icon className={cn("w-[18px] h-[18px]", iconColorMap[color])} />
        </div>
      </div>
      <p className="text-2xl font-headline font-bold text-on-surface mt-2">{value}</p>
      <p className="text-xs text-on-surface-variant">{label}</p>
      {subtitle && <p className="text-[11px] text-outline">{subtitle}</p>}
    </div>
  );
}
