import React, { useState, useEffect } from 'react';
import { Table, Tab, Tabs, Card, Button, Toast, ToastContainer } from 'react-bootstrap';
import { getReservations, updateReservation, updateTicket, filterReservations } from '../../../../../services/api';
import EditReservationModal from './components/EditReservationModal';
import EditTicketModal from './components/EditTicketModal';
import ReservationRow from './components/ReservationRow';
import ReservationFilter from './components/ReservationFilter';
import { useLocation, useSearchParams } from 'react-router-dom';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditReservation, setShowEditReservation] = useState(false);
  const [showEditTicket, setShowEditTicket] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [isFiltering, setIsFiltering] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'danger' });
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const fetchReservations = async () => {
    try {
      const data = await getReservations();
      setReservations(data);
      setLoading(false);
    } catch (err) {
      setError('Rezervasyonlar yüklenirken bir hata oluştu');
      setLoading(false);
      console.error('Rezervasyon yükleme hatası:', err);
    }
  };

  const handleFilter = async (filters) => {
    setLoading(true);
    setIsFiltering(Object.values(filters).some(val => val !== null && val !== '' && val !== undefined));
    
    try {
      console.log('Filtreleme başlatılıyor:', filters);
      let data;
      
      if (Object.keys(filters).length === 0 || 
          !Object.values(filters).some(val => val !== null && val !== '' && val !== undefined)) {
        console.log('Tüm rezervasyonlar getiriliyor...');
        data = await getReservations();
      } else {
        console.log('Filtrelenmiş rezervasyonlar getiriliyor...');
        data = await filterReservations({
          ...filters,
          date_next: undefined
        });
      }
      
      console.log('Alınan veri:', data);
      setReservations(data);
      
      if (data.length === 0) {
        setToast({
          show: true,
          message: 'Filtreleme kriterlerine uygun rezervasyon bulunamadı',
          variant: 'info'
        });
      } else {
        setToast({
          show: true,
          message: `${data.length} rezervasyon bulundu`,
          variant: 'success'
        });
      }
    } catch (error) {
      console.error('Rezervasyon filtreleme hatası:', error);
      setToast({
        show: true,
        message: 'Rezervasyonlar filtrelenirken bir hata oluştu: ' + (error.message || 'Bilinmeyen hata'),
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ticketNumber = searchParams.get('ticketNumber') || location.state?.searchTicketNumber;
    if (ticketNumber) {
      handleFilter({
        ticket_number: ticketNumber
      });
    } else {
      fetchReservations();
    }
  }, [location.state?.searchTicketNumber, searchParams]);

  const handleEditReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowEditReservation(true);
  };

  const handleEditTicket = (ticket, reservationId) => {
    setSelectedTicket({
      ...ticket,
      reservation_id: reservationId
    });
    setShowEditTicket(true);
  };

  const handleSaveReservation = async (editedReservation) => {
    try {
      await updateReservation(editedReservation.id, editedReservation);
      await fetchReservations();
      setShowEditReservation(false);
      setToast({
        show: true,
        message: 'Rezervasyon başarıyla güncellendi',
        variant: 'success'
      });
    } catch (error) {
      console.error('Rezervasyon güncelleme hatası:', error);
      const errorMessage = error.response?.data?.message || 'Rezervasyon güncellenirken bir hata oluştu';
      const errorDetails = error.response?.data?.details || '';
      setToast({
        show: true,
        message: `${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`,
        variant: 'danger'
      });
    }
  };

  const handleSaveTicket = async (editedTicket) => {
    try {
      await updateTicket(editedTicket.id, editedTicket);
      await fetchReservations();
      setShowEditTicket(false);
      setToast({
        show: true,
        message: 'Bilet başarıyla güncellendi',
        variant: 'success'
      });
    } catch (error) {
      console.error('Bilet güncelleme hatası:', error);
      const errorMessage = error.response?.data?.message || 'Bilet güncellenirken bir hata oluştu';
      const errorDetails = error.response?.data?.details || '';
      setToast({
        show: true,
        message: `${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`,
        variant: 'danger'
      });
    }
  };

  const handleStatusChange = async (reservationId, currentStatus) => {
    try {
      const updatedReservation = reservations.find(r => r.id === reservationId);
      await updateReservation(reservationId, {
        ...updatedReservation,
        status: !currentStatus
      });
      await fetchReservations();
      setToast({
        show: true,
        message: `Rezervasyon durumu ${!currentStatus ? 'aktif' : 'pasif'} olarak güncellendi`,
        variant: 'success'
      });
    } catch (error) {
      console.error('Status güncelleme hatası:', error);
      setToast({
        show: true,
        message: 'Durum güncellenirken bir hata oluştu',
        variant: 'danger'
      });
    }
  };

  if (loading) return <div className="p-3">Yükleniyor...</div>;
  if (error) return <div className="p-3 text-danger">{error}</div>;

  // Rezervasyonları aktif ve iptal edilmiş olarak ayır
  const activeReservations = reservations.filter(r => r.status);
  const cancelledReservations = reservations.filter(r => !r.status);

  return (
    <div className="p-5">
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

      <Card className="mb-4 bg-primary text-white">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              Rezervasyonlar
              {isFiltering && <span className="ms-2 badge bg-info">Filtrelenmiş</span>}
            </h5>
          </div>
        </Card.Header>
      </Card>
      
      <ReservationFilter onFilter={handleFilter} />
      
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="active" title={`Aktif Rezervasyonlar (${activeReservations.length})`}>
          <div className="table-responsive" style={{ maxHeight: '600px' }}>
            <Table size="sm" style={{ width: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                <tr align="center" className="align-middle">
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}></th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Müşteri Adı</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Telefon</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Otel</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Oda No</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Rehber</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Bilet Sayısı</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Komisyon</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Açıklama</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Oluşturma Tarihi</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Tahsilat</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Kurlar</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Durum</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {activeReservations.map((reservation) => (
                  <ReservationRow 
                    key={reservation.id} 
                    reservation={reservation}
                    onEditReservation={handleEditReservation}
                    onEditTicket={(ticket) => handleEditTicket(ticket, reservation.id)}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="cancelled" title={`İptal Edilen Rezervasyonlar (${cancelledReservations.length})`}>
          <div className="table-responsive" style={{ maxHeight: '600px' }}>
            <Table size="sm" style={{ width: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                <tr align="center" className="align-middle">
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}></th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Müşteri Adı</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Telefon</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Otel</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Oda No</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Rehber</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Bilet Sayısı</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Komisyon</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Açıklama</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Oluşturma Tarihi</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Tahsilat</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Kurlar</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>Durum</th>
                  <th style={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {cancelledReservations.map((reservation) => (
                  <ReservationRow 
                    key={reservation.id} 
                    reservation={reservation}
                    onEditReservation={handleEditReservation}
                    onEditTicket={(ticket) => handleEditTicket(ticket, reservation.id)}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
            </Table>
          </div>
        </Tab>
      </Tabs>

      {showEditReservation && selectedReservation && (
        <EditReservationModal
          show={showEditReservation}
          handleClose={() => setShowEditReservation(false)}
          reservation={selectedReservation}
          handleSave={handleSaveReservation}
          onEditTicket={(ticket) => handleEditTicket(ticket, selectedReservation.id)}
          allReservations={reservations}
        />
      )}

      {selectedTicket && (
        <EditTicketModal
          show={showEditTicket}
          handleClose={() => setShowEditTicket(false)}
          ticket={selectedTicket}
          handleSave={handleSaveTicket}
        />
      )}
    </div>
  );
} 