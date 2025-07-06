import React, { createContext, useContext, useState, useEffect } from 'react';

const ProviderAuthContext = createContext();

export const useProviderAuth = () => {
  return useContext(ProviderAuthContext);
};

export const ProviderAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const providerRef = localStorage.getItem('providerRef');
      setIsAuthenticated(isLoggedIn && providerRef);
    };

    checkAuth();
    // Sayfa yenilendiğinde oturum durumunu kontrol et
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('providerRef');
    localStorage.removeItem('isLoggedIn');
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    login,
    logout
  };

  return (
    <ProviderAuthContext.Provider value={value}>
      {children}
    </ProviderAuthContext.Provider>
  );
}; 