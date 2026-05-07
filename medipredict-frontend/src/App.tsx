/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { SettingsProvider, useSettings } from './context/SettingsContext'; // ✅ Added useSettings
import { AnimatePresence } from 'motion/react';
import ProtectedRoute from './components/ProtectedRoute';
import { requestNotificationPermission } from './utils/notificationService';

// Shared Pages
import SplashScreen from './pages/shared/SplashScreen';
import LoginScreen from './pages/shared/LoginScreen';
import SelectRoleScreen from './pages/shared/SelectRoleScreen';

// Patient Pages
import PatientHome from './pages/patient/PatientHome';
import MedicationList from './pages/patient/MedicationList';
import PatientInsights from './pages/patient/PatientInsights';
import CaregiverInfo from './pages/patient/CaregiverInfo';
import PatientHistory from './pages/patient/PatientHistory';
import PatientSettings from './pages/patient/PatientSettings';
import ReminderPopup from './components/patient/ReminderPopup';

// Caregiver Pages
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard';
import CaregiverMedList from './pages/caregiver/CaregiverMedList';
import CaregiverSettings from './pages/caregiver/CaregiverSettings';
import PatientHub from './pages/caregiver/PatientHub';
import LinkPatientScreen from './pages/caregiver/LinkPatientScreen';

// Layouts
import AppLayout from './layouts/AppLayout';

// Data & Context
// import { MASTER_MEDICATIONS } from './data/mockData';
import { MedicationProvider } from './context/MedicationContext';

const AppRoutes = () => {
  const { role, isLoggedIn, activePatient } = useUser();
  const [showReminder, setShowReminder] = useState(false);
  const { settings } = useSettings();

  // Demo: Show reminder after 15 seconds for logged-in patients
  useEffect(() => {
    // Only start the timer if the user is a patient AND reminders are enabled
    if (isLoggedIn && role === 'patient' && settings.reminders) { 
      const timer = setTimeout(() => setShowReminder(true), 15000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, role, settings.reminders]);

  useEffect(() => {
    // Request permission on mount so we are ready for AI alerts
    requestNotificationPermission();
  }, []);

  return (
    <>
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        
        {/* --- Role Selection (Requires Auth) --- */}
        <Route path="/select-role" element={
          <ProtectedRoute>
            <SelectRoleScreen />
          </ProtectedRoute>
        } />

        {/* --- Patient Flow --- */}
        <Route path="/patient" element={
          <ProtectedRoute roleRequired="patient">
            <AppLayout title="MediPredict" />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<PatientHome />} />
          <Route path="medications" element={<MedicationList />} />
          <Route path="history" element={<PatientHistory />} />
          <Route path="insights" element={<PatientInsights />} />
          <Route path="caregiver" element={<CaregiverInfo />} />
          <Route path="settings" element={<PatientSettings />} />
        </Route>

        {/* --- Caregiver Flow --- */}
        <Route path="/caregiver" element={
          <ProtectedRoute roleRequired="caregiver">
            <AppLayout title="CarePulse" />
          </ProtectedRoute>
        }>
          {/* Landing Zone */}
          <Route index element={<Navigate to="hub" replace />} />
          <Route path="hub" element={<PatientHub />} />
          <Route path="link-patient" element={<LinkPatientScreen />} />
          <Route path="settings" element={<CaregiverSettings />} />

          {/* Patient-Specific Data (Requires activePatient selection) */}
          <Route 
            path="dashboard" 
            element={activePatient ? <CaregiverDashboard /> : <Navigate to="/caregiver/hub" replace />} 
          />
          <Route 
            path="medications" 
            element={activePatient ? <CaregiverMedList /> : <Navigate to="/caregiver/hub" replace />} 
          />
          <Route 
            path="insights" 
            element={activePatient ? <PatientInsights /> : <Navigate to="/caregiver/hub" replace />} 
          />
          <Route 
            path="history" 
            element={activePatient ? <PatientHistory /> : <Navigate to="/caregiver/hub" replace />} 
          />
        </Route>

        {/* --- Fallback Redirects --- */}
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>

      {/* --- Global UI Components --- */}
      <AnimatePresence>
        {isLoggedIn && showReminder && (
          <ReminderPopup
            medication={MASTER_MEDICATIONS[0]}
            onClose={() => setShowReminder(false)}
            onTake={() => setShowReminder(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default function App() {
  return (
    <UserProvider>
      <SettingsProvider>
      <MedicationProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </MedicationProvider>
      </SettingsProvider>
    </UserProvider>
  );
}