import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import React from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, loading} = useAuth();
    const location = useLocation();
     
    if (loading) return null;

     if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
     }

     if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/profile" replace />;
     }

     return <>{children}</>;
};