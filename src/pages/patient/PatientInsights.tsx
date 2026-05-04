import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, Pill, Timer, Lightbulb, ChevronRight, Share2, CheckCircle2, ShieldAlert, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useMeds } from '../../context/MedicationContext';

const PatientInsights: React.FC = () => {
  const { aiInsights, isLoading, adherenceHistory } = useMeds();

  // ✅ Transformation: Convert raw logs into a 7-day trend for the chart
  const trendData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];

      const dayLogs = adherenceHistory?.filter(log => log.date === dateStr) || [];
      const total = dayLogs.length;
      
      const weightedScore = dayLogs.reduce((acc, log) => {
        if (log.status === 'taken') return acc + 1;
        if (log.status === 'late') return acc + 0.7; // AI-aligned weighting
        return acc;
      }, 0);

      const rate = total === 0 ? 0 : Math.round((weightedScore / total) * 100);
      return { day: dayName, rate, date: dateStr };
    });
  }, [adherenceHistory]);

  const getRiskStyles = (level: string) => {
    switch (level) {
      case 'Critical':
        return {
          bg: "bg-red-50/50 border-red-200",
          text: "text-red-600",
          icon: <ShieldAlert className="w-6 h-6 text-red-600" />,
          title: "Critical Intervention Required"
        };
      case 'Warning':
        return {
          bg: "bg-orange-50/50 border-orange-200",
          text: "text-orange-600",
          icon: <AlertCircle className="w-6 h-6 text-orange-600" />,
          title: "Adherence Warning"
        };
      default:
        return {
          bg: "bg-blue-50/50 border-blue-200",
          text: "text-primary",
          icon: <CheckCircle2 className="w-6 h-6 text-primary" />,
          title: "System Stable"
        };
    }
  };

  const risk = getRiskStyles(aiInsights?.level || 'Stable');

  if (isLoading) return <div className="p-10 text-center font-bold text-primary animate-pulse">Syncing AI Models...</div>;

  return (
    <div className="space-y-6 mt-4 pb-20 animate-in fade-in duration-500">
      <header className="px-1">
        <h1 className="text-3xl font-extrabold text-text-primary font-display tracking-tight">Insights</h1>
        <p className="text-text-secondary font-medium">Real-time health trends and behavioral predictions</p>
      </header>

      {/* 🧠 Live AI Risk Prediction Card */}
      <motion.section 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          "relative overflow-hidden rounded-[32px] border p-6 flex gap-5 items-start shadow-sm",
          risk.bg
        )}
      >
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
          {risk.icon}
        </div>
        <div className="space-y-1">
          <h3 className={cn("text-lg font-bold", risk.text)}>{risk.title}</h3>
          <p className="text-sm text-gray-700 leading-relaxed font-medium">
            {aiInsights?.insight || "Your adherence pattern is currently within optimal parameters."}
          </p>
        </div>
      </motion.section>

      {/* 📊 Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Large Trend Card */}
        <section className="md:col-span-2 bg-white rounded-[32px] p-8 soft-shadow border border-gray-50 flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4" /> Adherence Trends
              </h2>
              <p className="text-xs text-gray-400 font-medium">Historical consistency analysis</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-primary font-display leading-none">
                {aiInsights?.score || 0}%
              </span>
              <p className="text-[10px] text-success font-black uppercase tracking-wider mt-1">
                Healthy Pattern
              </p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
                  dy={10}
                />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#2563eb" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorRate)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Small Metric Stack */}
        <div className="flex flex-col gap-6">
          <section className="bg-white rounded-[32px] p-6 soft-shadow border border-gray-50 flex-1 flex flex-col justify-between group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Consistency Score</h4>
              <p className="text-3xl font-black text-text-primary">
                {aiInsights?.score || '0'} <span className="text-sm text-gray-400 font-bold">/ 100</span>
              </p>
            </div>
          </section>

          <section className={cn(
            "rounded-[32px] p-6 soft-shadow border flex-1 flex flex-col justify-between transition-colors",
            aiInsights?.level === 'Warning' ? "bg-orange-50/30 border-orange-100" : "bg-white border-gray-50"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              aiInsights?.level === 'Warning' ? "bg-orange-100 text-orange-600" : "bg-green-50 text-success"
            )}>
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Risk Level</h4>
              <p className={cn("text-3xl font-black", risk.text)}>
                {aiInsights?.level || 'Stable'}
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* AI Advisory Section */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-text-primary px-1">AI Health Advisory</h3>
        <div className="bg-white rounded-[32px] p-6 soft-shadow border border-gray-50 flex gap-5 items-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
             <Lightbulb className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-text-primary font-bold leading-relaxed">
              {aiInsights?.insight || "Maintain your current pace to reach a 98% adherence rate by next week."}
            </p>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Real-time heuristic insight
            </p>
          </div>
        </div>

        <button className="w-full bg-white rounded-[24px] p-5 border border-gray-100 soft-shadow flex items-center justify-between hover:bg-gray-50 transition-all active:scale-[0.98]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-text-primary">Share Report</p>
              <p className="text-xs text-text-secondary">Send live trends to your healthcare provider</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </button>
      </section>
    </div>
  );
};

export default PatientInsights;