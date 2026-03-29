"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface ClinicContextType {
  clinicId: string;
  setClinicId: (id: string) => void;
}

const ClinicContext = createContext<ClinicContextType>({
  clinicId: "",
  setClinicId: () => {},
});

export function useClinic() {
  return useContext(ClinicContext);
}

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [clinicId, setClinicId] = useState("");

  useEffect(() => {
    // Fetch the first clinic from seeded data
    fetch("/api/health")
      .then(() =>
        fetch("/api/clinics/discover")
          .then((r) => r.json())
          .catch(() => null)
      )
      .catch(() => null);
  }, []);

  return (
    <ClinicContext.Provider value={{ clinicId, setClinicId }}>
      {children}
    </ClinicContext.Provider>
  );
}
