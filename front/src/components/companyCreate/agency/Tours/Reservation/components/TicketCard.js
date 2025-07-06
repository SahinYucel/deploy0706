import React from 'react';
import { Card, Button, Col, Badge, Row } from 'react-bootstrap';
import { 
  FaTicketAlt, 
  FaClock, 
  FaUsers, 
  FaMoneyBillWave, 
  FaEdit, 
  FaMapMarkerAlt,
  FaUserFriends,
  FaChild,
  FaUserAltSlash,
  FaPlus
} from 'react-icons/fa';

export default function TicketCard({ ticket, onEdit }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  console.log('Ticket options:', ticket.ticket_options);

  return (
    <Col xs={12} className="mb-3">
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center py-3">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center">
              <FaTicketAlt className="me-2" />
              <span className="fw-bold">{ticket.tour_name}</span>
            </div>
            <div className="d-flex align-items-center text-muted">
              <span>({ticket.tour_group_name})</span>
            </div>
           
          </div>
          <Badge bg={ticket.status === 1 ? "success" : "warning"}>
            {ticket.status === 1 ? "Aktif" : "Pasif"}
          </Badge>
        </Card.Header>
        <Card.Body className="py-4">
          <Row className="g-4">
            <Col md={4}>
              <div className="mb-4">
                <small className="text-muted d-block mb-2">Bölge:</small>
                <div className="d-flex align-items-center">
                  <FaMapMarkerAlt className="me-2 text-secondary" />
                  <span>{ticket.regions}</span>
                </div>
                
              </div>

              <div>
                <small className="text-muted d-block mb-2">Tarih & Saat:</small>
                <div className="d-flex align-items-center">
                  <FaClock className="me-2 text-secondary" />
                  <span>
                    {formatDate(ticket.date)} - {ticket.time}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <small className="text-muted d-block mb-2">Bilet Numarası</small>
                <div className="d-flex align-items-center">
                  <FaTicketAlt className="me-2 text-secondary" />
                  <span className="fw-bold">{ticket.ticket_number}</span>
                </div>
              </div>
            
            </Col>
          

            <Col md={4}>
              <div className="mb-4">
                <small className="text-muted d-block mb-2">Pax:</small>
                <div className="d-flex align-items-center mb-2">
                  <FaUserFriends className="me-2 text-secondary" />
                  <span>Yetişkin: {ticket.adult_count}</span>
                  <span className="ms-2 text-success">({ticket.adult_price} {ticket.currency})</span>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <FaChild className="me-2 text-secondary" />
                  <span>Çocuk: {ticket.child_count}</span>
                  <span className="ms-2 text-success">({ticket.half_price} {ticket.currency})</span>
                </div>
                <div className="d-flex align-items-center">
                  <FaUserAltSlash className="me-2 text-secondary" />
                  <span>Ücretsiz: {ticket.free_count}</span>
                </div>
              </div>

              <div>
                <small className="text-muted d-block mb-2">Kalan Tutarlar:</small>
                <div className="d-flex flex-column gap-1">
                  {ticket.total_rest_amount ? 
                    ticket.total_rest_amount.split(',').map((amount, index) => (
                      <div key={index} className="d-flex align-items-center text-danger">
                        <FaMoneyBillWave className="me-2" />
                        <span className="fw-bold">{amount.trim()}</span>
                      </div>
                    ))
                    : <span className="text-muted">Kalan tutar bulunmuyor</span>
                  }
                </div>
              </div>

              <div className="mt-4">
                <small className="text-muted d-block mb-2">Opsiyonlar:</small>
                <div className="d-flex flex-column gap-1">
                  {ticket.ticket_options ? (
                    ticket.ticket_options.split(',').map((option, index) => {
                      console.log('Processing option:', option);
                      const optionParts = option.trim().split(':');
                      const name = optionParts[0];
                      const priceInfo = optionParts[1] || '';
                      
                      return (
                        <div key={index} className="d-flex align-items-center">
                          <FaPlus className="me-2 text-success" />
                          <span>{name}</span>
                          {priceInfo && <span className="ms-2 text-success">{priceInfo}</span>}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-muted">Opsiyon bulunmuyor</span>
                  )}
                </div>
              </div>
            </Col>

            <Col md={4}>
              <div className="mb-4">
                <small className="text-muted d-block mb-2">Rehber:</small>
                <span className="d-block mb-1">{ticket.guide_name}</span>
                {ticket.guide_ref && (
                  <small className="text-muted">Ref: {ticket.guide_ref}</small>
                )}
              </div>

              <div>
                <small className="text-muted d-block mb-2">Sağlayıcı:</small>
                <span className="d-block mb-1">{ticket.provider_name}</span>
                {ticket.provider_ref && (
                  <small className="text-muted">Ref: {ticket.provider_ref}</small>
                )}
              </div>

              {ticket.comment && (
                <div className="mt-3">
                  <small className="text-muted d-block mb-2">Açıklama:</small>
                  <p className="mb-0 small">{ticket.comment}</p>
                </div>
              )}

              {ticket.status !== 1 && ticket.cancellation_reason && (
                <div className="mt-3">
                  <small className="text-danger d-block mb-2">İptal Nedeni:</small>
                  <div className="d-flex align-items-start">
                    <span className="small text-danger">
                      {ticket.cancellation_reason}
                    </span>
                  </div>
                </div>
              )}

              
            </Col>
          </Row>
        </Card.Body>
        <Card.Footer className="d-flex justify-content-between align-items-center bg-light py-3">
          <div className="d-flex align-items-center">
            <FaMoneyBillWave className="me-2 text-success" />
            <span className="fw-bold">
              Doviz Tipi: {ticket.total_amount} {ticket.currency}
            </span>
          </div>
          <Button 
            variant="outline-primary"
            size="sm"
            onClick={() => onEdit(ticket)}
          >
            <FaEdit className="me-1" />
            Düzenle
          </Button>
        </Card.Footer>
      </Card>
    </Col>
  );
} 