/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { AnimatePresence } from 'motion/react';
import ProtectedRoute from './components/ProtectedRoute';

// Shared Pages
import SplashScreen from './pages/shared/SplashScreen';
import LoginScreen from './pages/shared/LoginScreen';
import SelectRoleScreen from './pages/shared/SelectRoleScreen';
import LinkPatientScreen from './pages/caregiver/LinkPatientScreen';

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

// Layouts
import AppLayout from './layouts/AppLayout';

// Data
import { MASTER_MEDICATIONS } from './data/mockData';
import { MedicationProvider } from './context/MedicationContext';

const AppRoutes = () => {
  // ✅ Added 'activePatient' to destructuring to fix ReferenceError
  const { role, isLoggedIn, activePatient, linkStatus } = useUser();
  const [showReminder, setShowReminder] = useState(false);

  // Demo: Show reminder after 15 seconds for patient
  useEffect(() => {
    if (isLoggedIn && role === 'patient') {
      const timer = setTimeout(() => setShowReminder(true), 15000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, role]);

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen />} />

        {/* Protected Choice Route */}
        <Route path="/select-role" element={<SelectRoleScreen />} />

        {/* Patient Flow */}
        <Route path="/patient" element={
          isLoggedIn && role === 'patient' ? <AppLayout title="MediPredict" /> : <Navigate to="/login" />
        }>
          <Route path="home" element={<PatientHome />} />
          <Route path="medications" element={<MedicationList />} />
          <Route path="insights" element={activePatient ? <PatientInsights /> : <Navigate to="/caregiver/hub" replace />} />
          <Route path="caregiver" element={<CaregiverInfo />} />
          <Route path="settings" element={<PatientSettings />} />
          <Route index element={<Navigate to="home" />} />
        </Route>

        {/* Caregiver Flow (Corrected) */}
        <Route
          path="/caregiver"
          element={isLoggedIn && role === 'caregiver' ? <AppLayout title="CarePulse" /> : <Navigate to="/login" />}
        >
          {/* ✅ 1. THE LANDING ZONE: Landing on /caregiver now always opens the Hub */}
          <Route index element={<PatientHub />} /> 
          <Route path="hub" element={<PatientHub />} />
          
          {/* ✅ 2. ENTRY POINT: Always accessible to link new people */}
          <Route path="link-patient" element={<LinkPatientScreen />} />

          {/* ✅ 3. PROTECTED DATA ZONE: Redirects to HUB if no patient is selected */}
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

          {/* ✅ 4. GENERAL ACCESS: Always available for account management */}
          <Route path="settings" element={<CaregiverSettings />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/splash" />} />
      </Routes>

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
      <MedicationProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </MedicationProvider>
    </UserProvider>
  );
}