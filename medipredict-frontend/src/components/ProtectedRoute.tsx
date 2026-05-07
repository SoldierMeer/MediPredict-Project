import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roleRequired?: 'patient' | 'caregiver';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roleRequired }) => {
  const { userId, role, isLoggedIn } = useUser();

  if (!isLoggedIn || !userId) {
    return <Navigate to="/login" replace />;
  }

  if (roleRequired && role !== roleRequired) {
    return <Navigate to="/select-role" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;