"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getPatients,
  createPatient,
  type PatientListItem,
} from "@/lib/api";
import {
  Users,
  Search,
  Plus,
  X,
  Shield,
  CalendarDays,
  Phone,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CLINIC_ID_KEY = "carequeue_clinic_id";

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = useCallback(async (cId: string, q?: string) => {
    try {
      setLoading(true);
      const data = await getPatients(cId, q);
      setPatients(data);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cId = localStorage.getItem(CLINIC_ID_KEY) || "";
    if (cId) {
      setClinicId(cId);
      fetchData(cId);
    } else {
      setLoading(false);
      setError("No Clinic ID set. Go to Dashboard first.");
    }
  }, [fetchData]);

  useEffect(() => {
    if (!clinicId) return;
    const timer = setTimeout(() => {
      fetchData(clinicId, search || undefined);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, clinicId, fetchData]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Patients
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Manage your clinic&apos;s patient registry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(clinicId, search || undefined)}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Patient
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone number..."
          className="input-field pl-10"
        />
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
      {!loading && patients.length === 0 && !error && (
        <div className="card text-center py-16">
          <Users className="w-12 h-12 text-outline mx-auto mb-3" />
          <h3 className="font-headline text-lg font-bold text-on-surface">
            {search ? "No patients found" : "No patients yet"}
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            {search
              ? `No patients matching "${search}"`
              : "Register your first patient to get started"}
          </p>
          {!search && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary mt-4"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Add Patient
            </button>
          )}
        </div>
      )}

      {/* Patient Table */}
      {!loading && patients.length > 0 && (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">
                  Patient
                </th>
                <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">
                  Phone
                </th>
                <th className="text-center text-xs font-semibold text-on-surface-variant px-5 py-3">
                  Reliability
                </th>
                <th className="text-center text-xs font-semibold text-on-surface-variant px-5 py-3">
                  Appointments
                </th>
                <th className="text-center text-xs font-semibold text-on-surface-variant px-5 py-3">
                  Waitlist
                </th>
                <th className="text-left text-xs font-semibold text-on-surface-variant px-5 py-3">
                  Last Visit
                </th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-outline-variant/10 hover:bg-surface-container-low/50 transition"
                >
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-on-surface">
                      {p.name}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-on-surface-variant flex items-center gap-1.5">
                      <Phone className="w-3 h-3" />
                      {p.phone}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          p.reliabilityScore >= 80
                            ? "text-primary"
                            : p.reliabilityScore >= 50
                            ? "text-tertiary"
                            : "text-error"
                        )}
                      >
                        {p.reliabilityScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-sm text-on-surface-variant flex items-center justify-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {p.totalAppointments}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {p.activeWaitlist > 0 ? (
                      <span className="badge-urgent">{p.activeWaitlist} active</span>
                    ) : (
                      <span className="text-xs text-outline">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-on-surface-variant">
                      {p.lastVisit
                        ? new Date(p.lastVisit).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <AddPatientModal
          clinicId={clinicId}
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            fetchData(clinicId);
          }}
        />
      )}
    </div>
  );
}

// ── Add Patient Modal ──
function AddPatientModal({
  clinicId,
  onClose,
  onCreated,
}: {
  clinicId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createPatient(clinicId, { name, phone });
      onCreated();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="card w-full max-w-md mx-4 relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-surface-container-high transition"
        >
          <X className="w-4 h-4 text-on-surface-variant" />
        </button>

        <h2 className="font-headline text-lg font-bold text-on-surface mb-1">
          Register New Patient
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Add a patient to your clinic&apos;s registry
        </p>

        {error && (
          <div className="bg-error-container text-on-error-container p-3 rounded-lg text-sm mb-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-field"
              placeholder="e.g. Rahul Sharma"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="input-field"
              placeholder="e.g. 9876543210"
            />
            <p className="text-[11px] text-outline mt-1">
              +91 will be added automatically if not provided
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Registering..." : "Register Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
