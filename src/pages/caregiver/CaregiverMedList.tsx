import React from 'react';
import { motion } from 'motion/react';
import { Pill, Clock, CheckCircle2, AlertTriangle, XCircle, Search } from 'lucide-react';
import { MASTER_MEDICATIONS } from '../../data/mockData';
import { cn } from '../../utils/cn';

const CaregiverMedList: React.FC = () => {
  return (
    <div className="space-y-8 mt-4 pb-32 animate-in fade-in duration-500">
      <section className="">
        <h1 className="text-3xl font-extrabold text-primary mb-6 font-display tracking-tight">Patient Medications</h1>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input 
            className="w-full h-14 pl-12 pr-4 bg-white border border-gray-100 rounded-[24px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm soft-shadow text-base font-medium placeholder:text-gray-400" 
            placeholder="Search John's medications..." 
            type="text"
            readOnly
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6">
        {MASTER_MEDICATIONS.map((med) => (
          <motion.div 
            key={med.id}
            whileHover={{ y: -2 }}
            className="bg-white rounded-[28px] p-4 flex gap-4 relative overflow-hidden soft-shadow border border-white"
          >
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-1.5",
              med.status === 'taken' ? "bg-success" : 
              med.status === 'missed' ? "bg-alert" : 
              med.status === 'upcoming' ? "bg-warning" : "bg-primary"
            )} />
            
            <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary shrink-0 transition-transform">
              <Pill className="w-8 h-8" />
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-text-primary">{med.name}</h3>
                  <p className="text-sm font-bold text-text-secondary">{med.dosage} • {med.frequency}</p>
                </div>
                <div className={cn(
                  "flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                  med.status === 'taken' ? "bg-green-50 text-success" : 
                  med.status === 'missed' ? "bg-red-50 text-alert" : 
                  med.status === 'upcoming' ? "bg-amber-50 text-warning" : "bg-blue-50 text-primary"
                )}>
                  {med.status === 'taken' && <CheckCircle2 className="w-3 h-3 mr-1 fill-current" />}
                  {med.status}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">Tomorrow, {med.time}</span>
                </div>
                {med.status === 'upcoming' && (
                  <button className="px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-sm shadow-primary/20">
                    Remind Patient
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-blue-50/50 p-6 rounded-[32px] border border-blue-100/50 flex gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="text-primary w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-primary">Monitoring Mode</p>
          <p className="text-xs text-blue-600 leading-relaxed mt-1">
            As a caregiver, you have read-only access to John's medication list. You can send reminders but cannot edit or add new entries.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CaregiverMedList;
