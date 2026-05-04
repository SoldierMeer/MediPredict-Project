import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'patient' | 'caregiver' | null;
export type LinkStatus = 'none' | 'pending' | 'accepted' | null;

interface UserContextType {
  role: UserRole;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  userDob: string | null;
  linkStatus: LinkStatus;
  patientCode: string | null;
  isLoggedIn: boolean;
  // ✅ AI & Behavioral Insights
  adherenceScore: number;
  latestRiskLevel: string;
  latestRiskInsight: string;
  // ✅ Caregiver Context
  activePatient: any | null;
  setActivePatient: (patient: any) => void;
  // ✅ Methods
  setRole: (role: UserRole) => void;
  setLinkStatus: (status: LinkStatus) => void;
  setAdherenceData: (score: number, level: string, insight: string) => void; // For real-time updates
  login: (
    role: UserRole, 
    id: string | number, 
    status: LinkStatus, 
    code: string | null, 
    name: string | null,
    email: string | null, 
    phone: string | null, 
    dob: string | null,
    score?: number,    // Added
    level?: string,    // Added
    insight?: string   // Added
  ) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Core User State
  const [role, setRoleState] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('mp_role');
    return (savedRole === "null" || !savedRole) ? null : (savedRole as UserRole);
  });
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('mp_userId') || null);
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem('mp_userName') || null);
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('mp_userEmail') || null);
  const [userPhone, setUserPhone] = useState<string | null>(() => localStorage.getItem('mp_userPhone') || null);
  const [userDob, setUserDob] = useState<string | null>(() => localStorage.getItem('mp_userDob') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('mp_isLoggedIn') === 'true');
  const [linkStatus, setLinkStatusState] = useState<LinkStatus>(() => (localStorage.getItem('mp_linkStatus') as LinkStatus) || 'none');
  const [patientCode, setPatientCodeState] = useState<string | null>(() => localStorage.getItem('mp_patientCode'));

  // 2. ✅ AI State with persistence
  const [adherenceScore, setAdherenceScore] = useState<number>(() => Number(localStorage.getItem('mp_adherenceScore')) || 0);
  const [latestRiskLevel, setLatestRiskLevel] = useState<string>(() => localStorage.getItem('mp_latestRiskLevel') || 'Stable');
  const [latestRiskInsight, setLatestRiskInsight] = useState<string>(() => localStorage.getItem('mp_latestRiskInsight') || 'Optimal management detected.');

  // 3. Caregiver State
  const [activePatient, setActivePatientState] = useState<any>(() => {
    const savedPatient = localStorage.getItem('active_patient');
    return savedPatient ? JSON.parse(savedPatient) : null;
  });

  const setActivePatient = (patient: any) => {
    setActivePatientState(patient);
    if (patient) localStorage.setItem('active_patient', JSON.stringify(patient));
    else localStorage.removeItem('active_patient');
  };

  // ✅ Method to update AI data after clicking "Taken" without a full re-login
  const setAdherenceData = (score: number, level: string, insight: string) => {
    setAdherenceScore(score);
    setLatestRiskLevel(level);
    setLatestRiskInsight(insight);
    localStorage.setItem('mp_adherenceScore', String(score));
    localStorage.setItem('mp_latestRiskLevel', level);
    localStorage.setItem('mp_latestRiskInsight', insight);
  };

  const login = (
    role: UserRole, id: string | number, status: LinkStatus, code: string | null, 
    name: string | null, email: string | null, phone: string | null, dob: string,
    score: number = 0, level: string = 'Stable', insight: string = 'Optimal management detected.'
  ) => {
    const stringId = String(id);
    setIsLoggedIn(true);
    setRoleState(role);
    setUserId(stringId);
    setLinkStatusState(status);
    setPatientCodeState(code);
    setUserName(name);
    setUserEmail(email);
    setUserPhone(phone);
    setUserDob(dob);
    
    // Set AI Data
    setAdherenceScore(score);
    setLatestRiskLevel(level);
    setLatestRiskInsight(insight);

    localStorage.setItem('mp_isLoggedIn', 'true');
    localStorage.setItem('mp_userId', stringId);
    localStorage.setItem('mp_linkStatus', status as string);
    localStorage.setItem('mp_userDob', dob || '');
    localStorage.setItem('mp_adherenceScore', String(score));
    localStorage.setItem('mp_latestRiskLevel', level);
    localStorage.setItem('mp_latestRiskInsight', insight);
    
    if (code) localStorage.setItem('mp_patientCode', code);
    if (name) localStorage.setItem('mp_userName', name);
    if (email) localStorage.setItem('mp_userEmail', email);
    if (phone) localStorage.setItem('mp_userPhone', phone);
    if (role) localStorage.setItem('mp_role', role);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setRoleState(null);
    setUserId(null);
    setUserName(null);
    setUserEmail(null);
    setUserPhone(null);
    setLinkStatusState('none');
    setUserDob(null);
    setAdherenceScore(0);
    setLatestRiskLevel('Stable');
    setLatestRiskInsight('');
    setActivePatientState(null);
    localStorage.clear();
  };

  return (
    <UserContext.Provider value={{ 
      role, userId, userName, userEmail, userPhone, userDob, linkStatus, patientCode,
      isLoggedIn, adherenceScore, latestRiskLevel, latestRiskInsight, activePatient,
      setRole: (r) => { setRoleState(r); if(r) localStorage.setItem('mp_role', r); },
      setLinkStatus: (s) => { setLinkStatusState(s); if(s) localStorage.setItem('mp_linkStatus', s); },
      setAdherenceData, setActivePatient, login, logout
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error('useUser must be used within a UserProvider');
  return context;
};