import React from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, Clock, XCircle, TrendingUp, Pill } from 'lucide-react';
import { MOCK_HISTORY } from '../../data/mockData';
import { cn } from '../../utils/cn';

const PatientHistory: React.FC = () => {
  return (
    <div className="space-y-8 mt-4 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-primary font-display tracking-tight">History</h1>
        <p className="text-text-secondary">Your medication record logs</p>
      </div>

      {/* Date Selector/Filter */}
      <div className="flex items-center gap-4 overflow-x-auto py-2 scroll-smooth no-scrollbar">
        <div className="flex-shrink-0 bg-primary text-white px-5 py-4 rounded-[20px] text-center shadow-lg shadow-primary/20 min-w-[80px]">
          <span className="block text-[10px] uppercase tracking-widest font-bold opacity-80 mb-1">Today</span>
          <span className="text-lg font-extrabold">24 Oct</span>
        </div>
        {[23, 22, 21, 20].map((day, i) => (
          <div key={day} className="flex-shrink-0 bg-surface-container-low text-text-secondary px-5 py-4 rounded-[20px] text-center min-w-[80px] border border-transparent hover:border-primary/10 transition-all">
            <span className="block text-[10px] uppercase tracking-widest font-bold mb-1">
              {['Wed', 'Tue', 'Mon', 'Sun'][i]}
            </span>
            <span className="text-lg font-extrabold">{day} Oct</span>
          </div>
        ))}
        <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-full border-2 border-dashed border-gray-200 text-gray-400 hover:text-primary hover:border-primary transition-all">
          <Calendar className="w-6 h-6" />
        </div>
      </div>

      {/* History List */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
          Past Doses <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"/>
        </h2>
        
        {MOCK_HISTORY.map((log) => (
          <motion.div 
            key={log.id}
            whileHover={{ x: 4 }}
            className={cn(
              "bg-white p-5 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-l-4 flex items-center justify-between transition-all border border-gray-50",
              log.status === 'taken' ? "border-l-success" : 
              log.status === 'late' ? "border-l-warning" : "border-l-error"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                log.status === 'taken' ? "bg-success/10 text-success" : 
                log.status === 'late' ? "bg-warning/10 text-warning" : "bg-error/10 text-error"
              )}>
                {log.status === 'taken' && <CheckCircle2 className="w-6 h-6 fill-current opacity-20" />}
                {log.status === 'late' && <Clock className="w-6 h-6" />}
                {log.status === 'missed' && <XCircle className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{log.medicationName}</p>
                <p className="text-xs text-text-secondary font-medium">
                  {log.scheduledTime} • {log.status === 'taken' ? 'Taken on time' : log.status === 'late' ? `Taken at ${log.takenTime}` : 'No record found'}
                </p>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end gap-1">
              <span className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest",
                log.status === 'taken' ? "bg-success/10 text-success" : 
                log.status === 'late' ? "bg-warning/10 text-warning" : "bg-error/10 text-error"
              )}>
                {log.status}
              </span>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Oct {log.date.split('-')[2]}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Stats Summary Section */}
      <section className="grid grid-cols-2 gap-4 pt-4">
        <div className="bg-[#f0f9ff]/50 p-6 rounded-[32px] flex flex-col justify-between h-40 border border-[#e0f2fe]">
          <TrendingUp className="text-primary w-6 h-6" />
          <div>
            <p className="text-4xl font-extrabold text-primary font-display leading-none">92%</p>
            <p className="text-[10px] text-text-secondary font-extrabold uppercase tracking-widest mt-2">Adherence Rate</p>
          </div>
        </div>
        <div className="bg-[#f5f3ff]/50 p-6 rounded-[32px] flex flex-col justify-between h-40 border border-[#ede9fe]">
          <Pill className="text-purple-600 w-6 h-6" />
          <div>
            <p className="text-4xl font-extrabold text-purple-600 font-display leading-none">24</p>
            <p className="text-[10px] text-text-secondary font-extrabold uppercase tracking-widest mt-2">Total Doses</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PatientHistory;
