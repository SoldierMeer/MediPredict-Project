import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, Phone, Shield, Bell, ShieldAlert, Users,
  LogOut, ChevronRight, ShieldCheck, Lock, Activity,
  ArrowLeft, Key, Calendar, Edit2, Cake, Moon
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { cn } from '../../utils/cn';
import { useState } from 'react';
import api from '../../utils/api';

const PatientSettings: React.FC = () => {
  const { logout, userName, userEmail, userPhone, userDob, userId, role, linkStatus } = useUser();
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [linkedCaregiver, setLinkedCaregiver] = useState({ name: 'Loading...', email: '' });
  const [notifications, setNotifications] = useState({
    medReminders: true,
    reportReady: true,
  });

  useEffect(() => {
    const fetchCaregiver = async () => {
      // Fetching the linked caregiver for this patient
      if (role === 'patient' && linkStatus === 'accepted' && userId) {
        try {
          const res = await api.get(`/auth/links/caregiver-detail/${userId}`);
          setLinkedCaregiver({
            name: res.data.name,
            email: res.data.email
          });
        } catch (err) {
          console.error("Error fetching linked caregiver:", err);
          setLinkedCaregiver({ name: "Not Linked", email: "" });
        }
      }
    };
    fetchCaregiver();
  }, [userId, role, linkStatus]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-8 mt-4 pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-primary font-display tracking-tight">Settings</h1>
        <p className="text-text-secondary text-sm">Personal profile & app preferences</p>
      </div>

      {/* Profile Section */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-text-primary px-2 antialiased">Account Profile</h2>
        <div className="bg-white rounded-[32px] overflow-hidden soft-shadow border border-gray-50 transition-all hover:border-primary/10">
          <div className="p-6 flex items-center gap-6 bg-primary/5 border-b border-primary/5">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-black border-4 border-white shadow-sm">
              {userName?.charAt(0) || <User />}
            </div>
            <div>
              <p className="text-2xl font-extrabold text-text-primary tracking-tight">{userName}</p>
              <p className="text-xs text-text-secondary font-medium">Sukkur, Sindh</p>
            </div>
            <button className="ml-auto bg-white p-2.5 rounded-xl shadow-sm text-primary hover:bg-primary hover:text-white transition-all transform active:scale-95">
              <Edit2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between p-5 px-6 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <Mail className="text-primary w-5 h-5" />
                <span className="text-sm font-bold text-text-primary">Email Address</span>
              </div>
              <span className="text-xs font-bold text-text-secondary">{userEmail}</span>
            </div>

            <div className="flex items-center justify-between p-5 px-6 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <Phone className="text-primary w-5 h-5" />
                <span className="text-sm font-bold text-text-primary">Phone Number</span>
              </div>
              <span className="text-xs font-bold text-text-secondary">{userPhone || "Not provided"}</span>
            </div>

            <div className="flex items-center justify-between p-5 px-6">
              <div className="flex items-center gap-3">
                <Cake className="text-primary w-5 h-5" />
                <span className="text-sm font-bold text-text-primary">Date of Birth</span>
              </div>
              <span className="text-xs font-bold text-text-secondary">
                {userDob ? new Date(userDob).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                }) : "Not provided"}
            </span>
            </div>
          </div>
        </div>
      </section>

      {/* Notification Settings */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-text-primary px-2 antialiased">Notifications</h2>
        <div className="bg-white rounded-[32px] overflow-hidden soft-shadow border border-gray-50">
          <AlertToggle
            title="Medication Reminders"
            desc="Get notified when it's time for your dose"
            checked={notifications.medReminders}
            onChange={() => toggleNotification('medReminders')}
          />
          <AlertToggle
            title="Health Risk Alerts"
            desc="Predictive insights and trend warnings"
            checked={notifications.reportReady}
            onChange={() => toggleNotification('reportReady')}
          />
        </div>
      </section>

      {/* App Preferences */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-text-primary px-2 antialiased">App Preferences</h2>
        <div className="bg-white rounded-[32px] overflow-hidden soft-shadow border border-gray-50">
          <div className="flex items-center justify-between p-5 px-6 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-primary">
                <Moon className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-text-primary">Dark Appearance</span>
            </div>
            <span className="text-xs font-bold text-text-secondary">System Default</span>
          </div>

          <motion.div
            whileTap={{ backgroundColor: "rgba(239, 68, 68, 0.05)" }}
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center justify-between p-5 px-6 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-error">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-error">Log Out</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </motion.div>
        </div>
      </section>

      {/* Footer Info */}
      <div className="text-center py-8 space-y-2">
        <div className="flex justify-center gap-4 text-gray-400 mb-2">
          <ShieldCheck className="w-4 h-4" />
          <Lock className="w-4 h-4" />
        </div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          MediPredict v2.4.0 • Built with Intelligent Precision
        </p>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] p-8 w-full max-w-sm soft-shadow relative z-10 border border-gray-100"
            >
              <div className="w-20 h-20 bg-red-50 rounded-[32px] flex items-center justify-center text-error mx-auto mb-6">
                <LogOut className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-extrabold text-center text-text-primary tracking-tight mb-2">Logout?</h3>
              <p className="text-center text-text-secondary text-sm mb-8">
                Are you sure you want to end your session?
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleLogout}
                  className="w-full py-4 bg-error text-white font-bold rounded-2xl shadow-lg shadow-error/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                  Yes, Log Out
                </button>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="w-full py-4 bg-gray-100 text-text-primary font-bold rounded-2xl hover:bg-gray-200 transition-colors active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientSettings;

// Add this at the very bottom of PatientSettings.tsx
const AlertToggle: React.FC<{ 
    title: string; 
    desc: string; 
    checked: boolean; 
    onChange: () => void 
}> = ({ title, desc, checked, onChange }) => (
    <div className="flex items-center justify-between p-5 px-6 border-b border-gray-50 last:border-0">
        <div className="flex flex-col max-w-[70%]">
            <span className="text-sm font-bold text-text-primary">{title}</span>
            <span className="text-[10px] text-text-secondary font-medium mt-1 uppercase tracking-widest leading-tight">
                {desc}
            </span>
        </div>
        <button
            type="button"
            onClick={onChange}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                checked ? "bg-primary" : "bg-gray-200"
            )}
        >
            <span
                className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    checked ? "translate-x-5" : "translate-x-0"
                )}
            />
        </button>
    </div>
);