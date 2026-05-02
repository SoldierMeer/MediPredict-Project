/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { AnimatePresence } from 'motion/react';

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

// Layouts
import AppLayout from './layouts/AppLayout';

// Data
import { MASTER_MEDICATIONS } from './data/mockData';
import { MedicationProvider } from './context/MedicationContext';

const AppRoutes = () => {
  const { role, isLoggedIn, linkStatus } = useUser();
  const [showReminder, setShowReminder] = useState(false);

  // Demo: Show reminder after 10 seconds for patient
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
          <Route path="insights" element={<PatientInsights />} />
          <Route path="caregiver" element={<CaregiverInfo />} />
          <Route path="settings" element={<PatientSettings />} />
          <Route index element={<Navigate to="home" />} />
        </Route>

        {/* Caregiver Flow */}
        <Route
          path="/caregiver"
          element={isLoggedIn && role === 'caregiver' ? <AppLayout title="CarePulse" /> : <Navigate to="/login" />}
        >
          {/* 1. The Gatekeeper: The Link Patient screen handles both 'none' and 'pending' UI internally */}
          <Route path="link-patient" element={<LinkPatientScreen />} />

          {/* 2. Protected Data Routes: Redirect to link-patient if NOT accepted */}
          <Route
            path="dashboard"
            element={linkStatus === 'accepted' ? <CaregiverDashboard /> : <Navigate to="/caregiver/link-patient" replace />}
          />
          <Route
            path="medications"
            element={linkStatus === 'accepted' ? <CaregiverMedList /> : <Navigate to="/caregiver/link-patient" replace />}
          />
          <Route
            path="insights"
            element={linkStatus === 'accepted' ? <PatientInsights /> : <Navigate to="/caregiver/link-patient" replace />}
          />
          <Route
            path="history"
            element={linkStatus === 'accepted' ? <PatientHistory /> : <Navigate to="/caregiver/link-patient" replace />}
          />

          {/* 3. General Routes: Always accessible to the caregiver */}
          <Route path="settings" element={<CaregiverSettings />} />

          {/* 4. Default Redirects */}
          <Route index element={<Navigate to="dashboard" replace />} />
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
