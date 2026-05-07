import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, Shield,
    Bell, ShieldAlert, Users,
    LogOut, ChevronRight,
    Activity, ArrowLeft, Key,
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { useMeds } from '../../context/MedicationContext'; // ✅ Use the same data source
import { cn } from '../../utils/cn';
import api from '../../utils/api';

const CaregiverSettings: React.FC = () => {
    const { logout, userName, userEmail, userPhone, activePatient } = useUser();
    const { aiInsights, refreshData } = useMeds(); // ✅ Destructure global AI insights
    const navigate = useNavigate();

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [notifications, setNotifications] = useState({
        emergency: true,
        missedDose: true,
        dailySummary: false,
    });

    // 1. Sync Global Context with the selected Patient
    useEffect(() => {
        const syncPatientContext = async () => {
            const rawId = activePatient?._id || activePatient?.id;
            if (rawId) {
                // Sanitize ID (remove trailing underscores)
                const cleanId = rawId.replace(/[^a-fA-F0-9]/g, '');

                // Fetch latest data for this specific patient into the context
                await refreshData(cleanId);
            }
        };
        syncPatientContext();
    }, [activePatient, refreshData]);

    // 2. Helper uses aiInsights from context for the "Single Source of Truth"
    const displayPatient = {
        name: activePatient?.name || "No Patient Selected",
        code: activePatient?.patientCode || "---",
        adherence: aiInsights?.score ?? 0, // ✅ Live data from context
        risk: aiInsights?.level ?? 'Stable' // ✅ Live data from context
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleNotification = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="space-y-8 mt-4 pb-32 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 px-1">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 rounded-2xl bg-white soft-shadow border border-gray-50 text-gray-400 hover:text-primary transition-all active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-3xl font-extrabold text-primary font-display tracking-tight">Settings</h1>
                    <p className="text-text-secondary text-sm">Account & Preferences</p>
                </div>
            </div>

            {/* 1. Caregiver Personal Profile Card (Static Data) */}
            <section className="bg-white rounded-[32px] p-8 soft-shadow border border-gray-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
                <div className="flex items-center gap-6 mb-8 relative z-10">
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-black border-4 border-white shadow-sm">
                        {userName?.charAt(0) || <User />}
                    </div>
                    <div>
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-primary text-[10px] font-extrabold mb-2 uppercase tracking-widest border border-blue-100">
                            Primary Caregiver
                        </span>
                        <h3 className="text-2xl font-extrabold text-on-surface tracking-tight">{userName}</h3>
                        <p className="text-sm text-text-secondary font-medium">Sukkur, Sindh</p>
                    </div>
                </div>

                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-4 p-4 bg-[#f8f9fe] rounded-2xl border border-slate-50 transition-all">
                        <Mail className="text-primary w-5 h-5" />
                        <div>
                            <p className="text-[10px] text-text-secondary uppercase font-extrabold tracking-widest">Email Address</p>
                            <p className="text-sm text-on-surface font-bold">{userEmail}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-[#f8f9fe] rounded-2xl border border-slate-50 transition-all">
                        <Phone className="text-primary w-5 h-5" />
                        <div>
                            <p className="text-[10px] text-text-secondary uppercase font-extrabold tracking-widest">Phone Number</p>
                            <p className="text-sm text-on-surface font-bold">{userPhone}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Linked Patient Information Card (Live AI Data) */}
            <section>
                <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Selected Patient</h2>
                    <button
                        onClick={() => navigate('/caregiver/hub')}
                        className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-all"
                    >
                        Switch Patient
                    </button>
                </div>
                <div className="bg-primary rounded-[32px] p-6 text-white soft-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[64px] transition-all group-hover:scale-110" />

                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">Currently Monitoring</p>
                            <h3 className="text-2xl font-bold tracking-tight">{displayPatient.name}</h3>
                            <p className="text-white/60 font-mono text-xs mt-1">ID: {displayPatient.code}</p>
                        </div>
                        <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-4 h-4 text-white/70" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Adherence</span>
                            </div>
                            <div className="flex items-end gap-1">
                                <span className="text-2xl font-bold">{displayPatient.adherence}%</span>
                            </div>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldAlert className="w-4 h-4 text-white/70" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Risk Level</span>
                            </div>
                            <div className={cn(
                                "inline-flex px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider border",
                                displayPatient.risk === 'Critical' ? "bg-red-500/20 border-red-500/30" : "bg-white/10 border-white/20"
                            )}>
                                {displayPatient.risk}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Monitoring Alerts */}
            <section>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Monitoring Alerts</h2>
                <div className="bg-white rounded-[32px] overflow-hidden soft-shadow border border-gray-50 text-left">
                    <div className="flex items-center justify-between p-5 px-6 border-b border-gray-50">
                        <div className="flex flex-col max-w-[70%]">
                            <span className="text-sm font-bold text-text-primary">Emergency Alerts</span>
                            <span className="text-[10px] text-text-secondary font-medium mt-1 uppercase tracking-widest leading-relaxed">Immediate notification for critical patient events</span>
                        </div>
                        <ToggleSwitch
                            checked={notifications.emergency}
                            onChange={() => toggleNotification('emergency')}
                        />
                    </div>
                    <div className="flex items-center justify-between p-5 px-6">
                        <div className="flex flex-col max-w-[70%]">
                            <span className="text-sm font-bold text-text-primary">Missed Dose Alerts</span>
                            <span className="text-[10px] text-text-secondary font-medium mt-1 uppercase tracking-widest leading-relaxed">Alert when patient skips a scheduled medication</span>
                        </div>
                        <ToggleSwitch
                            checked={notifications.missedDose}
                            onChange={() => toggleNotification('missedDose')}
                        />
                    </div>
                </div>
            </section>

            {/* 4. Account & Security */}
            <section>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Account & Security</h2>
                <div className="bg-white rounded-[32px] overflow-hidden soft-shadow border border-gray-50">
                    <motion.button
                        // Use whileHover for the "pointer effect" and visual lift
                        whileHover={{
                            x: 4,
                            backgroundColor: "rgba(239, 68, 68, 0.05)",
                            boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.1)" // Subtle red-tinted shadow
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowLogoutModal(true)}
                        // Added cursor-pointer for explicit feedback
                        className="w-full flex items-center justify-between p-5 px-6 transition-all group cursor-pointer"
                    >
                        <div className="flex items-center gap-4">
                            {/* Icon container pops on hover */}
                            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-error transition-transform group-hover:scale-110 group-active:scale-95">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-bold text-error">Logout</span>
                        </div>

                        {/* Chevron slides slightly to the right */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-error/40 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                                End Session
                            </span>
                            <ChevronRight className="w-5 h-5 text-gray-300 transition-transform group-hover:translate-x-1" />
                        </div>
                    </motion.button>
                </div>
            </section>

            {/* Logout Modal */}
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
                                Are you sure you want to end your caregiver session?
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
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
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
);

export default CaregiverSettings;