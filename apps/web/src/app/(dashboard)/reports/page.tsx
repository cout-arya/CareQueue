"use client";

import { useEffect, useState, useCallback } from "react";
import { getRecoveryReport, type RecoveryReport } from "@/lib/api";
import {
  BarChart3,
  AlertTriangle,
  RefreshCcw,
  TrendingUp,
  IndianRupee,
  Clock,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CLINIC_ID_KEY = "carequeue_clinic_id";

export default function ReportsPage() {
  const [report, setReport] = useState<RecoveryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());

  const fetchData = useCallback(
    async (cId: string, m: number, y: number) => {
      try {
        setLoading(true);
        const data = await getRecoveryReport(cId, m, y);
        setReport(data);
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
      fetchData(cId, month, year);
    } else {
      setLoading(false);
      setError("No Clinic ID set. Go to Dashboard first.");
    }
  }, [month, year, fetchData]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">
            Recovery Reports
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Monthly slot recovery performance and revenue metrics
          </p>
        </div>
        <button
          onClick={() => fetchData(clinicId, month, year)}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Month/Year Selector */}
      <div className="flex items-center gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="input-field w-40"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="input-field w-28"
        >
          {[2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
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

      {!loading && report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              icon={Target}
              label="Fill Rate"
              value={report.summary.fillRate}
              color="primary"
            />
            <SummaryCard
              icon={TrendingUp}
              label="Slots Filled"
              value={`${report.summary.slotsFilled}/${report.summary.totalSlotsCancelled}`}
              color="tertiary"
            />
            <SummaryCard
              icon={IndianRupee}
              label="Revenue Recovered"
              value={report.summary.totalRevenueRecovered}
              color="primary"
            />
            <SummaryCard
              icon={Clock}
              label="Avg Recovery Time"
              value={report.summary.avgRecoveryTimeFormatted}
              color="secondary"
            />
          </div>

          {/* Per-Doctor Breakdown */}
          <div className="card">
            <h3 className="font-headline text-base font-bold text-on-surface mb-4">
              Per-Doctor Breakdown
            </h3>

            {report.byDoctor.length === 0 ? (
              <p className="text-sm text-on-surface-variant py-4 text-center">
                No recovery events this month
              </p>
            ) : (
              <div className="space-y-4">
                {report.byDoctor.map((doc) => {
                  const fillRate =
                    doc.cancelled > 0
                      ? Math.round((doc.filled / doc.cancelled) * 100)
                      : 0;

                  return (
                    <div
                      key={doc.doctorName}
                      className="flex items-center justify-between bg-surface-container-low rounded-clinical px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-on-surface">
                          {doc.doctorName}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          {doc.cancelled} cancelled · {doc.filled} recovered
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Progress Bar */}
                        <div className="w-32 h-2 bg-surface-container-high rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500"
                            style={{ width: `${fillRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-primary w-12 text-right">
                          {fillRate}%
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          ₹{doc.revenue.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color = "primary",
}: {
  icon: any;
  label: string;
  value: string;
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
      <div
        className={cn(
          "w-9 h-9 rounded-clinical flex items-center justify-center",
          bgMap[color]
        )}
      >
        <Icon className={cn("w-[18px] h-[18px]", iconColorMap[color])} />
      </div>
      <p className="text-xl font-headline font-bold text-on-surface mt-2">
        {value}
      </p>
      <p className="text-xs text-on-surface-variant">{label}</p>
    </div>
  );
}
