import axios from 'axios';
import { format } from 'date-fns';

// Production API URL
const API_URL = 'http://localhost:5000';
//const API_URL = 'http://13.216.32.130:5000';


const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // CORS için gerekli
});



// Auth endpoints
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);

// Company endpoints
export const saveCompany = (data) => api.post('/company', data);
export const companyLogin = (credentials) => api.post('/company/login', credentials);
export const getCompanies = () => api.get('/company');
export const updateCompany = (id, data) => api.put(`/company/${id}`, data);
export const deleteCompany = (id) => api.delete(`/company/${id}`);

// Agency role member endpoints
export const registerAgencyRoleMember = (data) => api.post('/agency/register', data);
export const loginAgencyRoleMember = (data) => api.post('/agency/login', data);
export const getAgencyMembers = (companyId) => api.get(`/agency/members/${companyId}`);
export const deleteAgencyMember = (memberId) => api.delete(`/agency/members/${memberId}`);
export const updateAgencyMemberRole = (memberId, newRole) => api.put(`/agency/members/${memberId}/role`, { newRole });
export const updateAgencyMemberUsername = (memberId, newUsername) => api.put(`/agency/members/${memberId}/username`, { newUsername });

// Agency providers endpoints
export const saveProviders = (providers) => api.post('/agencyAddCompanies/providers', {providers});
export const getProviders = (companyId) => api.get(`/agencyAddCompanies/providers/${companyId}`);

// Role permissions endpoints
export const getRolePermissions = (companyId) => api.get(`/agency/role-permissions/${companyId}`);
export const updateRolePermissions = (companyId, permissions) => api.put(`/agency/role-permissions/${companyId}`, { permissions });

// Tour endpoints
export const saveTourData = async (companyId, data) => {
  try {
    console.log('Sending data to server:', {
      companyId,
      data,
      requestBody: { ...data, companyId }
    });
    
    const response = await api.post('/tourlist/save', { ...data, companyId });
    return response.data;
  } catch (error) {
    console.error('API Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      fullError: error
    });
    throw error;
  }
};

export const getTourData = async (companyId) => {
  try {

    const response = await api.get(`/tourlist/${companyId}`, {
      headers: {
        'Content-Type': 'application/json',
        // Debug için tüm headers'ı logla
        ...api.defaults.headers
      }
    });

    return response.data;
  } catch (error) {
    console.error('getTourData detailed error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    throw new Error(`Veri çekme hatası: ${error.message}`);
  }
};

// Backup endpoints
export const backupDatabase = async (companyId) => {
  try {
    const response = await api.post(`/company/backup/${companyId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const createBackup = (companyId, companyName) => api.post(`/backup/backup/${companyId}`, { companyName });
export const restoreBackup = (formData) => api.post('/backup/restore', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
export const getAutoBackupStatus = (companyId) => api.get(`/backup/auto-backup/${companyId}/status`);
export const toggleAutoBackup = (companyId, enabled) => api.post(`/backup/auto-backup/${companyId}`, { enabled }, {
  headers: {
    'Content-Type': 'application/json'
  }
});

// Tüm turları getir
export const getAllTours = async (companyId) => {
  try {
    const response = await api.get(`/alltoursave/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Turları getirme hatası:', error);
    throw error;
  }
};

// Turları kaydet
export const saveAllTours = async (tours) => {
  try {
    const response = await api.post('/alltoursave/save', tours);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Tur silme
export const deleteTour = async (tourId) => {
  try {
    const response = await api.delete(`/alltoursave/${tourId}`);
    return response.data;
  } catch (error) {
    console.error('Tur silme hatası:', error);
    throw error;
  }
};

// Rehber fiyatlarını reservation_tickets tablosunda güncelle
export const updateGuidePrices = async (companyId) => {
  try {
    const response = await api.post('/alltoursave/update-guide-prices', {
      companyRef: companyId
    });
    return response.data;
  } catch (error) {
    console.error('Rehber fiyatları güncelleme hatası:', error);
    throw error;
  }
};

export const getCurrencyRates = () => api.get('/currency');

export const saveProviderData = async (providerId, data) => {return await api.post(`/provider-data/${providerId}`, data);};

export const getProviderData = async (providerRef) => {
  try {
    const response = await api.get(`/provider-approve/provider-data/${providerRef}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching provider data:', error);
    throw error;
  }
};

// Guide endpoints
export const saveGuides = async (companyId, guides) => {
  const response = await api.post('/guide-data/save', {
    companyId,
    guides: guides.map(guide => ({
      ...guide,
      earnings: parseFloat(guide.earnings) || 0,
      promotionRate: parseFloat(guide.promotionRate) || 0,
      revenue: parseFloat(guide.revenue) || 0,
      pax: {
        adult: parseInt(guide.pax?.adult) || 0,
        child: parseInt(guide.pax?.child) || 0,
        free: parseInt(guide.pax?.free) || 0
      }
    }))
  });
  return response.data;
};

export const getGuides = async (companyId) => {
  try {
    const response = await api.get(`/guide-data/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('getGuides error:', error);
    throw new Error('Rehberler getirilemedi: ' + error.message);
  }
};

// Guide login endpoint
export const guideLogin = async (credentials) => {
  try {
    const response = await api.post('/guide-login', credentials);
    return response.data;
  } catch (error) {
    console.error('Guide login error:', error);
    throw error;
  }
};

// Safe endpoints
export const getSafes = async (companyId) => {
  try {
    const response = await api.get(`/safe-data/${companyId}`);
    return response.data;
  } catch (error) {
    throw new Error('Kasalar getirilemedi: ' + error.message);
  }
};

export const getSafeRecords = async (companyId, dateFilters = {}) => {
  try {
    const params = {};
    if (dateFilters.startDate) params.startDate = dateFilters.startDate;
    if (dateFilters.endDate) params.endDate = dateFilters.endDate;
    
    const response = await api.get(`/safe-data/records/${companyId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Safe records getirme hatası:', error);
    throw error;
  }
};

export const createManualSafeRecord = async (companyId, record) => {
  try {
    const response = await api.post('/safe-data/manual-record', {
      companyId,
      record
    });
    return response.data;
  } catch (error) {
    console.error('Manuel kayıt oluşturma hatası:', error);
    throw error;
  }
};

export const saveSafe = async (companyId, safe) => {
  try {
    const response = await api.post('/safe-data/save', { companyId, safe });
    return response.data;
  } catch (error) {
    throw new Error('Kasa kaydedilemedi: ' + error.message);
  }
};

export const deleteSafe = async (safeId) => {
  try {
    const response = await api.delete(`/safe-data/${safeId}`);
    return response.data;
  } catch (error) {
    throw new Error('Kasa silinemedi: ' + error.message);
  }
};


// Guidelar için API fonksiyonları
export const guideAPI = { 
  getTours: async () => {
    try {
      // LocalStorage'dan guide verilerini al
      const guideData = JSON.parse(localStorage.getItem('guideData'));
      if (!guideData?.id) {
        throw new Error('Rehber bilgisi bulunamadı');
      }

      const response = await api.get(`/guidegetTours?guideId=${guideData.id}`);
      return response;
    } catch (error) {
      console.error('Error in getTours:', error);
      throw error;
    }
  }
};

// Update tour or sub-tour name
export const updateTourName = async (data) => {
  try {
    const response = await api.put('/tourlist/update-name', data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error.response?.data || error;
  }
};

// Delete region or area
export const deleteRegionOrArea = async (type, id, companyId) => {
  try {
    const response = await api.delete(`/tourlist/${type}/${id}?companyId=${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Delete operation error:', error);
    throw error.response?.data || error;
  }
};





// Reservation endpoints
export const getReservations = async (filters = {}) => {
  try {
    // forceRefresh true ise önce Redis'i temizle
    if (filters.forceRefresh) {
      await api.post('/get-reservation/clear-cache');
    }
    
    // Filtreleme parametrelerini URL'ye ekle
    const response = await api.get('/get-reservation', { 
      params: filters 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
};

// Reservation update endpoints
export const updateReservation = async (id, data) => {
  try {
    const response = await api.put(`/get-reservation/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Rezervasyon güncelleme hatası:', error);
    throw error;
  }
};

export const updateTicket = async (id, data) => {
  try {
    // Tarihi ISO formatına çevirelim
    const formattedData = {
      ...data,
      ticket_number: data.ticket_number, // Bilet numarasını ekleyelim
      date: new Date(data.date).toISOString().split('T')[0],
      status: data.status === true ? 1 : 0
    };

    const response = await api.put(`/get-reservation/ticket/${id}`, formattedData);
    return response.data;
  } catch (error) {
    console.error('Bilet güncelleme hatası:', error);
    throw error;
  }
};



// Reservation tour endpoints
export const getReservationRegions = async () => {
  try {
    const response = await api.get('/get-reservation/regions');
    return response.data;
  } catch (error) {
    console.error('Bölgeleri getirme hatası:', error);
    throw error;
  }
};

export const getRegionTours = async (regionName) => {
  try {
    const response = await api.get(`/get-reservation/tours/by-region/${regionName}`);
    return response.data;
  } catch (error) {
    console.error('Bölge turları getirme hatası:', error);
    throw error;
  }
};


export const getReservationGuides = () => api.get('/get-reservation/reservation-guides');

// Rezervasyon ödemeleri için API fonksiyonları
export const getReservationPayments = (reservationId) => 
    api.get(`/get-reservation/${reservationId}/payments`);

export const addReservationPayment = (reservationId, paymentData) => 
    api.post(`/get-reservation/${reservationId}/payments`, paymentData);

// Ödeme güncelleme için API fonksiyonu
export const updateReservationPayment = (reservationId, paymentId, paymentData) => 
    api.put(`/get-reservation/${reservationId}/payments/${paymentId}`, paymentData);

export const deleteReservationPayment = async (reservationId, paymentId) => {
  try {
    const response = await api.delete(`/get-reservation/${reservationId}/payments/${paymentId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Ticket options endpoints
export const getTicketOptions = async (ticketId) => {
  try {
    const response = await api.get(`/get-reservation/ticket/${ticketId}/options`);
    return response.data;
  } catch (error) {
    console.error('Bilet opsiyonlarını getirme hatası:', error);
    throw error;
  }
};

export const addTicketOption = async (ticketId, optionData) => {
  try {
    const response = await api.post(`/get-reservation/ticket/${ticketId}/options`, optionData);
    return response.data;
  } catch (error) {
    console.error('Bilet opsiyonu ekleme hatası:', error);
    throw error;
  }
};

export const updateTicketOption = async (ticketId, optionId, optionData) => {
  try {
    const response = await api.put(`/get-reservation/ticket/${ticketId}/options/${optionId}`, optionData);
    return response.data;
  } catch (error) {
    console.error('Bilet opsiyonu güncelleme hatası:', error);
    throw error;
  }
};

export const deleteTicketOption = async (ticketId, optionId) => {
  try {
    const response = await api.delete(`/get-reservation/ticket/${ticketId}/options/${optionId}`);
    return response.data;
  } catch (error) {
    console.error('Bilet opsiyonu silme hatası:', error);
    throw error;
  }
};

// Rezervasyon filtreleme
export const filterReservations = async (filters) => {
  try {
    console.log('Filtreleme isteği gönderiliyor:', filters);
    const response = await api.post('/get-reservation/filter', filters);
    return response.data;
  } catch (error) {
    console.error('Rezervasyon filtreleme hatası:', error);
    throw error;
  }
};



export const getOperators = async () => {
  try {
    const response = await api.get('/get-reservation/operators');
    return response.data;
  } catch (error) {
    console.error('Error fetching operators:', error);
    throw error;
  }
};

export const updateTicketOperator = async (ticketId, operatorData) => {
  try {
    const response = await api.put(`/get-reservation/ticket/${ticketId}/operator`, operatorData);
    return response.data;
  } catch (error) {
    console.error('Error updating ticket operator:', error);
    throw error;
  }
};


// Reservation onay işlemleri
export const getReservationDetails = (startDate = null, endDate = null) => {
  let url = '/reservation-approve';
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }
  return api.get(url);
};

export const updateReservationStatus = (id, type, status) => {
  console.log(`Onay gönderiliyor: ID=${id}, Type=${type}, Status=${status}`);
  return api.patch(`/reservation-approve/${id}/status`, { 
    type, // 'guide' veya 'provider'
    status // 'approved' veya 'rejected'
  });
};


export const updateTicketStatus = (ticketId, status, cancellationReason = null) => {
  return api.patch(`/reservation-approve/ticket/${ticketId}/status`, {
    status,
    cancellationReason
  });
};

export const updateReservationDetails = (reservationId, data) => {
  return api.put(`/reservation-approve/${reservationId}`, data);
};

// Tamamlanan rezervasyonları silme
export const deleteCompletedReservations = () => {
  return api.delete('/reservation-approve/completed');
};







//pdf oluşturma için ticket lar çağırılır
export const getReservationTickets = async (date) => {
  try {
    const response = await api.get(`/get-reservation/tickets`, {
      params: { date }
    });
    console.log('Fetched tickets:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
};

export const generateTicketsPDF = async (ticketIds) => {
  try {
    const response = await api.post('/get-reservation/tickets/generate-pdf', 
      { ticketIds },
      { responseType: 'blob' }
    );
    return response;
  } catch (error) {
    throw error;
  }
};

// WhatsApp PDF sending endpoint
export const sendTicketsPDFToWhatsApp = async (ticketIds, phoneNumber) => {
  try {
    const response = await api.post('/get-reservation/tickets/send-whatsapp', {
      ticketIds,
      phoneNumber
    });
    return response.data;
  } catch (error) {
    console.error('WhatsApp gönderimi hatası:', error);
    throw error;
  }
};








// Bilet tur adını güncelleme endpoint'i
export const updateTicketName = async (ticketId, targetTourName) => {
  try {
    const response = await api.post('/get-reservation/update-ticket-name', {
      ticketId,
      targetTourName
    });
    return response.data;
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
};

// Tüm turları getir
export const getAllTourNames = async () => {
  try {
    const response = await api.get('/get-reservation/all-tour-names');
    return response.data;
  } catch (error) {
    console.error('Error fetching tour names:', error);
    throw error;
  }
};








// Provider rezervasyon onayları için endpoint
export const getProviderReservationApprovals = async (providerRef) => {
  try {
    const response = await api.get(`/provider-approve/reservations/${providerRef}`);
    console.log('Provider approvals response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching provider approvals:', error);
    throw error;
  }
};

// Provider onay işlemi için endpoint güncellendi
export const updateProviderApproval = async (reservationId, type, status) => {
  try {
    const response = await api.patch(
      `/provider-approve/${reservationId}/${type}/status`, 
      { status }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating approval:', error);
    throw error;
  }
};

// Provider login endpoint'i
export const providerLogin = async (companyRef, password) => {
  try {
    const response = await api.post('/provider-approve/login', {
      companyRef,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Saat güncelleme için yeni API fonksiyonu
export const updateReservationTime = async (ticketNo, time) => {
  try {
    const response = await api.patch(`/provider-approve/update-time/${ticketNo}`, { time });
    return response.data;
  } catch (error) {
    console.error('Saat güncelleme hatası:', error);
    throw error;
  }
};

// PDF indirme için yeni API fonksiyonu
export const downloadProviderPDF = async (providerRef, tour = 'all') => {
  try {
    const response = await api.get(`/provider-approve/download-pdf/${providerRef}`, {
      params: { tour },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('PDF indirme hatası:', error);
    throw error;
  }
};

// Kurları kaydetme endpoint'i
export const saveCurrencyRates = (companyId, currencies) => 
  api.post('/currency/save', { companyId, currencies });

// Kaydedilmiş kurları getirme endpoint'i
export const getSavedCurrencyRates = (companyId) => 
  api.get(`/currency/saved/${companyId}`);

// Son işlem saatini kontrol et
export const checkExitTime = async (providerRef) => {
  try {
    const response = await api.get(`/provider-approve/check-exit-time/${providerRef}`);
    return response.data;
  } catch (error) {
    console.error('Error checking exit time:', error);
    throw error;
  }
};

export default api;

