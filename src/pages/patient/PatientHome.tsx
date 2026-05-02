import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Pill, Clock, Brain, ChevronRight, CheckCircle2, Copy, ShieldCheck } from 'lucide-react';
import { MOCK_INSIGHTS, type Medication } from '../../data/mockData';
import { cn } from '../../utils/cn';
import { useUser } from '../../context/UserContext';
import { useMedicationTimer } from '../../hooks/useMedicationTimer';
import ReminderPopup from '../../components/patient/ReminderPopup';
import PendingRequests from '../patient/PendingRequests';
import { useMeds } from '../../context/MedicationContext';

// ✅ Utility to sync behavioral data with the backend
const logAdherenceEvent = async (medication: Medication, status: 'taken' | 'missed') => {
  const token = localStorage.getItem('med_app_token');
  if (!token) return;

  // Helper to convert "08:42 AM" string to today's ISO timestamp
  const getScheduledISO = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12 && modifier === 'AM') hours = 0;
    if (modifier === 'PM' && hours !== 12) hours += 12;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  };

  const logData = {
    medicationName: medication.name,
    scheduledTime: getScheduledISO(medication.time),
    actualTakenTime: new Date().toISOString(),
    snoozeCount: medication.snoozeCount || 0,
    status: status,
  };

  try {
    const response = await fetch('http://localhost:5000/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(logData),
    });

    if (response.ok) {
      console.log(`✅ Telemetry: ${medication.name} marked as ${status}`);
    }
  } catch (error) {
    console.error("❌ Sync failed:", error);
  }
};

const getMedicationDayLabel = (med: Medication) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayName = daysOfWeek[new Date().getDay()];

  if (med.frequency === 'Daily') return 'Today';

  // Support for both "Custom" (UI) and "Specific Days" (Postman)
  if (med.frequency === 'Custom' || med.frequency === 'Specific Days') {
    if (Array.isArray(med.selectedDays) && med.selectedDays.length > 0) {
      return med.selectedDays.includes(todayName) 
        ? 'Today' 
        : med.selectedDays.join(', ');
    }
    // Debugging hint: if you see this, the array is missing in the frontend
    console.log("Missing array for:", med.name, med);
  }

  return med.frequency;
};

const PatientHome: React.FC = () => {
  const navigate = useNavigate();
  const { medications, setMedications } = useMeds();
  const { activeReminder, setActiveReminder } = useMedicationTimer(medications, setMedications);
  const { userId, userName, patientCode } = useUser();

  // ✅ Midnight Reset Logic
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
    const interval = setInterval(performMidnightReset, 3600000);
    return () => clearInterval(interval);
  }, [setMedications]);

  // ✅ Handle Mark as Taken + Telemetry
  const handleTakeMedicine = (id?: string) => {
    const targetId = id || activeReminder?.id;
    if (!targetId) return;

    const medToLog = medications.find(m => m.id === targetId);
    if (medToLog) {
      logAdherenceEvent(medToLog, 'taken'); // Safe API call outside state setter
    }

    setMedications(prev => prev.map(med =>
      med.id === targetId
        ? { ...med, isTaken: true, status: 'taken', snoozeUntil: null, snoozeCount: 0 }
        : med
    ));
    setActiveReminder(null);
  };

  // ✅ FIXED Handle Snooze: No side-effects inside setMedications
  const handleSnooze = (id?: string) => {
    const targetId = id || activeReminder?.id;
    if (!targetId) return;

    // 1. Find the target medication FIRST
    const targetMed = medications.find(m => m.id === targetId);
    if (!targetMed) return;

    const currentSnoozeCount = targetMed.snoozeCount || 0;

    // 2. Perform logic & side effects OUTSIDE the state setter
    if (currentSnoozeCount >= 2) {
      logAdherenceEvent(targetMed, 'missed');

      setMedications(prev => prev.map(m =>
        m.id === targetId ? { ...m, status: 'missed', snoozeUntil: null } : m
      ));
    } else {
      const nextNag = new Date(Date.now() + 3 * 60000);
      const h = nextNag.getHours() % 12 || 12;
      const mTime = nextNag.getMinutes().toString().padStart(2, '0');
      const ampm = nextNag.getHours() >= 12 ? 'PM' : 'AM';
      const formattedNextNag = `${h.toString().padStart(2, '0')}:${mTime} ${ampm}`;

      setMedications(prev => prev.map(m =>
        m.id === targetId ? {
          ...m,
          status: 'missed',
          snoozeUntil: formattedNextNag,
          snoozeCount: currentSnoozeCount + 1
        } : m
      ));
    }
    setActiveReminder(null);
  };

  // ---------------------------------------------------------
  // ✅ DATA CALCULATIONS
  // ---------------------------------------------------------
  const todayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];

  const todaysMeds = medications.filter(med => {
    const isActive = !med.isArchived;
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayName = daysOfWeek[new Date().getDay()];
  
    // ✅ New Logic: Check frequency OR the selectedDays array
    const isDueToday = 
      med.frequency === 'Daily' || 
      med.frequency.includes(todayName) || 
      (Array.isArray(med.selectedDays) && med.selectedDays.includes(todayName));
  
    return isActive && isDueToday;
  });

  const toMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) hours = 0;
    if (modifier === 'PM') hours += 12;
    return hours * 60 + minutes;
  };

  const sortedTodaysMeds = [...todaysMeds].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  const nextDose = sortedTodaysMeds.find(m => !m.isTaken);

  const visibleMeds = [...sortedTodaysMeds]
    .sort((a, b) => (a.isTaken === b.isTaken ? 0 : a.isTaken ? 1 : -1))
    .slice(0, 3);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Morning' : currentHour < 17 ? 'Afternoon' : 'Evening';
  const currentDayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
  // ---------------------------------------------------------
  return (
    <div className="space-y-8 mt-4 animate-in fade-in duration-500 pb-10">
      {/* Greeting Section */}
      <section className="px-1">
        <h2 className="text-3xl font-extrabold text-primary font-display antialiased tracking-tight">
          Good {greeting}, {userName?.split(' ')[0] || 'Meer'}
        </h2>
        <p className="text-text-secondary font-medium">Your health insights are updated for today.</p>
      </section>

      {/* 1. Connection Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/10 p-5 rounded-[32px] border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
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
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-2 pl-4 rounded-2xl border border-primary/10 w-full sm:w-auto">
          <span className="text-2xl font-mono font-black tracking-widest text-primary">
            {patientCode || "MP-0000"}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(patientCode || "");
              alert("Code copied to clipboard!");
            }}
            className="bg-primary text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-primary/20"
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
              <div className="py-2">
                <span className="text-sm font-bold text-success mb-1 block">All Done!</span>
                <span className="text-2xl font-bold text-text-primary block leading-tight mb-1">No Doses Remaining</span>
                <span className="text-xs text-text-secondary font-medium italic">Enjoy your {greeting.toLowerCase()}!</span>
              </div>
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
            <p className="text-xs text-text-secondary mt-2 leading-relaxed font-medium">Our models indicate optimal management of chronic conditions.</p>
          </div>
        </motion.div>
      </section>

      {/* Medication List Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-2xl font-bold text-text-primary antialiased">Today’s Medications</h3>
          <button onClick={() => navigate('/patient/medications')} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline active:scale-95 transition-transform">
            See All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {todaysMeds.length > 0 ? (
            visibleMeds.map((med) => (
              <motion.div
                key={med.id}
                layout
                whileHover={{ x: 4 }}
                className="bg-white rounded-[24px] p-5 soft-shadow border border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                    med.isTaken ? "bg-success/10 text-success" :
                      med.status === 'missed' ? "bg-alert/10 text-alert" : "bg-blue-50 text-primary"
                  )}>
                    <Pill className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-text-primary">{med.name}</h4>
                    <p className="text-xs text-text-secondary font-bold uppercase tracking-tight">
                      {med.dosage} • {med.category}
                    </p>
                    <p className="text-xs text-primary font-medium mt-0.5">
                      {getMedicationDayLabel(med)}, {med.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!med.isTaken && (
                    <button
                      onClick={() => handleSnooze(med.id)}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-gray-50 text-primary font-bold text-sm hover:bg-gray-100 transition-colors active:scale-95"
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
                          : "bg-primary text-white hover:bg-blue-700 shadow-lg shadow-primary/20"
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
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[32px] p-12 text-center">
              <div className="bg-white w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Pill className="w-8 h-8 text-gray-300" />
              </div>
              <h4 className="text-lg font-bold text-text-primary">No medications scheduled</h4>
              <p className="text-sm text-text-secondary mb-6">You're all caught up for now!</p>
              <button
                onClick={() => navigate('/patient/medications')}
                className="px-8 py-3 bg-primary text-white rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:bg-blue-700 transition-colors"
              >
                Add Medication
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Weekly Adherence Chart */}
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
        <div className="flex items-end justify-between h-32 gap-3 mt-4 px-2">
          {MOCK_INSIGHTS.weeklyData.map((data) => {
            const isToday = data.day === currentDayShort;
            return (
              <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${data.rate}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "w-full rounded-t-xl relative transition-colors",
                    isToday ? "bg-primary shadow-lg shadow-primary/20" : "bg-blue-50"
                  )}
                >
                  {isToday && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                      {data.rate}%
                    </div>
                  )}
                </motion.div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isToday ? "text-primary scale-110" : "text-gray-400"
                )}>
                  {data.day.charAt(0)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Reminder Popup */}
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
