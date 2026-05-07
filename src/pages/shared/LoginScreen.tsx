import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, Eye, EyeOff, ShieldCheck, 
  LockKeyhole, Loader2, Calendar, User, Phone, X, CheckCircle2 
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

  // 2. Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // 3. Dynamic Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  
    const payload = isLogin
      ? { email, password }
      : { 
          name, 
          email, 
          password, 
          phoneNumber: phone, 
          dob, 
          gender: 'male' 
        };
  
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
  
    try {
      const response = await api.post(endpoint, payload);
  
      if (response.status === 200 || response.status === 201) {
        if (isLogin) {
          const { token, user } = response.data;
          localStorage.setItem('med_app_token', token);
  
          login(
            user.role, 
            user.id, 
            'none', 
            user.patientCode, 
            user.name, 
            user.email, 
            user.phoneNumber, 
            user.dob 
          );

          if (!user.role) {
            navigate('/select-role');
          } else if (user.role === 'patient') {
            navigate('/patient/home');
          } else if (user.role === 'caregiver') {
            navigate('/caregiver/dashboard');
          }
        } else {
          // ✅ FIX: Transition from Signup to Login
          alert("Account created successfully! Please login with your credentials.");
          setName('');
          setPhone('');
          setDob('');
          setIsLogin(true); // Switch view
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Authentication failed.";
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      alert("Recovery link sent! Please check your email.");
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (err: any) {
      alert(err.response?.data?.error || "Could not process request.");
    } finally {
      setIsResetting(false);
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
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
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

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-sm font-bold text-text-primary" htmlFor="password">Password</label>
                {/* ✅ FIX: Forgot Password Trigger */}
                {isLogin && (
                  <button 
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-semibold text-primary hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
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

      {/* ✅ Reset Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowForgotModal(false)} 
              className="absolute inset-0 bg-primary/20 backdrop-blur-sm cursor-pointer" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="bg-white rounded-[40px] p-8 w-full max-w-sm soft-shadow relative z-10 border border-gray-100"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-center text-text-primary tracking-tight mb-2">Reset Password</h3>
              <p className="text-center text-text-secondary text-sm mb-8">Enter your email and we'll send you a recovery link.</p>
              
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low rounded-xl border border-transparent focus:bg-white focus:border-primary outline-none transition-all"
                    placeholder="name@example.com"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isResetting}
                  className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center cursor-pointer"
                >
                  {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
                </motion.button>
                <button 
                  type="button"
                  onClick={() => setShowForgotModal(false)} 
                  className="w-full py-2 text-text-secondary font-bold text-sm cursor-pointer"
                >
                  Back to Login
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginScreen;