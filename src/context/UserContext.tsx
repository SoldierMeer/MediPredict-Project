import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'patient' | 'caregiver' | null;
export type LinkStatus = 'none' | 'pending' | 'accepted' | null;

interface UserContextType {
  role: UserRole;
  userId: string | null; // Added this
  userName: string | null;   // Added
  userEmail: string | null;  // Added
  userPhone: string | null;
  linkStatus: LinkStatus;
  patientCode: string | null;
  userDob: string | null;
  setRole: (role: UserRole) => void;
  setLinkStatus: (status: LinkStatus) => void;
  isLoggedIn: boolean;
  login: (role: UserRole, id: string | number, status: LinkStatus, code: string | null, name: string | null,    // Added
    email: string | null,   // Added
    phone: string | null, dob: string | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from LocalStorage
  const [role, setRoleState] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('mp_role');
    return (savedRole === "null" || !savedRole) ? null : (savedRole as UserRole);
  });
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('mp_userId') || null);
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem('mp_userName') || null);
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('mp_userEmail') || null);
  const [userPhone, setUserPhone] = useState<string | null>(() => localStorage.getItem('mp_userPhone') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('mp_isLoggedIn') === 'true');
  const [linkStatus, setLinkStatusState] = useState<LinkStatus>(() => (localStorage.getItem('mp_linkStatus') as LinkStatus) || 'none');
  const [patientCode, setPatientCodeState] = useState<string | null>(() => localStorage.getItem('mp_patientCode'));
  const [userDob, setUserDob] = useState<string | null>(() => localStorage.getItem('mp_userDob') || null);

  const [activePatient, setActivePatientState] = useState<any>(() => {
    // ✅ Check localStorage on startup to persist selection after refresh
    const savedPatient = localStorage.getItem('active_patient');
    return savedPatient ? JSON.parse(savedPatient) : null;
  });

  const setActivePatient = (patient: any) => {
    setActivePatientState(patient);
    if (patient) {
      localStorage.setItem('active_patient', JSON.stringify(patient));
    } else {
      localStorage.removeItem('active_patient');
    }
  };

  const [loading, setLoading] = useState(true);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole) localStorage.setItem('mp_role', newRole);
    else localStorage.removeItem('mp_role');
  };

  const setLinkStatus = (status: LinkStatus) => {
    setLinkStatusState(status);
    if (status) localStorage.setItem('mp_linkStatus', status);
  };

  // 2. Updated Login to handle both Role and ID
  const login = (role: UserRole, id: string | number, status: LinkStatus, code: string | null, name: string | null, email: string | null, phone: string | null, dob:string) => {
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

    localStorage.setItem('mp_isLoggedIn', 'true');
    // localStorage.setItem('mp_role', role as string);
    localStorage.setItem('mp_userId', stringId);
    localStorage.setItem('mp_linkStatus', status as string);
    localStorage.setItem('mp_userDob', dob || '');
    if (code) localStorage.setItem('mp_patientCode', code);
    if (name) localStorage.setItem('mp_userName', name);
    if (email) localStorage.setItem('mp_userEmail', email);
    if (phone) localStorage.setItem('mp_userPhone', phone);
    if (role) localStorage.setItem('mp_role', role);
    else localStorage.removeItem('mp_role'); 

    // ✅ FIX: Ensure date is stored as a string or empty
    localStorage.setItem('mp_userDob', dob || '');
  };

  // 3. Updated Logout to clear everything
  const logout = () => {
    setIsLoggedIn(false);
    setRoleState(null);
    setUserId(null);
    setUserName(null);   // ✅ Add this
    setUserEmail(null);  // ✅ Add this
    setUserPhone(null);  // ✅ Add this
    setLinkStatusState('none');
    setUserDob(null);
    localStorage.removeItem('active_patient');
  setActivePatientState(null);
    localStorage.clear();
};

  return (
    <UserContext.Provider value={{ 
      role, userId, userName, userEmail, userPhone, userDob, linkStatus,
      setRole, setLinkStatus, isLoggedIn, login, logout, patientCode, activePatient, setActivePatient
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};