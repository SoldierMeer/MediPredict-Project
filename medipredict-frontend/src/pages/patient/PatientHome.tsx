import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Pill, Clock, Brain, ChevronRight, CheckCircle2, Copy, ShieldCheck, Activity } from 'lucide-react';
import { type Medication } from '../../context/MedicationContext';
import { cn } from '../../utils/cn';
import { useUser } from '../../context/UserContext';
import { useMedicationTimer } from '../../hooks/useMedicationTimer';
import ReminderPopup from '../../components/patient/ReminderPopup';
import PendingRequests from '../patient/PendingRequests';
import { useMeds } from '../../context/MedicationContext';
import api from '../../utils/api';

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
  const { medications, setMedications, isLoading, refreshData, aiInsights, adherenceHistory } = useMeds();
  const { activeReminder, setActiveReminder } = useMedicationTimer(medications, setMedications);
  const { role, userId, userName, patientCode, adherenceScore, latestRiskLevel, latestRiskInsight, setAdherenceData, userPhone, // 👈 Added
    userDob, updateUser } = useUser();

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

  useEffect(() => {
    if (userId && !role) {
      navigate('/role-selector');
    }
  }, [userId, navigate]);

  useEffect(() => {
    const syncUserStats = async () => {
      if (!userId) return;
      try {
        // 1. ✅ Fetch the full latest profile (including the updated Name)
        const res = await api.get(`/users/profile/${userId}`);
        const { name, adherenceScore, latestRiskLevel, latestRiskInsight } = res.data;

        // 2. ✅ Update BOTH stats and profile info in the global context
        // This ensures the greeting "Good Morning, [Name]" updates immediately
        if (name) updateUser(name, userPhone, userDob); 

        setAdherenceData(
          adherenceScore || 0,
          latestRiskLevel || 'Stable',
          latestRiskInsight || 'Optimal management detected.'
        );
      } catch (err) {
        console.error("Failed to sync AI stats & profile on load:", err);
      }
    };

    syncUserStats();
  }, [userId, setAdherenceData, updateUser, userPhone, userDob]);


  // ✅ Handle Mark as Taken + Telemetry
  // ✅ handleToggleTaken: Optimistic + Real-time AI Sync
  const handleToggleTaken = async (med: any) => {
    const originalMeds = [...medications];

    // 1. OPTIMISTIC UPDATE: Flip the UI immediately for a snappy feel
    setMedications(prev => prev.map(m =>
      (m._id === med._id || m.id === med._id)
        ? { ...m, isTaken: !m.isTaken, status: !m.isTaken ? 'taken' : 'upcoming' }
        : m
    ));

    try {
      // 2. Perform the cloud sync
      const res = await api.patch(`/medications/${med._id}`, {
        isTaken: !med.isTaken,
        status: !med.isTaken ? 'taken' : 'upcoming'
      });

      // 3. Destructure the combined response (Med + AI Analysis)
      const { updatedMed, aiAnalysis } = res.data;

      // 4. Update the local med state with server-side calculated fields (e.g., latency)
      setMedications(prev => prev.map(m =>
        (m._id === med._id || m.id === med._id) ? { ...m, ...updatedMed } : m
      ));

      // 5. GLOBAL SYNC: Push the new score/level to UserContext to update the top cards
      if (aiAnalysis) {
        setAdherenceData(aiAnalysis.score, aiAnalysis.level, aiAnalysis.insight);
        console.log(`✅ Adherence Synced: ${aiAnalysis.score}%`);
      }

    } catch (err) {
      console.error("❌ Sync failed, rolling back:", err);
      // 6. ROLLBACK: Revert to original state on network failure
      setMedications(originalMeds);
      alert("Could not sync with cloud. Reverting changes.");
    }
  };

  // ✅ handleSnooze: Escalation + AI Insight Update
  const handleSnooze = async (id?: string) => {
    const targetId = id || activeReminder?.id || activeReminder?._id;
    if (!targetId) return;

    const targetMed = medications.find(m => m._id === targetId || m.id === targetId);
    if (!targetMed) return;

    const nextSnoozeCount = (targetMed.snoozeCount || 0) + 1;
    const newStatus = nextSnoozeCount > 2 ? 'missed' : 'upcoming';

    try {
      const nextNag = new Date(Date.now() + 3 * 60000);
      const formattedNextNag = nextNag.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

      // 1. Update snooze state on the server
      const res = await api.patch(`/medications/${targetId}`, {
        snoozeCount: nextSnoozeCount,
        status: newStatus,
        snoozeUntil: formattedNextNag
      });

      // 2. If the status flipped to 'missed', the AI score needs to update globally
      const { updatedMed, aiAnalysis } = res.data;

      if (aiAnalysis) {
        setAdherenceData(aiAnalysis.score, aiAnalysis.level, aiAnalysis.insight);
      }

      // 3. Telemetry: Log 'missed' only on the 3rd snooze (first time it flips)
      if (nextSnoozeCount === 3) {
        logAdherenceEvent(targetMed, 'missed');
      }

      // 4. Update local state and clear the reminder
      setMedications(prev => prev.map(m =>
        (m._id === targetId || m.id === targetId) ? { ...m, ...updatedMed } : m
      ));
      setActiveReminder(null);

    } catch (err) {
      console.error("Snooze sync failed:", err);
    }
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
      med.frequency?.includes(todayName) ||
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

  // Inside PatientHome.tsx, before the return statement

  // PatientHome.tsx (inside the component)

  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dayName = days[d.getDay()];
      // ✅ Sync date format with backend (YYYY-MM-DD)
      const dateStr = d.toLocaleDateString('en-CA');

      const dayLogs = adherenceHistory?.filter(log => log.dateString === dateStr) || [];

      if (dayLogs.length === 0) return { day: dayName, rate: 0 };

      // 1. ✅ CLINICAL WEIGHTING: Match aiEngine.js logic
      const dayPoints = dayLogs.reduce((acc, log) => {
        const lat = log.latencyMinutes || 0;
        if (log.status === 'missed' || lat >= 480) return acc + 0; // 8h+ = Failure
        if (lat > 60) return acc + 0.5; // 1h+ = 50% Penalty
        return acc + 1; // On-time
      }, 0);

      let rate = Math.round((dayPoints / dayLogs.length) * 100);

      // 2. ✅ TOXICITY OVERRIDE: Catch bulk-dosing on a per-day basis
      const timestamps = dayLogs.map(l => new Date(l.timestamp).getTime());
      let dayToxicity = false;
      dayLogs.forEach(log => {
        const sameTime = timestamps.filter(t =>
          Math.abs(t - new Date(log.timestamp).getTime()) < 10 * 60 * 1000
        ).length;
        if (sameTime >= 4) dayToxicity = true;
      });

      if (dayToxicity) rate = Math.min(rate, 35); // Force drop for toxicity

      return { day: dayName, rate };
    });
  };

  const getRiskTheme = (level: string) => {
    switch (level) {
      case 'Critical':
        return {
          text: 'text-red-600',
          border: 'border-red-500',
          badge: 'bg-red-100 text-red-700 border-red-200',
          label: 'CRITICAL'
        };
      case 'Warning':
        return {
          text: 'text-orange-600',
          border: 'border-orange-500',
          badge: 'bg-orange-100 text-orange-700 border-orange-200',
          label: 'WARNING'
        };
      default:
        return {
          text: 'text-green-600',
          border: 'border-green-500',
          badge: 'bg-green-100 text-green-700 border-green-200',
          label: 'STABLE'
        };
    }
  };
  const riskTheme = getRiskTheme(aiInsights?.level || 'Stable');
  const weeklyStats = getWeeklyData();
  // ---------------------------------------------------------
  return (
    <div className="space-y-8 mt-4 animate-in fade-in duration-500 pb-10">
      {/* Greeting Section */}
      <section className="px-1">
        <h2 className="text-3xl font-extrabold text-primary font-display antialiased tracking-tight">
          Good {greeting}, {userName}
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
            <CheckCircle2 className={cn(
              "w-5 h-5 fill-current/10",
              aiInsights?.level === 'Critical' ? "text-alert" : "text-primary"
            )} />
          </div>

          <div className="flex items-baseline gap-2">
            {/* ✅ Dynamic Number Color */}
            <span className={cn(
              "text-5xl font-bold font-display antialiased leading-none transition-colors",
              aiInsights?.level === 'Critical' ? "text-alert" : "text-primary"
            )}>
              {aiInsights?.score || 0}%
            </span>

            <span className={cn(
              "text-xs font-bold transition-colors uppercase tracking-tight",
              aiInsights?.level === 'Critical' ? "text-alert" :
                aiInsights?.level === 'Warning' ? "text-warning" : "text-success"
            )}>
              {aiInsights?.level || 'Stable'}
            </span>
          </div>

          <div className="mt-6 h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${aiInsights?.score}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={cn(
                "h-full rounded-full transition-all duration-500",
                aiInsights?.level === 'Critical' ? "bg-alert" : "bg-primary"
              )}
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
          className={cn(
            "bg-white rounded-[32px] p-6 soft-shadow flex flex-col justify-between relative overflow-hidden border-l-4 transition-all duration-500",
            riskTheme.border // ✅ Dynamically sets border-l-red-500, orange, or success
          )}
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Brain className="w-20 h-20" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">AI Risk Level</span>

            {/* ✅ Dynamic Badge */}
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors",
              riskTheme.badge // ✅ Dynamically sets bg/text/border colors
            )}>
              {riskTheme.label}
            </span>
          </div>

          <div>
            {/* ✅ Dynamic Main Heading */}
            <span className={cn(
              "text-4xl font-extrabold block leading-none transition-colors",
              riskTheme.text // ✅ Dynamically sets text-red-600, orange, or success
            )}>
              {aiInsights?.level || 'Stable'}
            </span>

            <p className="text-xs text-text-secondary mt-2 leading-relaxed font-medium">
              {aiInsights?.insight || 'Our models indicate optimal management of chronic conditions.'}
            </p>
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
                key={med.id || med._id}
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

                {/* Action Button Area - Snooze Removed for cleaner UX */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleTaken(med)}
                    disabled={med.isTaken}
                    className={cn(
                      "w-full sm:w-auto px-8 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm active:scale-95",
                      med.isTaken
                        ? "bg-success/10 text-success border border-success/20 cursor-default"
                        : med.status === 'missed'
                          ? "bg-alert text-white hover:bg-red-700 shadow-lg shadow-alert/20"
                          : "bg-primary text-white hover:bg-blue-700 shadow-lg shadow-primary/20"
                    )}
                  >
                    {med.isTaken ? (
                      <div className="flex items-center gap-1 justify-center">
                        <CheckCircle2 className="w-4 h-4" /> Taken
                      </div>
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
      {/* Weekly Adherence Section - Final Premium Polish */}
      <section className="bg-white rounded-[32px] p-8 soft-shadow border border-gray-50 overflow-hidden">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Weekly Adherence
            </h3>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em]">7-Day Behavioral Analysis</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-primary font-display tracking-tight">
              {aiInsights?.score || 0}%
            </span>
            <p className="text-[9px] font-black text-success uppercase tracking-widest mt-0.5">Avg. Score</p>
          </div>
        </div>

        {/* Container for the bars */}
        <div className="flex items-end justify-between h-28 px-2">
          {weeklyStats.map((data, index) => {
            const isToday = data.day === currentDayShort;

            // ✅ Dynamic colors based on AI thresholds
            const barColor = data.rate >= 90 ? "bg-success" :
              data.rate >= 70 ? "bg-primary" :
                data.rate > 0 ? "bg-orange-400" : "bg-gray-100";

            return (
              // ✅ Added cursor-pointer so the user knows they can hover
              <div key={data.day} className="flex flex-col items-center gap-4 group cursor-pointer">
                {/* Bar Wrapper with fixed width to prevent label wrapping */}
                <div className="relative w-3 h-28 flex items-end justify-center">

                  {/* ✅ FIXED TOOLTIP: Positioned statically at the top of the track, visible even at 0% */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 pointer-events-none z-30">
                    <div className="bg-text-primary text-white text-[10px] px-2 py-1 rounded-md font-black shadow-xl whitespace-nowrap">
                      {data.rate}%
                    </div>
                  </div>

                  {/* 1. Ghost Track (Background) */}
                  <div className="absolute inset-0 bg-gray-50 rounded-full w-full h-full" />

                  {/* 2. Active Progress Bar (Real Data) */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${data.rate}%` }}
                    transition={{
                      duration: 1.2,
                      delay: index * 0.1,
                      ease: [0.16, 1, 0.3, 1]
                    }}
                    className={cn(
                      "w-full rounded-full relative z-10 transition-all duration-500",
                      barColor,
                      isToday && "shadow-[0_0_15px_rgba(37,99,235,0.4)] ring-2 ring-white"
                    )}
                  />
                  {/* Note: Removed the nested tooltip from inside the motion.div */}
                </div>

                {/* 3. Fixed Day Label - Using first letter only to prevent glitches */}
                <span className={cn(
                  "text-[10px] font-black transition-colors w-6 text-center",
                  isToday ? "text-primary" : "text-gray-300 group-hover:text-gray-400"
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
            onTake={async () => {
              await handleToggleTaken(activeReminder);
              setActiveReminder(null);
            }}
            // Use the handleSnooze logic for the Snooze button
            onSnooze={() => handleSnooze(activeReminder._id || activeReminder.id)}
            // For 'Skip', you'd typically mark it as missed immediately
            onSkip={async () => {
              await api.patch(`/medications/${activeReminder._id}`, { status: 'missed' });
              if (userId) await refreshData(userId);
              setActiveReminder(null);
            }}
            onClose={() => setActiveReminder(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
export default PatientHome;
