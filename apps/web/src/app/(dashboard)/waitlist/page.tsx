"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getWaitlist,
  removeFromWaitlist,
  joinWaitlist,
  getPatients,
  getDoctors,
  type WaitlistEntry,
  type PatientListItem,
  type DoctorItem,
} from "@/lib/api";
import { getUrgencyBadge, cn } from "@/lib/utils";
import {
  ListOrdered,
  AlertTriangle,
  RefreshCcw,
  Trash2,
  Clock,
  Shield,
  Plus,
  X,
  Search,
  CheckCircle,
} from "lucide-react";

const CLINIC_ID_KEY = "carequeue_clinic_id";

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState("");

  const fetchData = useCallback(async (cId: string) => {
    try {
      setLoading(true);
      const data = await getWaitlist(cId);
      setEntries(data.entries);
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

  const handleRemove = async (entryId: string) => {
    if (!confirm("Remove this patient from the waitlist?")) return;
    try {
      await removeFromWaitlist(clinicId, entryId);
      await fetchData(clinicId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
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
            Waitlist Queue
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Ranked by scoring algorithm — urgency, proximity, wait time, reliability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(clinicId)}
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
            Add to Waitlist
          </button>
        </div>
      </div>

      {error && (
        <div className="card bg-error-container/20 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-error" />
          <p className="text-sm text-on-error-container">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {!loading && entries.length === 0 && !error && (
        <div className="card text-center py-16">
          <ListOrdered className="w-12 h-12 text-outline mx-auto mb-3" />
          <h3 className="font-headline text-lg font-bold text-on-surface">
            Waitlist is empty
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            No patients currently waiting for an appointment
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary mt-4"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Add First Patient
          </button>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry, idx) => {
            const waitDays = Math.floor(
              (Date.now() - new Date(entry.joinedAt).getTime()) / 86400000
            );

            return (
              <div
                key={entry.id}
                className="card flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                      idx === 0
                        ? "bg-gradient-to-br from-primary to-primary-light text-white shadow-ambient"
                        : idx === 1
                        ? "bg-primary-fixed text-primary-dark"
                        : idx === 2
                        ? "bg-primary-fixed/50 text-primary"
                        : "bg-surface-container-high text-on-surface-variant"
                    )}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      {entry.patient.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-on-surface-variant">
                        {entry.doctor?.name || "Any doctor"}
                      </span>
                      <span className="text-[11px] text-outline flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {waitDays}d waiting
                      </span>
                      <span className="text-[11px] text-outline flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {entry.patient.reliabilityScore}% reliable
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={getUrgencyBadge(entry.urgency)}>
                    {entry.urgency.replace("_", " ")}
                  </span>
                  <div className="text-center">
                    <p className="text-lg font-headline font-bold text-primary">
                      {Math.round(entry.rankScore)}
                    </p>
                    <p className="text-[10px] text-outline -mt-0.5">score</p>
                  </div>
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-clinical text-error hover:bg-error-container transition"
                    title="Remove from waitlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scoring Legend */}
      <div className="card-flat">
        <h4 className="text-xs font-semibold text-on-surface-variant mb-2">
          Scoring Weights
        </h4>
        <div className="flex gap-6 text-[11px] text-outline">
          <span>🔴 Urgency: 35%</span>
          <span>📍 Proximity: 25%</span>
          <span>⏳ Wait Time: 20%</span>
          <span>🛡️ Reliability: 15%</span>
        </div>
      </div>

      {/* Add to Waitlist Modal */}
      {showAddModal && (
        <AddToWaitlistModal
          clinicId={clinicId}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            setToast("Patient added to waitlist! They'll be notified when a slot opens 📱");
            setTimeout(() => setToast(""), 4000);
            fetchData(clinicId);
          }}
        />
      )}
    </div>
  );
}

// ── Add to Waitlist Modal ──
function AddToWaitlistModal({
  clinicId,
  onClose,
  onAdded,
}: {
  clinicId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [urgency, setUrgency] = useState("ROUTINE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    getDoctors(clinicId).then(setDoctors).catch(console.error);
  }, [clinicId]);

  useEffect(() => {
    if (patientSearch.length >= 2) {
      getPatients(clinicId, patientSearch).then(setPatients).catch(console.error);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [patientSearch, clinicId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPatient) {
      setError("Please select a patient");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await joinWaitlist(clinicId, {
        patientId: selectedPatient.id,
        doctorId: selectedDoctor || undefined,
        urgency,
      });
      onAdded();
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
          Add to Waitlist
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">
          Patient will be ranked automatically and notified when a slot opens
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
            <label className="block text-sm font-medium text-on-surface mb-1">Patient *</label>
            {selectedPatient ? (
              <div className="input-field flex items-center justify-between">
                <span>{selectedPatient.name} ({selectedPatient.phone})</span>
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
                {showDropdown && patients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-surface-container-lowest rounded-clinical shadow-lg border border-outline-variant/20 max-h-40 overflow-y-auto">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(p);
                          setShowDropdown(false);
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

          {/* Doctor Preference */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Doctor Preference
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="input-field"
            >
              <option value="">Any Doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Urgency Level</label>
            <div className="flex gap-2">
              {[
                { value: "ROUTINE", label: "Routine", color: "bg-surface-container-high text-on-surface-variant" },
                { value: "FOLLOW_UP", label: "Follow-up", color: "bg-tertiary-fixed text-[#003ea8]" },
                { value: "URGENT", label: "Urgent", color: "bg-error-container text-on-error-container" },
              ].map((u) => (
                <button
                  key={u.value}
                  type="button"
                  onClick={() => setUrgency(u.value)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold transition border-2",
                    urgency === u.value
                      ? "border-primary " + u.color
                      : "border-transparent " + u.color + " opacity-50 hover:opacity-75"
                  )}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Adding..." : "Add to Waitlist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
