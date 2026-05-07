import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Phone, Bell, ShieldAlert,
  LogOut, ChevronRight, ShieldCheck, Lock,
  Edit2, Cake, X
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useSettings } from '../../context/SettingsContext';
import { cn } from '../../utils/cn';
import api from '../../utils/api';

const PatientSettings: React.FC = () => {
  const { logout, userName, userEmail, userPhone, userDob, userId, role, linkStatus, updateUser } = useUser();
  const { settings, updateSetting } = useSettings();
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [linkedCaregiver, setLinkedCaregiver] = useState({ name: 'Loading...', email: '' });

  const [formData, setFormData] = useState({
    name: userName || '',
    phone: userPhone || '',
    dob: userDob ? userDob.split('T')[0] : ''
  });

  useEffect(() => {
    const fetchCaregiver = async () => {
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

  const handleSaveProfile = async () => {
    try {
      const response = await api.put(`/auth/profile/update/${userId}`, formData);
      if (response.status === 200) {
        updateUser(formData.name, formData.phone, formData.dob);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  return (
    <div className="space-y-8 mt-4 pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 px-1">
        <h1 className="text-3xl font-extrabold text-primary font-display tracking-tight">Settings</h1>
        <p className="text-text-secondary text-sm font-medium">Personal profile & app preferences</p>
      </div>

      {/* Account Profile Section */}
      <section>
        <h2 className="text-xs font-black mb-4 text-gray-400 uppercase tracking-[0.2em] px-2">Account Profile</h2>
        <div className="bg-white rounded-[32px] overflow-hidden soft-shadow border border-gray-50">
          <div className="p-6 flex items-center gap-6 bg-primary/5 border-b border-primary/5">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-black border-4 border-white shadow-sm">
              {userName?.charAt(0) || <User />}
            </div>
            <div>
              <p className="text-2xl font-extrabold text-text-primary tracking-tight">{userName}</p>
              <p className="text-xs text-text-secondary font-medium uppercase tracking-widest">Sukkur, Sindh</p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="ml-auto bg-white p-2.5 rounded-xl shadow-sm text-primary hover:bg-primary hover:text-white transition-all active:scale-90"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col">
            <ProfileRow icon={Mail} label="Email Address" value={userEmail} />
            <ProfileRow icon={Phone} label="Phone Number" value={userPhone || "Not provided"} />
            <ProfileRow icon={Cake} label="Date of Birth" value={userDob ? new Date(userDob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Not provided"} />
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section>
        <h2 className="text-xs font-black mb-4 text-gray-400 uppercase tracking-[0.2em] px-2">Notifications</h2>
        <div className="bg-white rounded-[32px] overflow-hidden soft-shadow border border-gray-50">
          <AlertToggle
            title="Medication Reminders"
            desc="Get notified when it's time for your dose"
            checked={settings.reminders}
            onChange={() => updateSetting('reminders', !settings.reminders)}
          />
          <AlertToggle
            title="Health Risk Alerts"
            desc="Predictive insights and trend warnings"
            checked={settings.riskAlerts}
            onChange={() => updateSetting('riskAlerts', !settings.riskAlerts)}
          />
        </div>
      </section>

      {/* App Preferences Section */}
      <section>
        <h2 className="text-xs font-black mb-4 text-gray-400 uppercase tracking-[0.2em] px-2">Account & Security</h2>
        <div className="bg-white rounded-[32px] overflow-hidden soft-shadow border border-gray-50">
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
      <div className="text-center py-8 space-y-3 opacity-60">
        <div className="flex justify-center gap-6 text-gray-400">
          <ShieldCheck className="w-5 h-5" />
          <Lock className="w-5 h-5" />
        </div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">
          MediPredict v2.4.0 • Sukkur IBA AI Initiative
        </p>
      </div>

      {/* --- MODALS --- */}

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 pb-12 relative z-10 soft-shadow border border-gray-100"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 sm:hidden" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-text-primary tracking-tight">Edit Profile</h3>
                <button onClick={() => setIsEditing(false)} className="p-2 bg-gray-50 rounded-full text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-gray-100 text-text-primary font-bold rounded-2xl active:scale-95 transition-all">
                  Cancel
                </button>
                <button onClick={handleSaveProfile} className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-sm cursor-pointer"
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
              <p className="text-center text-text-secondary text-sm mb-8 font-medium">
                Are you sure you want to end your session?
              </p>

              <div className="space-y-3">
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    backgroundColor: "#dc2626",
                    boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.25)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className="w-full py-4 bg-error text-white font-bold rounded-2xl shadow-lg shadow-error/20 cursor-pointer transition-colors"
                >
                  Yes, Log Out
                </motion.button>

                <motion.button
                  whileHover={{
                    scale: 1.02,
                    backgroundColor: "#f3f4f6"
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLogoutModal(false)}
                  className="w-full py-4 bg-gray-50 text-text-primary font-bold rounded-2xl cursor-pointer transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProfileRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="flex items-center justify-between p-5 px-6 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-3">
      <Icon className="text-primary w-5 h-5" />
      <span className="text-sm font-bold text-text-primary">{label}</span>
    </div>
    <span className="text-xs font-bold text-text-secondary">{value}</span>
  </div>
);

const AlertToggle: React.FC<{ title: string; desc: string; checked: boolean; onChange: () => void }> = ({ title, desc, checked, onChange }) => (
  <div className="flex items-center justify-between p-5 px-6 border-b border-gray-50 last:border-0">
    <div className="flex flex-col max-w-[70%]">
      <span className="text-sm font-bold text-text-primary">{title}</span>
      <span className="text-[10px] text-text-secondary font-black mt-1 uppercase tracking-widest leading-tight">{desc}</span>
    </div>
    <button type="button" onClick={onChange} className={cn("relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none", checked ? "bg-primary" : "bg-gray-200")}>
      <motion.span animate={{ x: checked ? 20 : 0 }} className="pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg ring-0 transition duration-300" />
    </button>
  </div>
);

export default PatientSettings;