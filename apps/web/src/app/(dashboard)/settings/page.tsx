"use client";

import { useEffect, useState } from "react";
import { getHealth, getDoctors, type DoctorItem } from "@/lib/api";
import {
  Settings as SettingsIcon,
  CheckCircle,
  XCircle,
  Stethoscope,
  Phone,
  MapPin,
  Wifi,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CLINIC_ID_KEY = "carequeue_clinic_id";

interface ClinicInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string;
  lat: number | null;
  lng: number | null;
  doctors: { id: string; name: string; specialty: string }[];
}

export default function SettingsPage() {
  const [clinic, setClinic] = useState<ClinicInfo | null>(null);
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [apiHealth, setApiHealth] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch clinic info
        const res = await fetch("/api/clinics/discover");
        if (res.ok) {
          const data = await res.json();
          setClinic(data);
          localStorage.setItem(CLINIC_ID_KEY, data.id);

          // Fetch doctors
          const docs = await getDoctors(data.id);
          setDoctors(docs);
        }
      } catch {
        // ignore
      }

      // Health check
      try {
        await getHealth();
        setApiHealth(true);
      } catch {
        setApiHealth(false);
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-headline text-2xl font-bold text-on-surface">Settings</h1>
        <p className="text-sm text-on-surface-variant mt-0.5">
          Clinic profile and system configuration
        </p>
      </div>

      {/* Clinic Profile */}
      {clinic && (
        <div className="card space-y-4">
          <h2 className="font-headline text-base font-bold text-on-surface flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-primary" />
            Clinic Profile
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-outline uppercase tracking-wider mb-0.5">Name</p>
              <p className="text-sm font-medium text-on-surface">{clinic.name}</p>
            </div>
            <div>
              <p className="text-[11px] text-outline uppercase tracking-wider mb-0.5">City</p>
              <p className="text-sm font-medium text-on-surface">{clinic.city}</p>
            </div>
            <div>
              <p className="text-[11px] text-outline uppercase tracking-wider mb-0.5">Address</p>
              <p className="text-sm text-on-surface flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" /> {clinic.address}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-outline uppercase tracking-wider mb-0.5">Phone</p>
              <p className="text-sm text-on-surface flex items-center gap-1">
                <Phone className="w-3 h-3 text-primary" /> {clinic.phone}
              </p>
            </div>
          </div>
          {clinic.lat && clinic.lng && (
            <p className="text-[11px] text-outline">
              📍 GPS: {clinic.lat.toFixed(4)}, {clinic.lng.toFixed(4)}
            </p>
          )}
        </div>
      )}

      {/* Doctors */}
      <div className="card space-y-4">
        <h2 className="font-headline text-base font-bold text-on-surface flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-primary" />
          Doctors ({doctors.length})
        </h2>
        <div className="space-y-3">
          {doctors.map((doc) => {
            const hours = doc.workingHours as Record<string, { start: string; end: string }>;
            const days = Object.keys(hours || {}).join(", ");

            return (
              <div
                key={doc.id}
                className="flex items-center justify-between bg-surface-container-low rounded-clinical px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-on-surface">{doc.name}</p>
                  <p className="text-[11px] text-on-surface-variant">{doc.specialty}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-on-surface-variant flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />
                    {doc.slotDuration} min slots
                  </p>
                  <p className="text-[10px] text-outline capitalize">{days}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integration Status */}
      <div className="card space-y-4">
        <h2 className="font-headline text-base font-bold text-on-surface flex items-center gap-2">
          <Wifi className="w-4 h-4 text-primary" />
          Integration Status
        </h2>
        <div className="space-y-2">
          <StatusRow
            label="API Server"
            status={apiHealth === true}
            detail="Fastify on port 3001"
          />
          <StatusRow
            label="WhatsApp (Twilio)"
            status={!!process.env.NEXT_PUBLIC_TWILIO_CONNECTED}
            detail="Sandbox mode — messages mocked in dev"
          />
          <StatusRow
            label="SMS Fallback (MSG91)"
            status={!!process.env.NEXT_PUBLIC_MSG91_CONNECTED}
            detail="Auto-triggered when WhatsApp fails"
          />
          <StatusRow
            label="Maps (OpenRouteService)"
            status={!!process.env.NEXT_PUBLIC_ORS_CONNECTED}
            detail="Driving distance for proximity scoring"
          />
          <StatusRow
            label="Job Queue (BullMQ + Redis)"
            status={apiHealth === true}
            detail="Reminders, recovery, timeout workers"
          />
        </div>
      </div>

      {/* Clinic ID */}
      {clinic && (
        <div className="card-flat">
          <p className="text-[11px] text-outline">
            Clinic ID: <code className="text-xs bg-surface-container-high px-1.5 py-0.5 rounded">{clinic.id}</code>
          </p>
        </div>
      )}
    </div>
  );
}

function StatusRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between bg-surface-container-low rounded-clinical px-4 py-2.5">
      <div className="flex items-center gap-3">
        {status ? (
          <CheckCircle className="w-4 h-4 text-primary" />
        ) : (
          <XCircle className="w-4 h-4 text-outline" />
        )}
        <div>
          <p className="text-sm font-medium text-on-surface">{label}</p>
          <p className="text-[11px] text-outline">{detail}</p>
        </div>
      </div>
      <span
        className={cn(
          "badge",
          status
            ? "bg-primary-fixed text-primary-dark"
            : "bg-surface-container-high text-on-surface-variant"
        )}
      >
        {status ? "Connected" : "Inactive"}
      </span>
    </div>
  );
}
