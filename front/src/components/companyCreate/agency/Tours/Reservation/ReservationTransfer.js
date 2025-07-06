import React, { useState, useEffect } from 'react';
import { getReservations,  getAllTourNames, updateTicketName, getReservationTickets } from '../../../../../services/api';

export default function ReservationTransfer() {
  const [tickets, setTickets] = useState([]);
  const [uniqueTours, setUniqueTours] = useState([]);
  const [selectedTour, setSelectedTour] = useState('');
  const [targetTour, setTargetTour] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [allTourNames, setAllTourNames] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);

  // Tüm turları yükle
  useEffect(() => {
    const fetchAllTours = async () => {
      try {
        const tourNames = await getAllTourNames();
        if (Array.isArray(tourNames) && tourNames.length > 0) {
          setAllTourNames(tourNames);
        } else {
          setAllTourNames([]);
        }
      } catch (error) {
        console.error('Error fetching tours:', error);
        setAllTourNames([]);
      }
    };

    fetchAllTours();
  }, []);

  // Seçili tarihe göre biletleri getir
  useEffect(() => {
    const fetchTickets = async () => {
      if (!selectedDate) {
        setTickets([]);
        setUniqueTours([]);
        setFilteredTickets([]);
        return;
      }

      try {
        const formattedDate = selectedDate;
        const response = await getReservationTickets(formattedDate);
        
        if (response?.data) {
          const allTickets = response.data.map(ticket => ({
            ...ticket,
            tour_name: ticket.tourName,
            customerPhone: ticket.phone,
            hotelName: ticket.hotel_name,
            roomNumber: ticket.room_number
          }));
          
          setTickets(allTickets);
          setFilteredTickets(allTickets);
          
          const uniqueTourNames = [...new Set(allTickets.map(ticket => ticket.tour_name))];
          setUniqueTours(uniqueTourNames);
        }
        
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };

    fetchTickets();
  }, [selectedDate]);

  // Tur seçimine göre biletleri filtrele
  useEffect(() => {
    if (!selectedTour) {
      setFilteredTickets(tickets);
    } else {
      const filtered = tickets.filter(ticket => ticket.tour_name === selectedTour);
      setFilteredTickets(filtered);
    }
  }, [selectedTour, tickets]);

  // Bilet seçimi için yeni fonksiyon
  const handleTicketSelection = (ticket) => {
    setSelectedTickets(prev => {
      if (prev.includes(ticket.id)) {
        return prev.filter(id => id !== ticket.id);
      } else {
        return [...prev, ticket.id];
      }
    });
  };

  const handleTransfer = async () => {
    if (selectedTickets.length === 0 || !targetTour) {
      alert('Lütfen bilet ve hedef tur seçin');
      return;
    }

    try {
      // Seçili biletleri güncelle
      for (const ticketId of selectedTickets) {
        await updateTicketName(ticketId, targetTour);
      }

      alert('Transfer işlemi başarıyla tamamlandı');
      
      // Seçimleri sıfırla
      setSelectedTickets([]);
      
      // Sadece seçili tarihteki biletleri yeniden yükle
      const response = await getReservationTickets(selectedDate);
      if (response?.data) {
        // Backend'den gelen veriyi frontend'in beklediği formata dönüştür
        const allTickets = response.data.map(ticket => ({
          ...ticket,
          tour_name: ticket.tourName,
          customerPhone: ticket.phone,
          hotelName: ticket.hotel_name,
          roomNumber: ticket.room_number
        }));
        
        setTickets(allTickets);
        
        // Benzersiz tur isimlerini güncelle
        const uniqueTourNames = [...new Set(allTickets.map(ticket => ticket.tour_name))];
        setUniqueTours(uniqueTourNames);
      }
      
    } catch (error) {
      console.error('Transfer sırasında hata:', error);
      alert('Transfer sırasında bir hata oluştu: ' + error.message);
    }
  };

  // Tümünü seç fonksiyonunu ekleyelim
  const handleSelectAll = (checked) => {
    if (checked) {
      // Sadece filtrelenmiş ve hedef tura ait olmayan biletleri seç
      const eligibleTickets = filteredTickets
        .filter(ticket => ticket.tour_name !== targetTour)
        .map(ticket => ticket.id);
      setSelectedTickets(eligibleTickets);
    } else {
      setSelectedTickets([]);
    }
  };

  return (
    <div className="container p-4">
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0 pri">Tur Transferi</h4>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6 col-lg-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title mb-3">
                    <i className="fas fa-calendar-alt me-2"></i>
                    Tarih Seçin
                  </h5>
                  <input
                    type="date"
                    className="form-control form-control-lg"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {selectedDate && (
              <>
                <div className="col-md-6 col-lg-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title mb-3">
                        <i className="fas fa-filter me-2"></i>
                        Tur Seçin
                      </h5>
                      <select 
                        className="form-select form-select-lg"
                        value={selectedTour}
                        onChange={(e) => setSelectedTour(e.target.value)}
                      >
                        <option value="">Tüm Turlar</option>
                        {uniqueTours.map((tour) => (
                          <option key={tour} value={tour}>
                            {tour}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-4">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title mb-3">
                        <i className="fas fa-exchange-alt me-2"></i>
                        Hedef Tur
                      </h5>
                      <select 
                        className="form-select form-select-lg"
                        value={targetTour}
                        onChange={(e) => setTargetTour(e.target.value)}
                      >
                        <option value="">Hedef Tur Seçin</option>
                        {allTourNames.map((tour) => (
                          <option 
                            key={tour} 
                            value={tour}
                          >
                            {tour}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {selectedDate && (
            <>
              <div className="table-responsive mt-4">
                <table className="table table-striped table-bordered">
                  <thead>
                    <tr>
                      <th>
                        <div className="d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input me-2"
                            checked={
                              filteredTickets.length > 0 &&
                              selectedTickets.length === filteredTickets.filter(t => t.tour_name !== targetTour).length
                            }
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            disabled={!filteredTickets.length || !targetTour}
                          />
                          <span>Tümünü Seç</span>
                        </div>
                      </th>
                      <th>Bilet No</th>
                      <th>Müşteri Bilgileri</th>
                      <th>Otel Bilgileri</th>
                      <th>Tur</th>
                      <th>Yetişkin</th>
                      <th>Çocuk</th>
                      <th>Ücretsiz</th>
                      <th>Toplam Kişi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map(ticket => {
                      const totalPax = (parseInt(ticket.adult_count) || 0) + 
                                     (parseInt(ticket.child_count) || 0) + 
                                     (parseInt(ticket.free_count) || 0);
                      
                      return (
                        <tr key={ticket.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedTickets.includes(ticket.id)}
                              onChange={() => handleTicketSelection(ticket)}
                              disabled={ticket.tour_name === targetTour}
                            />
                          </td>
                          <td>{ticket.ticket_number}</td>
                          <td>
                            <div><strong>{ticket.customerName}</strong></div>
                            <div className="text-muted small">{ticket.customerPhone}</div>
                          </td>
                          <td>
                            <div>{ticket.hotelName}</div>
                            <div className="text-muted small">Oda: {ticket.roomNumber}</div>
                          </td>
                          <td>{ticket.tour_name}</td>
                          <td>{ticket.adult_count || 0}</td>
                          <td>{ticket.child_count || 0}</td>
                          <td>{ticket.free_count || 0}</td>
                          <td>{totalPax}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={handleTransfer}
                  disabled={selectedTickets.length === 0 || !targetTour}
                >
                  <i className="fas fa-exchange-alt me-2"></i>
                  Transfer Et ({selectedTickets.length} bilet seçili)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
