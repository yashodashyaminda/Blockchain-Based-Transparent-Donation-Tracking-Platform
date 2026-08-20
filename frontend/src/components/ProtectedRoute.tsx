import React from 'react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  setActivePage?: (page: string) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  setActivePage
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // If session is loading, show a clean, non-intrusive loading view
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 font-medium text-sm animate-pulse">
          Verifying account credentials...
        </div>
      </div>
    );
  }

  // Redirect to login if user is unauthenticated
  if (!isAuthenticated || !user) {
    if (setActivePage) {
      React.useEffect(() => {
        setActivePage('login');
      }, [setActivePage]);
    }
    return null;
  }

  // Normalize role to case-insensitive checks
  const userRole = user.role.toUpperCase();
  const allowedRolesUpper = allowedRoles.map(role => role.toUpperCase());

  // Block access if role does not match
  if (!allowedRolesUpper.includes(userRole)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] mt-16 flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl max-w-md text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 text-2xl font-bold">
            🚫
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
            Access Denied
          </h2>
          <p className="text-slate-500 text-xs leading-relaxed">
            Your account role ({user.role}) does not have permission to access this workspace.
          </p>
          <button
            onClick={() => {
              if (setActivePage) setActivePage('home');
            }}
            className="mt-2 px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all duration-350 cursor-pointer"
          >
            Go to Home Page
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
