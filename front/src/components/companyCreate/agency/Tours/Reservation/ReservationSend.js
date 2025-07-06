import React, { useState, useEffect } from 'react';
import { getReservationTickets, generateTicketsPDF, getOperators, sendTicketsPDFToWhatsApp } from '../../../../../services/api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { tr } from 'date-fns/locale';
import { format } from 'date-fns';

function ReservationSend() {
  const [loading, setLoading] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [tickets, setTickets] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [operators, setOperators] = useState([]);

  useEffect(() => {
    // Fetch operators when component mounts
    const fetchOperators = async () => {
      try {
        const operatorsData = await getOperators();
        setOperators(operatorsData);
      } catch (error) {
        console.error('Error fetching operators:', error);
      }
    };

    fetchOperators();
  }, []);

  const loadTickets = async (date = null) => {
    if (!date) {
      setTickets([]);
      return;
    }
    try {
      setLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await getReservationTickets(formattedDate);
      if (response.data) {
        setTickets(response.data);
        setSelectedTickets([]);
        setSelectAll(false);
      }
    } catch (error) {
      setAlert({
        show: true,
        type: 'danger',
        message: 'Biletler yüklenirken bir hata oluştu!'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    loadTickets(date);
  };

  // Tüm biletleri seç/kaldır
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    setSelectedTickets(checked ? tickets.map(ticket => ticket.id) : []);
  };

  // Tek bilet seç/kaldır
  const handleSelectTicket = (ticketId) => {
    setSelectedTickets(prev => {
      if (prev.includes(ticketId)) {
        const newSelection = prev.filter(id => id !== ticketId);
        setSelectAll(false);
        return newSelection;
      } else {
        const newSelection = [...prev, ticketId];
        setSelectAll(newSelection.length === tickets.length);
        return newSelection;
      }
    });
  };

  // PDF oluştur ve indir
  const handleCreatePDF = async () => {
    if (selectedTickets.length === 0) {
      setAlert({
        show: true,
        type: 'warning',
        message: 'Lütfen en az bir bilet seçiniz!'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await generateTicketsPDF(selectedTickets);
      
      // PDF'i indir
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tickets_${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setAlert({
        show: true,
        type: 'success',
        message: 'PDF başarıyla oluşturuldu!'
      });
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      setAlert({
        show: true,
        type: 'danger',
        message: 'PDF oluşturulurken bir hata oluştu!'
      });
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp ile gönder
  const handleSendWhatsApp = () => {
    if (selectedTickets.length === 0) {
      setAlert({
        show: true,
        type: 'warning',
        message: 'Lütfen en az bir bilet seçiniz!'
      });
      return;
    }
    
    setPhoneNumber('');
    setShowWhatsappModal(true);
  };

  const handleSendWhatsAppConfirm = async () => {
    if (!phoneNumber) {
      setAlert({
        show: true,
        type: 'warning',
        message: 'Lütfen bir telefon numarası seçiniz!'
      });
      return;
    }

    try {
      setWhatsappLoading(true);
      
      // Call the API to send the PDF to WhatsApp
      const response = await sendTicketsPDFToWhatsApp(selectedTickets, phoneNumber);
      
      setAlert({
        show: true,
        type: 'success',
        message: 'Biletler başarıyla gönderildi!'
      });
    } catch (error) {
      console.error('WhatsApp gönderme hatası:', error);
      setAlert({
        show: true,
        type: 'danger',
        message: 'WhatsApp gönderilirken bir hata oluştu!'
      });
    } finally {
      setWhatsappLoading(false);
      setShowWhatsappModal(false);
    }
  };

  return (
    <div className="container mt-4">
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
      
      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Rezervasyon Biletleri</h5>
          <div className="d-flex gap-2">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              className="form-control"
              dateFormat="dd.MM.yyyy"
              isClearable
              placeholderText="Tarih seçiniz"
              locale={tr}
            />
            <button 
              className="btn btn-light"
              onClick={handleCreatePDF}
              disabled={loading || selectedTickets.length === 0}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-file-pdf me-2"></i>
              )}
              PDF İndir
            </button>
            <button 
              className="btn btn-success"
              onClick={handleSendWhatsApp}
              disabled={whatsappLoading || selectedTickets.length === 0}
            >
              {whatsappLoading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-whatsapp me-2"></i>
              )}
              WhatsApp
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </div>
                  </th>
                  <th>Müşteri Adı</th>
                  <th>Tur</th>
                  <th>Tarih</th>
                  <th>Yetişkin</th>
                  <th>Çocuk</th>
                  <th>Ücretsiz</th>
                  <th>Toplam</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      {loading ? (
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Yükleniyor...</span>
                        </div>
                      ) : (
                        <p className="text-muted mb-0">
                          {selectedDate ? 'Seçilen tarihte bilet bulunmamaktadır.' : 'Lütfen bir tarih seçin'}
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  tickets.map(ticket => (
                    <tr key={ticket.id}>
                      <td>
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedTickets.includes(ticket.id)}
                            onChange={() => handleSelectTicket(ticket.id)}
                          />
                        </div>
                      </td>
                      <td>{ticket.customerName}</td>
                      <td>{ticket.tourName}</td>
                      <td className="text-center">{ticket.adult_count}</td>
                      <td className="text-center">{ticket.child_count}</td>
                      <td className="text-center">{ticket.free_count}</td>
                      <td className="text-center fw-bold">
                        {(ticket.adult_count || 0) + (ticket.child_count || 0) + (ticket.free_count || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {tickets.length > 0 && (
                <tfoot className="table-light">
                  <tr>
                    <td colSpan="4" className="text-end fw-bold">Toplam:</td>
                    <td className="text-center fw-bold">
                      {tickets.reduce((sum, ticket) => sum + (ticket.adult_count || 0), 0)}
                    </td>
                    <td className="text-center fw-bold">
                      {tickets.reduce((sum, ticket) => sum + (ticket.child_count || 0), 0)}
                    </td>
                    <td className="text-center fw-bold">
                      {tickets.reduce((sum, ticket) => sum + (ticket.free_count || 0), 0)}
                    </td>
                    <td className="text-center fw-bold">
                      {tickets.reduce((sum, ticket) => 
                        sum + (ticket.adult_count || 0) + (ticket.child_count || 0) + (ticket.free_count || 0), 0
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      <div className={`modal fade ${showWhatsappModal ? 'show' : ''}`} 
           style={{display: showWhatsappModal ? 'block' : 'none'}}
           tabIndex="-1" 
           aria-labelledby="whatsappModalLabel" 
           aria-hidden={!showWhatsappModal}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="whatsappModalLabel">
                <i className="bi bi-whatsapp text-success me-2"></i>
                WhatsApp ile Gönder
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowWhatsappModal(false)} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="phoneNumber" className="form-label">Telefon Numarası</label>
                <select 
                  className="form-select" 
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                >
                  <option value="">Operatör Seçin</option>
                  {operators.map(operator => (
                    <option key={operator.id} value={operator.phone_number}>
                      {operator.company_name} - {operator.phone_number}
                    </option>
                  ))}
                </select>
                <div className="form-text">Operatör telefon numarasını seçin</div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowWhatsappModal(false)}>İptal</button>
              <button 
                type="button" 
                className="btn btn-success" 
                onClick={handleSendWhatsAppConfirm}
                disabled={whatsappLoading}
              >
                {whatsappLoading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-whatsapp me-2"></i>
                )}
                Gönder
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal arkaplan overlay */}
      {showWhatsappModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </div>
  );
}

export default ReservationSend; 