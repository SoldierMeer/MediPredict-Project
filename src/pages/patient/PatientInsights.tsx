import React from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, Pill, Timer, Lightbulb, ChevronRight, Share2 } from 'lucide-react';
import { MOCK_INSIGHTS } from '../../data/mockData';
import { cn } from '../../utils/cn';

const PatientInsights: React.FC = () => {
  return (
    <div className="space-y-8 mt-4 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-text-primary font-display tracking-tight">Insights</h1>
        <p className="text-text-secondary">Your health trends and AI predictions</p>
      </div>

      {/* AI Risk Prediction Card (Critical Alert) */}
      <motion.section 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-[32px] bg-red-50/30 border-l-4 border-alert p-6 flex gap-4 items-start shadow-sm"
      >
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-alert/10 flex items-center justify-center">
          <AlertCircle className="text-alert w-6 h-6 fill-current opacity-20" />
          <AlertCircle className="text-alert w-6 h-6 absolute" />
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-bold text-alert mb-1">Risk Alert</h3>
          <p className="text-sm text-on-error-container leading-relaxed">
            <span className="font-bold text-text-primary">High risk of missing tonight’s dose.</span> AI detected a disruption in your typical evening routine.
          </p>
          <button className="mt-4 px-6 py-2.5 bg-alert text-white rounded-full text-xs font-bold hover:bg-red-700 transition-all shadow-sm active:scale-95">
            Set Reminder
          </button>
        </div>
      </motion.section>

      {/* Adherence Trends Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="md:col-span-2 bg-white rounded-[32px] p-6 soft-shadow border border-gray-50">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-xl font-bold text-text-primary uppercase tracking-tight">Adherence Trends</h2>
              <p className="text-xs text-text-secondary font-medium">7-Day medication consistency</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-extrabold text-primary font-display leading-none">{MOCK_INSIGHTS.adherenceRate}%</span>
              <p className="text-xs text-success font-bold flex items-center justify-end gap-1 mt-1">
                <TrendingUp className="w-3.5 h-3.5" /> {MOCK_INSIGHTS.riskTrend}
              </p>
            </div>
          </div>

          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_INSIGHTS.weeklyData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004ac6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#004ac6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="rate" stroke="#004ac6" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-surface-container-low rounded-[28px] p-6 border border-white flex flex-col justify-between hover:bg-surface-container transition-colors group">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Pill className="text-primary w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Missed Doses</h4>
            <p className="text-2xl font-bold text-text-primary leading-none">
              {MOCK_INSIGHTS.missedDoses} <span className="text-sm text-text-secondary font-medium">/ {MOCK_INSIGHTS.totalDoses} doses</span>
            </p>
          </div>
        </section>

        <section className="bg-surface-container-low rounded-[28px] p-6 border border-white flex flex-col justify-between hover:bg-surface-container transition-colors group">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Timer className="text-success w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">On-Time Rate</h4>
            <p className="text-2xl font-bold text-text-primary leading-none">{MOCK_INSIGHTS.onTimeRate}%</p>
          </div>
        </section>
      </div>

      {/* Smart Health Advisory */}
      <section className="space-y-6 pt-4">
        <h3 className="text-xl font-bold text-text-primary px-1">Smart Health Advisory</h3>
        <div className="glass-card rounded-[32px] p-6 soft-shadow border border-white/50 flex gap-5">
          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-sm border-2 border-white">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSfL4fTGv2ATIKTKoxoKW3naOEVNm07m1SkeiqEpCKDyC5JGjZNQ5XKL3N5m0lhZRtYoHhlMe2QnoBwmlPGHheBLviWWlkMwafyZoq2RWJ7GgFCp4h4ttfbPdXfaCIpnwNxbubJjSyZD-Fdua9rSdqxxuIgKa4RVxS7AUt1rYGj7suXQlyqD8aebBzUiaE844hVbeVEo3yH5X42kwLdNcrs5yYNCC671b-gefUoYgZKKG2OY88Loc3sdXzNEUXLnqrAqttNEN1g8s" 
              alt="AI Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-2">
            <p className="text-base text-text-primary font-medium leading-relaxed">
              <span className="font-bold">Consistency is key!</span> You've taken your Lisinopril within a 15-minute window for 5 days straight. Your cardiovascular risk score is improving.
            </p>
            <p className="text-xs text-primary flex items-center gap-1.5 font-bold">
              <Lightbulb className="w-3.5 h-3.5 fill-current" /> AI generated insight
            </p>
          </div>
        </div>

        <button className="w-full bg-white rounded-[24px] p-5 border border-gray-100 soft-shadow flex items-center justify-between hover:bg-gray-50 transition-all active:scale-[0.99]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-gray-500">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-text-primary">Share Report</p>
              <p className="text-xs text-text-secondary">Send weekly trends to Dr. Sarah</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </section>
    </div>
  );
};

export default PatientInsights;
