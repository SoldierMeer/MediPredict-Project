import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, Clock, XCircle, TrendingUp, Pill } from 'lucide-react';
import { useMeds } from '../../context/MedicationContext';
import { useUser } from '../../context/UserContext';
import { cn } from '../../utils/cn';

const PatientHistory: React.FC = () => {
  const { adherenceHistory, aiInsights, fetchAdherenceHistory, isLoading } = useMeds();
  const { userId, role, activePatient } = useUser();
  
  // 1. State for Filtering
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

  // 3. Filtered Logic
  const displayLogs = useMemo(() => {
    if (selectedDate === 'All') return adherenceHistory || [];
    return adherenceHistory?.filter(log => log.date === selectedDate) || [];
  }, [selectedDate, adherenceHistory]);

  // 4. Dynamic Stats based on selection
  const displayScore = useMemo(() => {
    if (selectedDate === 'All') return aiInsights?.score || 0;
    if (displayLogs.length === 0) return 0;
    
    const weighted = displayLogs.reduce((acc, log) => {
      if (log.status === 'taken') return acc + 1;
      if (log.status === 'late') return acc + 0.7;
      return acc;
    }, 0);
    return Math.round((weighted / displayLogs.length) * 100);
  }, [selectedDate, displayLogs, aiInsights]);

  if (isLoading) return <div className="p-10 text-center text-gray-400">Syncing behavioral records...</div>;

  return (
    <div className="space-y-8 mt-4 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-primary font-display tracking-tight">History</h1>
        <p className="text-text-secondary">
          {role === 'caregiver' ? `Viewing logs for ${activePatient?.name}` : 'Your medication record logs'}
        </p>
      </div>

      {/* Date Selector */}
      <div className="flex items-center gap-3 overflow-x-auto py-2 no-scrollbar">
        <button
          onClick={() => setSelectedDate('All')}
          className={cn(
            "flex-shrink-0 px-6 py-4 rounded-[24px] text-center transition-all min-w-[85px]",
            selectedDate === 'All' 
              ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
              : "bg-white border border-gray-100 text-text-secondary hover:bg-gray-50"
          )}
        >
          <span className="block text-[10px] uppercase tracking-widest font-black opacity-70 mb-1">Recent</span>
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
                : "bg-white border-gray-100 text-text-secondary hover:border-primary/30"
            )}
          >
            <span className="block text-[10px] uppercase font-black opacity-70 mb-1">{d.day}</span>
            <span className="text-lg font-black">{d.num}</span>
          </button>
        ))}
      </div>

      {/* Stats Summary - Now Dynamic! */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-[#f0f9ff]/50 p-6 rounded-[32px] flex flex-col justify-between h-40 border border-[#e0f2fe]">
          <TrendingUp className="text-primary w-6 h-6" />
          <div>
            <p className="text-4xl font-extrabold text-primary font-display leading-none">{displayScore}%</p>
            <p className="text-[10px] text-text-secondary font-extrabold uppercase tracking-widest mt-2">
              {selectedDate === 'All' ? 'Overall Score' : 'Daily Adherence'}
            </p>
          </div>
        </div>
        <div className="bg-[#f5f3ff]/50 p-6 rounded-[32px] flex flex-col justify-between h-40 border border-[#ede9fe]">
          <Pill className="text-purple-600 w-6 h-6" />
          <div>
            <p className="text-4xl font-extrabold text-purple-600 font-display leading-none">{displayLogs.length}</p>
            <p className="text-[10px] text-text-secondary font-extrabold uppercase tracking-widest mt-2">Doses Shown</p>
          </div>
        </div>
      </section>

      {/* History List */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          {selectedDate === 'All' ? 'Past Doses' : `Doses on ${new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
          <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"/>
        </h2>
        
        {displayLogs.length > 0 ? (
          displayLogs.map((log) => (
            <motion.div 
              key={log._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "bg-white p-5 rounded-[28px] border-l-4 flex items-center justify-between border border-gray-50 soft-shadow",
                log.status === 'taken' ? "border-l-success" : 
                log.status === 'late' ? "border-l-amber-500" : "border-l-red-500"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                  log.status === 'taken' ? "bg-success/10 text-success" : 
                  log.status === 'late' ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                )}>
                  {log.status === 'taken' && <CheckCircle2 className="w-6 h-6 fill-current opacity-20" />}
                  {log.status === 'late' && <Clock className="w-6 h-6" />}
                  {log.status === 'missed' && <XCircle className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-lg font-bold text-text-primary">{log.medicationName}</p>
                  <p className="text-xs text-text-secondary font-medium">
                    Sch: {log.scheduledTime} • {log.status === 'taken' ? 'On time' : `Taken at ${new Date(log.actualTakenTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest",
                  log.status === 'taken' ? "bg-success/10 text-success" : 
                  log.status === 'late' ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                )}>
                  {log.status}
                </span>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium italic">No logs found for this date.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default PatientHistory;