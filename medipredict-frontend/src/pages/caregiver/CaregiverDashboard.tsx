import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, AlertTriangle, Send, Activity, Clock, CheckCircle2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useUser } from '../../context/UserContext';
import { useMeds } from '../../context/MedicationContext';
import api from '../../utils/api';

const CaregiverDashboard: React.FC = () => {
  const { activePatient } = useUser();
  const {
    aiInsights,
    adherenceHistory,
    refreshData
  } = useMeds();

  const [alerts, setAlerts] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [latestPatientName, setLatestPatientName] = useState(activePatient?.name || '');
  const [sent, setSent] = useState(false); // New state for feedback

  // 1. Sync Context with selected Patient
  useEffect(() => {
    const syncPatientContext = async () => {
      if (activePatient?._id) {
        const cleanId = activePatient._id.replace(/[^a-fA-F0-9]/g, '');
        await refreshData(cleanId);

        try {
          const userRes = await api.get(`/users/${cleanId}`);
          if (userRes.data?.name) setLatestPatientName(userRes.data.name);

          const alertsRes = await api.get(`/logs/recent/${cleanId}`);
          setAlerts(alertsRes.data);
        } catch (err) {
          console.error("Dashboard metadata fetch error:", err);
        }
      }
    };
    syncPatientContext();
  }, [activePatient?._id, refreshData]);

  // 2. Calculate Missed Doses
  const missedDosesCount = useMemo(() => {
    return adherenceHistory?.filter(log => log.status === 'missed').length || 0;
  }, [adherenceHistory]);

  // 3. Updated UI Theme Logic - Sync with Patient Dashboard
  const riskLevel = aiInsights?.level || 'Stable';
  const riskScore = aiInsights?.score || 0;

  const riskTheme = riskLevel === 'Critical'
    ? {
      text: 'text-alert',
      border: 'border-alert',
      bg: 'bg-red-50',
      badge: 'bg-red-100 text-red-700',
      bar: 'bg-alert',
      iconBg: 'bg-red-50'
    }
    : riskLevel === 'Warning'
      ? {
        text: 'text-warning',
        border: 'border-warning',
        bg: 'bg-amber-50',
        badge: 'bg-orange-100 text-orange-700',
        bar: 'bg-warning',
        iconBg: 'bg-amber-50'
      }
      : {
        text: 'text-success',
        border: 'border-success',
        bg: 'bg-green-50',
        badge: 'bg-green-100 text-green-700',
        bar: 'bg-primary',
        iconBg: 'bg-blue-50'
      };

  const handleSendReminder = async () => {
    if (!activePatient?._id || sent) return;
    setIsSending(true);
    try {
      await api.post(`/requests/send-reminder`, { patientId: activePatient._id });
      setSent(true); // Trigger success state
      setTimeout(() => setSent(false), 3000); // Reset after 3 seconds
    } catch (err) {
      console.error("Reminder failed:", err);
      alert("Could not send reminder. One might already be pending.");
    } finally {
      setIsSending(false);
    }
  };

  if (!activePatient) {
    return <div className="p-10 text-center font-bold text-text-secondary">Please select a patient from the Hub.</div>;
  }

  return (
    <div className="space-y-8 mt-4 pb-32 animate-in fade-in duration-500">
      {/* Patient Summary Section */}
      <section className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-on-surface tracking-tight font-display">
            Monitoring: {latestPatientName}
          </h2>
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border transition-colors",
              riskTheme.badge,
              riskTheme.border
            )}>
              {riskLevel} Condition
            </span>
            <span className="text-text-secondary text-xs font-bold uppercase tracking-tighter opacity-60">
              ID: #{activePatient._id?.slice(-5).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black text-xl uppercase">
            {latestPatientName.charAt(0)}
          </div>
        </div>
      </section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">

        {/* ✅ Updated Adherence Card (Synced with Patient UI) */}
        <motion.div className="bg-white p-5 rounded-3xl border border-slate-100 soft-shadow flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adherence</span>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", riskTheme.iconBg)}>
              <Activity className={cn("w-4 h-4", riskTheme.text)} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-4xl font-black transition-colors", riskTheme.text)}>
                {riskScore}%
              </span>
              <span className={cn("text-xs font-bold transition-colors", riskTheme.text)}>
                {riskLevel}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${riskScore}%` }}
                className={cn("h-full transition-all duration-1000", riskTheme.bar)}
              />
            </div>
          </div>
        </motion.div>

        {/* Missed Doses Card */}
        <motion.div className="bg-white p-5 rounded-3xl border border-slate-100 soft-shadow flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Missed Doses</span>
            <AlertTriangle className={cn("w-5 h-5", missedDosesCount > 0 ? "text-alert" : "text-slate-300")} />
          </div>
          <div>
            <span className="text-4xl font-black text-slate-800">{missedDosesCount}</span>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Total Logs Detected</p>
          </div>
        </motion.div>

        {/* AI Risk Level Card */}
        <motion.div
          className={cn(
            "p-5 rounded-3xl border-l-[6px] soft-shadow flex flex-col justify-between h-40 relative overflow-hidden transition-all bg-white",
            riskTheme.border
          )}
        >
          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Risk Level</span>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase", riskTheme.badge)}>
              {riskLevel}
            </span>
          </div>
          <div className="relative z-10">
            <h4 className={cn("text-2xl font-black mb-1", riskTheme.text)}>
              {riskLevel}
            </h4>
            <p className="text-[11px] text-slate-500 leading-tight line-clamp-2 font-medium">
              {aiInsights?.insight || "Analyzing behavioral patterns..."}
            </p>
          </div>
          <ShieldAlert className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-50 opacity-[0.03]" />
        </motion.div>
      </div>
      {/* Recent Alerts Section - Using adherenceHistory for consistency */}
      <section className="space-y-4 px-1">
        <h3 className="text-xl font-bold text-text-primary tracking-tight px-1">Recent Activity</h3>
        <div className="space-y-3">
          {/* ✅ We map adherenceHistory instead of 'alerts' to ensure sync with the 35% score */}
          {adherenceHistory && adherenceHistory.length > 0 ? (
            adherenceHistory.slice(0, 10).map((log: any) => {
              const isLate = log.status === 'late' || (log.latencyMinutes && log.latencyMinutes > 30);
              const isMissed = log.status === 'missed';

              const theme = isMissed
                ? { bg: "bg-red-50", text: "text-alert", icon: <ShieldAlert className="w-6 h-6" />, label: "Missed" }
                : isLate
                  ? { bg: "bg-amber-50", text: "text-warning", icon: <Clock className="w-6 h-6" />, label: "Late" }
                  : { bg: "bg-green-50", text: "text-success", icon: <CheckCircle2 className="w-6 h-6" />, label: "Taken" };

              return (
                <motion.div key={log._id} className="flex gap-4 p-5 bg-white border border-slate-100 rounded-3xl soft-shadow">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", theme.bg, theme.text)}>
                    {theme.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-text-primary">
                        <span className={cn("mr-1", theme.text)}>{theme.label}:</span>
                        {log.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-snug font-medium">
                      {isLate
                        ? `Recorded ${log.latencyMinutes || 0} minutes past the scheduled time.`
                        : isMissed
                          ? "Dose was completely missed or skipped."
                          : "Medication taken according to the prescribed schedule."}
                    </p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <p className="text-center text-xs text-gray-400 font-bold uppercase tracking-widest py-8">No logs available</p>
          )}
        </div>
      </section>


      <section className="pt-4 px-1">
        <button
          onClick={handleSendReminder}
          disabled={isSending || sent}
          className={cn(
            "w-full py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg",
            sent
              ? "bg-success text-white shadow-success/20"
              : "bg-primary text-white shadow-primary/25 hover:bg-blue-700 disabled:opacity-50"
          )}
        >
          {isSending ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Clock className="w-5 h-5" />
              </motion.div>
              Syncing nudge...
            </>
          ) : sent ? (
            <>
              <CheckCircle2 className="w-6 h-6 animate-in zoom-in" />
              Reminder Sent!
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Reminder
            </>
          )}
        </button>
      </section>
    </div>
  );
};

export default CaregiverDashboard;