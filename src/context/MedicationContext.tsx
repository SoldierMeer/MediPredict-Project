import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useUser } from './UserContext';
import { Medication } from '../data/mockData';

interface MedicationContextType {
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
  fetchMeds: () => Promise<void>; // Aligned name
  addMedication: (med: Omit<Medication, 'id'>) => Promise<void>;
  isLoading: boolean;
  historyLogs: any[]; 
  setHistoryLogs: React.Dispatch<React.SetStateAction<any[]>>;
  fetchAdherenceHistory: (patientId: string) => Promise<void>;
  refreshData: (patientId: string) => Promise<void>;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export const MedicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, role, activePatient } = useUser();

  // 1. Fetch Medications from MongoDB
  const fetchMeds = async () => {
    const targetId = role === 'caregiver' ? activePatient?._id : userId;
    
    if (!targetId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.get(`/medications/patient/${targetId}`);
      setMedications(res.data);
    } catch (err) {
      console.error("Failed to sync medications with MongoDB Atlas:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIX: Changed setLoading to setIsLoading to match defined state
  const fetchAdherenceHistory = async (patientId: string) => {
    if (!patientId) return;
    try {
      setIsLoading(true); 
      const res = await api.get(`/medications/adherence-history/${patientId}`);
      setHistoryLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch adherence history:", err);
    } finally {
      setIsLoading(false); 
    }
  };

  const refreshData = async (patientId: string) => {
    try {
      // Run both fetches in parallel for efficiency
      await Promise.all([
        fetchMeds(),
        fetchAdherenceHistory(patientId)
      ]);
    } catch (err) {
      console.error("Failed to refresh app data:", err);
    }
  };

  // 2. Add Medication to MongoDB
  const addMedication = async (newMedData: Omit<Medication, 'id'>) => {
    try {
      const response = await api.post('/medications', newMedData);
      const savedMed = { ...response.data, id: response.data._id };
      setMedications(prev => [...prev, savedMed]);
    } catch (error) {
      console.error("Error saving medication:", error);
      throw error;
    }
  };

  // Sync effect
  useEffect(() => {
    if (userId) {
      fetchMeds();
      // Polling every 3 seconds to keep data fresh across platforms
      const interval = setInterval(fetchMeds, 3000); 
      return () => clearInterval(interval);
    }
  }, [userId, activePatient, role]);

  return (
    <MedicationContext.Provider value={{ 
      medications, 
      setMedications, 
      fetchMeds, 
      addMedication,
      isLoading,
      historyLogs,
      setHistoryLogs,
      fetchAdherenceHistory,
      refreshData
    }}>
      {children}
    </MedicationContext.Provider>
  );
};

export const useMeds = () => {
  const context = useContext(MedicationContext);
  if (!context) throw new Error('useMeds must be used within a MedicationProvider');
  return context;
};