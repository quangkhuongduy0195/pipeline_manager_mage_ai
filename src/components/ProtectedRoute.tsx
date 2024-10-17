import React, { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { isTokenValid } from '../services/tokenManager';

const ProtectedRoute: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isTokenValid()) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  if (!isTokenValid()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
