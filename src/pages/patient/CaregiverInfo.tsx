import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useUser } from '@/src/context/UserContext';
import api from '@/src/utils/api';
import { Phone, Mail, MapPin, CheckCircle2, MessageCircle, Share2, Info, UserPlus } from 'lucide-react';
import PendingRequests from './PendingRequests';

interface CaregiverData {
  name: string;
  email: string;
  phone: string;
  role_type: string;
}

const CaregiverInfo: React.FC = () => {
  

  const { userId } = useUser();
  const [caregiver, setCaregiver] = useState<CaregiverData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCaregiver = async () => {
      try {
        const res = await api.get(`/auth/links/caregiver-detail/${userId}`);
        setCaregiver(res.data);
      } catch (err) {
        console.error("No linked caregiver found or error fetching.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchCaregiver();
  }, [userId]);

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading caregiver details...</div>;

  if (!caregiver) {
    return (
      <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100 text-center">
        <p className="text-primary font-bold">No linked caregiver found.</p>
        <p className="text-sm text-text-secondary mt-2">Go to the Home screen to share your code.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-4 pb-24 animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-on-surface mb-1 font-display tracking-tight">Care Circle</h2>
        <p className="text-base text-text-secondary">Primary contact and caregiver details.</p>
      </div>
  
      {/* 1. New Connection Requests Section */}
      <section className="space-y-4 mb-8">
        <div className="flex items-center gap-2 px-1">
          <UserPlus className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-extrabold text-text-secondary uppercase tracking-widest">New Requests</h4>
        </div>
        <PendingRequests userId={userId} />
      </section>
  
      {/* 2. Caregiver Profile Card */}
      <section className="bg-white rounded-[32px] p-8 shadow-[0_4px_20px_rgba(90,155,213,0.08)] mb-8 overflow-hidden relative border border-blue-50/50">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
        
        <div className="flex items-center gap-6 mb-8 relative z-10">
          {/* Dynamic Avatar: First letter of name */}
          <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-black shadow-md border-4 border-white">
            {caregiver.name.charAt(0)}
          </div>
          <div>
            <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-primary text-[10px] font-extrabold mb-2 uppercase tracking-widest border border-blue-100">
              {caregiver.role_type}
            </span>
            <h3 className="text-2xl font-extrabold text-on-surface tracking-tight">{caregiver.name}</h3>
            <p className="text-sm text-text-secondary font-medium">Verified Connection</p>
          </div>
        </div>
  
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-4 p-4 bg-[#f8f9fe] rounded-2xl border border-slate-50 group hover:border-primary/20 transition-all">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-sm text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-text-secondary uppercase font-extrabold tracking-widest">Phone Number</p>
              <p className="text-lg text-on-surface font-bold tracking-tight">{caregiver.phone}</p>
            </div>
          </div>
  
          <div className="flex items-center gap-4 p-4 bg-[#f8f9fe] rounded-2xl border border-slate-50 group hover:border-primary/20 transition-all">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-sm text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-text-secondary uppercase font-extrabold tracking-widest">Email Address</p>
              <p className="text-lg text-on-surface font-bold tracking-tight">{caregiver.email}</p>
            </div>
          </div>
  
          {/* Note: We used a static location for now since it isn't in the DB yet */}
          <div className="flex items-center gap-4 p-4 bg-[#f8f9fe] rounded-2xl border border-slate-50 group hover:border-primary/20 transition-all">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-sm text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-text-secondary uppercase font-extrabold tracking-widest">Base Location</p>
              <p className="text-lg text-on-surface font-bold tracking-tight">Sukkur, Sindh</p>
            </div>
          </div>
        </div>
      </section>
  
      {/* 3. Relationship & Permissions */}
      <section>
        <h4 className="text-xs font-extrabold text-text-secondary mb-6 px-1 uppercase tracking-widest">Care Permissions</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col gap-3">
            <CheckCircle2 className="text-success w-6 h-6 fill-success/10" />
            <div>
              <p className="text-sm font-bold text-on-surface">Meds Access</p>
              <p className="text-[11px] text-text-secondary font-medium">Full oversight</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col gap-3">
            <CheckCircle2 className="text-success w-6 h-6 fill-success/10" />
            <div>
              <p className="text-sm font-bold text-on-surface">Emergency</p>
              <p className="text-[11px] text-text-secondary font-medium">Primary contact</p>
            </div>
          </div>
        </div>
      </section>
  
      {/* 4. Quick Actions */}
      <div className="flex flex-col gap-4 pt-4">
        <a 
          href={`mailto:${caregiver.email}`} 
          className="w-full h-16 bg-primary text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          Message {caregiver.name.split(' ')[0]}
        </a>
        <button className="w-full h-16 bg-white text-primary border border-primary/20 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-blue-50 active:scale-[0.98] transition-all">
          <Share2 className="w-5 h-5" />
          Share Health Logs
        </button>
      </div>
  
      {/* 5. Note Section */}
      <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
        <div className="flex gap-4">
          <Info className="text-primary w-6 h-6 shrink-0" />
          <p className="text-sm text-primary font-medium italic leading-relaxed">
            "{caregiver.name.split(' ')[0]} is notified automatically whenever a scheduled dose is missed for more than 30 minutes."
          </p>
        </div>
      </div>
    </div>
  );
}
export default CaregiverInfo;
