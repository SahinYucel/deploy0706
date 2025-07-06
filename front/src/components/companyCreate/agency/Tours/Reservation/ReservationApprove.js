import React, { useState, useEffect, useRef } from 'react';
import { getReservationDetails, updateReservationStatus, deleteCompletedReservations, updateReservationDetails } from '../../../../../services/api';
import { format, parse, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Modal, Button, Form } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from 'react-router-dom';

function ReservationApprove() {
  const navigate = useNavigate();
  const [pendingReservations, setPendingReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [approvedReservations, setApprovedReservations] = useState({
    guide: {},
    provider: {}  
  });
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const previousCountRef = useRef(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    phone: '',
    hotel_name: '',
    room_number: '',
    guide_name: '',
    guide_phone: '',
    adult_count: 0,
    child_count: 0,
    free_count: 0,
    rest_amount: '',
    time: '',
    ticket_no: '',
    date: null,
    description: '',
    option: ''
  });

  // Load saved filters from localStorage
  const loadSavedFilters = () => {
    const savedFilters = localStorage.getItem('reservationFilters');
    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters);
      // Convert string dates back to Date objects
      if (parsedFilters.startDate) parsedFilters.startDate = new Date(parsedFilters.startDate);
      if (parsedFilters.endDate) parsedFilters.endDate = new Date(parsedFilters.endDate);
      return parsedFilters;
    }
    return {
      startDate: null,
      endDate: null,
      approvalStatus: 'all',
      searchTerm: ''
    };
  };

  const [filters, setFilters] = useState(loadSavedFilters);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('reservationFilters', JSON.stringify(filters));
  }, [filters]);

  // Fetch reservations when component mounts with saved filters
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      fetchPendingReservations(filters.startDate, filters.endDate);
    }
  }, []);

  // Rezervasyon sayısı değiştiğinde kontrol et
  useEffect(() => {
    const count = pendingReservations.length;

    // Eğer sayı 30, 60, 90 gibi değerlere ulaştıysa ve önceki sayıdan büyükse
    if (count > previousCountRef.current && (count === 50 || count === 75 || count === 100)) {
      setShowCleanupModal(true);
    }

    previousCountRef.current = count;
  }, [pendingReservations.length]);

  const fetchPendingReservations = async (startDate, endDate) => {
    try {
      setLoading(true);
      const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : null;
      const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : null;
      const response = await getReservationDetails(formattedStartDate, formattedEndDate);
      setPendingReservations(response.data);

      // Mevcut onay durumlarını kontrol et
      const guideApprovals = {};
      const providerApprovals = {};

      response.data.forEach(reservation => {
        if (reservation.guide_status === 1) {
          guideApprovals[reservation.id] = true;
        }
        if (reservation.provider_status === 1) {
          providerApprovals[reservation.id] = true;
        }
      });

      setApprovedReservations({
        guide: guideApprovals,
        provider: providerApprovals
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setAlert({
        show: true,
        type: 'danger',
        message: 'Rezervasyonlar yüklenirken bir hata oluştu!'
      });
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const isApproved = approvedReservations.guide[id];
      const newStatus = isApproved ? 'rejected' : 'approved';

      console.log(`Rehber onayı ${isApproved ? 'kaldırılıyor' : 'gönderiliyor'}: ID=${id}`);
      const response = await updateReservationStatus(id, 'guide', newStatus);
      console.log('Onay yanıtı:', response);

      // Update the guide approval status
      setApprovedReservations(prev => ({
        ...prev,
        guide: {
          ...prev.guide,
          [id]: !isApproved
        }
      }));

    } catch (error) {
      console.error('Error updating guide approval:', error);
      setAlert({
        show: true,
        type: 'danger',
        message: `Rehber onayı güncellenirken bir hata oluştu: ${error.message}`
      });
    }
  };

  const handleProviderApprove = async (id) => {
    try {
      const isApproved = approvedReservations.provider[id];
      const newStatus = isApproved ? 'rejected' : 'approved';

      console.log(`Tedarikçi onayı ${isApproved ? 'kaldırılıyor' : 'gönderiliyor'}: ID=${id}`);
      const response = await updateReservationStatus(id, 'provider', newStatus);
      console.log('Onay yanıtı:', response);

      // Update the provider approval status
      setApprovedReservations(prev => ({
        ...prev,
        provider: {
          ...prev.provider,
          [id]: !isApproved
        }
      }));

    } catch (error) {
      console.error('Error updating provider approval:', error);
      setAlert({
        show: true,
        type: 'danger',
        message: `Tedarikçi onayı güncellenirken bir hata oluştu: ${error.message}`
      });
    }
  };

  const handleDeleteCompleted = async () => {
    if (window.confirm('Tamamlanan tüm rezervasyonlar silinecek. Emin misiniz?')) {
      try {
        setLoading(true);
        const response = await deleteCompletedReservations();

        setAlert({
          show: true,
          type: 'success',
          message: `${response.data.message}`
        });

        // Rezervasyon listesini yenile
        fetchPendingReservations(null, null);

        // Temizleme modalını kapat
        setShowCleanupModal(false);
      } catch (error) {
        console.error('Error deleting completed reservations:', error);
        setAlert({
          show: true,
          type: 'danger',
          message: 'Tamamlanan rezervasyonlar silinirken bir hata oluştu!'
        });
        setLoading(false);
      }
    }
  };

  // Temizleme modalını kapat
  const handleCloseCleanupModal = () => {
    setShowCleanupModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Filtre değişikliklerini işle
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Modify date filter change handler
  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setFilters(prev => ({ 
      ...prev, 
      startDate: start,
      endDate: end
    }));
    
    if (start && end) {
      fetchPendingReservations(start, end);
    } else {
      setPendingReservations([]); // Clear reservations when dates are cleared
    }
  };

  // Filtreleme fonksiyonu
  const getFilteredReservations = () => {
    return pendingReservations.filter(reservation => {
      // Tarih filtresi
      let passesDateFilter = true;
      if (filters.startDate && filters.endDate) {
        const reservationDate = new Date(reservation.date);
        reservationDate.setHours(0, 0, 0, 0);
        const filterStartDate = new Date(filters.startDate);
        filterStartDate.setHours(0, 0, 0, 0);
        const filterEndDate = new Date(filters.endDate);
        filterEndDate.setHours(23, 59, 59, 999);

        passesDateFilter = reservationDate >= filterStartDate && reservationDate <= filterEndDate;
      }

      // Onay durumu filtresi
      let passesApprovalFilter = true;
      if (filters.approvalStatus !== 'all') {
        const isApproved = approvedReservations.guide[reservation.id] &&
          approvedReservations.provider[reservation.id];
        passesApprovalFilter = filters.approvalStatus === 'approved' ? isApproved : !isApproved;
      }

      // Arama filtresi
      let passesSearchFilter = true;
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        passesSearchFilter = [
          reservation.customer_name,
          reservation.phone,
          reservation.hotel_name,
          reservation.tour_name,
          reservation.guide_name,
          reservation.ticket_no
        ].some(field =>
          field?.toString().toLowerCase().includes(searchLower)
        );
      }

      return passesDateFilter && passesApprovalFilter && passesSearchFilter;
    });
  };

  const handleWhatsAppReminder = (guidePhone, reservation) => {
    if (!guidePhone) {
      setAlert({
        show: true,
        type: 'warning',
        message: 'Rehber telefon numarası bulunamadı!'
      });
      return;
    }

    // Remove any non-numeric characters from the phone number
    const cleanPhone = guidePhone.replace(/\D/g, '');
    
    // Create the message
    const message = `Dikkat! Hala rezervasyonu onaylamadınız!\n\n` +
      `Müşteri: ${reservation.customer_name}\n` +
      `Tur: ${reservation.tour_name}\n` +
      `Tarih: ${formatDate(reservation.date)}\n` +
      `Saat: ${reservation.time}\n` +
      `Kişi Sayısı: ${reservation.adult_count + reservation.child_count + reservation.free_count}\n` + 
      `Ticket No: ${reservation.ticket_no}`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
  };

  const handleTicketNumberClick = (ticketNumber) => {
    if (!ticketNumber) return;
    
    // Navigate to reservations list with ticket number as URL parameter
    navigate(`/companyAgencyDashboard/reservations/list?ticketNumber=${encodeURIComponent(ticketNumber)}`);
  };

  return (
    <div className="container-fluid px-4 mt-5" style={{ maxWidth: "1800px" }}>
      {alert.show && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert({ show: false, type: '', message: '' })}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Temizleme Önerisi Modalı */}
      {showCleanupModal && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <strong>Dikkat!</strong> Rezervasyon sayısı {pendingReservations.length} oldu.
          Sistem performansını artırmak için tamamlanan rezervasyonları silmek ister misiniz?
          <div className="mt-2">
            <button
              className="btn btn-danger btn-sm me-2"
              onClick={handleDeleteCompleted}
            >
              <i className="bi bi-trash me-1"></i> Tamamlananları Sil
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCloseCleanupModal}
            >
              Daha Sonra
            </button>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={handleCloseCleanupModal}
            aria-label="Close"
          ></button>
        </div>
      )}

      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Rezervasyon Onay</h5>
          <div>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDeleteCompleted}
            >
              <i className="bi bi-trash me-1"></i> Tamamlananları Sil
            </button>
          </div>
        </div>

        {/* Filtre Bölümü */}
        <div className="card-body border-bottom">
          <div className="row">
            <div className="col-md-2 col-sm-12 col-xs-12">
              <label className="form-label">Tarih Seçin</label>
              <DatePicker
                selected={filters.startDate}
                onChange={handleDateChange}
                startDate={filters.startDate}
                endDate={filters.endDate}
                selectsRange
                className="form-control"
                dateFormat="dd.MM.yyyy"
                isClearable
                placeholderText="Tarih aralığı seçiniz"
                locale={tr}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Onay Durumu</label>
              <select
                className="form-select"
                name="approvalStatus"
                value={filters.approvalStatus}
                onChange={handleFilterChange}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="pending">Onay Bekleyenler</option>
                <option value="approved">Onaylananlar</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Arama</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ara..."
                name="searchTerm"
                value={filters.searchTerm}
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="d-flex justify-content-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
              </div>
            </div>
          ) : getFilteredReservations().length === 0 ? (
            <div className="alert alert-info">
              {filters.startDate === null ? 
                'Lütfen bir tarih aralığı seçin' : // Tarih seçilmemişse bu mesajı göster
                'Seçilen tarihte rezervasyon bulunmamaktadır.'
              }
            </div>
          ) : (
            <>
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <strong>
                  Toplam {getFilteredReservations().length} rezervasyon
                </strong>
                <small className="text-muted">
                  <i className="bi bi-info-circle me-4"></i>
                  Kişi sayısı: (Yetişkin+Çocuk+Ücretsiz)
                </small>
              </div>
              <div className="table-responsive" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <table className="table table-striped table-hover">
                  <thead className="sticky-top bg-light">
                    <tr>
                      <th className="align-top">Müşteri</th>
                      <th className="align-top">Telefon</th>
                      <th className="align-top">Tur</th>
                      <th className="align-top">Tarih</th>
                      <th className="align-top">Saat</th>
                      <th className="align-top">Pax</th>
                      <th className="align-top">Otel</th>
                      <th className="align-top">Oda No</th>
                      <th className="align-top">Rehber</th>
                      <th className="align-top">Bilet No</th>
                      <th className="align-top">Rest</th>
                      <th className="align-top">Opsiyonlar</th>
                      <th className="align-top">Açıklama</th>
                      <th className="align-top">Durum</th>
                      <th className="align-top">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredReservations().map(reservation => (
                      <tr key={reservation.id}>
                        <td>
                          {reservation.customer_name}
                        </td>
                        <td>{reservation.phone}</td>
                        <td>{reservation.tour_name}</td>
                        <td>{formatDate(reservation.date)}</td>
                        <td>{reservation.time}</td>
                        <td>
                          <div className="fs-6 fw-bold">
                            ({reservation.adult_count}+{reservation.child_count}+{reservation.free_count})
                          </div>
                          <span className="text-muted">
                            {reservation.adult_count + reservation.child_count + reservation.free_count} kişi
                          </span>
                        </td>
                        <td>{reservation.hotel_name}</td>
                        <td>{reservation.room_number || '-'}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div>
                              {reservation.guide_name}
                              {reservation.guide_phone && <><br />{reservation.guide_phone}</>}
                            </div>
                            {reservation.guide_phone && (
                              <button
                                className="btn btn-success btn-sm ms-2"
                                onClick={() => handleWhatsAppReminder(reservation.guide_phone, reservation)}
                                title="WhatsApp ile Hatırlat"
                              >
                                <i className="bi bi-whatsapp"></i>
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          {reservation.ticket_no ? (
                            <span
                              onClick={() => handleTicketNumberClick(reservation.ticket_no)}
                              style={{
                                cursor: 'pointer',
                                color: '#007bff',
                                textDecoration: 'underline'
                              }}
                              title="Bilet detaylarını görüntüle"
                            >
                              {reservation.ticket_no}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          {reservation.rest_amount || ''}
                        </td>
                        <td>
                          <div style={{ maxHeight: '50px', overflowY: 'auto', minWidth: '150px' }}>
                            {reservation.ticket_options ? (
                              <div className="small">
                                {reservation.ticket_options.split(', ').map((option, idx) => (
                                  <div key={idx}>{option.split(':')[0].trim()}</div>
                                ))}
                              </div>
                            ) : '-'}
                          </div>
                        </td>
                        <td>
                          <div style={{ maxHeight: '50px', overflowY: 'auto', minWidth: '150px' }}  >
                            {reservation.description || '-'}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${approvedReservations.guide[reservation.id] && approvedReservations.provider[reservation.id] ? 'bg-success' : 'bg-warning'}`}>
                            {approvedReservations.guide[reservation.id] && approvedReservations.provider[reservation.id] ? 'Onaylı' : 'Bekliyor'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex">
                            <button
                              className={`btn ${approvedReservations.guide[reservation.id] ? 'btn-success' : 'btn-secondary'} btn-sm me-1`}
                              onClick={() => handleApprove(reservation.id)}
                              title="Rehber Onay"
                            >
                              <i className="bi bi-person"></i>
                            </button>
                            <button
                              className={`btn ${approvedReservations.provider[reservation.id] ? 'btn-success' : 'btn-secondary'} btn-sm`}
                              onClick={() => handleProviderApprove(reservation.id)}
                              title="Tedarikçi Onay"
                            >
                              <i className="bi bi-building"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReservationApprove; 