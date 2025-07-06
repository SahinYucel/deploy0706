import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Card, Table } from 'react-bootstrap';
import { FaEdit, FaCheck, FaTimes, FaTrash } from 'react-icons/fa';
import { getReservationGuides, getReservationPayments, addReservationPayment, updateReservationPayment, deleteReservationPayment } from '../../../../../../services/api';

export default function EditReservationModal({ 
  show, 
  handleClose, 
  reservation, 
  handleSave, 
  onEditTicket,
}) {
  const [editedReservation, setEditedReservation] = useState(reservation);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    currency: 'TL',
    payment_type: 'cash'
  });
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingPayment, setEditingPayment] = useState({
    amount: '',
    currency: '',
    payment_type: ''
  });

  // Rehberleri yükle
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setLoading(true);
        const response = await getReservationGuides();
        setGuides(response.data);
      } catch (error) {
        console.error('Rehberler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    if (show) {
      fetchGuides();
    }
  }, [show]);

  useEffect(() => {
    setEditedReservation(reservation);
  }, [reservation]);

  // Ödemeleri yükle
  useEffect(() => {
    const fetchPayments = async () => {
      if (reservation?.id) {
        try {
          const response = await getReservationPayments(reservation.id);
          setPayments(response.data);
        } catch (error) {
          console.error('Ödemeler yüklenirken hata:', error);
        }
      }
    };

    if (show) {
      fetchPayments();
    }
  }, [show, reservation?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'guide_name') {
      const selectedGuide = guides.find(guide => guide.name === value);
      setEditedReservation(prev => ({
        ...prev,
        guide_name: value,
        commission_rate: selectedGuide?.commission_rate || 40
      }));
    } else {
      setEditedReservation(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    
    // Kur verilerini birleştir
    const rates = [];
    if (editedReservation.rate_usd) rates.push(`USD:${editedReservation.rate_usd}`);
    if (editedReservation.rate_eur) rates.push(`EUR:${editedReservation.rate_eur}`);
    if (editedReservation.rate_gbp) rates.push(`GBP:${editedReservation.rate_gbp}`);

    // Verileri API formatına dönüştür
    const updatedReservation = {
      ...editedReservation,
      currency_rates: rates.join(', ')
    };

    handleSave(updatedReservation);
    handleClose();
  };

  // Mevcut değerleri ayrıştırma
  useEffect(() => {
    if (reservation) {
      const parsedReservation = { 
        ...reservation,
        main_comment: reservation.main_comment || ''
      };

      // Kur verilerini ayrıştır
      if (reservation.currency_rates) {
        const rates = reservation.currency_rates.split(',').map(rate => rate.trim());
        rates.forEach(rate => {
          const [currency, value] = rate.split(':');
          if (currency === 'USD') parsedReservation.rate_usd = parseFloat(value);
          if (currency === 'EUR') parsedReservation.rate_eur = parseFloat(value);
          if (currency === 'GBP') parsedReservation.rate_gbp = parseFloat(value);
        });
      }

      setEditedReservation(parsedReservation);
    }
  }, [reservation]);

  // Yeni ödeme ekleme
  const handleAddPayment = async () => {
    // Tutar kontrolü
    if (!newPayment.amount || newPayment.amount <= 0) {
      alert('Lütfen geçerli bir tutar giriniz');
      return;
    }

    try {
      await addReservationPayment(reservation.id, newPayment);
      // Ödemeleri yeniden yükle
      const response = await getReservationPayments(reservation.id);
      setPayments(response.data);
      // Form'u temizle
      setNewPayment({
        amount: '',
        currency: 'TL',
        payment_type: 'cash'
      });
    } catch (error) {
      console.error('Ödeme eklenirken hata:', error);
    }
  };

  // Ödeme düzenleme moduna geç
  const handleEditPayment = (payment) => {
    setEditingPaymentId(payment.id);
    setEditingPayment({
      amount: payment.amount,
      currency: payment.currency,
      payment_type: payment.payment_type
    });
  };

  // Ödeme düzenlemeyi kaydet
  const handleSavePaymentEdit = async (paymentId) => {
    try {
      await updateReservationPayment(reservation.id, paymentId, editingPayment);
      // Ödemeleri yeniden yükle
      const response = await getReservationPayments(reservation.id);
      setPayments(response.data);
      // Düzenleme modundan çık
      setEditingPaymentId(null);
    } catch (error) {
      console.error('Ödeme güncellenirken hata:', error);
    }
  };

  // Ödeme silme fonksiyonu ekleyelim
  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Bu ödemeyi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteReservationPayment(reservation.id, paymentId);
        // Ödemeleri yeniden yükle
        const response = await getReservationPayments(reservation.id);
        setPayments(response.data);
      } catch (error) {
        console.error('Ödeme silinirken hata:', error);
      }
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Rezervasyon Düzenle</Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Müşteri Adı</Form.Label>
                <Form.Control
                  type="text"
                  name="customer_name"
                  value={editedReservation.customer_name}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Telefon</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={editedReservation.phone}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Otel</Form.Label>
                <Form.Control
                  type="text"
                  name="hotel_name"
                  value={editedReservation.hotel_name}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Oda Numarası</Form.Label>
                <Form.Control
                  type="text"
                  name="room_number"
                  value={editedReservation.room_number}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Rehber</Form.Label>
                <Form.Select
                  name="guide_name"
                  value={editedReservation.guide_name || ''}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Rehber Seçin</option>
                  {guides.map(guide => (
                    <option key={guide.id} value={guide.name}>
                      {guide.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
        

              
            </Col>
            <Col md={6}>
            
            

  

              <Form.Group className="mb-3">
                <Form.Label>Kurlar</Form.Label>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex gap-2 align-items-center">
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="rate_usd"
                      value={editedReservation.rate_usd || ''}
                      onChange={handleChange}
                      placeholder="USD kuru"
                    />
                    <span className="text-muted">USD/TL</span>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="rate_eur"
                      value={editedReservation.rate_eur || ''}
                      onChange={handleChange}
                      placeholder="EUR kuru"
                    />
                    <span className="text-muted">EUR/TL</span>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="rate_gbp"
                      value={editedReservation.rate_gbp || ''}
                      onChange={handleChange}
                      placeholder="GBP kuru"
                    />
                    <span className="text-muted">GBP/TL</span>
                  </div>
                </div>
              </Form.Group>


              <Form.Group className="mb-3">
                <Form.Label>Komisyon Oranı (%)</Form.Label>
                <Form.Control
                  type="number"
                  name="commission_rate"
                  value={editedReservation.commission_rate}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Açıklama</Form.Label>
                <Form.Control
                  as="textarea"
                  name="main_comment"
                  value={editedReservation.main_comment || ''}
                  onChange={handleChange}
                />
              </Form.Group>
            
            </Col>
          
          </Row>

          <Col md={12}>
            <h5>Ödemeler</h5>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Ödeme Tipi</th>
                  <th>Tutar</th>
                  <th style={{ width: '100px' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td>
                      {editingPaymentId === payment.id ? (
                        <Form.Select
                          value={editingPayment.payment_type}
                          onChange={e => setEditingPayment({
                            ...editingPayment,
                            payment_type: e.target.value
                          })}
                        >
                          <option value="cash">Nakit</option>
                          <option value="card">Kart</option>
                        </Form.Select>
                      ) : (
                        payment.payment_type === 'cash' ? 'Nakit' :
                        payment.payment_type === 'card' ? 'Kart' :
                        payment.payment_type === 'transfer' ? 'Havale' : payment.payment_type
                      )}
                    </td>
                    <td>
                      {editingPaymentId === payment.id ? (
                        <div className="d-flex gap-2">
                          <Form.Control
                            type="number"
                            step="0.01"
                            value={editingPayment.amount}
                            onChange={e => setEditingPayment({
                              ...editingPayment,
                              amount: e.target.value
                            })}
                          />
                          <Form.Select
                            value={editingPayment.currency}
                            onChange={e => setEditingPayment({
                              ...editingPayment,
                              currency: e.target.value
                            })}
                          >
                            <option value="TL">TL</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </Form.Select>
                        </div>
                      ) : (
                        `${payment.amount} ${payment.currency}`
                      )}
                    </td>
                    <td>
                      {editingPaymentId === payment.id ? (
                        <div className="d-flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleSavePaymentEdit(payment.id)}
                          >
                            <FaCheck />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setEditingPaymentId(null)}
                          >
                            <FaTimes />
                          </Button>
                        </div>
                      ) : (
                        <div className="d-flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleEditPayment(payment)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeletePayment(payment.id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div>
              <Row>
                <Col md={3}>
                  <Form.Select
                    value={newPayment.payment_type}
                    onChange={e => setNewPayment({...newPayment, payment_type: e.target.value})}
                  >
                    <option value="cash">Nakit</option>
                    <option value="card">Kart</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Control
                    type="number"
                    step="0.01"
                    placeholder="Tutar"
                    value={newPayment.amount}
                    onChange={e => setNewPayment({...newPayment, amount: e.target.value})}
                  />
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={newPayment.currency}
                    onChange={e => setNewPayment({...newPayment, currency: e.target.value})}
                  >
                    <option value="TL">TL</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Button 
                    variant="success" 
                    size="sm" 
                    className="w-100"
                    onClick={handleAddPayment}
                    disabled={!newPayment.amount || newPayment.amount <= 0}
                  >
                    Ödeme Ekle
                  </Button>
                </Col>
              </Row>
            </div>
          </Col>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            İptal
          </Button>
          <Button variant="primary" type="submit">
            Kaydet
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
} 