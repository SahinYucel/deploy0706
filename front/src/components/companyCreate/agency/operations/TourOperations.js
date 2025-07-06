import React, { useState, useEffect } from 'react';
import { Table, Card, Form, Row, Col, Button, Toast, Accordion, Modal } from 'react-bootstrap';
import { tourOperations } from '../../../../services/api2';
import { useNavigate, useLocation } from 'react-router-dom';
import CurrencyRatesCard from './CurrencyRatesCard';

export default function TourOperations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [reservations, setReservations] = useState([]);
  const [tourGroups, setTourGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState(new Set());
  const [selectedTourGroup, setSelectedTourGroup] = useState('');
  const [selectedTour, setSelectedTour] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [collectionComment, setCollectionComment] = useState('');
  const [currencyRates, setCurrencyRates] = useState(null);
  const [transactionCodeFilter, setTransactionCodeFilter] = useState('');

  useEffect(() => {
    // Get transaction number from URL parameters
    const params = new URLSearchParams(location.search);
    const transactionNo = params.get('transaction_no');
    if (transactionNo) {
      setTransactionCodeFilter(transactionNo);
      // Automatically open the accordion for the filtered transaction
      setOpenAccordion(transactionNo);
    }
  }, [location.search]);

  useEffect(() => {
    fetchTourGroups();
    fetchCollections();
    fetchCurrencyRates();
  }, []);

  useEffect(() => {
    if (selectedTourGroup) {
      fetchReservations(selectedTourGroup);
    } else {
      setReservations([]);
    }
  }, [selectedTourGroup]);

  const fetchTourGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tourOperations.getTourGroups();
      setTourGroups(data);
    } catch (err) {
      console.error('Error fetching tour groups:', err);
      setError(err.response?.data?.details || err.message || 'Tur grupları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async (tourGroup) => {
    try {
      setLoading(true);
      setError(null);
      const data = await tourOperations.getReservationsByTourGroup(tourGroup);
      setReservations(data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(err.response?.data?.details || err.message || 'Rezervasyonlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      setLoadingCollections(true);
      setError(null);
      console.log('Fetching provider collections...');
      const data = await tourOperations.getProviderCollections(transactionCodeFilter);
      console.log('Received collections:', data);
      setCollections(data);
    } catch (err) {
      console.error('Error fetching collections:', err);
      setError(err.response?.data?.details || err.message || 'Tahsilat kayıtları yüklenirken bir hata oluştu');
    } finally {
      setLoadingCollections(false);
    }
  };

  const fetchCurrencyRates = async () => {
    try {
      const response = await tourOperations.getCurrencyRates();
      setCurrencyRates(response.rates);
    } catch (error) {
      console.error('Error fetching currency rates:', error);
      setToast({
        show: true,
        message: 'Döviz kurları yüklenirken bir hata oluştu',
        variant: 'danger'
      });
    }
  };

  const handleRatesUpdate = async (newRates) => {
    try {
      await tourOperations.updateCurrencyRates(newRates);
      setCurrencyRates(newRates);
      setToast({
        show: true,
        message: 'Döviz kurları başarıyla güncellendi',
        variant: 'success'
      });
      
      // Refresh reservations to update costs with new rates
      if (selectedTourGroup) {
        await fetchReservations(selectedTourGroup);
      }
    } catch (error) {
      console.error('Error updating currency rates:', error);
      setToast({
        show: true,
        message: 'Döviz kurları güncellenirken bir hata oluştu',
        variant: 'danger'
      });
    }
  };

  const handleTicketSelect = (ticketId) => {
    setSelectedTickets(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(ticketId)) {
        newSelected.delete(ticketId);
      } else {
        newSelected.add(ticketId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allTicketIds = filteredReservations.flatMap(reservation => 
        reservation.tickets.map(ticket => ticket.id)
      );
      setSelectedTickets(new Set(allTicketIds));
    } else {
      setSelectedTickets(new Set());
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get tours based on selected tour group
  const availableTours = [...new Set(reservations.flatMap(reservation => 
    reservation.tickets.map(ticket => ticket.tour_name)
  ))].filter(Boolean).sort();

  // Filter tickets based on selected tour and date range
  const filteredReservations = reservations
    .map(reservation => ({
      ...reservation,
      tickets: reservation.tickets.filter(ticket => {
        const ticketDate = new Date(ticket.date);
        const startDateTime = startDate ? new Date(startDate + 'T00:00:00') : null;
        const endDateTime = endDate ? new Date(endDate + 'T23:59:59') : null;
        
        const isInTour = !selectedTour || ticket.tour_name === selectedTour;
        const isInDateRange = (!startDateTime || ticketDate >= startDateTime) && 
                            (!endDateTime || ticketDate <= endDateTime);
        return isInTour && isInDateRange;
      })
    }))
    .filter(reservation => reservation.tickets.length > 0);

  // Generate a 6-character alphanumeric code
  const generateTransactionCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const handleMakeCollection = async () => {
    // Calculate total amounts
    const selectedTicketsArray = Array.from(selectedTickets);
    const totalAmounts = selectedTicketsArray.reduce((acc, ticketId) => {
      const ticket = reservations
        .flatMap(reservation => reservation.tickets)
        .find(t => t.id === ticketId);
      
      if (ticket) {
        const amount = (ticket.adult_count * ticket.adult_price) + 
                      (ticket.child_count * ticket.half_price);
        if (!acc[ticket.currency]) {
          acc[ticket.currency] = 0;
        }
        acc[ticket.currency] += amount;
      }
      return acc;
    }, {});

    setShowCommentModal(true);
  };

  const handleConfirmCollection = async () => {
    try {
      setLoading(true);
      const selectedTicketsArray = Array.from(selectedTickets);
      
      // Get the current date
      const today = new Date().toISOString().split('T')[0];
      
      // Generate a single transaction code for all selected tickets
      const transactionCode = generateTransactionCode();

      // Calculate total amounts by currency
      const totalAmountsByCurrency = selectedTicketsArray.reduce((acc, ticketId) => {
        const ticket = reservations
          .flatMap(reservation => reservation.tickets)
          .find(t => t.id === ticketId);
        
        if (ticket) {
          const amount = (ticket.adult_count * ticket.adult_price) + 
                        (ticket.child_count * ticket.half_price);
          if (!acc[ticket.currency]) {
            acc[ticket.currency] = 0;
          }
          acc[ticket.currency] += amount;
        }
        return acc;
      }, {});

      // Create collection records for each selected ticket
      const collectionPromises = selectedTicketsArray.map(ticketId => {
        // Find the ticket and its reservation
        const ticket = reservations
          .flatMap(reservation => reservation.tickets)
          .find(t => t.id === ticketId);
        
        if (!ticket) {
          throw new Error(`Ticket with ID ${ticketId} not found`);
        }

        const reservation = reservations.find(r => 
          r.tickets.some(t => t.id === ticketId)
        );

        if (!reservation) {
          throw new Error(`Reservation for ticket ${ticketId} not found`);
        }

        // Calculate total amount
        const totalAmount = (ticket.adult_count * ticket.adult_price) + 
                          (ticket.child_count * ticket.half_price);

        // Create collection data with the same transaction code for all tickets
        const collectionData = {
          ticket_id: ticket.id,
          amount: totalAmount,
          currency: ticket.currency,
          collection_date: today,
          provider_name: ticket.provider_name,
          provider_ref: ticket.provider_ref,
          tour_name: ticket.tour_name,
          tour_group_name: ticket.tour_group_name,
          customer_name: reservation.customer_name,
          hotel_name: reservation.hotel_name,
          room_number: reservation.room_number,
          guide_name: ticket.guide_name,
          adult_count: ticket.adult_count,
          child_count: ticket.child_count,
          free_count: ticket.free_count,
          adult_price: ticket.adult_price,
          half_price: ticket.half_price,
          total_amount: totalAmount,
          comment: collectionComment,
          transaction_code: transactionCode,
          ticket_number: ticket.ticket_number
        };

        return tourOperations.createProviderCollection(collectionData);
      });

      // Wait for all collections to be created
      await Promise.all(collectionPromises);

      // Update provider cost status for all selected tickets
      await tourOperations.updateProviderCostStatus(selectedTicketsArray);

      // Clear selected tickets and comment
      setSelectedTickets(new Set());
      setCollectionComment('');
      setShowCommentModal(false);

      // Show success message
      setToast({
        show: true,
        message: `${selectedTicketsArray.length} tahsilat kaydı başarıyla oluşturuldu (İşlem Kodu: ${transactionCode})`,
        variant: 'success'
      });

      // Refresh both reservations and collections
      if (selectedTourGroup) {
        await fetchReservations(selectedTourGroup);
      }
      await fetchCollections();
    } catch (error) {
      console.error('Tahsilat kaydedilirken hata:', error);
      setToast({
        show: true,
        message: 'Tahsilat kaydedilirken bir hata oluştu: ' + error.message,
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTicketClick = (ticketNumber) => {
    navigate(`/companyAgencyDashboard/reservations/list?ticketNumber=${ticketNumber}`);
  };

  const handleDeleteCollection = async (collectionId) => {
    try {
      setLoadingCollections(true);
      await tourOperations.deleteProviderCollection(collectionId);
      
      // Show success message
      setToast({
        show: true,
        message: 'Tahsilat kaydı başarıyla silindi',
        variant: 'success'
      });

      // Refresh both collections and reservations
      await fetchCollections();
      if (selectedTourGroup) {
        await fetchReservations(selectedTourGroup);
      }
    } catch (error) {
      console.error('Tahsilat kaydı silinirken hata:', error);
      setToast({
        show: true,
        message: 'Tahsilat kaydı silinirken bir hata oluştu: ' + error.message,
        variant: 'danger'
      });
    } finally {
      setLoadingCollections(false);
    }
  };

  // Group collections by transaction code
  const groupedCollections = collections.reduce((acc, collection) => {
    if (!acc[collection.transaction_code]) {
      acc[collection.transaction_code] = {
        transaction_code: collection.transaction_code,
        created_at: collection.created_at,
        guide_name: collection.guide_name,
        collections: [],
        total_reservations: 0
      };
    }
    acc[collection.transaction_code].collections.push(collection);
    acc[collection.transaction_code].total_reservations++;
    return acc;
  }, {});

  // Convert grouped collections to array and sort by created_at
  const sortedGroupedCollections = Object.values(groupedCollections)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Filter collections based on transaction code
  const filteredGroupedCollections = sortedGroupedCollections.filter(group => 
    !transactionCodeFilter || 
    group.transaction_code.toLowerCase().includes(transactionCodeFilter.toLowerCase())
  );

  return (
    <div className="p-3" style={{ height: 'calc(100vh - 60px)', overflow: 'auto' }}>
      <Toast
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
        delay={3000}
        autohide
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000
        }}
      >
        <Toast.Header closeButton>
          <strong className="me-auto">
            {toast.variant === 'success' ? 'Başarılı' : 'Hata'}
          </strong>
        </Toast.Header>
        <Toast.Body>{toast.message}</Toast.Body>
      </Toast>

      <Row>
        <Col md={9}>
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Rezervasyonlar ve Biletler</h5>
                <Button
                  variant="primary"
                  onClick={handleMakeCollection}
                  disabled={selectedTickets.size === 0}
                >
                  Tahsilat Yap ({selectedTickets.size})
                </Button>
              </div>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Tur Grubu</Form.Label>
                    <Form.Select
                      value={selectedTourGroup}
                      onChange={(e) => {
                        setSelectedTourGroup(e.target.value);
                        setSelectedTour('');
                      }}
                    >
                      <option value="">Tur Grubu Seçiniz</option>
                      {tourGroups.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Tur</Form.Label>
                    <Form.Select
                      value={selectedTour}
                      onChange={(e) => setSelectedTour(e.target.value)}
                      disabled={!selectedTourGroup}
                    >
                      <option value="">Tüm Turlar</option>
                      {availableTours.map(tour => (
                        <option key={tour} value={tour}>{tour}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Başlangıç Tarihi</Form.Label>
                    <Form.Control
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Bitiş Tarihi</Form.Label>
                    <Form.Control
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body style={{ padding: 0 }}>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <div style={{ 
                height: '500px',
                overflow: 'auto',
                position: 'relative'
              }}>
                <Table hover className="align-middle" style={{ minWidth: '1500px' }}>
                  <thead style={{ 
                    position: 'sticky', 
                    top: 0, 
                    backgroundColor: 'white', 
                    zIndex: 1,
                    boxShadow: '0 2px 2px -1px rgba(0, 0, 0, 0.1)'
                  }}>
                    <tr>
                      <th style={{ whiteSpace: 'nowrap' }}>
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={selectedTickets.size > 0 && selectedTickets.size === filteredReservations.flatMap(r => r.tickets).length}
                        />
                      </th>
                      <th style={{ whiteSpace: 'nowrap' }}>Bilet No</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Tur</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Tarih</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Saat</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Yetişkin</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Çocuk</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Ücretsiz</th>  
                      <th style={{ whiteSpace: 'nowrap' }}>Taban Fiyatlar</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Toplam Taban</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Para Birimi</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Rest</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Tur Grubu</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Müşteri</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Otel</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Oda No</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Rehber</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Sağlayıcı</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Sağlayıcı Ref</th>
                      <th style={{ whiteSpace: 'nowrap' }}>Açıklama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="20" className="text-center">Yükleniyor...</td>
                      </tr>
                    ) : !selectedTourGroup ? (
                      <tr>
                        <td colSpan="20" className="text-center">Lütfen bir tur grubu seçiniz</td>
                      </tr>
                    ) : filteredReservations.length === 0 ? (
                      <tr>
                        <td colSpan="20" className="text-center">Rezervasyon bulunamadı</td>
                      </tr>
                    ) : (
                      <>
                        {filteredReservations.flatMap(reservation => 
                          reservation.tickets.map(ticket => (
                            <tr 
                              key={ticket.id} 
                              style={{ 
                                backgroundColor: selectedTickets.has(ticket.id) 
                                  ? '#e8f0fe' 
                                  : reservation.reservation_guide_color || 'inherit'
                              }}
                            >
                              <td style={{ whiteSpace: 'normal' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedTickets.has(ticket.id)}
                                  onChange={() => handleTicketSelect(ticket.id)}
                                />
                              </td>
                              <td style={{ whiteSpace: 'normal' }}>
                                <span 
                                  onClick={() => handleTicketClick(ticket.ticket_number)}
                                  style={{ 
                                    cursor: 'pointer', 
                                    color: '#007bff',
                                    textDecoration: 'underline'
                                  }}
                                >
                                  {ticket.ticket_number}
                                </span>
                              </td>
                              <td style={{ whiteSpace: 'normal' }}>{ticket.tour_name}</td>
                              <td style={{ whiteSpace: 'normal' }}>{formatDate(ticket.date)}</td>
                              <td style={{ whiteSpace: 'normal' }}>{ticket.time}</td>
                              <td style={{ whiteSpace: 'normal' }}>{ticket.adult_count}</td>
                              <td style={{ whiteSpace: 'normal' }}>{ticket.child_count}</td>
                              <td style={{ whiteSpace: 'normal' }}>{ticket.free_count}</td>
                              <td style={{ whiteSpace: 'normal' }}>
                                <div className="small">
                                  <div>Yetişkin: {ticket.adult_price}</div>
                                  <div>Çocuk: {ticket.half_price}</div>
                                </div>
                              </td>
                              <td style={{ whiteSpace: 'normal' }}>
                                {((ticket.adult_count * ticket.adult_price) + (ticket.child_count * ticket.half_price)).toFixed(2)}
                              </td>
                              <td style={{ whiteSpace: 'normal' }}>{ticket.currency}</td>
                              <td style={{ whiteSpace: 'normal' }}>
                                <div style={{ maxWidth: '150px' }}>
                                  {ticket.rest_amounts && ticket.rest_amounts.length > 0 ? (
                                    ticket.rest_amounts.map((rest, index) => (
                                      <div key={index} className="small mb-1">
                                        <span className="badge bg-warning text-dark">
                                          {rest.amount.toFixed(2)} {rest.currency}
                                        </span>
                                       
                                      </div>
                                    ))
                                  ) : '-'}
                                </div>
                              </td>
                              <td style={{ whiteSpace: 'normal' }}>{ticket.tour_group_name}</td>
                              <td style={{ whiteSpace: 'normal' }}>{reservation.customer_name}</td>
                              <td style={{ whiteSpace: 'normal' }}>{reservation.hotel_name}</td>
                              <td style={{ whiteSpace: 'normal' }}>{reservation.room_number || '-'}</td>
                              <td style={{ whiteSpace: 'normal' }}>{ticket.guide_name}</td>
                              <td style={{ whiteSpace: 'normal' }}>{ticket.provider_name || '-'}</td>
                              <td style={{ whiteSpace: 'normal' }}>{ticket.provider_ref || '-'}</td>
                              <td style={{ whiteSpace: 'normal' }}>
                                <div style={{ maxWidth: '150px' }} title={ticket.comment}>
                                  {ticket.comment || '-'}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                        {selectedTickets.size > 0 && (
                          <tr className="table-info">
                            <td colSpan="5" className="text-end fw-bold">Toplam:</td>
                            <td className="fw-bold">
                              {filteredReservations
                                .flatMap(reservation => reservation.tickets)
                                .filter(ticket => selectedTickets.has(ticket.id))
                                .reduce((sum, ticket) => sum + ticket.adult_count, 0)}
                            </td>
                            <td className="fw-bold">
                              {filteredReservations
                                .flatMap(reservation => reservation.tickets)
                                .filter(ticket => selectedTickets.has(ticket.id))
                                .reduce((sum, ticket) => sum + ticket.child_count, 0)}
                            </td>
                            <td className="fw-bold">
                              {filteredReservations
                                .flatMap(reservation => reservation.tickets)
                                .filter(ticket => selectedTickets.has(ticket.id))
                                .reduce((sum, ticket) => sum + ticket.free_count, 0)}
                            </td>
                            <td></td>
                            <td className="fw-bold">
                              {Object.entries(
                                filteredReservations
                                  .flatMap(reservation => reservation.tickets)
                                  .filter(ticket => selectedTickets.has(ticket.id))
                                  .reduce((acc, ticket) => {
                                    const amount = (ticket.adult_count * ticket.adult_price) + 
                                                (ticket.child_count * ticket.half_price);
                                    if (!acc[ticket.currency]) {
                                      acc[ticket.currency] = 0;
                                    }
                                    acc[ticket.currency] += amount;
                                    return acc;
                                  }, {})
                              ).map(([currency, amount]) => (
                                <div key={currency}>
                                  {amount.toFixed(2)} {currency}
                                </div>
                              ))}
                            </td>
                            <td colSpan="10"></td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <div style={{ position: 'sticky'}}>
            <CurrencyRatesCard 
              currencyRates={currencyRates} 
              onRatesUpdate={handleRatesUpdate}
            />
          </div>
        </Col>
      </Row>

      {/* Provider Collections Card */}
      <Card className="mt-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Tahsilat Kayıtları</h5>
            <Form.Group className="mb-0" style={{ width: '200px' }}>
              <Form.Control
                type="text"
                placeholder="İşlem Kodu ile Filtrele"
                value={transactionCodeFilter}
                onChange={(e) => {
                  setTransactionCodeFilter(e.target.value);
                  // Clear accordion when filter changes
                  if (!e.target.value) {
                    setOpenAccordion(null);
                  }
                }}
                onClick={() => {
                  setTransactionCodeFilter('');
                  setOpenAccordion(null);
                  // Remove transaction_no from URL
                  const params = new URLSearchParams(location.search);
                  params.delete('transaction_no');
                  navigate(location.pathname + (params.toString() ? `?${params.toString()}` : ''));
                }}
              />
            </Form.Group>
          </div>
        </Card.Header>
        <Card.Body style={{ padding: 0 }}>
          <div style={{ 
            height: '400px',
            overflow: 'auto',
            position: 'relative'
          }}>
            <div style={{ 
              overflowX: 'auto',
              minWidth: '100%'
            }}>
              <Table hover className="align-middle" style={{ minWidth: '800px' }}>
                <thead style={{ 
                  position: 'sticky', 
                  top: 0, 
                  backgroundColor: 'white', 
                  zIndex: 1,
                  boxShadow: '0 2px 2px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <tr>
                    <th className='text-wrap'>İşlem No</th>
                    <th className='text-wrap'>Kayıt Tarih/Saat</th>
                    <th className='text-wrap'>Rehber</th>
                    <th className='text-wrap'>Rezervasyon Sayısı</th>
                    <th className='text-wrap'>Tur</th>
                    <th className='text-wrap'>Sağlayıcı</th>
                    <th className='text-wrap'>Açıklama</th>
                    <th className='text-wrap'>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCollections ? (
                    <tr>
                      <td colSpan="9" className="text-center">Yükleniyor...</td>
                    </tr>
                  ) : filteredGroupedCollections.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center">
                        {transactionCodeFilter ? 'Filtreye uygun tahsilat kaydı bulunamadı' : 'Tahsilat kaydı bulunamadı'}
                      </td>
                    </tr>
                  ) : (
                    <>
                      {filteredGroupedCollections.map(group => (
                        <React.Fragment key={group.transaction_code}>
                          <tr>
                            <td>{group.transaction_code}</td>
                            <td>{new Date(group.created_at).toLocaleString('tr-TR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}</td>
                            <td>{group.guide_name}</td>
                            <td>{group.total_reservations}</td>
                            <td>
                              <div style={{ maxWidth: '200px' }}>
                                {group.collections.map((collection, index) => (
                                  <div key={index} className="small mb-1">
                                    {index === 0 ? collection.tour_name : null}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td>
                              <div style={{ maxWidth: '200px' }}>
                                {group.collections.map((collection, index) => (
                                  <div key={index} className="small mb-1">
                                    {index === 0 ? collection.provider_name : null}
                                  </div>
                                ))}
                              </div>
                            </td>
                          
                            <td>
                              <div style={{ maxWidth: '300px' }}>
                                {group.collections[0]?.comment && (
                                  <div className="text-muted">
                                    {group.collections[0].comment}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => {
                                    setOpenAccordion(openAccordion === group.transaction_code ? null : group.transaction_code);
                                  }}
                                >
                                  Detay
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => {
                                    group.collections.forEach(collection => {
                                      handleDeleteCollection(collection.id);
                                    });
                                  }}
                                  disabled={loadingCollections}
                                >
                                  Sil
                                </Button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td colSpan="9" className="p-0">
                              <Accordion activeKey={openAccordion}>
                                <Accordion.Item eventKey={group.transaction_code}>
                                  <Accordion.Body>
                                    <Table hover className="align-middle">
                                      <thead>
                                        <tr>
                                          <th style={{ whiteSpace: 'nowrap' }}>Reservation No</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Bilet No</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Tur</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Tarih</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Saat</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Yetişkin</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Çocuk</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Ücretsiz</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Taban Fiyatlar</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Toplam Taban</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Para Birimi</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Rest</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Tur Grubu</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Müşteri</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Otel</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Oda No</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Rehber</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Sağlayıcı</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Sağlayıcı Ref</th>
                                          <th style={{ whiteSpace: 'nowrap' }}>Açıklama</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {group.collections.map(collection => (
                                          <tr key={collection.id}>
                                            <td>{collection.ticket_id}</td>
                                            <td>
                                              <span 
                                                onClick={() => handleTicketClick(collection.ticket_number)}
                                                style={{ 
                                                  cursor: 'pointer', 
                                                  color: '#007bff',
                                                  textDecoration: 'underline'
                                                }}
                                              >
                                                {collection.ticket_number}
                                              </span>
                                            </td>
                                            <td>{collection.tour_name}</td>
                                            <td>{formatDate(collection.collection_date)}</td>
                                            <td>{collection.time || '-'}</td>
                                            <td>{collection.adult_count}</td>
                                            <td>{collection.child_count}</td>
                                            <td>{collection.free_count}</td>
                                            <td>
                                              <div className="small">
                                                <div>Yetişkin: {collection.adult_price}</div>
                                                <div>Çocuk: {collection.half_price}</div>
                                              </div>
                                            </td>
                                            <td>{collection.total_amount}</td>
                                            <td>{collection.currency}</td>
                                            <td>
                                              <div style={{ maxWidth: '150px' }}>
                                                {collection.rest_amount && collection.rest_amount.trim() !== '' ? (
                                                  collection.rest_amount.split(', ').map((rest, index) => (
                                                    <div key={index} className="small mb-1">
                                                      <span className="badge bg-warning text-dark">
                                                        {rest}
                                                      </span>
                                                    </div>
                                                  ))
                                                ) : '-'}
                                              </div>
                                            </td>
                                            <td>{collection.tour_group_name}</td>
                                            <td>{collection.customer_name}</td>
                                            <td>{collection.hotel_name}</td>
                                            <td>{collection.room_number || '-'}</td>
                                            <td>{collection.guide_name}</td>
                                            <td>{collection.provider_name || '-'}</td>
                                            <td>{collection.provider_ref || '-'}</td>
                                            <td>
                                              <div style={{ maxWidth: '150px' }} title={collection.ticket_comment}>
                                                {collection.ticket_comment || '-'}
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                        <tr className="table-info">
                                          <td colSpan="4" className="text-end fw-bold">Toplam:</td>
                                          <td className="fw-bold text-end">
                                            {group.collections.reduce((sum, collection) => 
                                              sum + (parseInt(collection.adult_count) || 0), 0
                                            )}
                                          </td>
                                          <td className="fw-bold text-end">
                                            {group.collections.reduce((sum, collection) => 
                                              sum + (parseInt(collection.child_count) || 0), 0
                                            )}
                                          </td>
                                          <td className="fw-bold text-end">
                                            {group.collections.reduce((sum, collection) => 
                                              sum + (parseInt(collection.free_count) || 0), 0
                                            )}
                                          </td>
                                          <td></td>
                                          <td className="fw-bold text-end">
                                            {Object.entries(
                                              group.collections.reduce((acc, collection) => {
                                                if (!acc[collection.currency]) {
                                                  acc[collection.currency] = 0;
                                                }
                                                acc[collection.currency] += parseFloat(collection.total_amount) || 0;
                                                return acc;
                                              }, {})
                                            ).map(([currency, amount], index, array) => (
                                              <span key={currency}>
                                                {parseFloat(amount).toFixed(2)} {currency}
                                                {index < array.length - 1 ? ' | ' : ''}
                                              </span>
                                            ))}
                                          </td>
                                          <td className="fw-bold text-end">
                                           
                                            {(() => {
                                              const totalInTL = group.collections.reduce((sum, collection) => {
                                                if (collection.currency === 'TRY') {
                                                  return sum + parseFloat(collection.total_amount);
                                                } else if (currencyRates && currencyRates[collection.currency]) {
                                                  return sum + (parseFloat(collection.total_amount) * currencyRates[collection.currency]);
                                                }
                                                return sum;
                                              }, 0);
                                              return totalInTL.toFixed(2);
                                            })()}
                                            &nbsp;TL
                                          </td>
                                          <td colSpan="10"></td>
                                        </tr>
                                      </tbody>
                                    </Table>
                                  </Accordion.Body>
                                </Accordion.Item>
                              </Accordion>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Comment Modal */}
      <Modal show={showCommentModal} onHide={() => setShowCommentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Tahsilat Açıklaması</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <h6>Toplam Ödenecek Tutarlar:</h6>
            {Object.entries(selectedTickets.size > 0 ? 
              Array.from(selectedTickets).reduce((acc, ticketId) => {
                const ticket = reservations
                  .flatMap(reservation => reservation.tickets)
                  .find(t => t.id === ticketId);
                
                if (ticket) {
                  const amount = (ticket.adult_count * ticket.adult_price) + 
                                (ticket.child_count * ticket.half_price);
                  if (!acc[ticket.currency]) {
                    acc[ticket.currency] = 0;
                  }
                  acc[ticket.currency] += amount;
                }
                return acc;
              }, {}) : {}
            ).map(([currency, amount]) => (
              <div key={currency} className="mb-2">
                {amount.toFixed(2)} {currency}
              </div>
            ))}
          </div>
          <Form.Group>
            <Form.Label>Açıklama</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={collectionComment}
              onChange={(e) => setCollectionComment(e.target.value)}
              placeholder="Tahsilat açıklamasını giriniz..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCommentModal(false)}>
            İptal
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirmCollection}
          >
            Tahsilat Yap
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
