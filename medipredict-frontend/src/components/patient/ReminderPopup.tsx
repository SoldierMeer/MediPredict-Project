import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pill, X, Clock, CheckCircle2, Timer, SkipForward, Sparkles } from 'lucide-react';
import { Medication } from '../../data/mockData';

interface ReminderPopupProps {
  medication: Medication;
  onClose: () => void;
  onTake: () => void;
}

const ReminderPopup: React.FC<ReminderPopupProps> = ({ medication, onClose, onTake }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md rounded-[32px] shadow-[0_20px_50px_rgba(0,74,198,0.15)] overflow-hidden flex flex-col"
      >
        {/* Close Button */}
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="px-8 pb-8 flex flex-col items-center text-center">
          {/* Visual Icon Anchor */}
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Pill className="w-10 h-10 text-primary fill-primary/10" />
          </div>

          <h1 className="text-2xl font-extrabold text-on-surface mb-2 font-display tracking-tight leading-tight">Time to take your medicine</h1>
          <p className="text-sm text-text-secondary mb-8 leading-relaxed font-medium">Consistent adherence is key to your wellness journey.</p>

          {/* Medicine Details Card */}
          <div className="w-full bg-surface-container-low rounded-[24px] p-5 mb-8 border-l-4 border-primary flex items-center gap-5 text-left border border-primary/5">
            <div className="bg-white p-3 rounded-2xl shadow-sm text-primary">
              <Pill className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-text-primary">{medication.name} {medication.dosage}</p>
              <div className="flex items-center gap-1.5 text-text-secondary mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">Scheduled for {medication.time}</span>
              </div>
            </div>
          </div>

          {/* Action Group */}
          <div className="w-full space-y-4">
            {/* Primary Action - FIXED LAYOUT */}
            <button
              onClick={onTake}
              className="w-full h-16 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>Taken</span>
            </button>

            {/* Secondary & Tertiary Row */}
            <div className="grid grid-cols-2 gap-4">
              <button onClick={onClose} className="h-16 bg-gray-100 text-primary font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-[0.98]">
                <Timer className="w-5 h-5" />
                Snooze
              </button>
              <button onClick={onClose} className="h-16 text-text-secondary font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-[0.98]">
                <SkipForward className="w-5 h-5" />
                Skip
              </button>
            </div>
          </div>
        </div>

        {/* Contextual Insight Footer */}
        <div className="bg-primary/5 px-8 py-5 border-t border-primary/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="text-primary w-5 h-5 fill-primary/10" />
          </div>
          <p className="text-xs text-primary font-bold italic text-left leading-relaxed">
            Predictive insight: You've been 98% consistent this week. Keep it up!
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ReminderPopup;
