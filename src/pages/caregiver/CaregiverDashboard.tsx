import React from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ShieldAlert, Pill, TrendingUp, AlertTriangle, Send, ChevronRight, History, Activity } from 'lucide-react';
import { MOCK_INSIGHTS } from '../../data/mockData';
import { cn } from '../../utils/cn';
import { useUser } from '@/src/context/UserContext';
import {useState, useEffect} from 'react'
import api from '../../utils/api'; // ✅ Add this import

const CaregiverDashboard: React.FC = () => {

  const { activePatient, userName } = useUser(); 
  const [meds, setMeds] = useState([]); // ✅ Define the state

  useEffect(() => {
    if (activePatient?._id) {
      api.get(`/medications/patient/${activePatient._id}`)
        .then(res => setMeds(res.data))
        .catch(err => console.error(err));
    }
  }, [activePatient]);

  if (!activePatient) {
    return <div className="p-10 text-center">Please select a patient from the Hub.</div>;
  }

  return (
    <div className="space-y-8 mt-4 pb-32 animate-in fade-in duration-500">
      {/* Patient Summary Section */}
      <section className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-on-surface tracking-tight font-display">Monitoring: {activePatient.name}</h2>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-primary px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-blue-200">Stable Condition</span>
            <span className="text-text-secondary text-xs font-bold uppercase tracking-tighter opacity-60">ID: #88219</span>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden transition-transform hover:scale-105">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDcuyq8hx03ZdbnrAIKJyVT9_sbHBlar07zomxp1yUK_VJs6IUpt2TEKt54-o4jplXx43ZVF0W5pvraPXBW9MXu0HxWX4JC54P09oxY2DpvHVi45tsJszRYdcXSfG6mvVjGEOvJyFhLeBPjE2GtRrjyv_mKmwwcQAWQQoNSFaoTxPjb4B8mGzEA_nj-vPY8VE8JkW8Ih_LCGOP5oQLf7h20g--bW3Xiqx8sryoYwFipfNIQ9SdyyZAu4ybCsUjzK1Sw-lE7A_DNgA" 
            alt="Patient" 
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Adherence Card */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="col-span-2 bg-white p-6 rounded-[32px] border border-slate-100 soft-shadow flex flex-col justify-between h-48 relative overflow-hidden"
        >
          <div className="relative z-10">
            <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">Weekly Adherence</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-5xl font-extrabold tracking-tight text-primary font-display">{MOCK_INSIGHTS.adherenceRate}%</span>
              <span className="text-success font-extrabold text-xs flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> 4%
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-auto relative z-10 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "85%" }}
              transition={{ duration: 1, delay: 0.2 }}
              className="bg-primary h-full rounded-full transition-all" 
            />
          </div>
          {/* Abstract Background Detail */}
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-50"></div>
        </motion.div>

        {/* AI Risk Level Card */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white p-5 rounded-[28px] border border-slate-100 soft-shadow flex flex-col justify-between aspect-square"
        >
          <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">AI Risk Level</span>
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-20 h-10 overflow-hidden">
              <div className="absolute top-0 left-0 w-20 h-20 border-[8px] border-slate-100 rounded-full"></div>
              <motion.div 
                initial={{ rotate: -135 }}
                animate={{ rotate: -45 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-0 left-0 w-20 h-20 border-[8px] border-warning rounded-full border-b-transparent border-l-transparent transition-all"
              />
            </div>
            <span className="text-xl font-extrabold text-warning mt-3 tracking-tight">Medium</span>
          </div>
          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tight opacity-80">Recent missed doses</p>
        </motion.div>

        {/* Missed Doses Card */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white p-5 rounded-[28px] border border-slate-100 soft-shadow flex flex-col justify-between aspect-square"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest">Missed Doses</span>
            <AlertTriangle className="text-alert w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-extrabold text-text-primary">2</span>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1 opacity-60">Past 48 hours</span>
          </div>
          <div className="flex gap-1.5">
            <div className="h-1 flex-1 bg-alert rounded-full"></div>
            <div className="h-1 flex-1 bg-alert rounded-full"></div>
            <div className="h-1 flex-1 bg-slate-100 rounded-full"></div>
          </div>
        </motion.div>
      </div>

      {/* Alerts Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <h3 className="text-xl font-bold text-text-primary tracking-tight">Recent Alerts</h3>
          <button className="text-primary font-bold text-xs hover:underline flex items-center gap-1">
             View History <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="space-y-3">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="flex gap-4 p-5 bg-white border border-slate-100 rounded-3xl soft-shadow transition-colors group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Pill className="text-warning w-6 h-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary">Missed: Metformin</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2h ago</span>
              </div>
              <p className="text-sm text-text-secondary leading-snug">Evening dose of 500mg was not logged by the dispenser.</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="flex gap-4 p-5 bg-white border border-slate-100 rounded-3xl soft-shadow transition-colors group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Activity className="text-primary w-6 h-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary">Vitals Update</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">5h ago</span>
              </div>
              <p className="text-sm text-text-secondary leading-snug">Blood pressure is slightly elevated (135/85) but within range.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Primary Action */}
      <section className="pt-4">
        <button className="w-full bg-primary text-white py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all hover:bg-blue-700">
          <Send className="w-5 h-5" />
          Send Reminder
        </button>
      </section>
    </div>
  );
};

export default CaregiverDashboard;
