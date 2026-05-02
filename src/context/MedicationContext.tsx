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
  const { userId } = useUser();

  // 1. Fetch Medications from MongoDB
  const fetchMedications = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const response = await api.get('/medications');
      // Map MongoDB _id to the 'id' field expected by your UI
      const formattedMeds = response.data.map((med: any) => ({
        ...med,
        id: med._id 
      }));
      setMedications(formattedMeds);
    } catch (error) {
      console.error("Failed to fetch medications:", error);
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
      fetchMedications();
      // Optional: Refresh the list every 30 seconds to catch Postman/Caregiver additions
      const interval = setInterval(fetchMedications, 3000); 
      return () => clearInterval(interval);
    }
  }, [userId]);

  return (
    <MedicationContext.Provider value={{ 
      medications, 
      setMedications, 
      fetchMedications, 
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