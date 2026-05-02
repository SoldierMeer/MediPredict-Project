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
        const res = await api.get(`/auth/links/pending/${userId}`);
        setPendingLinks(res.data);
      } catch (err) { console.error(err); }
    };
    if (userId) fetchLinks();
    const interval = setInterval(fetchLinks, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleResponse = async (relId: number, action: 'accept' | 'reject') => {
    await api.post(`/auth/links/respond?rel_id=${relId}&action=${action}`);
    setPendingLinks(prev => prev.filter(link => link.rel_id !== relId));
    if (onStatusChange) onStatusChange();
  };

  if (pendingLinks.length === 0) return null;

  return (
    <div className="space-y-3">
      {pendingLinks.map((request) => (
        <div key={request.rel_id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-bold">{request.caregiver_email}</p>
            <p className="text-xs text-gray-500">Wants to link with you</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleResponse(request.rel_id, 'reject')} className="p-2 text-gray-400 hover:text-red-500"><X /></button>
            <button onClick={() => handleResponse(request.rel_id, 'accept')} className="p-2 bg-primary text-white rounded-lg"><Check /></button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PendingRequests;