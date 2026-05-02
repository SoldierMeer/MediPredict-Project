import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Pill } from 'lucide-react';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex-grow flex flex-col items-center justify-center relative px-6 min-h-screen bg-radial-[circle_at_50%_50%] from-[#f3f3fe] to-[#faf8ff]">
      {/* Background Accents (Subtle AI/Neural patterns) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-[60%] -right-[5%] w-[35%] h-[35%] bg-secondary-container/30 rounded-full blur-[80px]"></div>
      </div>

      {/* Center Identity Cluster */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center text-center"
      >
        {/* Logo Icon */}
        <div className="relative mb-6 group">
          {/* Outer Glow */}
          <div className="absolute inset-0 bg-primary/20 rounded-[32px] blur-2xl group-hover:bg-primary/30 transition-all duration-700"></div>
          {/* Main Icon Container */}
          <div className="relative w-24 h-24 bg-white rounded-[28px] shadow-[0_12px_40px_rgba(0,74,198,0.12)] flex items-center justify-center border border-primary/5">
            <div className="flex items-center justify-center relative">
              <Pill className="text-primary w-12 h-12 fill-current" />
              <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1.5 border-4 border-white shadow-md">
                <span className="w-3 h-3 text-[10px] flex items-center justify-center">AI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="space-y-2">
          <h1 className="font-display text-4xl text-primary font-extrabold tracking-tight">MediPredict</h1>
          <p className="text-lg text-text-secondary tracking-wide">
            Smart Medication. <span className="text-primary-container font-semibold">Smarter Care.</span>
          </p>
        </div>
      </motion.div>

      {/* Loading / Progress Indicator */}
      <div className="absolute bottom-24 flex flex-col items-center w-full max-w-[200px]">
        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mb-2">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="h-full bg-primary rounded-full"
          />
        </div>
        <span className="text-xs text-gray-500 font-medium tracking-wide">Synchronizing health data...</span>
      </div>

      {/* Subtle Decorative Image */}
      <div className="absolute bottom-0 left-0 w-full h-[265px] opacity-5 pointer-events-none">
        <img 
          alt="Medical technology abstraction" 
          className="w-full h-full object-cover" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBt8Acaw95V9cPDqccH9odOlne5KpqffI-LIFlK8DYhQnaxZiwipHucry4xrui7owAl51US4lmLLB5r3k-CMrdl6vlaerm3CiFov1xLKG6iU-asIPDVkT55qkkd5HeEmxLnc3QyPtVY1-GKHjvjLQS3WaBlm27oMXmgSPuZl0D2f5hebC08f1utj4LG_XJVC3AWIqXJeqoweoTgRsELOhDvIFEFdrKVBitxTxnS0OjMxRs05fCtWO01IS6Y3OhY6XlbDpolsv6pj0E" 
        />
      </div>
    </div>
  );
};

export default SplashScreen;
