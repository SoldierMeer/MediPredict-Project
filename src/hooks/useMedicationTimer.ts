import { useState, useEffect, useRef } from 'react';
import { Medication } from '../data/mockData';
import { useUser } from '../context/UserContext';

export const useMedicationTimer = (
  medications: Medication[], 
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>
) => {
  const { userId } = useUser();
  const [activeReminder, setActiveReminder] = useState<Medication | null>(null);
  const [lastNotifiedTime, setLastNotifiedTime] = useState<string>("");
  
  // ✅ Keep a reference to the latest meds so the interval is always "live"
  const medsRef = useRef(medications);
  useEffect(() => { medsRef.current = medications; }, [medications]);

  useEffect(() => {
    if (!userId) return;

    const checkSchedule = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h = hours % 12 || 12;
      // Force "08:42 AM" format
      const formattedTime = `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;

      if (formattedTime === lastNotifiedTime) return;

      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayName = daysOfWeek[now.getDay()];

      const dueMed = medsRef.current.find(m => {
        const isActive = !m.isArchived;
        const isNotTaken = !m.isTaken;
        const isTimeMatch = m.time === formattedTime || m.snoozeUntil === formattedTime;
        const isDueToday = m.frequency === 'Daily' || m.frequency.includes(todayName);

        return isActive && isNotTaken && isDueToday && isTimeMatch;
      });

      if (dueMed) {
        setActiveReminder(dueMed);
        setLastNotifiedTime(formattedTime);
        
        // Auto-clear snooze field once triggered
        if (dueMed.snoozeUntil === formattedTime) {
          setMedications(prev => prev.map(p => 
            p.id === dueMed.id ? { ...p, snoozeUntil: null } : p
          ));
        }
      }
    };

    const interval = setInterval(checkSchedule, 5000); 
    return () => clearInterval(interval);
  }, [userId, lastNotifiedTime, setMedications]);

  return { activeReminder, setActiveReminder };
};