import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useUser } from './UserContext';
import axios from 'axios'; // Add this at the top


// ✅ Define the robust Medication interface here to include MongoDB properties
// frontend/src/context/MedicationContext.tsx

// frontend/src/context/MedicationContext.tsx

export interface Medication {
  _id: string;            // ✅ Added for MongoDB compatibility
  id: string;             // ✅ Added for frontend mapping
  patientId: string;
  name: string;
  dosage: string;
  quantity: string;
  time: string;
  category: string;
  frequency: string;
  status: 'upcoming' | 'taken' | 'missed' | 'late';
  isTaken: boolean;
  lastTakenDate: string | null;
  snoozeCount: number;    // ✅ Added
  snoozeUntil: string | null; // ✅ Added
  isArchived: boolean;    // ✅ Added
  selectedDays?: string[]; 
}

interface MedicationContextType {
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
  fetchMeds: (showLoading?: boolean) => Promise<void>;
  addMedication: (med: Omit<Medication, 'id' | '_id'>) => Promise<void>;
  isLoading: boolean;
  isSyncing: boolean;
  historyLogs: any[]; 
  adherenceHistory: any[]; 
  setHistoryLogs: React.Dispatch<React.SetStateAction<any[]>>;
  fetchAdherenceHistory: (patientId: string, silent?: boolean) => Promise<void>;
  refreshData: (patientId: string) => Promise<void>;
  aiInsights: { 
    level: string; 
    insight: string; 
    score: number;
    confidence?: number;
  } | null;
  fetchAIInsights: (patientId: string, silent?: boolean) => Promise<void>;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export const MedicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { userId, role, activePatient } = useUser();
  const [aiInsights, setAiInsights] = useState<MedicationContextType['aiInsights']>(null);

  const fetchMeds = useCallback(async (showLoading = false) => {
    const targetId = role === 'caregiver' ? activePatient?._id : userId;
    if (!targetId) {
      setIsLoading(false);
      return;
    }

    try {
      if (showLoading) setIsLoading(true);
      else setIsSyncing(true);

      const res = await api.get(`/medications/patient/${targetId}`);
      // ✅ Mapping both _id and id ensures compatibility across your components
      const formattedMeds = res.data.map((m: any) => ({ 
        ...m, 
        id: m._id 
      }));
      setMedications(formattedMeds);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [role, activePatient?._id, userId]);

  const fetchAdherenceHistory = useCallback(async (patientId: string, silent = false) => {
    if (!patientId) return;
    
    // ✅ Sanitize ID: Remove any non-alphanumeric characters like trailing underscores
    const cleanId = patientId.replace(/[^a-zA-Z0-9]/g, '');
  
    try {
      if (!silent) setIsLoading(true);
      const res = await api.get(`/medications/adherence-history/${cleanId}`);
      setHistoryLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAIInsights = useCallback(async (patientId: string, silent = false, signal?: AbortSignal) => {
    if (!patientId) return;
    try {
      if (!silent) setIsLoading(true);
      // ✅ Pass the signal to Axios
      const res = await api.get(`/medications/ai-insights/${patientId}`, { signal });
      setAiInsights(res.data);
    } catch (err) {
      // ✅ Ignore cancellation errors in the console
      if (axios.isCancel(err)) return; 
      console.error("AI Insight fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async (patientId: string) => {
    if (!patientId) return;
    try {
      setIsSyncing(true);
      await Promise.all([
        fetchMeds(false),
        fetchAdherenceHistory(patientId, true),
        fetchAIInsights(patientId, true)
      ]);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchMeds, fetchAdherenceHistory, fetchAIInsights]);

  const addMedication = async (newMedData: Omit<Medication, 'id' | '_id'>) => {
    try {
      const response = await api.post('/medications', newMedData);
      const savedMed = { ...response.data, id: response.data._id };
      setMedications(prev => [...prev, savedMed]);
    } catch (error) {
      console.error("Error saving medication:", error);
      throw error;
    }
  };

  useEffect(() => {
    const targetId = role === 'caregiver' ? activePatient?._id : userId;
    
    if (targetId) {
      const controller = new AbortController(); // ✅ Create controller
      
      fetchMeds(true);
      // ✅ Pass the signal
      fetchAIInsights(targetId, true, controller.signal); 
      fetchAdherenceHistory(targetId, true);
  
      const interval = setInterval(() => {
        fetchMeds(false);
      }, 5000); 
  
      return () => {
        controller.abort(); // ✅ Cancel pending request on unmount
        clearInterval(interval);
      };
    }
  }, [userId, activePatient?._id, role, fetchMeds, fetchAIInsights, fetchAdherenceHistory]);
  
  return (
    <MedicationContext.Provider value={{ 
      medications, 
      setMedications, 
      fetchMeds, 
      addMedication,
      isLoading,
      isSyncing,
      historyLogs,
      adherenceHistory: historyLogs, 
      setHistoryLogs,
      fetchAdherenceHistory,
      refreshData,
      aiInsights,
      fetchAIInsights
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