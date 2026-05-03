import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, UserPlus } from 'lucide-react';
import api from '../../utils/api';

interface Request {
  _id: string;
  caregiverName: string;
  status: string;
}

const PendingRequests: React.FC<{ userId: string | null }> = ({ userId }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      // ✅ Hits the GET /api/requests/:userId endpoint
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

  const handleAction = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      // ✅ Hits the PATCH /api/requests/:requestId endpoint
      await api.patch(`/requests/${requestId}`, { status });
      
      // Remove the request from local state immediately
      setRequests(prev => prev.filter(r => r._id !== requestId));
      
      if (status === 'accepted') {
        alert("Caregiver added to your circle! Refreshing...");
        window.location.reload(); // Refresh to show the new card in CaregiverInfo
      }
    } catch (err) {
      alert("Failed to update request.");
    }
  };

  if (loading) return <div className="p-4 text-xs text-gray-400">Checking for requests...</div>;

  if (requests.length === 0) {
    return (
      <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-3xl p-6 text-center">
        <p className="text-sm text-gray-400 font-medium">No new connection requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {requests.map((req) => (
          <motion.div
            key={req._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-blue-50 p-4 rounded-[24px] shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">{req.caregiverName}</p>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase font-black">
                  <Clock className="w-3 h-3" />
                  <span>Pending Link</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAction(req._id, 'accepted')}
                className="w-10 h-10 bg-success/10 text-success rounded-full flex items-center justify-center hover:bg-success hover:text-white transition-all"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleAction(req._id, 'rejected')}
                className="w-10 h-10 bg-error/10 text-error rounded-full flex items-center justify-center hover:bg-error hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default PendingRequests;