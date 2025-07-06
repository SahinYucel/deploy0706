import React, { useState, useEffect } from 'react';
import { guideOperations } from '../../../../services/api2';
import CurrencyRatesCard from './CurrencyRatesCard';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, Toast } from 'react-bootstrap';

const GuideOperations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openReservations, setOpenReservations] = useState({});
  const [isInitialState, setIsInitialState] = useState(true);
  const [openCollectionDetails, setOpenCollectionDetails] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  
  // Seçili rehberi localStorage'dan al veya boş string kullan
  const savedGuideName = localStorage.getItem('selectedGuideName') || '';
  const savedSelectedDate = localStorage.getItem('selectedDate') || '';

  // Filtreleri localStorage'dan al veya boş değerlerle başlat
  const [filters, setFilters] = useState({
    guideName: savedGuideName,
    selectedDate: savedSelectedDate
  });

  // Tahsilat kayıtları için filtre
  const [collectionFilters, setCollectionFilters] = useState({
    transactionNo: ''
  });

  // localStorage'dan işlem no filtresini al
  const savedTransactionFilter = localStorage.getItem('collectionTransactionFilter') || '';

  const [guideList, setGuideList] = useState([]);

  const [currencyRates, setCurrencyRates] = useState(null);

  // Seçili rezervasyonlar için state
  const [selectedReservations, setSelectedReservations] = useState([]);

  // CompanyId'yi localStorage'dan string olarak al ve number'a çevir
  const companyId = parseInt(localStorage.getItem('companyId'), 10);

  // State için yeni değişken ekleyelim
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [collections, setCollections] = useState([]);
  const [allCollections, setAllCollections] = useState([]); // Tüm tahsilat kayıtları
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingReservationId, setDeletingReservationId] = useState(null);
  
  // Tek bir collapse state'i
  const [isSectionsOpen, setIsSectionsOpen] = useState(true);

  // Rehber listesini yükle
  useEffect(() => {
    const loadGuideList = async () => {
      try {
        const guides = await guideOperations.getGuideList();
        setGuideList(guides);
      } catch (err) {
        console.error('Rehber listesi yüklenirken hata:', err);
      }
    };
    loadGuideList();
  }, []);

  // Döviz kurlarını yükle
  const loadCurrencyRates = async () => {
    try {
      const rates = await guideOperations.getCurrencyRates();
      setCurrencyRates(rates);
    } catch (error) {
      console.error('Döviz kurları yüklenirken hata:', error);
    }
  };

  useEffect(() => {
    loadCurrencyRates();
  }, []);

  // Filtreleri güncelle - localStorage'a kaydet
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'guideName') {
      localStorage.setItem('selectedGuideName', value);
    }
    if (name === 'selectedDate') {
      localStorage.setItem('selectedDate', value);
    }
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Tahsilat kayıtları filtrelerini güncelle
  const handleCollectionFilterChange = (e) => {
    const { name, value } = e.target;
    setCollectionFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Tahsilat kayıtlarını filtrele
  const applyCollectionFilters = async () => {
    if (!collectionFilters.transactionNo.trim()) {
      // Arama filtresi yoksa sadece mevcut kayıtları göster
      setCollections(allCollections);
      return;
    }

    // Arama filtresi varsa tüm kayıtları yeniden yükle
    try {
      const data = await guideOperations.getGuideCollections(filters.guideName, true);
      setAllCollections(data);
      
      // Arama filtresini uygula
      const filtered = data.filter(collection => 
        collection.transaction_no.toString().includes(collectionFilters.transactionNo.trim())
      );
      setCollections(filtered);
    } catch (error) {
      console.error('Arama sırasında hata:', error);
    }
  };

  // Sayfa yüklendiğinde seçili rehber varsa filtrelemeyi otomatik yap
  useEffect(() => {
    if (savedGuideName) {
      applyFilters();
    }
  }, []);

  // Sayfa yüklendiğinde işlem no filtresi varsa uygula
  useEffect(() => {
    if (savedTransactionFilter) {
      setCollectionFilters(prev => ({
        ...prev,
        transactionNo: savedTransactionFilter
      }));
      // localStorage'dan temizle
      localStorage.removeItem('collectionTransactionFilter');
    }
  }, [savedTransactionFilter]);

  // Filtreleri uygula
  const applyFilters = async () => {
    if (!filters.guideName.trim()) {
      setToast({
        show: true,
        message: 'Lütfen bir rehber seçin',
        variant: 'warning'
      });
      return;
    }

    setLoading(true);
    setIsInitialState(false);
    try {
      const trimmedFilters = {
        ...filters,
        guideName: filters.guideName.trim(),
        startDate: filters.selectedDate,
        endDate: filters.selectedDate
      };
      
      // Rezervasyonları getir
      const response = await guideOperations.getGuideReservationsWithTickets('all', trimmedFilters);
      console.log('Response:', response);
      setReservations(response);
      
      // Döviz kurlarını yeniden yükle
      const rates = await guideOperations.getCurrencyRates();
      setCurrencyRates(rates);

      // Tahsilat kayıtlarını güncelle
      await loadCollections(trimmedFilters.guideName);

    } catch (err) {
      console.error('Error details:', err);
      setError('Filtreleme sırasında hata oluştu: ' + err.message);
    }
    setLoading(false);
  };

  // Toggle fonksiyonu
  const toggleReservation = (reservationId) => {
    setOpenReservations(prev => ({
      ...prev,
      [reservationId]: !prev[reservationId]
    }));
  };

  // Rezervasyonları grupla
  const groupedReservations = Array.isArray(reservations) ? 
    Object.values(reservations.reduce((groups, reservation) => {
      if (!groups[reservation.id]) {
        groups[reservation.id] = {
          reservationData: {
            id: reservation.id,
            customer_name: reservation.customer_name,
            phone: reservation.phone,
            hotel_name: reservation.hotel_name,
            room_number: reservation.room_number,
            created_at: reservation.created_at,
            guide_name: reservation.guide_name,
            ticket_count: reservation.ticket_count,
            main_comment: reservation.main_comment,
            payments: reservation.payments,
            total_payments_try: reservation.total_payments_try || 0,
            guidePayment: reservation.guide_payment || 0,
            agencyPayment: reservation.agency_payment || 0,
            total_cost_try: Number(reservation.total_cost_try || 0),
            exchange_rate: Number(reservation.exchange_rate || 1),
            currency_rates: reservation.currency_rates,
            commission_rate: reservation.commission_rate || 40,
            reservation_guide_color: reservation.reservation_guide_color,
            rest_histories: []
          },
          tickets: []
        };
      }

      // Rest history varsa ekleyelim
      if (reservation.rest_history) {
        groups[reservation.id].reservationData.rest_histories.push({
          ticket_id: reservation.ticket_id,
          tour_name: reservation.tour_name,
          history: reservation.rest_history
        });
      }

      // Debug için rest_amount değerini kontrol edelim
      console.log('Processing ticket:', {
        ticket_id: reservation.ticket_id,
        rest_amount: reservation.rest_amount,
        fullReservation: reservation
      });

      groups[reservation.id].tickets.push({
        id: reservation.ticket_id,
        ticket_number: reservation.ticket_number,
        tour_name: reservation.tour_name,
        tour_group_name: reservation.tour_group_name,
        ticket_description: reservation.ticket_comment,
        date: reservation.date,
        time: reservation.time,
        adult_count: reservation.adult_count,
        child_count: reservation.child_count,
        free_count: reservation.free_count,
        total_cost: reservation.total_cost,
        base_price: reservation.base_price,
        adult_price: reservation.adult_price,
        half_price: reservation.half_price,
        currency: reservation.currency,
        status: reservation.ticket_status,
        rest_amount: reservation.rest_amount,
        rest_history: reservation.rest_history,
        guide_adult_price: reservation.guide_adult_price,
        guide_child_price: reservation.guide_child_price,
        ticket_options: reservation.ticket_options,
        options_total_price: reservation.options_total_price || 0
      });
      return groups;
    }, {})) : [];

  // Tüm rezervasyonları seç/kaldır
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedReservations(groupedReservations.map(group => group.reservationData.id));
    } else {
      setSelectedReservations([]);
    }
  };

  // Tek rezervasyon seç/kaldır
  const handleSelectReservation = (id) => {
    setSelectedReservations(prev => {
      if (prev.includes(id)) {
        return prev.filter(reservationId => reservationId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Tahsilat listesini yükle
  const loadCollections = async (selectedGuideName = '') => {
    try {
      setLoadingCollections(true);
      // Eğer arama filtresi varsa tüm kayıtları getir, yoksa sadece 1 kayıt
      const hasSearchFilter = collectionFilters.transactionNo.trim() !== '';
      const data = await guideOperations.getGuideCollections(selectedGuideName, hasSearchFilter);
      setAllCollections(data); // Tüm kayıtları sakla
      setCollections(data); // Başlangıçta tüm kayıtları göster
    } catch (error) {
      console.error('Tahsilat listesi yüklenirken hata:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  // Tahsilat filtrelerini uygula
  useEffect(() => {
    applyCollectionFilters();
  }, [collectionFilters, allCollections]);

  // Kaydetme fonksiyonunu güncelle
  const handleSave = async () => {
    if (selectedReservations.length === 0) {
      alert('Lütfen en az bir rezervasyon seçin');
      return;
    }

    // Seçili rezervasyonların rehber bilgisini al
    const selectedGuide = groupedReservations
      .find(group => group.reservationData.id === selectedReservations[0])
      ?.reservationData.guide_name;

    if (!selectedGuide) {
      alert('Seçili rezervasyonlar için rehber bilgisi bulunamadı');
      return;
    }

    try {
      setIsSaving(true);

      // Seçili rezervasyonların toplam rehber kazancını hesapla
      const totalGuideEarning = selectedReservations.reduce((total, reservationId) => {
        const reservation = groupedReservations.find(group => group.reservationData.id === reservationId);
        if (!reservation) return total;

        const totalPayments = Number(reservation.reservationData.total_payments_try || 0);
        const totalBase = reservation.tickets.reduce((sum, ticket) => {
          // Sadece rehber fiyatlarını kullan
          const adultPrice = Number(ticket.guide_adult_price || 0);
          const childPrice = Number(ticket.guide_child_price || 0);
          
          const basePrice = (
            (adultPrice * (Number(ticket.adult_count) || 0)) + 
            (childPrice * (Number(ticket.child_count) || 0)) +
            (Number(ticket.options_total_price) || 0)
          ) * (Number(currencyRates?.[ticket.currency]) || 1);
          return sum + basePrice;
        }, 0);

        // Toplam tabanı çıkar (kart komisyonu zaten düşülmüş durumda)
        let kalan = totalPayments - totalBase;
        // Komisyon oranını uygula
        const commissionRate = reservation.reservationData.commission_rate;
        const guideShare = kalan * (commissionRate / 100);
        
        return total + guideShare;
      }, 0);

      const result = await guideOperations.saveGuideCollections({
        reservationIds: selectedReservations,
        guideName: selectedGuide,
        description: description.trim(),
        totalGuideEarning: totalGuideEarning.toFixed(2) // Toplam rehber kazancını ekle
      });

      alert('Tahsilat başarıyla kaydedildi');
      setSelectedReservations([]);
      setDescription('');
      
      // Listeyi yenile
      loadCollections();
      applyFilters();

    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Tahsilat kaydedilirken hata oluştu: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCurrencyRatesUpdate = (newRates) => {
    setCurrencyRates(newRates);
  };

  // useNavigate ekleyelim
  const navigate = useNavigate();

  // Bilet numarasına tıklandığında çalışacak fonksiyon
  const handleTicketClick = (ticketNumber) => {
    if (ticketNumber) {
      navigate('/companyAgencyDashboard/reservations/list', {
        state: { searchTicketNumber: ticketNumber }
      });
    }
  };

  // Tahsilat kaydını silme fonksiyonu
  const handleDeleteCollection = async (transactionNo) => {
    if (!window.confirm('Bu tahsilat kaydını silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      setIsDeleting(true);
      // Silinecek kaydın döviz kurlarını al
      const collectionToDelete = collections.find(c => c.transaction_no === transactionNo);
      const oldRates = collectionToDelete?.currency_rates;
      
      await guideOperations.deleteGuideCollection(transactionNo);
      
      // Listeyi yenile
      await loadCollections();
      // Rezervasyon listesini yenile
      await applyFilters();
      
      // Eğer silinen kaydın döviz kurları varsa, CurrencyRatesCard'ı güncelle
      if (oldRates) {
        const rates = oldRates.split(',').reduce((acc, rate) => {
          const [currency, value] = rate.split(':');
          acc[currency] = parseFloat(value).toFixed(4);
          return acc;
        }, {});
        setCurrencyRates(rates);
      }
      
      alert('Tahsilat kaydı başarıyla silindi');
    } catch (error) {
      console.error('Silme hatası:', error);
      alert(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Tekil tahsilat kaydını silme fonksiyonu
  const handleDeleteSingleCollection = async (reservationId) => {
    if (!window.confirm('Bu tahsilat kaydını silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      setDeletingReservationId(reservationId);
      // Silinecek kaydın döviz kurlarını al
      const collectionToDelete = collections.find(c => 
        c.reservation_details.some(detail => detail.reservation_id === parseInt(reservationId))
      );
      const oldRates = collectionToDelete?.currency_rates;
      
      await guideOperations.deleteGuideCollectionByReservation(reservationId);
      
      // Listeyi yenile
      await loadCollections();
      // Rezervasyon listesini yenile
      await applyFilters();
      
      // Eğer silinen kaydın döviz kurları varsa, CurrencyRatesCard'ı güncelle
      if (oldRates) {
        const rates = oldRates.split(',').reduce((acc, rate) => {
          const [currency, value] = rate.split(':');
          acc[currency] = parseFloat(value).toFixed(4);
          return acc;
        }, {});
        setCurrencyRates(rates);
      }
      
      alert('Tahsilat kaydı başarıyla silindi');
    } catch (error) {
      console.error('Silme hatası:', error);
      alert(error.message);
    } finally {
      setDeletingReservationId(null);
    }
  };

  // Detayları toggle yapan fonksiyon
  const toggleCollectionDetails = (transactionNo) => {
    setOpenCollectionDetails(prev => ({
      ...prev,
      [transactionNo]: !prev[transactionNo]
    }));
  };

  // İşlem No header'ına tıklandığında filtreleme yap
  const handleTransactionNoHeaderClick = (transactionNo) => {
    setCollectionFilters(prev => ({
      ...prev,
      transactionNo: transactionNo
    }));
  };

  // Rezervasyon rehber rengini güncelle
  const handleUpdateGuideColor = async (reservationId, currentColor) => {
    try {
      const newColor = currentColor === 0 ? 1 : 0;
      await guideOperations.updateReservationGuideColor(reservationId, newColor);
      
      // Listeyi yenile
      await applyFilters();
      
      setToast({
        show: true,
        message: 'Rezervasyon rehber rengi güncellendi',
        variant: 'success'
      });
    } catch (error) {
      console.error('Rehber rengi güncelleme hatası:', error);
      setToast({
        show: true,
        message: error.message,
        variant: 'danger'
      });
    }
  };

  return (
    <div className="container-fluid mt-3">
      <ToastContainer position="top-end" className="p-3">
        <Toast 
          onClose={() => setToast({...toast, show: false})} 
          show={toast.show} 
          delay={3000} 
          autohide
          bg={toast.variant}
        >
          <Toast.Header>
            <strong className="me-auto">Bildirim</strong>
          </Toast.Header>
          <Toast.Body className={toast.variant === 'danger' ? 'text-white' : ''}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Collapse Butonu */}
      <div className="d-flex justify-content-end mb-3">
        <button 
          className="btn btn-outline-secondary"
          onClick={() => setIsSectionsOpen(!isSectionsOpen)}
        >
          <i className={`bi bi-chevron-${isSectionsOpen ? 'up' : 'down'} me-2`}></i>
          {isSectionsOpen ? 'Tümünü Kapat' : 'Tümünü Aç'}
        </button>
      </div>

      <div className="row">
        {/* Sol taraf - Filtreler ve Rezervasyonlar */}
        <div className="col-md-9">
          <div className="card mb-3">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">Filtreler</h5>
            </div>
            <div className={`card-body ${isSectionsOpen ? '' : 'd-none'}`}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Rehber Seçin</label>
                  <select
                    className="form-select"
                    name="guideName"
                    value={filters.guideName}
                    onChange={handleFilterChange}
                  >
                    <option value="">Rehber Seçin</option>
                    {guideList.map((guide, index) => (
                      <option key={index} value={guide.guide_name}>
                        {guide.guide_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Oluşturma Tarihi</label>
                  <input
                    type="date"
                    className="form-control"
                    name="selectedDate"
                    value={filters.selectedDate}
                    onChange={handleFilterChange}
                  />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={applyFilters}
                  >
                    <i className="bi bi-search me-2"></i>
                    Filtrele
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className={`card-body ${isSectionsOpen ? '' : 'd-none'}`}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="card-title mb-0">Rezervasyon Listesi</h4>
                {groupedReservations.length > 0 && (
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedReservations.length === groupedReservations.length}
                      onChange={handleSelectAll}
                      id="selectAll"
                    />
                    <label className="form-check-label" htmlFor="selectAll">
                      Tümünü Seç
                    </label>
                  </div>
                )}
              </div>
              
              <div className="table-responsive" style={{ 
                maxHeight: '600px',
                overflowY: 'auto',
                overflowX: 'auto'
              }}>
                <table className="table table-hover align-middle" style={{ 
                  minWidth: '1200px',
                  fontSize: '14px'
                }}>
                  <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr className="text-center">
                      <th className="py-3 text-nowrap" style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedReservations.length === groupedReservations.length}
                          onChange={handleSelectAll}
                          id="selectAll"
                        />
                      </th>
                      <th className="py-3 text-nowrap">Müşteri</th>
                      <th className="py-3 text-nowrap">Otel</th>
                      <th className="py-3 text-nowrap">Rehber/Bilet</th>
                      <th className="py-3 text-nowrap">Oluşturulma</th>
                      <th className="py-3 text-nowrap">Tahsilat</th>
                      <th className="py-3 text-nowrap">Tahsilat(TRY)</th>
                      <th className="py-3 text-nowrap">Rehber-T</th>
                      <th className="py-3 text-nowrap">Acenta-T</th>
                      <th className="py-3 text-nowrap">Komisyon Oranı</th>
                      <th className="py-3 text-nowrap">Rehber Hak Edişi</th>
                      <th className="py-3 text-nowrap">Acenta Hak Edişi</th>
                      <th className="py-3 text-nowrap">Not</th>
                      <th className="py-3 text-nowrap">Rest</th>
                      <th className="py-3 text-nowrap">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedReservations.map(group => (
                      <React.Fragment key={group.reservationData.id}>
                        <tr 
                          onClick={() => toggleReservation(group.reservationData.id)}
                          style={{ 
                            cursor: 'pointer',
                            backgroundColor: group.reservationData.reservation_guide_color === 1 ? '#e8f5e9' : 'inherit'
                          }}
                          className={`align-middle ${group.reservationData.reservation_guide_color === 1 ? 'table-success' : ''}`}
                        >
                          <td className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedReservations.includes(group.reservationData.id)}
                              onChange={() => handleSelectReservation(group.reservationData.id)}
                            />
                          </td>
                          <td className="py-3">
                            <div className="d-flex align-items-center">
                              <i className={`bi bi-chevron-${openReservations[group.reservationData.id] ? 'down' : 'right'} me-2 fs-5`}></i>
                              <div className="text-nowrap">
                                <div className="fw-bold mb-1">{group.reservationData.customer_name}</div>
                                <div className="text-muted small">
                                  <i className="bi bi-telephone me-1"></i>
                                  {group.reservationData.phone}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="text-nowrap">
                              <div className="fw-bold mb-1">
                                <i className="bi bi-building me-1"></i> 
                                {group.reservationData.hotel_name}
                              </div>
                              <div className="text-muted small">
                                <i className="bi bi-door-closed me-1"></i>
                                Oda: {group.reservationData.room_number}
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="text-nowrap">
                              <div className="fw-bold mb-1">
                                <i className="bi bi-person me-1"></i>
                                {group.reservationData.guide_name || 'Rehber Atanmamış'}
                              </div>
                              <div className="text-muted small">
                                <i className="bi bi-ticket-perforated me-1"></i>
                                Bilet: {group.reservationData.ticket_count}
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="text-nowrap">
                              <div className="fw-bold mb-1">
                                {new Date(group.reservationData.created_at).toLocaleDateString('tr-TR')}
                              </div>
                              <div className="text-muted small">
                                {new Date(group.reservationData.created_at).toLocaleTimeString('tr-TR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="text-nowrap small">
                              {group.reservationData.payments || 'Ödeme bilgisi yok'}
                            </div>
                          </td>
                          <td className="py-3 text-end">
                            <div className="text-nowrap fw-bold">
                              {Number(group.reservationData.total_payments_try).toFixed(2)} TL
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <div className="text-nowrap fw-bold">
                              {(() => {
                                const totalBase = group.tickets.reduce((sum, ticket) => {
                                  // Sadece rehber fiyatlarını kullan
                                  const adultPrice = Number(ticket.guide_adult_price || 0);
                                  const childPrice = Number(ticket.guide_child_price || 0);
                                  
                                  const basePrice = (
                                    (adultPrice * (Number(ticket.adult_count) || 0)) + 
                                    (childPrice * (Number(ticket.child_count) || 0)) +
                                    (Number(ticket.options_total_price) || 0)
                                  ) * (Number(currencyRates?.[ticket.currency]) || 1);
                                  return sum + basePrice;
                                }, 0);
                                return totalBase.toFixed(2) + ' TL';
                              })()}
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <div className="text-nowrap fw-bold">
                              {(() => {
                                const totalBase = group.tickets.reduce((sum, ticket) => {
                                  // Acenta fiyatlarını kullan (adult_price ve half_price)
                                  const adultPrice = Number(ticket.adult_price || 0);
                                  const childPrice = Number(ticket.half_price || 0);
                                  
                                  const basePrice = (
                                    (adultPrice * (Number(ticket.adult_count) || 0)) + 
                                    (childPrice * (Number(ticket.child_count) || 0)) +
                                    (Number(ticket.options_total_price) || 0)
                                  ) * (Number(currencyRates?.[ticket.currency]) || 1);
                                  return sum + basePrice;
                                }, 0);
                                return totalBase.toFixed(2) + ' TL';
                              })()}
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <div className="text-nowrap fw-bold">
                              %{group.reservationData.commission_rate}
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <div className="text-nowrap">
                              <span className="text-primary fw-bold">
                                {(() => {
                                  const totalPayments = Number(group.reservationData.total_payments_try || 0);
                                  const totalBase = group.tickets.reduce((sum, ticket) => {
                                    // Sadece rehber fiyatlarını kullan
                                    const adultPrice = Number(ticket.guide_adult_price || 0);
                                    const childPrice = Number(ticket.guide_child_price || 0);
                                    
                                    const basePrice = (
                                      (adultPrice * (Number(ticket.adult_count) || 0)) + 
                                      (childPrice * (Number(ticket.child_count) || 0)) +
                                      (Number(ticket.options_total_price) || 0)
                                    ) * (Number(currencyRates?.[ticket.currency]) || 1);
                                    return sum + basePrice;
                                  }, 0);

                                  // Toplam tabanı çıkar (kart komisyonu zaten düşülmüş durumda)
                                  let kalan = totalPayments - totalBase;
                                  // Komisyon oranını uygula
                                  const commissionRate = group.reservationData.commission_rate;
                                  const guideShare = kalan * (commissionRate / 100);
                                  
                                  return guideShare.toFixed(2) + ' TL';
                                })()}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <div className="text-nowrap">
                              <span className="text-success fw-bold">
                                {(() => {
                                  const totalPayments = Number(group.reservationData.total_payments_try || 0);
                                  
                                  // Acenta tabanı (adult_price ve half_price kullanarak)
                                  const agencyBase = group.tickets.reduce((sum, ticket) => {
                                    const adultPrice = Number(ticket.adult_price || 0);
                                    const childPrice = Number(ticket.half_price || 0);
                                    
                                    const basePrice = (
                                      (adultPrice * (Number(ticket.adult_count) || 0)) + 
                                      (childPrice * (Number(ticket.child_count) || 0)) +
                                      (Number(ticket.options_total_price) || 0)
                                    ) * (Number(currencyRates?.[ticket.currency]) || 1);
                                    return sum + basePrice;
                                  }, 0);

                                  // Yeni formül: (Tahsilat - Acenta Tabanı) * 0.6
                                  const kalan = totalPayments - agencyBase;
                                  const agencyShare = kalan * 0.6; // %60'ı acenta hak edişi
                                  
                                  return agencyShare.toFixed(2) + ' TL';
                                })()}
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="text-nowrap small">
                              {group.reservationData.main_comment || ''}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="text-nowrap">
                              {group.reservationData.rest_histories && group.reservationData.rest_histories.length > 0 ? (
                                group.reservationData.rest_histories.map((item, index) => (
                                  <div key={index} className="mb-2">
                                    {item.history.split(', ').map((history, hIndex) => (
                                      <div key={hIndex} className="small text-muted">
                                        {history}
                                      </div>
                                    ))}
                                  </div>
                                ))
                              ) : ''}
                            </div>
                          </td>
                          <td className="py-3">
                            <button
                              className={`btn btn-sm ${group.reservationData.reservation_guide_color === 1 ? 'btn-success' : 'btn-outline-success'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateGuideColor(group.reservationData.id, group.reservationData.reservation_guide_color);
                              }}
                            >
                              <i className="bi bi-check-circle me-1"></i>
                              {group.reservationData.reservation_guide_color === 1 ? 'isle Kaldır' : ''}
                            </button>
                          </td>
                        </tr>
                        
                        {/* Biletler tablosu için de benzer düzenlemeler */}
                        {openReservations[group.reservationData.id] && (
                          <tr>
                            <td colSpan="15" className="p-0">
                              <div className="bg-light p-3">
                                <table className="table table-sm mb-0">
                                  <thead>
                                    <tr className="table-secondary">
                                      <th style={{ width: '8%' }}>Bilet No</th>
                                      <th style={{ width: '12%' }}>Tur</th>
                                      <th style={{ width: '10%' }}>Tarih/Saat</th>
                                      <th style={{ width: '10%' }} className="text-center">Kişi Sayısı</th>
                                      <th style={{ width: '15%' }} className='text-center'>Taban Fiyatlar</th>
                                      <th style={{ width: '10%' }} className="text-end">Rehber Tabanı</th>
                                      <th style={{ width: '10%' }} className="text-end">Acenta Tabanı</th>
                                      <th style={{ width: '15%' }} className='text-center'>Açıklama</th>
                                      <th style={{ width: '8%' }}>Opsiyonlar</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {group.tickets.map(ticket => (
                                      <tr 
                                        key={`${group.reservationData.id}-${ticket.id}`} 
                                        className={`align-middle text-nowrap ${ticket.status === 0 ? 'table-danger' : ''}`}
                                      >
                                        <td>
                                          <div className="d-flex align-items-center gap-2">
                                            <span 
                                              className="text-primary" 
                                              style={{ cursor: 'pointer' }}
                                              onClick={() => handleTicketClick(ticket.ticket_number)}
                                            >
                                              #{ticket.ticket_number || '-'}
                                            </span>
                                          </div>
                                        </td>
                                        <td>
                                          <div className="fw-bold">{ticket.tour_name}</div>
                                          <small className="text-muted d-block">{ticket.tour_group_name}</small>
                                        </td>
                                        <td>
                                          <div>{ticket.date ? new Date(ticket.date).toLocaleDateString('tr-TR') : '-'}</div>
                                          <small className="text-muted">{ticket.time || '-'}</small>
                                        </td>
                                        <td className="text-center">
                                          <div className="d-flex flex-column">
                                            <span className="badge bg-primary mb-1">
                                              Yetişkin: {ticket.adult_count || 0}
                                            </span>
                                            <span className="badge bg-info mb-1">
                                              Çocuk: {ticket.child_count || 0}
                                            </span>
                                            {ticket.free_count > 0 && (
                                              <span className="badge bg-secondary">
                                                Ücretsiz: {ticket.free_count}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="text-center">
                                          <div className="text-wrap small">
                                            <div className="mb-2">
                                              <div className="fw-bold text-primary">Rehber Fiyatları:</div>
                                              <div>
                                                <strong>Yetişkin:</strong> {Number(ticket.guide_adult_price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {ticket.currency}
                                              </div>
                                              {ticket.child_count > 0 && (
                                                <div>
                                                  <strong>Çocuk:</strong> {Number(ticket.guide_child_price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {ticket.currency}
                                                </div>
                                              )}
                                            </div>
                                            <div>
                                              <div className="fw-bold text-success">Acenta Fiyatları:</div>
                                              <div>
                                                <strong>Yetişkin:</strong> {Number(ticket.adult_price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {ticket.currency}
                                              </div>
                                              {ticket.child_count > 0 && (
                                                <div>
                                                  <strong>Çocuk:</strong> {Number(ticket.half_price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {ticket.currency}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="text-end">
                                          <div className="d-flex flex-column align-items-end">
                                            <strong>
                                              {(() => {
                                                // Sadece rehber fiyatlarını kullan
                                                const adultPrice = Number(ticket.guide_adult_price || 0);
                                                const childPrice = Number(ticket.guide_child_price || 0);
                                                
                                                const basePrice = (
                                                  adultPrice * (Number(ticket.adult_count) || 0) +
                                                  childPrice * (Number(ticket.child_count) || 0)
                                                );
                                                
                                                // Opsiyon fiyatlarını hesapla
                                                let optionsTotal = 0;
                                                if (ticket.ticket_options) {
                                                  optionsTotal = ticket.ticket_options.split(', ').reduce((sum, option) => {
                                                    const priceMatch = option.match(/\((\d+\.?\d*)\s*[A-Z]+\)/);
                                                    if (priceMatch) {
                                                      return sum + Number(priceMatch[1]);
                                                    }
                                                    return sum;
                                                  }, 0);
                                                }

                                                const totalPrice = basePrice + optionsTotal;
                                                
                                                return totalPrice.toLocaleString('tr-TR', { 
                                                  minimumFractionDigits: 2, 
                                                  maximumFractionDigits: 2 
                                                }) + ' ' + ticket.currency;
                                              })()}
                                            </strong>
                                            {ticket.ticket_options && (
                                              <small className="text-muted">
                                                {(() => {
                                                  // Sadece rehber fiyatlarını kullan
                                                  const adultPrice = Number(ticket.guide_adult_price || 0);
                                                  const childPrice = Number(ticket.guide_child_price || 0);
                                                  
                                                  const basePrice = (
                                                    adultPrice * (Number(ticket.adult_count) || 0) +
                                                    childPrice * (Number(ticket.child_count) || 0)
                                                  );
                                                  return `Taban: ${basePrice.toLocaleString('tr-TR', { 
                                                    minimumFractionDigits: 2, 
                                                    maximumFractionDigits: 2 
                                                  })} ${ticket.currency}`;
                                                })()}
                                              </small>
                                            )}
                                          </div>
                                        </td>
                                        <td className="text-end">
                                          <div className="d-flex flex-column align-items-end">
                                            <strong>
                                              {(() => {
                                                // Acenta fiyatlarını kullan (adult_price ve half_price)
                                                const adultPrice = Number(ticket.adult_price || 0);
                                                const childPrice = Number(ticket.half_price || 0);
                                                
                                                const basePrice = (
                                                  adultPrice * (Number(ticket.adult_count) || 0) +
                                                  childPrice * (Number(ticket.child_count) || 0)
                                                );
                                                
                                                // Opsiyon fiyatlarını hesapla
                                                let optionsTotal = 0;
                                                if (ticket.ticket_options) {
                                                  optionsTotal = ticket.ticket_options.split(', ').reduce((sum, option) => {
                                                    const priceMatch = option.match(/\((\d+\.?\d*)\s*[A-Z]+\)/);
                                                    if (priceMatch) {
                                                      return sum + Number(priceMatch[1]);
                                                    }
                                                    return sum;
                                                  }, 0);
                                                }

                                                const totalPrice = basePrice + optionsTotal;
                                                
                                                return totalPrice.toLocaleString('tr-TR', { 
                                                  minimumFractionDigits: 2, 
                                                  maximumFractionDigits: 2 
                                                }) + ' ' + ticket.currency;
                                              })()}
                                            </strong>
                                            {ticket.ticket_options && (
                                              <small className="text-muted">
                                                {(() => {
                                                  // Acenta fiyatlarını kullan
                                                  const adultPrice = Number(ticket.adult_price || 0);
                                                  const childPrice = Number(ticket.half_price || 0);
                                                  
                                                  const basePrice = (
                                                    adultPrice * (Number(ticket.adult_count) || 0) +
                                                    childPrice * (Number(ticket.child_count) || 0)
                                                  );
                                                  return `Taban: ${basePrice.toLocaleString('tr-TR', { 
                                                    minimumFractionDigits: 2, 
                                                    maximumFractionDigits: 2 
                                                  })} ${ticket.currency}`;
                                                })()}
                                              </small>
                                            )}
                                          </div>
                                        </td>
                                        
                                        <td className='text-center'>
                                          {ticket.ticket_description && (
                                            <div className="text-wrap small">
                                              <i className="bi bi-info-circle me-1"></i>
                                              {ticket.ticket_description}
                                            </div>
                                          )}
                                        </td>
                                        <td>
                                          <div className="text-wrap small">
                                            {ticket.ticket_options ? (
                                              ticket.ticket_options.split(', ').map((option, index) => (
                                                <div key={index} className="mb-1">
                                                  <span className="badge bg-info">
                                                    {option}
                                                  </span>
                                                </div>
                                              ))
                                            ) : '-'}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Kaydet Butonu - Rezervasyon listesinin altına */}
          {groupedReservations.length > 0 && selectedReservations.length > 0 && (
            <div className="position-sticky bottom-0 bg-light p-3 border-top mt-3">
              <div className="row align-items-center">
                <div className="col">
                  <strong>{selectedReservations.length}</strong> rezervasyon seçildi
                </div>
                <div className="col-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tahsilat açıklaması (opsiyonel)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="col text-end">
                  <button 
                    className="btn btn-success"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-2"></i>
                        Seçili Rezervasyonların tahsilatını yap
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sağ taraf - Döviz Kurları */}
        <div className="col-md-3">
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">Döviz Kurları</h5>
            </div>
            <div className={`card-body ${isSectionsOpen ? '' : 'd-none'}`}>
              <CurrencyRatesCard 
                currencyRates={currencyRates} 
                onRatesUpdate={handleCurrencyRatesUpdate}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tahsilat Kayıtları - En alta taşındı */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Tahsilat Kayıtları</h5>
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="İşlem No ile ara..."
                    name="transactionNo"
                    value={collectionFilters.transactionNo}
                    onChange={handleCollectionFilterChange}
                    style={{ width: '200px' }}
                  />
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      setCollectionFilters({ transactionNo: '' });
                    }}
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                </div>
              </div>
              {loadingCollections ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                </div>
              ) : collections.length === 0 && isInitialState ? (
                <div className="text-center py-3">
                  <p className="text-muted mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    Lütfen tahsilat kayıtlarını görüntülemek için yukarıdan filtre seçin ve "Filtrele" butonuna basın.
                  </p>
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-3">
                  <p className="text-muted mb-0">Seçilen kriterlere uygun tahsilat kaydı bulunmuyor</p>
                </div>
              ) : (
                <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  <div style={{ minWidth: '1200px', overflowX: 'auto' }}>
                    <table className="table table-hover" style={{ position: 'relative' }}>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                        <tr>
                          <th 
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              // İşlem No header'ına tıklandığında filtreleme input'unu temizle
                              setCollectionFilters(prev => ({
                                ...prev,
                                transactionNo: ''
                              }));
                            }}
                            title="Filtrelemeyi temizlemek için tıklayın"
                          >
                            İşlem No
                          </th>
                          <th>Kayıt Tarih/Saat</th>
                          <th>Rehber</th>
                          <th>Rezervasyon Sayısı</th>
                          <th>Açıklama</th>
                          <th>Toplam Hak Ediş</th>
                          <th className="text-center text-nowrap">Döviz Kurları</th>
                          <th>Rest Miktarı</th>
                          <th>İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collections.map((collection) => (
                          <React.Fragment key={collection.transaction_no}>
                            <tr>
                              <td className="text-nowrap">
                                <div className="d-flex align-items-center gap-2">
                                  <button 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => toggleCollectionDetails(collection.transaction_no)}
                                  >
                                    <i className={`bi bi-chevron-${openCollectionDetails[collection.transaction_no] ? 'up' : 'down'}`}></i>
                                  </button>
                                  <span 
                                    style={{ cursor: 'pointer', color: '#007bff' }}
                                    onClick={() => handleTransactionNoHeaderClick(collection.transaction_no)}
                                    title="Bu işlem numarası ile filtrelemek için tıklayın"
                                  >
                                    {collection.transaction_no}
                                  </span>
                                </div>
                              </td>
                              <td className="text-nowrap">
                                <span className="fw-bold">
                                  {new Date(collection.collection_date).toLocaleDateString('tr-TR')}
                                </span>
                                <small className="text-muted ms-2">
                                  {new Date(collection.collection_date).toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </small>
                              </td>
                              <td className="text-nowrap">{collection.guide_name}</td>
                              <td className="text-nowrap">{collection.reservation_count}</td>
                              <td className="text-nowrap">{collection.description}</td>
                              <td className="text-nowrap">
                                <strong>
                                  {Number(collection.guide_earning).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                                </strong>
                              </td>
                              <td className="text-center" style={{ minWidth: '150px' }}>
                                <div className="small" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                                  {collection.currency_rates && collection.currency_rates !== '' ? (
                                    <div className="d-flex justify-content-center gap-2">
                                      {collection.currency_rates.includes('EUR:') && (
                                        <span className="badge bg-transparent border border-secondary text-secondary">
                                          EUR: {collection.currency_rates.split(',').find(rate => rate.startsWith('EUR:')).split(':')[1]}
                                        </span>
                                      )}
                                      {collection.currency_rates.includes('USD:') && (
                                        <span className="badge bg-transparent border border-secondary text-secondary">
                                          USD: {collection.currency_rates.split(',').find(rate => rate.startsWith('USD:')).split(':')[1]}
                                        </span>
                                      )}
                                      {collection.currency_rates.includes('GBP:') && (
                                        <span className="badge bg-transparent border border-secondary text-secondary">
                                          GBP: {collection.currency_rates.split(',').find(rate => rate.startsWith('GBP:')).split(':')[1]}
                                        </span>
                                      )}
                                    </div>
                                  ) : '-'}
                                </div>
                              </td>
                              <td className="text-nowrap">
                                <div className="text-wrap small">
                                  {(() => {
                                    // Toplam rest miktarlarını göster
                                    if (collection.total_rest_amounts && collection.total_rest_amounts.length > 0) {
                                      return (
                                        <div>
                                          {/* Sadece ilk rest miktarını göster */}
                                          <div className="mb-1">
                                            <span className="badge bg-warning text-dark">
                                              {collection.total_rest_amounts[0].formatted}
                                            </span>
                                          </div>
                                          {/* Eğer birden fazla rest varsa sayısını göster */}
                                          {collection.total_rest_amounts.length > 1 && (
                                            <div className="small text-muted">
                                              +{collection.total_rest_amounts.length - 1} daha
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                    
                                    // Eğer toplam rest miktarları yoksa, eski yöntemi kullan (geriye uyumluluk)
                                    const allRestAmounts = collection.reservation_details.flatMap(detail => 
                                      detail.tickets.map(ticket => ticket.rest_amount).filter(rest => rest && rest !== 'Rest bilgisi yok')
                                    );
                                    
                                    if (allRestAmounts.length === 0) {
                                      return '-';
                                    }
                                    
                                    // Rest miktarlarını grupla (aynı para birimi olanları topla)
                                    const groupedRest = allRestAmounts.reduce((acc, rest) => {
                                      const parts = rest.split(' ');
                                      const amount = parseFloat(parts[0]);
                                      const currency = parts[1];
                                      
                                      if (!acc[currency]) {
                                        acc[currency] = 0;
                                      }
                                      acc[currency] += amount;
                                      return acc;
                                    }, {});
                                    
                                    const groupedRestArray = Object.entries(groupedRest);
                                    
                                    return (
                                      <div>
                                        {/* Sadece ilk rest miktarını göster */}
                                        <div className="mb-1">
                                          <span className="badge bg-warning text-dark">
                                            {groupedRestArray[0][1].toFixed(2)} {groupedRestArray[0][0]}
                                          </span>
                                        </div>
                                        {/* Eğer birden fazla rest varsa sayısını göster */}
                                        {groupedRestArray.length > 1 && (
                                          <div className="small text-muted">
                                            +{groupedRestArray.length - 1} daha
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="text-nowrap">
                                <button 
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteCollection(collection.transaction_no)}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                      Siliniyor...
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-trash me-1"></i>
                                      Sil
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                            
                            <tr 
                              id={`details-${collection.transaction_no}`} 
                              style={{
                                display: openCollectionDetails[collection.transaction_no] ? '' : 'none',
                                backgroundColor: collection.reservation_details.some(detail => detail.reservation_guide_color === 1) ? '#e8f5e9' : 'inherit'
                              }}
                            >
                              <td colSpan="15" className="p-0">
                                <div className="table-responsive" style={{ minWidth: '1200px', overflowX: 'auto' }}>
                                  <table className="table table-sm mb-0 bg-light" style={{ width: '100%', minWidth: '1200px' }}>
                                    <thead>
                                      <tr className="table-secondary">
                                        <th style={{width: '15%'}}>Müşteri / Otel</th>
                                        <th style={{width: '15%'}}>Tur</th>
                                        <th style={{width: '12%'}}>Tarih</th>
                                        <th style={{width: '10%'}}>Bilet No</th>
                                        <th style={{width: '10%'}}>Opsiyonlar</th>
                                        <th style={{width: '13%'}}>Kişi Sayısı</th>
                                        <th style={{width: '15%'}} className="text-end">Rehber Tabanı</th>
                                        <th style={{width: '10%'}} className="text-center">Hak Ediş</th>
                                        <th style={{width: '10%'}} className="text-center">Tahsilat</th>
                                        <th style={{width: '10%'}} className="text-center">Rest Miktarı</th>
                                        <th style={{width: '10%'}} className="text-center">İşlemler</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {collection.reservation_details.map((detail, index) => (
                                        detail.tickets.map((ticket, ticketIndex) => (
                                          <tr 
                                            key={`${index}-${ticketIndex}`} 
                                            className={`align-middle text-nowrap ${ticket.status === 0 ? 'table-danger' : ''}`}
                                          >
                                            {ticketIndex === 0 && (
                                              <td rowSpan={detail.tickets.length}>
                                                <div className="d-flex flex-column">
                                                  <strong>{detail.customer_name}</strong>
                                                  <small className="text-muted">
                                                    <i className="bi bi-building me-1"></i>
                                                    {detail.hotel_name}
                                                  </small>
                                                </div>
                                              </td>
                                            )}
                                            <td>
                                              <div className="d-flex flex-column">
                                                <strong>{ticket.tour_name}</strong>
                                              </div>
                                            </td>
                                            <td>
                                              <div className="d-flex flex-column">
                                                <span>{ticket.tour_date ? new Date(ticket.tour_date).toLocaleDateString('tr-TR') : '-'}</span>
                                              </div>
                                            </td>
                                            <td>
                                              <div className="d-flex align-items-center gap-2">
                                                <span 
                                                  className="badge bg-info" 
                                                  style={{ cursor: 'pointer' }}
                                                  onClick={() => handleTicketClick(ticket.ticket_number)}
                                                >
                                                  #{ticket.ticket_number}
                                                </span>
                                              </div>
                                            </td>
                                            <td>
                                              <div className="text-wrap small">
                                                {ticket.ticket_options ? (
                                                  ticket.ticket_options.split(', ').map((option, index) => (
                                                    <div key={index} className="mb-1">
                                                      <span className="badge bg-info">
                                                        {option}
                                                      </span>
                                                    </div>
                                                  ))
                                                ) : '-'}
                                              </div>
                                            </td>
                                            <td>
                                              <div className="d-flex flex-column">
                                                <div className="d-flex align-items-center">
                                                  <i className="bi bi-person me-1"></i>
                                                  <span>{ticket.adult_count || 0} Yetişkin</span>
                                                  {ticket.adult_count > 0 && (
                                                    <span className="ms-1 text-muted">
                                                      ({ticket.guide_adult_price} {ticket.currency})
                                                    </span>
                                                  )}
                                                </div>
                                                {ticket.child_count > 0 && (
                                                  <div className="d-flex align-items-center">
                                                    <i className="bi bi-person-heart me-1"></i>
                                                    <span>{ticket.child_count} Çocuk</span>
                                                    <span className="ms-1 text-muted">
                                                      ({ticket.guide_child_price} {ticket.currency})
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                            <td className="text-end">
                                              <div className="d-flex flex-column align-items-end">
                                                <strong>
                                                  {(() => {
                                                    // Sadece rehber fiyatlarını kullan
                                                    const adultPrice = Number(ticket.guide_adult_price || 0);
                                                    const childPrice = Number(ticket.guide_child_price || 0);
                                                    
                                                    const basePrice = (
                                                      adultPrice * (Number(ticket.adult_count) || 0) +
                                                      childPrice * (Number(ticket.child_count) || 0)
                                                    );
                                                    
                                                    // Opsiyon fiyatlarını hesapla
                                                    let optionsTotal = 0;
                                                    if (ticket.ticket_options) {
                                                      optionsTotal = ticket.ticket_options.split(', ').reduce((sum, option) => {
                                                        const priceMatch = option.match(/\((\d+\.?\d*)\s*[A-Z]+\)/);
                                                        if (priceMatch) {
                                                          return sum + Number(priceMatch[1]);
                                                        }
                                                        return sum;
                                                      }, 0);
                                                    }

                                                    const totalPrice = basePrice + optionsTotal;
                                                    
                                                    return totalPrice.toLocaleString('tr-TR', { 
                                                      minimumFractionDigits: 2, 
                                                      maximumFractionDigits: 2 
                                                    }) + ' ' + ticket.currency;
                                                  })()}
                                                </strong>
                                                {ticket.ticket_options && (
                                                  <small className="text-muted">
                                                    {(() => {
                                                      // Sadece rehber fiyatlarını kullan
                                                      const adultPrice = Number(ticket.guide_adult_price || 0);
                                                      const childPrice = Number(ticket.guide_child_price || 0);
                                                      
                                                      const basePrice = (
                                                        adultPrice * (Number(ticket.adult_count) || 0) +
                                                        childPrice * (Number(ticket.child_count) || 0)
                                                      );
                                                      return `Taban: ${basePrice.toLocaleString('tr-TR', { 
                                                        minimumFractionDigits: 2, 
                                                        maximumFractionDigits: 2 
                                                      })} ${ticket.currency}`;
                                                    })()}
                                                  </small>
                                                )}
                                              </div>
                                            </td>
                                            <td className="text-center">
                                              <strong className="text-success">
                                                {(() => {
                                                  // Eğer ilk bilet ise tüm biletlerin toplam hak edişini hesapla
                                                  if (ticketIndex === 0) {
                                                    const totalGuideEarning = detail.tickets.reduce((sum, ticket) => {
                                                      return sum + Number(ticket.guide_earning || 0);
                                                    }, 0);
                                                    return totalGuideEarning.toLocaleString('tr-TR', { 
                                                      minimumFractionDigits: 2, 
                                                      maximumFractionDigits: 2 
                                                    }) + ' TL';
                                                  }
                                                  return '-';
                                                })()}
                                              </strong>
                                            </td>
                                            <td className="text-center">
                                              <div className="text-wrap small">
                                                {ticketIndex === 0 && ticket.payments ? (
                                                  ticket.payments.split(', ').map((payment, index) => (
                                                    <div key={index} className="mb-1">
                                                      <span className="badge bg-info">
                                                        {payment}
                                                      </span>
                                                    </div>
                                                  ))
                                                ) : '-'}
                                              </div>
                                            </td>
                                            <td className="text-center">
                                              <div className="text-wrap small">
                                                {ticket.rest_amount && ticket.rest_amount !== 'Rest bilgisi yok' ? (
                                                  <div style={{ 
                                                    maxHeight: '60px', 
                                                    overflowY: 'auto',
                                                    overflowX: 'hidden'
                                                  }}>
                                                    {ticket.rest_amount.split(', ').map((rest, index) => (
                                                      <div key={index} className="mb-1">
                                                        <span className="badge bg-warning text-dark">
                                                          {rest}
                                                        </span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : '-'}
                                              </div>
                                            </td>
                                            <td className="text-center">
                                              {ticketIndex === 0 && (
                                                <button 
                                                  className="btn btn-sm btn-outline-danger"
                                                  onClick={() => handleDeleteSingleCollection(detail.reservation_id)}
                                                  disabled={deletingReservationId === detail.reservation_id}
                                                >
                                                  {deletingReservationId === detail.reservation_id ? (
                                                    <>
                                                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                      Siliniyor...
                                                    </>
                                                  ) : (
                                                    <>
                                                      <i className="bi bi-trash me-1"></i>
                                                      Sil
                                                    </>
                                                  )}
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        ))
                                      ))}
                                      
                                      {/* İşlem için toplam rest miktarları alt satırı - Tablonun en altına */}
                                      {collection.total_rest_amounts && collection.total_rest_amounts.length > 0 && (
                                        <tr className="table-warning">
                                          <td colSpan="15" className="py-4">
                                            <div className="d-flex align-items-center justify-content-between">
                                              <div className="d-flex align-items-center">
                                                <i className="bi bi-calculator me-2 text-warning"></i>
                                                <strong className="text-warning">İŞLEM TOPLAM REST MİKTARLARI:</strong>
                                              </div>
                                              <div className="d-flex gap-2">
                                                {collection.total_rest_amounts.map((rest, index) => (
                                                  <span key={index} className="badge bg-warning text-dark fs-6">
                                                    {rest.formatted}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                      
                                      {/* İşlem için toplam tahsilat miktarları alt satırı */}
                                      {collection.total_payment_amounts && collection.total_payment_amounts.length > 0 && (
                                        <tr className="table-info">
                                          <td colSpan="15" className="py-4">
                                            <div className="d-flex align-items-center justify-content-between">
                                              <div className="d-flex align-items-center">
                                                <i className="bi bi-credit-card me-2 text-info"></i>
                                                <strong className="text-info">İŞLEM TOPLAM TAHSİLAT MİKTARLARI:</strong>
                                              </div>
                                              <div className="d-flex gap-2">
                                                {collection.total_payment_amounts.map((payment, index) => (
                                                  <span key={index} className="badge bg-info text-white fs-6">
                                                    {payment.formatted}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {collections.length > 0 && (
                <div className="card mt-3 bg-light" style={{ position: 'sticky', bottom: 0, zIndex: 1 }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">
                        <i className="bi bi-calculator me-2"></i>
                        TOPLAM REHBER KAZANÇ
                      </h6>
                      <h5 className="mb-0 text-success">
                        {collections.reduce((total, collection) => {
                          // Her tahsilat kaydı için tüm biletlerin hak edişlerini topla
                          const collectionTotal = collection.reservation_details.reduce((subTotal, detail) => {
                            const ticketsTotal = detail.tickets.reduce((ticketSum, ticket) => {
                              return ticketSum + Number(ticket.guide_earning || 0);
                            }, 0);
                            return subTotal + ticketsTotal;
                          }, 0);
                          return total + collectionTotal;
                        }, 0).toLocaleString('tr-TR', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })} TL
                      </h5>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideOperations; 