import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, Clock, XCircle, TrendingUp, Pill } from 'lucide-react';
import { useMeds } from '../../context/MedicationContext';
import { useUser } from '../../context/UserContext';
import { cn } from '../../utils/cn';

const PatientHistory: React.FC = () => {
  // ✅ Hook into live data instead of MOCK_HISTORY
  const { historyLogs, fetchAdherenceHistory, loading } = useMeds();
  const { userId, role, activePatient } = useUser();

  useEffect(() => {
    // Determine whose history to fetch (The current user or the selected patient)
    const targetId = role === 'caregiver' ? activePatient?._id : userId;
    if (targetId) {
      fetchAdherenceHistory(targetId);
    }
  }, [userId, activePatient, role]);

  // Helper to format the "actual time" from the Date object
  const formatActualTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Syncing logs...</div>;
  const totalDoses = historyLogs.length;
  const successfulDoses = historyLogs.filter(log => log.status === 'taken' || log.status === 'late').length;
  const adherenceRate = totalDoses > 0 ? Math.round((successfulDoses / totalDoses) * 100) : 0;

  return (
    <div className="space-y-8 mt-4 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-primary font-display tracking-tight">History</h1>
        <p className="text-text-secondary">
          {role === 'caregiver' ? `Viewing logs for ${activePatient?.name}` : 'Your medication record logs'}
        </p>
      </div>

      {/* Date Selector - (Static for UI, can be expanded for filtering later) */}
      <div className="flex items-center gap-4 overflow-x-auto py-2 scroll-smooth no-scrollbar">
        <div className="flex-shrink-0 bg-primary text-white px-5 py-4 rounded-[20px] text-center shadow-lg shadow-primary/20 min-w-[80px]">
          <span className="block text-[10px] uppercase tracking-widest font-bold opacity-80 mb-1">Recent</span>
          <span className="text-lg font-extrabold">All</span>
        </div>
        <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-full border-2 border-dashed border-gray-200 text-gray-400 hover:text-primary hover:border-primary transition-all cursor-pointer">
          <Calendar className="w-6 h-6" />
        </div>
      </div>

      {/* History List */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
          Past Doses <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"/>
        </h2>
        
        {historyLogs.length > 0 ? (
          historyLogs.map((log) => (
            <motion.div 
              key={log._id}
              whileHover={{ x: 4 }}
              className={cn(
                "bg-white p-5 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-l-4 flex items-center justify-between transition-all border border-gray-50",
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
                    Sch: {log.scheduledTime} • {log.status === 'taken' ? 'On time' : `Taken at ${formatActualTime(log.actualTakenTime)}`}
                  </p>
                </div>
              </div>
              
              <div className="text-right flex flex-col items-end gap-1">
                <span className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest",
                  log.status === 'taken' ? "bg-success/10 text-success" : 
                  log.status === 'late' ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                )}>
                  {log.status}
                </span>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                   {new Date(log.actualTakenTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-400">
            <p className="font-medium italic">No medication logs found yet.</p>
          </div>
        )}
      </section>

      {/* Stats Summary Section */}
      <section className="grid grid-cols-2 gap-4 pt-4">
        <div className="bg-[#f0f9ff]/50 p-6 rounded-[32px] flex flex-col justify-between h-40 border border-[#e0f2fe]">
          <TrendingUp className="text-primary w-6 h-6" />
          <div>
            <p className="text-4xl font-extrabold text-primary font-display leading-none">
            {totalDoses > 0 ? `${adherenceRate}%` : '--'}
            </p>
            <p className="text-[10px] text-text-secondary font-extrabold uppercase tracking-widest mt-2">Adherence Rate</p>
          </div>
        </div>
        <div className="bg-[#f5f3ff]/50 p-6 rounded-[32px] flex flex-col justify-between h-40 border border-[#ede9fe]">
          <Pill className="text-purple-600 w-6 h-6" />
          <div>
            <p className="text-4xl font-extrabold text-purple-600 font-display leading-none">{historyLogs.length}</p>
            <p className="text-[10px] text-text-secondary font-extrabold uppercase tracking-widest mt-2">Total Doses</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PatientHistory;