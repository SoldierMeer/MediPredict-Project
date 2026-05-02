import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Pill, Clock, Brain, ChevronRight, CheckCircle2, Copy, ShieldCheck, Archive, RotateCcw } from 'lucide-react';
import { MOCK_INSIGHTS, type Medication } from '../../data/mockData';
import { cn } from '../../utils/cn';
import { useUser } from '../../context/UserContext';
import { useMedicationTimer } from '../../hooks/useMedicationTimer';
import ReminderPopup from '../../components/patient/ReminderPopup';
import PendingRequests from '../patient/PendingRequests';
import { useMeds } from '../../context/MedicationContext';

// Helper to format day labels for the UI
const getMedicationDayLabel = (med: Medication) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayName = daysOfWeek[new Date().getDay()];

  if (med.frequency === 'Daily') return 'Today';
  if (med.frequency.includes(todayName)) return 'Today';
  return med.frequency;
};

const PatientHome: React.FC = () => {
  const navigate = useNavigate();
  const { patientCode, userId, userName } = useUser();
  
  // ✅ Single Source of Truth from MedicationContext
  const { medications, setMedications } = useMeds();

  // ✅ 1. Midnight Reset Logic: Clears 'isTaken' status every new day
  useEffect(() => {
    const performMidnightReset = () => {
      const today = new Date().toDateString();
      const lastResetDate = localStorage.getItem('mp_last_reset_date');

      if (lastResetDate !== today) {
        setMedications(prev => prev.map(med => ({
          ...med,
          isTaken: false,
          status: 'upcoming',
          snoozeUntil: null,
          snoozeCount: 0
        })));
        localStorage.setItem('mp_last_reset_date', today);
      }
    };
    performMidnightReset();
    const interval = setInterval(performMidnightReset, 3600000); // Check every hour
    return () => clearInterval(interval);
  }, [setMedications]);

  // ✅ 2. Initialize Reminder Timer Hook
  const { activeReminder, setActiveReminder } = useMedicationTimer(medications, setMedications);

  // ✅ 3. Handle Mark as Taken
  const handleTakeMedicine = (id?: string) => {
    const targetId = id || activeReminder?.id;
    if (!targetId) return;

    setMedications(prev => prev.map(med =>
      med.id === targetId 
        ? { ...med, isTaken: true, status: 'taken', snoozeUntil: null, snoozeCount: 0 } 
        : med
    ));
    setActiveReminder(null);
  };

  // ✅ 4. Improved handleSnooze (Works for both Popup and Card Buttons)
  const handleSnooze = (id?: string) => {
    const targetId = id || activeReminder?.id;
    if (!targetId) return;

    setMedications(prev => prev.map(m => {
      if (m.id === targetId) {
        const snoozeCount = m.snoozeCount || 0;
        
        // Capped at 2 snoozes total
        if (snoozeCount < 2) {
          const now = new Date();
          const nextNag = new Date(now.getTime() + 3 * 60000); // +3 Minutes
          
          // Force manual formatting to match "HH:MM AM/PM" perfectly
          const h = nextNag.getHours() % 12 || 12;
          const mTime = nextNag.getMinutes().toString().padStart(2, '0');
          const ampm = nextNag.getHours() >= 12 ? 'PM' : 'AM';
          const formattedNextNag = `${h.toString().padStart(2, '0')}:${mTime} ${ampm}`;

          return { 
            ...m, 
            status: 'missed', 
            snoozeUntil: formattedNextNag, 
            snoozeCount: snoozeCount + 1 
          };
        }
        // If limit reached, keep as missed but stop snoozing
        return { ...m, status: 'missed', snoozeUntil: null };
      }
      return m;
    }));
    setActiveReminder(null);
  };

  // ---------------------------------------------------------
  // ✅ DATA CALCULATIONS (Home Screen "Brain")
  // ---------------------------------------------------------

  const todayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];

  // A. Filter for Today's Active Medications
  const todaysMeds = medications.filter(med => {
    const isActive = !med.isArchived;
    const isDueToday = med.frequency === 'Daily' || med.frequency.includes(todayName);
    return isActive && isDueToday;
  });

  // B. Chronological Sort Helper (converts "08:42 AM" to minutes for sorting)
  const toMinutes = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours += 12;
    return hours * 60 + minutes;
  };

  // C. Final Sorting (Time order)
  const sortedTodaysMeds = [...todaysMeds].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));

  // D. Find the Next Upcoming Dose for Today
  const nextDose = sortedTodaysMeds.find(m => !m.isTaken);

  // E. List Logic: Untaken/Missed at top, Taken at bottom, max 3 items
  const visibleMeds = [...sortedTodaysMeds]
    .sort((a, b) => (a.isTaken === b.isTaken ? 0 : a.isTaken ? 1 : -1))
    .slice(0, 3);

  // ---------------------------------------------------------
  const globalNextDose = nextDose || medications.find(m => !m.isArchived && !m.isTaken);
  // ---------------------------------------------------------
  return (
    <div className="space-y-8 mt-4 animate-in fade-in duration-500">
      {/* Greeting Section */}
      <section className="">
        <h2 className="text-3xl font-extrabold text-primary font-display antialiased">
          Good Morning, {userName?.split(' ')[0] || 'Meer'}
        </h2>
        <p className="text-text-secondary">Your health insights are updated for today.</p>
      </section>

      {/* 1. Connection Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/10 p-5 rounded-[32px] border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-2xl">
            <ShieldCheck className="text-primary w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Connection Code</h3>
            <p className="text-xs text-primary/70">Share this to link with your caregiver</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/50 p-2 pl-4 rounded-2xl border border-primary/10 w-full sm:w-auto">
          <span className="text-2xl font-mono font-black tracking-widest text-primary">
            {patientCode || "MP-0000"}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(patientCode || "");
              alert("Code copied!");
            }}
            className="bg-primary text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all active:scale-90"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* 2. Reusable Pending Requests Component */}
      <section className="space-y-4">
        <PendingRequests userId={userId} />
      </section>

      {/* Summary Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Adherence Card */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white rounded-[32px] p-6 soft-shadow border border-blue-50/50 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">Adherence</span>
            <CheckCircle2 className="text-primary w-5 h-5 fill-primary/10" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-primary font-display antialiased leading-none">{MOCK_INSIGHTS.adherenceRate}%</span>
            <span className="text-xs font-bold text-success">{MOCK_INSIGHTS.riskTrend}</span>
          </div>
          <div className="mt-6 h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${MOCK_INSIGHTS.adherenceRate}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-primary rounded-full transition-all"
            />
          </div>
        </motion.div>

        {/* Next Dose Card */}
        <motion.div whileHover={{ y: -4 }} className="bg-white rounded-[32px] p-6 soft-shadow border border-blue-50/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">Next Dose</span>
            <Clock className="text-primary w-5 h-5" />
          </div>

          <div>
            {nextDose ? (
              <>
                <span className="text-sm font-bold text-primary mb-1 block">{getMedicationDayLabel(nextDose)}</span>
                <span className="text-4xl font-extrabold text-text-primary block leading-none mb-2">{nextDose.time}</span>
                <span className="text-base text-text-secondary font-medium">{nextDose.name}, {nextDose.dosage}</span>
              </>
            ) : (
              <>
                <span className="text-sm font-bold text-success mb-1 block">All Done!</span>
                <span className="text-2xl font-bold text-text-primary block leading-tight mb-2">No Doses Remaining</span>
                <span className="text-xs text-text-secondary font-medium">Enjoy your day!</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Risk Status Card */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white rounded-[32px] p-6 soft-shadow border-l-4 border-l-success flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Brain className="w-20 h-20" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">AI Risk Level</span>
            <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase tracking-widest border border-success/20">Stable</span>
          </div>
          <div>
            <span className="text-4xl font-extrabold text-success block leading-none">{MOCK_INSIGHTS.riskLevel}</span>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">Predictions indicate optimal management of chronic conditions.</p>
          </div>
        </motion.div>
      </section>

      {/* Medication List Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-text-primary antialiased">Today’s Medications</h3>
          <button onClick={() => navigate('/patient/medications')} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
            See All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* ✅ FIXED: Correct ternary and map syntax */}
          {todaysMeds.length > 0 ? (
            visibleMeds.map((med) => (
              <motion.div
                key={med.id}
                whileHover={{ x: 4 }}
                className="bg-white rounded-[24px] p-5 soft-shadow border border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    med.isTaken ? "bg-success/10 text-success" :
                      med.status === 'missed' ? "bg-alert/10 text-alert" : "bg-blue-50 text-primary"
                  )}>
                    <Pill className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-text-primary">{med.name}</h4>
                    <p className="text-xs text-text-secondary font-medium">
                      {med.dosage} • {med.category} • {getMedicationDayLabel(med)}, {med.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!med.isTaken && (
                    <button
                      onClick={() => handleSnooze(med.id)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-full bg-gray-50 text-primary font-bold text-sm hover:bg-gray-100 transition-colors"
                    >
                      Snooze
                    </button>
                  )}
                  <button
                    onClick={() => handleTakeMedicine(med.id)}
                    disabled={med.isTaken}
                    className={cn(
                      "flex-1 sm:flex-none px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm active:scale-95",
                      med.isTaken
                        ? "bg-success/10 text-success border border-success/20 cursor-default"
                        : med.status === 'missed'
                          ? "bg-alert text-white hover:bg-red-700 shadow-lg shadow-alert/20"
                          : "bg-primary text-white hover:bg-blue-700"
                    )}
                  >
                    {med.isTaken ? (
                      <div className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Taken</div>
                    ) : med.status === 'missed' ? 'Take Overdue Dose' : 'Mark as Taken'}
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            /* ✅ Empty State UI */
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] p-10 text-center">
              <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-text-primary">No medications scheduled</h4>
              <button
                onClick={() => navigate('/patient/medications')}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-full font-bold text-sm"
              >
                Add Medication
              </button>
            </div>
          )}
        </div>
      </section>
      {/* Mini Progress Chart Section */}
      <section className="bg-white rounded-[32px] p-6 soft-shadow border border-gray-50 overflow-hidden relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-text-primary antialiased">Weekly Adherence</h3>
            <p className="text-sm text-text-secondary">Tracking your consistency over 7 days</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">Avg. 94%</span>
          </div>
        </div>
        <div className="flex items-end justify-between h-32 gap-3 mt-4">
          {MOCK_INSIGHTS.weeklyData.map((data) => (
            <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${data.rate}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "w-full rounded-t-lg relative",
                  data.day === 'Thu' ? "bg-primary" : "bg-blue-100"
                )}
              >
                {data.day === 'Thu' && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-bold">92</div>
                )}
              </motion.div>
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", data.day === 'Thu' ? "text-primary" : "text-gray-400")}>
                {data.day.charAt(0)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Popup Logic */}
      <AnimatePresence>
        {activeReminder && (
          <ReminderPopup
            medication={activeReminder}
            onTake={() => handleTakeMedicine(activeReminder.id)}
            onClose={() => handleSnooze(activeReminder.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
export default PatientHome;
