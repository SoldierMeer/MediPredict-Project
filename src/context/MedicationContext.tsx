import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useUser } from './UserContext';
import { Medication } from '../data/mockData';

interface MedicationContextType {
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
  fetchMeds: (showLoading?: boolean) => Promise<void>;
  addMedication: (med: Omit<Medication, 'id'>) => Promise<void>;
  isLoading: boolean;
  isSyncing: boolean; // Added to track background refreshes
  historyLogs: any[]; 
  adherenceHistory: any[]; // Alias for UI compatibility
  setHistoryLogs: React.Dispatch<React.SetStateAction<any[]>>;
  fetchAdherenceHistory: (patientId: string, silent?: boolean) => Promise<void>;
  refreshData: (patientId: string) => Promise<void>;
  aiInsights: { level: string; insight: string; score: number } | null;
  fetchAIInsights: (patientId: string, silent?: boolean) => Promise<void>;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export const MedicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { userId, role, activePatient } = useUser();
  const [aiInsights, setAiInsights] = useState(null);

  // 1. Fetch Medications - Wrapped in useCallback to prevent infinite loops
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
      // Ensure each medication has a consistent 'id' field for the frontend
      const formattedMeds = res.data.map((m: any) => ({ ...m, id: m._id }));
      setMedications(formattedMeds);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [role, activePatient?._id, userId]);

  // 2. Fetch Adherence History
  const fetchAdherenceHistory = useCallback(async (patientId: string, silent = false) => {
    if (!patientId) return;
    try {
      if (!silent) setIsLoading(true);
      const res = await api.get(`/medications/adherence-history/${patientId}`);
      setHistoryLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch adherence history:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. Fetch AI Insights
  const fetchAIInsights = useCallback(async (patientId: string, silent = false) => {
    if (!patientId) return;
    try {
      if (!silent) setIsLoading(true);
      const res = await api.get(`/medications/ai-insights/${patientId}`);
      setAiInsights(res.data);
    } catch (err) {
      console.error("AI Insight fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 4. Global Refresh - Parallelizes calls without wiping the UI
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

  // Sync effect: Runs on mount and sets up polling
  useEffect(() => {
    const targetId = role === 'caregiver' ? activePatient?._id : userId;
    
    if (targetId) {
      // Initial Load
      fetchMeds(true);
      fetchAIInsights(targetId, true);
      fetchAdherenceHistory(targetId, true);

      // Background Polling (Every 5 seconds for stability)
      const interval = setInterval(() => {
        fetchMeds(false);
      }, 5000); 

      return () => clearInterval(interval);
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
      adherenceHistory: historyLogs, // Alias for chart compatibility
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