import React, { useState, useEffect } from 'react';
import { UserPlus, X, Check } from 'lucide-react';
import api from '../../utils/api';

interface Props {
  userId: string | null;
  onStatusChange?: () => void;
}

const PendingRequests: React.FC<Props> = ({ userId, onStatusChange }) => {
  const [pendingLinks, setPendingLinks] = useState<any[]>([]);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        // ✅ Updated to match your new /api/requests/:userId route
        const res = await api.get(`/requests/${userId}`);
        setPendingLinks(res.data);
      } catch (err) { 
        console.error("Error fetching requests:", err); 
      }
    };

    if (userId) fetchLinks();
    
    // Keep the polling logic to catch new caregiver requests in real-time
    const interval = setInterval(fetchLinks, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleResponse = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      // ✅ Using PATCH to update status as defined in your requestController
      const statusValue = action === 'accept' ? 'accepted' : 'rejected';
      
      await api.patch(`/requests/${requestId}`, { status: statusValue });
      
      // Update local state immediately for a snappy UI
      setPendingLinks(prev => prev.filter(link => link._id !== requestId));
      
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error("Failed to respond to request:", err);
    }
  };

  if (pendingLinks.length === 0) return null;

  return (
    <div className="space-y-3">
      {pendingLinks.map((request) => (
        <div 
          key={request._id} 
          className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2"
        >
          <div>
            {/* ✅ Using caregiverName from your new Mongoose model */}
            <p className="text-sm font-bold text-text-primary">{request.caregiverName}</p>
            <p className="text-xs text-text-secondary">Wants to link with you</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleResponse(request._id, 'reject')} 
              className="p-2 text-gray-400 hover:text-alert transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <button 
              onClick={() => handleResponse(request._id, 'accept')} 
              className="p-2 bg-primary text-white rounded-xl hover:bg-blue-700 transition-all active:scale-90"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PendingRequests;