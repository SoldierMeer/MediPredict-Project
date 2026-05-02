import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, Eye, EyeOff, ShieldCheck, 
  LockKeyhole, Loader2, Calendar, User, Phone 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../utils/api';
import { useUser } from '../../context/UserContext';

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useUser();

  // 1. Local State for Form Inputs
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Dynamic Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  
    // 1. Prepare data based on mode
    const payload = isLogin
      ? { email, password }
      : { email, password, name, phone, dob, role: 'unassigned' };
  
    const endpoint = isLogin ? '/auth/login' : '/auth/signup';
  
    try {
      const response = await api.post(endpoint, payload);
  
      if (response.status === 200 || response.status === 201) {
        // ✅ Destructure the new fields from your backend response
        const { 
          role, 
          user_id, 
          link_status, 
          patient_code, 
          name: resName, 
          email: resEmail, 
          phone: resPhone,
          dob: resDob
        } = response.data;
  
        // ✅ Pass all 7 arguments to the context login function
        login(
          role, 
          user_id, 
          link_status || 'none', 
          patient_code || null,
          resName || name,   // Fallback to local state if backend didn't send it
          resEmail || email, 
          resPhone || phone,
          resDob || dob
        );
  
        if (!isLogin) {
          navigate('/select-role');
        } else {
          if (role === 'patient') navigate('/patient/home');
          else if (role === 'caregiver') navigate('/caregiver/dashboard');
          else navigate('/select-role');
        }
      }
    } catch (err: any) {
      const rawDetail = err.response?.data?.detail;
      const errorMsg = Array.isArray(rawDetail)
        ? rawDetail[0]?.msg
        : (typeof rawDetail === 'string' ? rawDetail : "Authentication failed.");
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background font-sans text-on-surface min-h-screen flex flex-col items-center">
      <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-center px-6 py-4 h-16">
        <div className="flex items-center space-x-2">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <ShieldCheck className="text-primary w-6 h-6" />
          </div>
          <span className="text-xl font-extrabold text-primary tracking-tight">MediPredict</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md px-6 pt-24 pb-12 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col items-center text-center"
        >
          {/* Illustration Container */}
          <div className="relative w-full aspect-square max-w-[200px] mb-8 bg-primary/5 rounded-[32px] overflow-hidden flex items-center justify-center">
             <LockKeyhole className="text-primary w-12 h-12 fill-primary/5 z-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary mb-2">
            {isLogin ? 'Welcome back' : 'Join MediPredict'}
          </h1>
          <p className="text-text-secondary">Predicting your health, protecting your future.</p>
        </motion.div>

        <div className="bg-white p-8 rounded-[32px] soft-shadow border border-surface-container">
          {/* Toggle Switch */}
          <div className="flex p-1 bg-surface-container-low rounded-xl mb-8">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-primary'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-primary'}`}
            >
              Signup
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
          <AnimatePresence>
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-5 overflow-hidden"
              >
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-text-primary ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low rounded-xl border border-transparent focus:bg-white focus:border-primary outline-none transition-all placeholder:text-gray-400"
                      placeholder="Meer Muhammad"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-text-primary ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low rounded-xl border border-transparent focus:bg-white focus:border-primary outline-none transition-all placeholder:text-gray-400"
                      placeholder="+92 300 1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                </div>

                {/* DOB */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-text-primary ml-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low rounded-xl border border-transparent focus:bg-white focus:border-primary outline-none transition-all placeholder:text-gray-400"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-text-primary ml-1" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low rounded-xl border border-transparent focus:bg-white focus:border-primary outline-none transition-all placeholder:text-gray-400"
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-sm font-bold text-text-primary" htmlFor="password">Password</label>
                {isLogin && <a className="text-xs font-semibold text-primary hover:underline" href="#">Forgot?</a>}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-container-low rounded-xl border border-transparent focus:bg-white focus:border-primary outline-none transition-all placeholder:text-gray-400"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg active:scale-[0.98] transition-all duration-150 shadow-lg shadow-primary/20 hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center"
                type="submit"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isLogin ? 'Continue' : 'Create Account')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default LoginScreen;