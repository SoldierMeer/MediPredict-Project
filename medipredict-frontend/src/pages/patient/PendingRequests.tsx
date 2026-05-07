import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, UserPlus, Bell } from 'lucide-react'; // Added Bell
import { cn } from '../../utils/cn';
import api from '../../utils/api';

interface Request {
  _id: string;
  caregiverName: string;
  type: 'link' | 'reminder'; // ✅ Added type
  message?: string;          // ✅ Added message
  status: string;
}

const PendingRequests: React.FC<{ userId: string | null }> = ({ userId }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.get(`/requests/${userId}`);
      setRequests(res.data);
    } catch (err) {
      console.error("Error fetching pending requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchRequests();
  }, [userId]);

  const handleAction = async (req: Request, action: 'confirm' | 'reject') => {
    try {
      const isLink = req.type === 'link';
      
      // ✅ Logic: Links get 'accepted', Reminders get 'dismissed'
      const newStatus = action === 'reject' 
        ? 'rejected' 
        : (isLink ? 'accepted' : 'dismissed');

      await api.patch(`/requests/${req._id}`, { status: newStatus });
      
      setRequests(prev => prev.filter(r => r._id !== req._id));
      
      if (newStatus === 'accepted') {
        alert("Caregiver added to your circle! Refreshing...");
        window.location.reload(); 
      } else if (newStatus === 'dismissed') {
        // Just a subtle feedback for reminders
        console.log("Reminder acknowledged");
      }
    } catch (err) {
      alert("Failed to update request.");
    }
  };

  if (loading) return <div className="p-4 text-xs text-gray-400 animate-pulse">Syncing requests...</div>;

  if (requests.length === 0) return null; // Hide section if empty

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {requests.map((req) => {
          const isLink = req.type === 'link';
          
          return (
            <motion.div
              key={req._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "bg-white border p-5 rounded-[32px] soft-shadow flex items-center justify-between transition-colors",
                isLink ? "border-blue-50" : "border-orange-50"
              )}
            >
              <div className="flex items-center gap-4">
                {/* ✅ Dynamic Icon and Color */}
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                  isLink ? "bg-primary/10 text-primary" : "bg-orange-100 text-orange-600"
                )}>
                  {isLink ? <UserPlus className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                </div>

                <div>
                  <h4 className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] mb-1",
                    isLink ? "text-primary/60" : "text-orange-600/60"
                  )}>
                    {isLink ? "Connection Request" : "Caregiver Nudge"}
                  </h4>
                  <p className="text-sm font-bold text-text-primary leading-tight">
                    {/* ✅ Show custom message for reminders, or name for links */}
                    {(req.caregiverId as any)?.name || "New Caregiver"} wants to link
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(req, 'confirm')}
                  className="w-10 h-10 bg-green-50 text-success rounded-full flex items-center justify-center hover:bg-success hover:text-white transition-all active:scale-90"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleAction(req, 'reject')}
                  className="w-10 h-10 bg-red-50 text-error rounded-full flex items-center justify-center hover:bg-error hover:text-white transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default PendingRequests;