import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode; // Add children prop
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    // Not authenticated, redirect to login
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Authenticated but not authorized, redirect to home or unauthorized page
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
