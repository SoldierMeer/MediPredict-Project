import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, ChevronRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const SelectRoleScreen: React.FC = () => {
  const navigate = useNavigate();
  // ✅ Pull the existing identity data from context so we can re-save it during login()
  const {
    userId,
    userName,
    userEmail,
    userPhone,
    userDob,
    login,
    role,
    isLoggedIn
  } = useUser();

  // Guard: Redirect if session is invalid or role is already picked
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    } else if (role === 'patient') {
      navigate('/patient/home');
    } else if (role === 'caregiver') {
      navigate('/caregiver/dashboard');
    }
  }, [isLoggedIn, role, navigate]);

  const handleRoleSelection = async (selectedRole: 'patient' | 'caregiver') => {
    // Note: We don't need to check userId here because the 
    // backend will get it from the JWT token via authMiddleware.

    try {
      // 1. Update role in the Database
      // We use POST to match your router.post('/select-role', ...)
      const response = await api.post('/auth/select-role', {
        role: selectedRole
      });

      // The backend 'selectRole' function returns { message, user }
      const updatedUser = response.data.user;

      login(
        updatedUser.role,
        updatedUser._id || updatedUser.id, // ✅ Fallback in case of serialization differences
        'none',
        updatedUser.patientCode,
        updatedUser.name,
        updatedUser.email,
        updatedUser.phoneNumber,
        updatedUser.dob
      );

      // 3. Navigate to the appropriate dashboard
      if (selectedRole === 'patient') navigate('/patient/home');
      if (selectedRole === 'caregiver') navigate('/caregiver/hub');

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Could not update role.";
      console.error("Update Role Error:", error);
      alert(errorMsg);
    }
  };

  return (
    <div className="bg-background font-sans text-on-background min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-blue-50 shadow-sm shadow-blue-500/5 flex justify-between items-center w-full px-6 py-4 h-16">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-primary font-display">MediPredict</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden border border-primary/10">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQhZv-S62b9LKohqIKzbvizAZAbuLb55EKRu4OIKmTql9_-ZWJM6RkHOpqImqpsjJrQCjGjTG6YPuyP_TrelgngnJAqlhCeJBDcEfmyvZchP1IlZsWQ785iiZIl6miGhgH7avQDgnlJjrXXy-RNeBhsJsvdFsSN2vK9Dnc2bQ9q7AvG4ebZSqCZeFjqGjHiko-8yCbeeplzu9NETlJubmu1SsGvhvfXzj-20wZos36dNzUM-e7x9dc7Wo9iOgnT5MIEZbsKGGenJ4"
              alt="User Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-[640px] w-full text-center space-y-8">
          <section className="space-y-2">
            <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">Welcome to MediPredict</h1>
            <p className="text-lg text-text-secondary">Please select your primary role to customize your predictive healthcare experience.</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelection('patient')}
              className="group relative bg-white p-8 rounded-[32px] shadow-[0_4px_20px_0_rgba(93,156,236,0.08)] border-2 border-transparent hover:border-primary transition-all duration-300 text-left flex flex-col items-start"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300">
                <User className="text-primary w-8 h-8 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Patient</h3>
              <p className="text-sm text-text-secondary leading-relaxed">Manage your medications, track health metrics, and receive personalized risk alerts powered by AI.</p>
              <div className="mt-6 flex items-center text-primary font-bold text-sm">
                <span>Select Role</span>
                <ChevronRight className="ml-1 w-4 h-4" />
              </div>
            </motion.button>

            {/* Caregiver Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelection('caregiver')}
              className="group relative bg-white p-8 rounded-[32px] shadow-[0_4px_20px_0_rgba(93,156,236,0.08)] border-2 border-transparent hover:border-primary transition-all duration-300 text-left flex flex-col items-start"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300">
                <Users className="text-primary w-8 h-8 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Caregiver</h3>
              <p className="text-sm text-text-secondary leading-relaxed">Support a loved one by monitoring their medication adherence and receiving critical health trend notifications.</p>
              <div className="mt-6 flex items-center text-primary font-bold text-sm">
                <span>Select Role</span>
                <ChevronRight className="ml-1 w-4 h-4" />
              </div>
            </motion.button>
          </div>

          <div className="flex items-center justify-center gap-3 bg-blue-50/50 py-4 px-6 rounded-2xl border border-blue-100/50">
            <Sparkles className="text-blue-500 w-5 h-5 fill-blue-500/20" />
            <p className="text-sm text-primary font-medium italic text-left">
              MediPredict uses secure AI to analyze health patterns. Your choice helps us tailor specific insights for your journey.
            </p>
          </div>
        </div>
      </main>

      {/* <footer className="p-6 text-center">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-loose">
          Already have an account? <button onClick={() => navigate('/login')} className="text-primary hover:underline ml-1">Log In</button>
        </p>
      </footer> */}
    </div>
  );
};

export default SelectRoleScreen;
