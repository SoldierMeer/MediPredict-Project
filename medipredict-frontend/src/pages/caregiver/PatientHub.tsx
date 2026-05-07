// src/pages/caregiver/PatientHub.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import api from '../../utils/api';
import { Users, ChevronRight, UserPlus, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const PatientHub: React.FC = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ FIX: Define loading state
  const { setActivePatient, userName, setLinkStatus } = useUser(); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/requests/my-patients');
        setPatients(res.data);
        
        // ✅ Sync global link status if patients exist
        if (res.data.length > 0) {
          setLinkStatus('accepted');
        }
      } catch (err) {
        console.error("Error fetching patients", err);
      } finally {
        setLoading(false); // ✅ FIX: Stop loading after fetch
      }
    };
    fetchPatients();
  }, []);

  const handleSelect = (patient: any) => {
    setActivePatient(patient);
    navigate('/caregiver/dashboard');
  };

  // ✅ Now loading is defined
  if (loading) return <div className="p-10 text-center text-gray-400">Loading Care Circle...</div>;

  if (patients.length === 0) {
    return (
      <div className="p-10 text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-primary">
           <UserPlus className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">No Patients Linked</h2>
          <p className="text-gray-500 mt-2">You haven't added anyone to your care circle yet.</p>
        </div>
        <button 
          onClick={() => navigate('/caregiver/link-patient')}
          className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
        >
          Link Your First Patient
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-black text-primary tracking-tight">Care Circle</h1>
        <p className="text-text-secondary">Welcome back, {userName?.split(' ')[0]}</p>
      </header>

      <div className="grid gap-4">
        {patients.map((patient: any) => (
          <motion.button
            key={patient._id}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(patient)}
            className="w-full p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Heart className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-on-surface">{patient.name}</h3>
                <p className="text-xs text-gray-400 font-mono uppercase">ID: {patient.patientCode}</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" />
          </motion.button>
        ))}

        <button 
          onClick={() => navigate('/caregiver/link-patient')}
          className="w-full py-8 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary/40 hover:text-primary transition-all"
        >
          <UserPlus className="w-6 h-6" />
          <span className="font-bold">Link Another Patient</span>
        </button>
      </div>
    </div>
  );
};

export default PatientHub;