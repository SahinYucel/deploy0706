import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const providerRef = localStorage.getItem('providerRef');

  if (!isLoggedIn || !providerRef) {
    return <Navigate to="/provider-login" replace />;
  }

  return children;
};

export default ProtectedRoute; 