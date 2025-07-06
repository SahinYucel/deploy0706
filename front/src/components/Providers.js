import React, { useState, useEffect } from 'react';
import { getProviderReservationApprovals, updateProviderApproval, updateReservationTime, downloadProviderPDF, getProviderData, checkExitTime } from '../services/api';
import { Table, Badge, Card } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProviderAuth } from '../context/ProviderAuthContext';
import { providerStyles } from '../utils/styles/providerStyles';

const Providers = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const [selectAll, setSelectAll] = useState(false);
  const navigate = useNavigate();
  const { logout } = useProviderAuth();
  const [modifiedTimes, setModifiedTimes] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [exitTime, setExitTime] = useState(null);
  const [selectedTour, setSelectedTour] = useState('all');

  // Yarının tarihini hesapla
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatted = tomorrow.toLocaleDateString('tr-TR');

  // Oturum kontrolü
  useEffect(() => {
    const checkSession = async () => {
      const providerRef = localStorage.getItem('providerRef');
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      
      if (!providerRef || !isLoggedIn) {
        navigate('/login');
      } else {
        // Provider bilgilerini getir
        try {
          const providerData = await getProviderData(providerRef);
          setExitTime(providerData.exitTime);
        } catch (err) {
          console.error('Provider bilgileri alınamadı:', err);
        }
      }
    };

    checkSession();
  }, [navigate]);

  // Çıkış yapma fonksiyonu
  const handleLogout = () => {
    logout();
    navigate('/provider-login');
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      // localStorage'dan providerRef'i al
      const providerRef = localStorage.getItem('providerRef');

      if (!providerRef) {
        throw new Error('Provider referans kodu bulunamadı');
      }

      const data = await getProviderReservationApprovals(providerRef);
      setReservations(data);
    } catch (err) {
      setError('Rezervasyonlar yüklenirken bir hata oluştu: ' + err.message);
      console.error('Rezervasyon yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Son işlem saati kontrolü
  const isAfterExitTime = () => {
    if (!exitTime) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const [exitHour, exitMinute] = exitTime.split(':').map(Number);
    
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const exitTimeInMinutes = exitHour * 60 + exitMinute;
    
    return currentTimeInMinutes > exitTimeInMinutes;
  };

  const handleStatusClick = async (reservationId, type, currentStatus) => {
    if (isAfterExitTime()) {
      alert('Son işlem saati geçildi. Değişiklik yapamazsınız.');
      return;
    }
    try {
      // Only update provider status
      if (type === 'provider') {
        const newStatus = currentStatus === 1 ? 0 : 1;
        await updateProviderApproval(reservationId, type, newStatus);
      }
      // Fetch reservations after updating provider status
      fetchReservations();
    } catch (err) {
      setError('Durum güncellenirken bir hata oluştu');
      console.error('Güncelleme hatası:', err);
    }
  };

  // Saat değişikliklerini geçici olarak tut
  const handleTimeUpdate = (ticketNumber, currentTime, newValue, type) => {
    if (isAfterExitTime()) {
      alert('Son işlem saati geçildi. Değişiklik yapamazsınız.');
      return;
    }
    const [hours, minutes] = (currentTime || '00:00').split(':');
    let newTime;
    
    if (type === 'hour') {
      newTime = `${newValue.padStart(2, '0')}:${minutes}`;
    } else {
      newTime = `${hours}:${newValue.padStart(2, '0')}`;
    }

    setModifiedTimes(prev => ({
      ...prev,
      [ticketNumber]: newTime
    }));
    setHasChanges(true);

    // Arayüzde göster ama kaydetme
    setReservations(prevReservations =>
      prevReservations.map(reservation =>
        reservation.ticketNumber === ticketNumber
          ? { ...reservation, time: newTime }
          : reservation
      )
    );
  };

  // Tüm değişiklikleri kaydet
  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      
      // Son işlem saatini kontrol et
      const providerRef = localStorage.getItem('providerRef');
      const { canSave, exitTime } = await checkExitTime(providerRef);
      
      if (!canSave) {
        alert(`Son işlem saati (${exitTime}) geçildi. Değişiklikler kaydedilemez.`);
        return;
      }
      
      // Tüm değişiklikleri kaydet
      for (const [ticketNumber, newTime] of Object.entries(modifiedTimes)) {
        await updateReservationTime(ticketNumber, newTime);
      }

      // State'i temizle
      setModifiedTimes({});
      setHasChanges(false);
      
      // Başarı mesajı göster
      alert('Değişiklikler kaydedildi');
      
      // Güncel verileri getir
      await fetchReservations();
    } catch (error) {
      setError('Değişiklikler kaydedilirken bir hata oluştu');
      console.error('Kaydetme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Saat input'u için options oluştur
  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const getStatusBadge = (status, type, reservationId) => {
    // Eğer bu rezervasyonun saati değiştirilmişse
    const hasTimeModification = Object.keys(modifiedTimes).length > 0;

    return (
      <div 
        onClick={() => !hasTimeModification && handleStatusClick(reservationId, type, status)}
        className={`status-badge ${status === 1 ? 'active' : 'inactive'} ${hasTimeModification ? 'disabled' : ''}`}
      >
        <Badge 
          bg={status === 1 ? 'success' : 'secondary'}
          className={`w-100 py-2 ${hasTimeModification ? 'opacity-50' : ''}`}
        >
          {type === 'provider' ? 'Onay' : 'Rehber'}
        </Badge>
      </div>
    );
  };

  // Tüm rezervasyonları toplu onaylama/reddetme
  const handleBulkApproval = async (tourName = selectedTour) => {
    if (isAfterExitTime()) {
      alert('Son işlem saati geçildi. Değişiklik yapamazsınız.');
      return;
    }
    if (Object.keys(modifiedTimes).length > 0) {
      return; // Eğer değiştirilmiş saatler varsa işlemi engelle
    }

    try {
      setLoading(true);
      const newStatus = 1; // Her zaman onaylama yap
      
      // Sadece seçili tur için rezervasyonları güncelle
      const reservationsToUpdate = tourName === 'all' 
        ? reservations 
        : reservations.filter(res => res.tourName === tourName);

      // Seçili rezervasyonları güncelle
      for (const reservation of reservationsToUpdate) {
        await updateProviderApproval(reservation._id, 'provider', newStatus);
      }

      // State'i güncelle
      setReservations(prevReservations =>
        prevReservations.map(reservation => {
          if (tourName === 'all' || reservation.tourName === tourName) {
            return {
              ...reservation,
              providerStatus: newStatus
            };
          }
          return reservation;
        })
      );
      
      setSelectAll(true);
    } catch (error) {
      setError('Toplu onaylama sırasında bir hata oluştu');
      console.error('Toplu onaylama hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Seçili tur için tüm onayları kaldır
  const handleBulkUnapproval = async (tourName = selectedTour) => {
    if (isAfterExitTime()) {
      alert('Son işlem saati geçildi. Değişiklik yapamazsınız.');
      return;
    }
    if (Object.keys(modifiedTimes).length > 0) {
      return; // Eğer değiştirilmiş saatler varsa işlemi engelle
    }

    try {
      setLoading(true);
      const newStatus = 0; // Onayı kaldır
      
      // Sadece seçili tur için rezervasyonları güncelle
      const reservationsToUpdate = tourName === 'all' 
        ? reservations 
        : reservations.filter(res => res.tourName === tourName);

      // Seçili rezervasyonları güncelle
      for (const reservation of reservationsToUpdate) {
        await updateProviderApproval(reservation._id, 'provider', newStatus);
      }

      // State'i güncelle
      setReservations(prevReservations =>
        prevReservations.map(reservation => {
          if (tourName === 'all' || reservation.tourName === tourName) {
            return {
              ...reservation,
              providerStatus: newStatus
            };
          }
          return reservation;
        })
      );
      
      setSelectAll(false);
    } catch (error) {
      setError('Toplu onay kaldırma sırasında bir hata oluştu');
      console.error('Toplu onay kaldırma hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // PDF indirme fonksiyonu
  const handleDownloadPDF = async () => {
    try {
      // Onaylanmamış rezervasyon kontrolü
      const hasUnapprovedReservations = filteredReservations.some(res => res.providerStatus !== 1);
      if (hasUnapprovedReservations) {
        alert('Lütfen tüm rezervasyonları onayladıktan sonra PDF indiriniz.');
        return;
      }

      setLoading(true);
      const providerRef = localStorage.getItem('providerRef');
      
      if (!providerRef) {
        throw new Error('Provider referans kodu bulunamadı');
      }

      // Tüm turlar seçiliyse, her tur için ayrı PDF indir
      if (selectedTour === 'all') {
        // Benzersiz tur isimlerini al
        const uniqueTours = [...new Set(reservations.map(res => res.tourName))];
        
        // Her tur için PDF indir
        for (const tour of uniqueTours) {
          const pdfBlob = await downloadProviderPDF(providerRef, tour);
          
          // PDF'i indir
          const fileName = `${tour}_${tomorrowFormatted}.pdf`;

          // Blob URL oluştur
          const blob = new Blob([pdfBlob], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          
          // İndirme linki oluştur ve tıkla
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          
          // Temizlik
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          // Her PDF arasında kısa bir bekleme süresi
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        // Tek tur için PDF indir
        const pdfBlob = await downloadProviderPDF(providerRef, selectedTour);
        
        // PDF'i indir
        const fileName = `${selectedTour}_${tomorrowFormatted}.pdf`;

        // Blob URL oluştur
        const blob = new Blob([pdfBlob], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        // İndirme linki oluştur ve tıkla
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // Temizlik
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      setError('PDF indirme sırasında bir hata oluştu');
      console.error('PDF indirme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique tour names for filter
  const uniqueTours = ['all', ...new Set(reservations.map(res => res.tourName))];

  // Filter reservations based on selected tour
  const filteredReservations = selectedTour === 'all' 
    ? reservations 
    : reservations.filter(res => res.tourName === selectedTour);

  // Seçili tur için tüm rezervasyonların onaylı olup olmadığını kontrol et
  const areAllSelectedTourReservationsApproved = () => {
    const reservationsToCheck = selectedTour === 'all' 
      ? reservations 
      : reservations.filter(res => res.tourName === selectedTour);
    
    return reservationsToCheck.length > 0 && 
           reservationsToCheck.every(res => res.providerStatus === 1);
  };

  if (loading) return <div className="text-center p-5">Yükleniyor...</div>;
  if (error) return <div className="text-center text-danger p-5">{error}</div>;

  return (
    <div className="container-fluid py-5 px-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Rezervasyon Onayları</h4>
            <small className="text-white-50">
              {tomorrowFormatted} tarihli rezervasyonlar ({filteredReservations.length} rezervasyon)
              {exitTime && (
                <Badge bg={isAfterExitTime() ? "danger" : "warning"} className="ms-2">
                  Son İşlem Saati: {exitTime}
                </Badge>
              )}
            </small>
          </div>
          <div className="d-flex gap-2">
            <div className="d-flex align-items-center gap-2">
              <select 
                className="form-select form-select-sm"
                value={selectedTour}
                onChange={(e) => setSelectedTour(e.target.value)}
                style={{ width: '200px' }}
              >
                {uniqueTours.map(tour => (
                  <option key={tour} value={tour}>
                    {tour === 'all' ? 'Tüm Turlar' : tour}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-success btn-sm"
                onClick={() => handleBulkApproval(selectedTour)}
                disabled={loading || filteredReservations.length === 0 || Object.keys(modifiedTimes).length > 0 || isAfterExitTime()}
                title={selectedTour === 'all' ? 'Tüm rezervasyonları onayla' : `${selectedTour} turu için tüm rezervasyonları onayla`}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="fas fa-check me-2"></i>
                )}
                {selectedTour === 'all' ? 'Tümünü Onayla' : 'Seçili Turu Onayla'}
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleBulkUnapproval(selectedTour)}
                disabled={loading || filteredReservations.length === 0 || Object.keys(modifiedTimes).length > 0 || isAfterExitTime()}
                title={selectedTour === 'all' ? 'Tüm rezervasyonların onayını kaldır' : `${selectedTour} turu için tüm onayları kaldır`}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="fas fa-times me-2"></i>
                )}
                {selectedTour === 'all' ? 'Tüm Onayları Kaldır' : 'Seçili Tur Onaylarını Kaldır'}
              </button>
            </div>
            <button
              className="btn btn-light btn-sm"
              onClick={handleDownloadPDF}
              disabled={
                loading || 
                filteredReservations.length === 0 || 
                !areAllSelectedTourReservationsApproved() || 
                isAfterExitTime() ||
                hasChanges
              }
              title={
                isAfterExitTime() 
                  ? 'Son işlem saati geçildi'
                  : hasChanges
                    ? 'Lütfen önce değişiklikleri kaydedin'
                    : !areAllSelectedTourReservationsApproved()
                      ? 'Seçili tur için tüm rezervasyonları onayladıktan sonra PDF indirebilirsiniz' 
                      : ''
              }
            >
              <i className="fas fa-file-pdf me-2"></i>
              PDF İndir
            </button>
            {hasChanges && (
              <button
                className="btn btn-warning btn-sm"
                onClick={handleSaveChanges}
                disabled={loading || isAfterExitTime()}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="fas fa-save me-2"></i>
                )}
                Değişiklikleri Kaydet
              </button>
            )}
            <button
              className="btn btn-danger btn-sm"
              onClick={handleLogout}
            >
              <i className="fas fa-sign-out-alt me-2"></i>
              Çıkış Yap
            </button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-3">Müşteri</th>
                  <th>Telefon</th>
                  <th>Tur</th>
                  <th>Tarih</th>
                  <th>Saat</th>
                  <th className="text-center">
                    Pax
                  </th>
                  <th>Otel</th>
                  <th>Oda</th>
                  <th>Rehber</th>
                  <th>Bilet</th>
                  <th className="text-center">Rest</th>
                  <th className="text-center">Opsiyon</th>
                  <th className="text-center">Not</th>
                  <th>Rehber Onayı</th>
                  <th>Onaylayın</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((reservation) => (
                  <tr key={reservation._id} className="align-middle">
                    <td className="px-3 text-nowrap">{reservation.customerName}</td>
                    <td className="text-nowrap">{reservation.phone}</td>
                    <td className="text-nowrap">{reservation.tourName}</td>
                    <td className="text-nowrap">
                      {new Date(reservation.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="text-nowrap">
                      <div className="d-flex align-items-center gap-1">
                        <select
                          className="form-select form-select-sm"
                          style={{ width: '65px' }}
                          value={(reservation.time || '00:00').split(':')[0]}
                          onChange={(e) => handleTimeUpdate(
                            reservation.ticketNumber,
                            reservation.time,
                            e.target.value,
                            'hour'
                          )}
                          disabled={isAfterExitTime()}
                        >
                          {hourOptions.map(hour => (
                            <option key={hour} value={hour}>{hour}</option>
                          ))}
                        </select>
                        <span>:</span>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: '65px' }}
                          value={(reservation.time || '00:00').split(':')[1]}
                          onChange={(e) => handleTimeUpdate(
                            reservation.ticketNumber,
                            reservation.time,
                            e.target.value,
                            'minute'
                          )}
                          disabled={isAfterExitTime()}
                        >
                          {minuteOptions.map(minute => (
                            <option key={minute} value={minute}>{minute}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="pax-info">
                        
                        <div className="pax-details ">
                          <h6 className="adult">{reservation.pax.adult}</h6>
                          <h6 className="separator">/</h6>
                          <h6 className="child">{reservation.pax.child}</h6>
                          <h6 className="separator">/</h6>
                          <h6 className="free">{reservation.pax.free}</h6>
                        </div>
                      </div>
                    </td>
                    <td className="text-nowrap">{reservation.hotel}</td>
                    <td>{reservation.roomNumber}</td>
                    <td className="text-nowrap">{reservation.guide.name}</td>
                    <td>{reservation.ticketNumber}</td>
                    <td className="text-center">
                      <div className="scrollable-cell">
                        {reservation.restaurant}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="scrollable-cell">
                        {reservation.ticket_options}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="scrollable-cell">
                        {reservation.notes}
                      </div>
                    </td>
                    <td className="text-center">
                      {getStatusBadge(reservation.guideStatus, 'guide', reservation._id)}
                    </td>
                    <td className="text-center">
                      {getStatusBadge(reservation.providerStatus, 'provider', reservation._id)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {filteredReservations.length === 0 && (
        <div className="text-center p-5">
          <h5 className="text-muted">
            {selectedTour === 'all' 
              ? `${tomorrowFormatted} tarihli rezervasyon bulunmamaktadır.`
              : `${selectedTour} turu için rezervasyon bulunmamaktadır.`}
          </h5>
        </div>
      )}

      <style jsx>{providerStyles}</style>
      <div className="text-center p-5">
     <small> Tüm rezervasyonlar onaylandıktan sonra PDF indirilebilir.</small>
    </div>
    </div>
    
  );
};

export default Providers; 