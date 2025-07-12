import axios from 'axios';

//const API_URL = 'http://localhost:5000';
const API_URL = 'http://13.216.32.130:5000';


const api2 = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Rehber işlemleri için API fonksiyonları
export const guideOperations = {
    // Rehber ekleme
    addGuide: async (companyId, guideData) => {
        try {
            const response = await api2.post('/guide/add', { companyId, ...guideData });
            return response.data;
        } catch (error) {
            throw new Error('Rehber eklenirken hata oluştu: ' + error.message);
        }
    },

    // Rehber listesini getirme
    getGuides: async (companyId) => {
        try {
            const response = await api2.get(`/guide/list/${companyId}`);
            return response.data;
        } catch (error) {
            throw new Error('Rehber listesi alınırken hata oluştu: ' + error.message);
        }
    },

    // Rehber güncelleme
    updateGuide: async (guideId, updateData) => {
        try {
            const response = await api2.put(`/guide/update/${guideId}`, updateData);
            return response.data;
        } catch (error) {
            throw new Error('Rehber güncellenirken hata oluştu: ' + error.message);
        }
    },

    // Rehber silme
    deleteGuide: async (guideId) => {
        try {
            const response = await api2.delete(`/guide/delete/${guideId}`);
            return response.data;
        } catch (error) {
            throw new Error('Rehber silinirken hata oluştu: ' + error.message);
        }
    },

    // Rehber detaylarını getirme
    getGuideDetails: async (guideId) => {
        try {
            const response = await api2.get(`/guide/details/${guideId}`);
            return response.data;
        } catch (error) {
            throw new Error('Rehber detayları alınırken hata oluştu: ' + error.message);
        }
    },

    // Rehber performans raporu
    getGuidePerformance: async (guideId, dateRange) => {
        try {
            const response = await api2.get(`/guide/performance/${guideId}`, {
                params: dateRange
            });
            return response.data;
        } catch (error) {
            throw new Error('Rehber performans raporu alınırken hata oluştu: ' + error.message);
        }
    },

    // Rezervasyonları ve biletleri getirme
    getGuideReservationsWithTickets: async (companyId, filters = {}) => {
        try {
            const response = await api2.get(`/guide-process/reservations-with-tickets/${companyId}`, {
                params: {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    guideName: filters.guideName
                }
            });
            return response.data;
        } catch (error) {
            console.error('API Hatası:', error);
            throw new Error('Rezervasyonlar alınırken hata oluştu');
        }
    },

    // Rehberin rezervasyonlarını güncelleme
    updateReservationStatus: async (reservationId, ticketId, updateData) => {
        try {
            const response = await api2.put(`/guide/reservation-status/${reservationId}/${ticketId}`, updateData);
            return response.data;
        } catch (error) {
            throw new Error('Rezervasyon durumu güncellenirken hata oluştu: ' + error.message);
        }
    },

    // Rehberin rezervasyon istatistiklerini getirme
    getGuideReservationStats: async (guideId, dateRange) => {
        try {
            const response = await api2.get(`/guide/reservation-stats/${guideId}`, {
                params: {
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate
                }
            });
            return response.data;
        } catch (error) {
            throw new Error('Rezervasyon istatistikleri alınırken hata oluştu: ' + error.message);
        }
    },

    // Rehberin günlük rezervasyonlarını getirme
    getDailyReservations: async (guideId, date) => {
        try {
            const response = await api2.get(`/guide/daily-reservations/${guideId}`, {
                params: { date }
            });
            return response.data;
        } catch (error) {
            throw new Error('Günlük rezervasyonlar alınırken hata oluştu: ' + error.message);
        }
    },

    // Rehberin rezervasyon detaylarını getirme
    getReservationDetails: async (reservationId) => {
        try {
            const response = await api2.get(`/guide/reservation-details/${reservationId}`);
            return response.data;
        } catch (error) {
            throw new Error('Rezervasyon detayları alınırken hata oluştu: ' + error.message);
        }
    },

    // Rehberin bilet detaylarını getirme
    getTicketDetails: async (ticketId) => {
        try {
            const response = await api2.get(`/guide/ticket-details/${ticketId}`);
            return response.data;
        } catch (error) {
            throw new Error('Bilet detayları alınırken hata oluştu: ' + error.message);
        }
    },

    // Rehber listesini getir
    getGuideList: async () => {
        try {
            const response = await api2.get('/guide/guide-list');
            return response.data;
        } catch (error) {
            throw new Error('Rehber listesi alınırken hata oluştu: ' + error.message);
        }
    },

    // Döviz kurlarını getir
    getCurrencyRates: async () => {
        try {
            const response = await api2.get('/guide-process/currency-rates');
            return response.data;
        } catch (error) {
            throw new Error('Döviz kurları alınırken hata oluştu: ' + error.message);
        }
    },

    // Döviz kurlarını güncelle
    updateCurrencyRates: async (rates) => {
        try {
            const response = await api2.post('/guide-process/update-currency-rates', { rates });
            return response.data;
        } catch (error) {
            console.error('Currency rates update error:', error.response?.data || error);
            throw new Error(
                'Döviz kurları güncellenirken hata oluştu: ' + 
                (error.response?.data?.details || error.message)
            );
        }
    },

    // Rehber tahsilatlarını kaydet
    saveGuideCollections: async (data) => {
        try {
            const response = await api2.post('/guide-process/save-guide-collections', data);
            return response.data;
        } catch (error) {
            console.error('Guide collections save error:', error.response?.data || error);
            throw new Error('Tahsilat kaydedilirken hata oluştu: ' + 
                (error.response?.data?.details || error.message));
        }
    },

    // Rehber tahsilatlarını getir
    getGuideCollections: async (guideName = '', searchMode = false) => {
        try {
            const response = await api2.get('/guide-process/guide-collections', {
                params: { guideName, searchMode }
            });
            return response.data;
        } catch (error) {
            console.error('Guide collections fetch error:', error.response?.data || error);
            throw new Error('Tahsilat kayıtları alınırken hata oluştu: ' + 
                (error.response?.data?.details || error.message));
        }
    },

    // Rehber tahsilatını sil
    deleteGuideCollection: async (transactionNo) => {
        try {
            const response = await api2.delete(`/guide-process/guide-collections/${transactionNo}`);
            return response.data;
        } catch (error) {
            console.error('Guide collection delete error:', error.response?.data || error);
            throw new Error('Tahsilat kaydı silinirken hata oluştu: ' + 
                (error.response?.data?.details || error.message));
        }
    },

    // Tekil tahsilat kaydını sil
    deleteGuideCollectionByReservation: async (reservationId) => {
        try {
            const response = await api2.delete(`/guide-process/guide-collections/reservation/${reservationId}`);
            return response.data;
        } catch (error) {
            console.error('Guide collection delete error:', error.response?.data || error);
            throw new Error('Tahsilat kaydı silinirken hata oluştu: ' + 
                (error.response?.data?.details || error.message));
        }
    },

    // Rezervasyon rehber rengini güncelle
    updateReservationGuideColor: async (reservationId, color) => {
        try {
            const response = await api2.put(`/guide-process/update-reservation-guide-color/${reservationId}`, { color });
            return response.data;
        } catch (error) {
            console.error('Reservation guide color update error:', error.response?.data || error);
            throw new Error('Rezervasyon rehber rengi güncellenirken hata oluştu: ' + 
                (error.response?.data?.details || error.message));
        }
    },

    // Tüm tur isimlerini getir
    getAllTourNames: async () => {
        try {
            const response = await api2.get('/get-reservation/all-tour-names');
            return response.data;
        } catch (error) {
            console.error('Tur isimleri alınırken hata:', error);
            throw new Error('Tur isimleri alınamadı: ' + error.message);
        }
    },

    // Tur gruplarını getir
    getTourGroups: async () => {
        try {
            const response = await api2.get('/get-reservation/tour-groups');
            return response.data;
        } catch (error) {
            console.error('Tur grupları alınırken hata:', error);
            throw new Error('Tur grupları alınamadı: ' + error.message);
        }
    },
};

// Tur operasyonları için API fonksiyonları
export const tourOperations = {
    // Tüm tur gruplarını getir
    getTourGroups: async () => {
        try {
            const response = await api2.get('/tour-operations/tour-groups');
            return response.data;
        } catch (error) {
            console.error('Tur grupları alınırken hata:', error);
            throw new Error('Tur grupları alınamadı: ' + error.message);
        }
    },

    // Tur grubuna göre rezervasyonları getir
    getReservationsByTourGroup: async (tourGroup) => {
        try {
            const response = await api2.get(`/tour-operations/reservations/${tourGroup}`);
            return response.data;
        } catch (error) {
            console.error('Rezervasyonlar alınırken hata:', error);
            throw new Error('Rezervasyonlar alınamadı: ' + error.message);
        }
    },

    // Rezervasyon güncelle
    updateReservation: async (reservationId, updateData) => {
        try {
            const response = await api2.put(`/tour-operations/reservations/${reservationId}`, updateData);
            return response.data;
        } catch (error) {
            console.error('Rezervasyon güncellenirken hata:', error);
            throw new Error('Rezervasyon güncellenemedi: ' + error.message);
        }
    },

    // Rezervasyon sil
    deleteReservation: async (reservationId) => {
        try {
            const response = await api2.delete(`/tour-operations/reservations/${reservationId}`);
            return response.data;
        } catch (error) {
            console.error('Rezervasyon silinirken hata:', error);
            throw new Error('Rezervasyon silinemedi: ' + error.message);
        }
    },

    // Yeni rezervasyon oluştur
    createReservation: async (reservationData) => {
        try {
            const response = await api2.post('/tour-operations/reservations', reservationData);
            return response.data;
        } catch (error) {
            console.error('Rezervasyon oluşturulurken hata:', error);
            throw new Error('Rezervasyon oluşturulamadı: ' + error.message);
        }
    },

    // Provider collection işlemleri
    createProviderCollection: async (collectionData) => {
        try {
            const response = await api2.post('/tour-operations/provider-collection', collectionData);
            return response.data;
        } catch (error) {
            console.error('Provider collection oluşturulurken hata:', error);
            throw new Error('Provider collection oluşturulamadı: ' + error.message);
        }
    },

    updateProviderCostStatus: async (ticketIds) => {
        try {
            const response = await api2.put('/tour-operations/update-provider-cost-status', { ticketIds });
            return response.data;
        } catch (error) {
            console.error('Provider cost status güncellenirken hata:', error);
            throw new Error('Provider cost status güncellenemedi: ' + error.message);
        }
    },

    getProviderCollections: async (transactionCode = '') => {
        const response = await api2.get(`${API_URL}/tour-operations/provider-collections${transactionCode ? `?transaction_code=${transactionCode}` : ''}`);
        return response.data;
    },

    deleteProviderCollection: async (collectionId) => {
        try {
            const response = await api2.delete(`/tour-operations/provider-collection/${collectionId}`);
            return response.data;
        } catch (error) {
            console.error('Provider collection silinirken hata:', error);
            throw new Error('Provider collection silinemedi: ' + error.message);
        }
    },

    getCurrencyRates: async () => {
        try {
            const response = await api2.get('/tour-operations/currency-rates');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateCurrencyRates: async (rates) => {
        try {
            const response = await api2.put('/tour-operations/currency-rates', { rates });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default api2; 