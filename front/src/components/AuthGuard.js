import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function AuthGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAccess = () => {
      const agencyUser = localStorage.getItem('agencyUser');
      
      if (!agencyUser) {
        navigate('/login');
        return;
      }

      // Admin için tüm sayfalara erişim izni var
      const user = JSON.parse(agencyUser);
      if (user.position === 'admin') {
        return;
      }

      // Rol izinlerini kontrol et
      const permissions = JSON.parse(localStorage.getItem(`rolePermissions_${user.companyId}`));
      if (!permissions || !permissions[user.position]) {
        navigate('/unauthorized');
        return;
      }

      // Mevcut sayfanın ID'sini al
      const currentPath = location.pathname;
      const pageId = currentPath.split('/').pop();

      // Sayfa izinlerini kontrol et
      const userPermissions = permissions[user.position];
      if (!userPermissions[pageId] && pageId !== 'dashboard') {
        navigate('/unauthorized');
      }
    };

    checkAccess();
  }, [navigate, location]);

  return <>{children}</>;
}

export default AuthGuard; 