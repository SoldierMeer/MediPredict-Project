import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useUser } from './UserContext';
import { Medication } from '../data/mockData';

interface MedicationContextType {
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
  fetchMedications: () => Promise<void>;
  addMedication: (med: Omit<Medication, 'id'>) => Promise<void>;
  isLoading: boolean;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export const MedicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, role, activePatient } = useUser();


  // 1. Fetch Medications from MongoDB
  const fetchMeds = async () => {
    // Logic: If caregiver, use activePatient._id. If patient, use their own userId.
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

  // Trigger fetch when the user logs in or the component mounts
  useEffect(() => {
    if (userId) {
      fetchMeds();
      // Optional: Refresh the list every 30 seconds to catch Postman/Caregiver additions
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
      isLoading 
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