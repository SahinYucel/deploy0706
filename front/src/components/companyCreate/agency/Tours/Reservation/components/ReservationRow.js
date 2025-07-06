import React, { useState } from 'react';
import { Button, Collapse, Row, Dropdown, Form } from 'react-bootstrap';
import { FaChevronDown, FaChevronUp, FaTicketAlt, FaEdit, FaEllipsisV, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import TicketCard from './TicketCard';

export default function ReservationRow({ reservation, onEditReservation, onEditTicket, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editedComment, setEditedComment] = useState(reservation.main_comment || '');

  

  const formatCurrencyRates = (rates) => {
    if (!rates) return 'Kur bilgisi yok';
    return rates.split(',').map(rate => rate.trim()).join(' | ');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCommentSave = async () => {
    try {
      await onEditReservation({
        ...reservation,
        main_comment: editedComment
      });
      setIsEditingComment(false);
    } catch (error) {
      console.error('Açıklama güncelleme hatası:', error);
    }
  };

  const handleStatusChangeClick = () => {
    if (reservation.status) {
      if (window.confirm('Bu rezervasyonu iptal etmek istediğinizden emin misiniz?')) {
        onStatusChange(reservation.id, reservation.status);
      }
    } else {
      if (window.confirm('Bu rezervasyonu aktif etmek istediğinizden emin misiniz?')) {
        onStatusChange(reservation.id, reservation.status);
      }
    }
  };

  return (
    <>
      <tr 
        className={`align-middle ${reservation.is_cost_guide ? 'table-success' : ''}`}
        style={{ 
          lineHeight: '1.2', 
          padding: '10px 0'
        }}
      >
        <td className="py-2">
          <Button
            variant="link"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="p-0 text-dark"
          >
            {open ? <FaChevronUp /> : <FaChevronDown />}
          </Button>
        </td>
        
        <td className="py-2 text-center">{reservation.customer_name}</td>
        <td className="py-2 text-center">{reservation.phone}</td>
        <td className="py-2 text-center">{reservation.hotel_name}</td>
        <td className="py-2 text-center">{reservation.room_number}</td>
        <td className="py-2 text-center">{reservation.guide_name}</td>
        <td className="py-2 text-center">{reservation.ticket_count}</td>
        <td className="py-2 text-center">{reservation.commission_rate}%</td>
        <td className="py-2 text-center" style={{ maxWidth: '200px' }}>
          <div className="text-truncate" title={reservation.main_comment || 'Açıklama bulunmuyor'}>
            {reservation.main_comment || '-'}
          </div>
        </td>
        <td className="py-2 text-center">{formatDate(reservation.created_at)}</td>
    
        <td className="py-2 text-center">
           {reservation.total_amount}
        </td>
        <td className="py-2 text-center">{formatCurrencyRates(reservation.currency_rates)}</td>
       
        <td className="py-2 text-center">
          <Button
            variant="link"
            className="p-0"
            onClick={handleStatusChangeClick}
          >
            {reservation.status ? <FaToggleOn className="text-success" /> : <FaToggleOff className="text-muted" />}
          </Button>
        </td> 
        <td className="py-2 text-center">
          <div className="d-flex gap-2 justify-content-center">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onEditReservation(reservation)}
            >
              <FaEdit className="me-1" />
              Düzenle
            </Button>
          </div>
        </td>
        <td className="py-2 text-center">
          <Dropdown align="end">
            <Dropdown.Toggle variant="link" className="p-0 text-dark" id={`dropdown-${reservation.id}`}>
              <FaEllipsisV />
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Header>Biletler</Dropdown.Header>
              {reservation.tickets.map((ticket) => (
                <Dropdown.Item 
                  key={ticket.id} 
                  onClick={() => onEditTicket(ticket, reservation.id)}
                >
                  <FaTicketAlt className="me-2" />
                  {ticket.tour_name}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </td>
        
      </tr>
      <tr>
        <td colSpan={15} className="p-0">
          <Collapse in={open}>
            <div className="p-4 bg-light border-top">
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6>Açıklama</h6>
                  <Button
                    variant="link"
                    className="p-0 text-primary"
                    onClick={() => setIsEditingComment(!isEditingComment)}
                  >
                    <FaEdit />
                  </Button>
                </div>
                {isEditingComment ? (
                  <div className="d-flex gap-2">
                    <Form.Control
                      as="textarea"
                      value={editedComment}
                      onChange={(e) => setEditedComment(e.target.value)}
                      rows={3}
                    />
                    <div className="d-flex flex-column gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={handleCommentSave}
                      >
                        Kaydet
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setIsEditingComment(false);
                          setEditedComment(reservation.main_comment || '');
                        }}
                      >
                        İptal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted mb-0">
                    {reservation.main_comment || 'Açıklama bulunmuyor'}
                  </p>
                )}
              </div>
              <h6 className="mb-4">
                <FaTicketAlt className="me-2" />
                Biletler
              </h6>
              <Row className="g-0">
                {reservation.tickets.map((ticket) => (
                  <TicketCard 
                    key={ticket.id} 
                    ticket={ticket} 
                    onEdit={(ticket) => onEditTicket(ticket, reservation.id)}
                  />
                ))}
              </Row>
            </div>
          </Collapse>
        </td>
      </tr>
    </>
  );
} 