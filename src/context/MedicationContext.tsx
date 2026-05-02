import React, { createContext, useContext, useState, useEffect } from 'react';
import { MASTER_MEDICATIONS, type Medication } from '../data/mockData';

interface MedicationContextType {
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export const MedicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medications, setMedications] = useState<Medication[]>(() => {
    const saved = localStorage.getItem('mp_daily_meds');
    // ✅ This prevents Panadol from "haunting" you if you've deleted it
    return saved ? JSON.parse(saved) : MASTER_MEDICATIONS;
  });

  useEffect(() => {
    localStorage.setItem('mp_daily_meds', JSON.stringify(medications));
  }, [medications]);

  return (
    <MedicationContext.Provider value={{ medications, setMedications }}>
      {children}
    </MedicationContext.Provider>
  );
};

export const useMeds = () => {
  const context = useContext(MedicationContext);
  if (!context) throw new Error("useMeds must be used within MedicationProvider");
  return context;
};