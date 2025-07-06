import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getRolePermissions, updateRolePermissions } from '../../../services/api';

// Memoize static data
const pages = [
  { id: 'dashboard', name: 'Dashboard', icon: 'bi-speedometer2' },
  { id: 'definitions', name: 'Tanımlamalar', icon: 'bi-list-check' },
  { id: 'operations', name: 'İşlemler', icon: 'bi-gear-wide-connected' },
  { id: 'reservations', name: 'Rezervasyonlar', icon: 'bi-calendar-check' },
  { id: 'reports', name: 'Raporlar', icon: 'bi-file-earmark-text' },
  { id: 'safe', name: 'Kasa', icon: 'bi-safe' },
  { id: 'backup', name: 'Veri Tabanı Yedekleme', icon: 'bi-database-down' },
  { id: 'settings', name: 'Ayarlar', icon: 'bi-gear' }
];

const roles = [
  { id: 'muhasebe', name: 'Muhasebe' },
  { id: 'operasyon', name: 'Operasyon' }
];

const defaultPermissions = {
  muhasebe: {
    dashboard: true,
    definitions: false,
    companies: false,
    guides: false,
    'create-tour': false,
    'tour-lists': false,
    reservations: false,
    'reservation-send': false,
    'reservation-approve': false,
    'reservation-list': false,
    reports: true,
    safe: true,
    'safe-management': true,
    'safe-collection': true,
    backup: true,
    'reservation-transfer': false,
    settings: false,
    operations: false,
    'guide-operations': false,
    'tour-operations': false,
  },
  operasyon: {  
    dashboard: true,
    definitions: true,
    companies: true,
    guides: true,
    'create-tour': true,
    'tour-lists': true,
    reservations: true,
    'reservation-send': true,
    'reservation-approve': true,
    'reservation-list': true,
    reports: false,
    safe: false,
    'safe-management': false,
    'safe-collection': false,
    backup: false,
    'reservation-transfer': true,
    settings: false,
    operations: true,
    'guide-operations': true,
    'tour-operations': true,
  }
};

// Define page hierarchy for permission inheritance
const pageHierarchy = {
  definitions: ['companies', 'guides', 'create-tour', 'tour-lists'],
  safe: ['safe-management', 'safe-collection'],
  reservations: ['reservation-send', 'reservation-approve', 'reservation-list', 'reservation-transfer'],
  operations: ['guide-operations', 'tour-operations']
};

// Memoized TableRow component
const TableRow = React.memo(({ page, roles, rolePermissions, onPermissionChange, updating }) => {
  // Check if this page has sub-items in the hierarchy
  const hasSubItems = pageHierarchy[page.id];
  
  return (
    <tr key={page.id}>
      <td>
        <i className={`bi ${page.icon} me-2`}></i>
        {page.name}
        {hasSubItems && <small className="ms-2 text-muted">(Alt menüleri içerir)</small>}
      </td>
      {roles.map(role => (
        <td key={role.id} className="text-center">
          <div className="form-check d-flex justify-content-center">
            <input
              type="checkbox"
              className="form-check-input"
              checked={rolePermissions[role.id]?.[page.id] ?? false}
              onChange={() => onPermissionChange(role.id, page.id)}
              disabled={updating}
            />
          </div>
        </td>
      ))}
    </tr>
  );
});

function RoleManagement({ company }) {
  const [rolePermissions, setRolePermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState(false);

  // Fetch permissions from database
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!company?.id) {
        setError('Şirket bilgisi bulunamadı');
        setLoading(false);
        return;
      }

      try {
        const response = await getRolePermissions(company.id);
        
        if (response?.data && Object.keys(response.data).length > 0) {
          // Format permissions from database and ensure all roles have permissions
          const formattedPermissions = roles.reduce((acc, role) => {
            acc[role.id] = {
              ...defaultPermissions[role.id], // Start with default permissions
              ...(response.data[role.id] || {}) // Override with database permissions if they exist
            };
            return acc;
          }, {});

          setRolePermissions(formattedPermissions);
        } else {
          // If no permissions exist in database, set and save default permissions
          await updateRolePermissions(company.id, defaultPermissions);
          setRolePermissions(defaultPermissions);
        }
      } catch (err) {
        console.error('İzin getirme hatası:', err);
        setError('İzinler yüklenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
        setRolePermissions(defaultPermissions);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [company?.id]);

  // Handle permission changes
  const handlePermissionChange = useCallback(async (roleId, pageId) => {
    if (!rolePermissions || !company?.id || updating) return;

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      let newPermissions = {
        ...rolePermissions,
        [roleId]: {
          ...rolePermissions[roleId],
          [pageId]: !rolePermissions[roleId][pageId]
        }
      };

      // If this page has sub-items, update their permissions too
      if (pageHierarchy[pageId]) {
        const newValue = !rolePermissions[roleId][pageId];
        pageHierarchy[pageId].forEach(subItem => {
          newPermissions[roleId][subItem] = newValue;
        });
      }

      // Update permissions in database
      const response = await updateRolePermissions(company.id, newPermissions);
      
      if (response?.data?.success) {
        setRolePermissions(newPermissions);
        setSuccess('İzinler başarıyla güncellendi');
        
        // Update localStorage to keep it in sync with database
        localStorage.setItem(`rolePermissions_${company.id}`, JSON.stringify(newPermissions));
      } else {
        throw new Error('İzinler güncellenemedi');
      }
    } catch (err) {
      console.error('İzin güncelleme hatası:', err);
      setError('İzinler güncellenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
      
      // Refresh permissions from database on error
      const response = await getRolePermissions(company.id);
      if (response?.data) {
        setRolePermissions(response.data);
      }
    } finally {
      setUpdating(false);
    }
  }, [company?.id, rolePermissions, updating]);

  if (loading) {
    return (
      <div className="container mt-3">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!rolePermissions) {
    return (
      <div className="container mt-3">
        <div className="alert alert-danger">
          Rol izinleri yüklenemedi. Lütfen sayfayı yenileyin.
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-3">
      <div className="card">
        <div className="card-body">
          <h4 className="card-title mb-4">Rol Yönetimi</h4>
          
          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Sayfalar / Roller</th>
                  {roles.map(role => (
                    <th key={role.id} className="text-center">{role.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pages.map(page => (
                  <TableRow
                    key={page.id}
                    page={page}
                    roles={roles}
                    rolePermissions={rolePermissions}
                    onPermissionChange={handlePermissionChange}
                    updating={updating}
                  />
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="alert alert-info mt-3">
            <i className="bi bi-info-circle me-2"></i>
            Admin rolü varsayılan olarak tüm sayfalara erişebilir.
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(RoleManagement); 