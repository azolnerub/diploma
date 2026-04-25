import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import React from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, loading} = useAuth();
     if (loading) return null;

     if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/profile" replace/>
     }

     return <>{children}</>;
};