export const loadMenuItems = (loggedInUser, company, setMenuItems, setIsMenuLoading) => {
  setIsMenuLoading(true);
  const items = [
    {
      path: '/companyAgencyDashboard',
      icon: 'bi-speedometer2',
      text: 'Dashboard',
      id: 'dashboard'
    },
    {
      path: '/companyAgencyDashboard/definitions',
      icon: 'bi-list-check',
      text: 'Tanımlamalar',
      id: 'definitions',
      subItems: [
        {
          path: '/companyAgencyDashboard/definitions/companies',
          icon: 'bi-building',
          text: 'Tedarikçiler',
          id: 'companies'
        },
        {
          path: '/companyAgencyDashboard/definitions/guides',
          icon: 'bi-person-badge',
          text: 'Rehberler',
          id: 'guides'
        },
        {
          path: '/companyAgencyDashboard/definitions/tours/create',
          icon: 'bi-plus-circle',
          text: 'Tur Oluştur',
          id: 'create-tour'
        },
        {
          path: '/companyAgencyDashboard/definitions/tours/lists',
          icon: 'bi-list-ul',
          text: 'Tur Listeleri',
          id: 'tour-lists'
        }
      ]
    },
    {
      path: '/companyAgencyDashboard/operations',
      icon: 'bi-gear-wide-connected',
      text: 'İşlemler',
      id: 'operations',
      subItems: [
        {
          path: '/companyAgencyDashboard/operations/guide-operations',
          icon: 'bi-person-workspace',
          text: 'Rehber İşlemleri',
          id: 'guide-operations'
        },
        {
          path: '/companyAgencyDashboard/operations/tour-operations',
          icon: 'bi-calendar2-week',
          text: 'Tur İşlemleri',
          id: 'tour-operations'
        }
      ]
    },
    {
      path: '/companyAgencyDashboard/safe',
      icon: 'bi-safe',
      text: 'Kasa',
      id: 'safe',
      subItems: [
        {
          path: '/companyAgencyDashboard/safe',
          icon: 'bi-safe-fill',
          text: 'Kasa Yönetimi',
          id: 'safe-management'
        },
        {
          path: '/companyAgencyDashboard/safe/Collection',
          icon: 'bi-cash',
          text: 'Kasa-işlemleri',
          id: 'safe-collection'
        }
      ]
    },
    {
      path: '/companyAgencyDashboard/reservations',
      icon: 'bi-calendar-check',
      text: 'Rezervasyonlar',
      id: 'reservations',
      subItems: [
    
        {
          path: '/companyAgencyDashboard/reservations/list',
          icon: 'bi-list-ul',
          text: 'Rezervasyonlar',
          id: 'reservation-list'
        },
        {
          path: '/companyAgencyDashboard/reservations/approve',
          icon: 'bi-check-circle',
          text: 'Rezervasyon Onay',
          id: 'reservation-approve'
        },
        {
          path: '/companyAgencyDashboard/reservations/send',
          icon: 'bi-send',
          text: 'Rezervasyon Gönder',
          id: 'reservation-send'
        },
        {
          path: '/companyAgencyDashboard/reservations/transfer',
          icon: 'bi-arrow-left-right',
          text: 'Rezervasyon Transfer',
          id: 'reservation-transfer'
        }
      ]
    },
    {
      path: '/companyAgencyDashboard/reports',
      icon: 'bi-file-earmark-text',
      text: 'Raporlar',
      id: 'reports'
    },
    {
      path: '/companyAgencyDashboard/database-backup',
      icon: 'bi-database',
      text: 'Veritabanı Yedekleme',
      id: 'backup'
    },
    {
      path: '/companyAgencyDashboard/settings',
      icon: 'bi-gear',
      text: 'Ayarlar',
      id: 'settings'
    }
  ];

  if (!loggedInUser) {
    setMenuItems([]);
    setIsMenuLoading(false);
    return;
  }

  if (loggedInUser.position === 'admin') {
    items.push({
      path: '/companyAgencyDashboard/role-management',
      icon: 'bi-shield-lock',
      text: 'Rol Yönetimi',
      id: 'role-management'
    });
    setMenuItems(items);
    setIsMenuLoading(false);
    return;
  }

  const rolePermissions = JSON.parse(localStorage.getItem(`rolePermissions_${company?.id}`)) || {
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
      'reservation-transfer': false,
      reports: true,
      safe: true,
      'safe-management': true,
      'safe-collection': true,
      backup: false,
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
      'reservation-list': true,
      'reservation-send': true,
      'reservation-approve': true,
      'reservation-transfer': true,
      reports: false,
      safe: false,
      'safe-management': false,
      'safe-collection': false,
      backup: false,
      settings: false,
      operations: true,
      'guide-operations': true,
      'tour-operations': true,
    }
  };

  const filterMenuItems = (items, permissions) => {
    return items.filter(item => {
      // Ana menü öğesi için izin kontrolü
      const hasMainPermission = permissions[item.id];
      
      if (item.subItems) {
        // Alt menü öğelerini filtrele
        const filteredSubItems = item.subItems.filter(subItem => {
          // Alt öğe için izin kontrolü - ana menü izni varsa alt menülere de izin ver
          return hasMainPermission && (permissions[subItem.id] !== false);
        });
        
        // Alt menü öğeleri varsa, bunları güncelle
        if (filteredSubItems.length > 0) {
          item.subItems = filteredSubItems;
        }
      }
      
      return hasMainPermission;
    });
  };

  const filteredItems = filterMenuItems(items, rolePermissions[loggedInUser.position] || {});

  setMenuItems(filteredItems);
  setIsMenuLoading(false);
}; 