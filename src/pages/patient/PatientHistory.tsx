import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, TrendingUp, Pill } from 'lucide-react';
import { useMeds } from '../../context/MedicationContext';
import { useUser } from '../../context/UserContext';
import { cn } from '../../utils/cn';

// ✅ Frontend interface (No backend model imports)
interface IMedicationLog {
  _id: string;
  name: string;
  dosage: string;
  status: 'taken' | 'missed' | 'late';
  timestamp: string;
  dateString: string;
}

const PatientHistory: React.FC = () => {
  const { adherenceHistory, aiInsights, fetchAdherenceHistory, isLoading } = useMeds();
  const { userId, role, activePatient } = useUser();
  
  // 1. State for Date Filtering (Defaults to 'All' for overall overview)
  const [selectedDate, setSelectedDate] = useState<'All' | string>('All');

  useEffect(() => {
    const targetId = role === 'caregiver' ? activePatient?._id : userId;
    if (targetId) {
      fetchAdherenceHistory(targetId);
    }
  }, [userId, activePatient, role, fetchAdherenceHistory]);

  // 2. Generate the last 7 days for the selector
  const filterDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push({
        full: d.toISOString().split('T')[0],
        day: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        num: d.getDate(),
      });
    }
    return dates;
  }, []);

  // 3. Filtered Logic: Matches 'dateString' from our MedicationLog model
  const displayLogs = useMemo((): IMedicationLog[] => { // ✅ Add type here
    if (selectedDate === 'All') return adherenceHistory || [];
    return (adherenceHistory || []).filter((log: IMedicationLog) => log.dateString === selectedDate);
  }, [selectedDate, adherenceHistory]);

  // 4. Dynamic Stats: Recalculates adherence based on the visible list
  const displayScore = useMemo(() => {
    if (selectedDate === 'All') return aiInsights?.score || 0;
    if (displayLogs.length === 0) return 0;
    
    const takenCount = displayLogs.filter(log => log.status === 'taken' || log.status === 'late').length;
    return Math.round((takenCount / displayLogs.length) * 100);
  }, [selectedDate, displayLogs, aiInsights]);

  if (isLoading) return <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Syncing behavioral records...</div>;

  return (
    <div className="space-y-8 mt-4 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 px-1">
        <h1 className="text-3xl font-black text-primary tracking-tight font-display">History</h1>
        <p className="text-sm text-slate-500 font-medium italic">
          {role === 'caregiver' ? `Monitoring logs for ${activePatient?.name}` : 'Your permanent medication record logs'}
        </p>
      </div>

      {/* Date Selector */}
      <div className="flex items-center gap-3 overflow-x-auto py-2 no-scrollbar px-1">
        <button
          onClick={() => setSelectedDate('All')}
          className={cn(
            "flex-shrink-0 px-6 py-4 rounded-[24px] text-center transition-all min-w-[85px] border",
            selectedDate === 'All' 
              ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" 
              : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"
          )}
        >
          <span className="block text-[9px] uppercase tracking-widest font-black opacity-70 mb-1">Recent</span>
          <span className="text-lg font-black">All</span>
        </button>

        {filterDates.map((d) => (
          <button
            key={d.full}
            onClick={() => setSelectedDate(d.full)}
            className={cn(
              "flex-shrink-0 w-[65px] py-4 rounded-[24px] text-center transition-all border",
              selectedDate === d.full 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" 
                : "bg-white border-slate-100 text-slate-400 hover:border-primary/30"
            )}
          >
            <span className="block text-[9px] uppercase font-black opacity-70 mb-1">{d.day}</span>
            <span className="text-lg font-black">{d.num}</span>
          </button>
        ))}
      </div>

      {/* Stats Summary Grid */}
      <section className="grid grid-cols-2 gap-4 px-1">
        <div className="bg-blue-50/50 p-6 rounded-[32px] flex flex-col justify-between h-40 border border-blue-100 soft-shadow">
          <TrendingUp className="text-primary w-6 h-6" />
          <div>
            <p className="text-4xl font-black text-primary leading-none">{displayScore}%</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">
              {selectedDate === 'All' ? 'Overall Score' : 'Daily Adherence'}
            </p>
          </div>
        </div>
        <div className="bg-purple-50/50 p-6 rounded-[32px] flex flex-col justify-between h-40 border border-purple-100 soft-shadow">
          <Pill className="text-purple-600 w-6 h-6" />
          <div>
            <p className="text-4xl font-black text-purple-600 leading-none">{displayLogs.length}</p>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Doses Shown</p>
          </div>
        </div>
      </section>

      {/* History List */}
      <section className="space-y-4 px-1">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          {selectedDate === 'All' ? 'Complete Audit Trail' : `Doses on ${new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
          <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"/>
        </h2>
        
        {displayLogs.length > 0 ? (
          displayLogs.map((log: IMedicationLog) => (
            <motion.div 
              key={log._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "bg-white p-5 rounded-[28px] border-l-[6px] flex items-center justify-between border border-slate-50 soft-shadow",
                log.status === 'taken' ? "border-l-success" : 
                log.status === 'late' ? "border-l-amber-500" : "border-l-red-500"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                  log.status === 'taken' ? "bg-green-50 text-success" : 
                  log.status === 'late' ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                )}>
                  {log.status === 'taken' && <CheckCircle2 className="w-6 h-6" />}
                  {log.status === 'late' && <Clock className="w-6 h-6" />}
                  {log.status === 'missed' && <XCircle className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-base font-black text-slate-800">{log.name}</p>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">
                    {log.dosage} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                  log.status === 'taken' ? "bg-green-50 text-success border-green-100" : 
                  log.status === 'late' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-red-50 text-red-600 border-red-100"
                )}>
                  {log.status}
                </span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No activity logged for this period</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default PatientHistory;