import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import tr from 'date-fns/locale/tr';
import "react-datepicker/dist/react-datepicker.css";
import { updateTicketOperator,getOperators } from '../../../../../../services/api';
import { 
    CURRENCIES, 
    isRegionSelected, 
    handleChange as handleInputChange,
    handleSubmit as submitForm,
    handleAddOption as addOption,
    handleDeleteOption as deleteOption,
    useTicketEffects
} from './EditTicketsubHelpers';

// Türkçe lokalizasyonu kaydet
registerLocale('tr', tr);
setDefaultLocale('tr');

export default function EditTicketModal({ show, handleClose, ticket, handleSave }) {
  const [editedTicket, setEditedTicket] = useState({
    ...ticket,
    ticket_number: ticket?.ticket_number || '',
    rest_amounts: {  // Her para birimi için ayrı tutar
      TL: '',
      USD: '',
      EUR: '',
      GBP: ''
    },
    hour: '',
    minute: ''
  });

  const [tours, setTours] = useState([]);
  const [tourGroups, setTourGroups] = useState([]);
  const [regions, setRegions] = useState([]);
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState({
    option_name: '',
    price: ''
  });
  const [operators, setOperators] = useState([]);
  
  // Custom hook ile effect'leri yönet
  useTicketEffects(show, ticket, setEditedTicket, setRegions, setTours, setTourGroups, setOptions);
  
  // Operatörleri yükle
  useEffect(() => {
    if (show) {
      const loadOperators = async () => {
        try {
          const operatorData = await getOperators();
          setOperators(operatorData);
        } catch (error) {
          console.error('Operatörler yüklenirken hata:', error);
        }
      };
      loadOperators();
    }
  }, [show]);
  
  // Event handler'ları yardımcı fonksiyonlarla yönet
  const handleChange = (e) => {
    // Status checkbox için özel işlem
    if (e.target.name === 'status') {
        setEditedTicket(prev => ({
            ...prev,
            status: e.target.checked // checkbox'ın checked değerini doğrudan kullan
        }));
        return;
    }

    // Diğer alanlar için mevcut işlem
    if (e.target.name === 'tour_name') {
        // Seçilen turu bul
        const selectedTour = tours.find(tour => tour.name === e.target.value);
        
        if (selectedTour) {
            // Tur bilgilerini otomatik güncelle
            handleInputChange({
                target: {
                    name: 'provider_name',
                    value: selectedTour.provider_name || ''
                }
            }, editedTicket, setEditedTicket);
            
            handleInputChange({
                target: {
                    name: 'provider_ref',
                    value: selectedTour.provider_ref || ''
                }
            }, editedTicket, setEditedTicket);

            // Diğer tur bilgilerini de güncelle
            handleInputChange({
                target: {
                    name: 'adult_price',
                    value: selectedTour.price || 0
                }
            }, editedTicket, setEditedTicket);

            handleInputChange({
                target: {
                    name: 'child_price',
                    value: selectedTour.child_price || 0
                }
            }, editedTicket, setEditedTicket);

            handleInputChange({
                target: {
                    name: 'currency',
                    value: selectedTour.currency || 'TRY'
                }
            }, editedTicket, setEditedTicket);
        }
    }
    
    if (e.target.name === 'hour' || e.target.name === 'minute') {
        const newTime = {
            hour: e.target.name === 'hour' ? e.target.value : editedTicket.hour,
            minute: e.target.name === 'minute' ? e.target.value : editedTicket.minute
        };

        // Validate hour and minute
        const validHour = Math.min(Math.max(parseInt(newTime.hour) || 0, 0), 23);
        const validMinute = Math.min(Math.max(parseInt(newTime.minute) || 0, 0), 59);

        // Format time as HH:mm
        const formattedTime = `${validHour.toString().padStart(2, '0')}:${validMinute.toString().padStart(2, '0')}`;

        setEditedTicket(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
            time: formattedTime
        }));
        return;
    }
    
    handleInputChange(e, editedTicket, setEditedTicket, setTours, setTourGroups, tours);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Format time if hour and minute exist
    const formattedTime = editedTicket.hour && editedTicket.minute
        ? `${editedTicket.hour.toString().padStart(2, '0')}:${editedTicket.minute.toString().padStart(2, '0')}`
        : null;

    // Rest tutarlarını formatla
    const restAmounts = Object.entries(editedTicket.rest_amounts)
        .filter(([_, amount]) => amount && amount !== '0')
        .map(([currency, amount]) => `${amount} ${currency}`)
        .join(', ');

    const updatedTicket = {
        ...editedTicket,
        time: formattedTime,
        total_rest_amount: restAmounts || null,
        status: Boolean(editedTicket.status),
        adult_price: parseFloat(editedTicket.adult_price) || 0,
        half_price: parseFloat(editedTicket.child_price) || 0,
        child_price: undefined
    };
    
    // Log the update payload for debugging
    console.log('Updating ticket with:', updatedTicket);
    
    // Önce operatör bilgilerini güncelle
    if (editedTicket.provider_name) {
        try {
            await updateTicketOperator(ticket.id, {
                provider_name: editedTicket.provider_name,
                provider_ref: editedTicket.provider_ref
            });
        } catch (error) {
            console.error('Operatör güncelleme hatası:', error);
        }
    }
    
    // Sonra diğer bilgileri kaydet
    handleSave(updatedTicket);
  };

  // useEffect ile başlangıç rest tutarlarını ayarlayalım
  useEffect(() => {
    if (show && ticket) {
        // Rest tutarlarını parse et
        const restAmounts = { TL: '', USD: '', EUR: '', GBP: '' };
        if (ticket.total_rest_amount) {
            ticket.total_rest_amount.split(', ').forEach(amount => {
                const [value, currency] = amount.trim().split(' ');
                if (currency && value) {
                    restAmounts[currency] = value;
                }
            });
        }

        setEditedTicket(prev => ({
            ...prev,
            ...ticket,
            status: Boolean(ticket.status), // Status değerini boolean'a çevir
            rest_amounts: restAmounts,
            hour: ticket.time ? ticket.time.split(':')[0] : '',
            minute: ticket.time ? ticket.time.split(':')[1] : ''
        }));
    }
  }, [show, ticket]);

  // Opsiyon işlemleri
  const handleAddOption = async () => {
    await addOption(ticket.id, newOption, options, setOptions, setNewOption);
  };

  const handleDeleteOption = async (optionId) => {
    await deleteOption(ticket.id, optionId, options, setOptions);
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Bilet Düzenle</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Bilet Numarası</Form.Label>
                <Form.Control
                  type="text"
                  name="ticket_number"
                  value={editedTicket.ticket_number}
                  onChange={handleChange}
                  placeholder="Bilet numarası girin"
                  readOnly
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Bölgeler</Form.Label>
                <div className="border rounded p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {regions.map((region) => (
                    <Form.Check
                      key={region.name}
                      type="checkbox"
                      id={`region-${region.name}`}
                      label={region.name}
                      name="regions"
                      value={region.name}
                      checked={isRegionSelected(editedTicket.regions, region.name)}
                      onChange={handleChange}
                      className="mb-1"
                    />
                  ))}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Grup</Form.Label>
                <Form.Select
                  name="tour_group_name"
                  value={editedTicket.tour_group_name || ''}
                  onChange={handleChange}
                >
                  <option value="">Grup Seçin</option>
                  {tourGroups.map((group) => (
                    <option key={group.id} value={group.group_name}>
                      {group.group_name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Tur</Form.Label>
                <Form.Select
                  name="tour_name"
                  value={editedTicket.tour_name || ''}
                  onChange={handleChange}
                >
                  <option value="">Tur Seçin</option>
                  {tours.map((tour) => (
                    <option key={tour.id} value={tour.name}>
                      {tour.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Operatör Referans No</Form.Label>
                <Form.Control
                  type="text"
                  name="provider_ref"
                  value={editedTicket.provider_ref || ''}
                  onChange={handleChange}
                  placeholder="Operatör referans numarası"
                  readOnly // Operatör seçildiğinde otomatik doldurulacak
                />
              </Form.Group>


              <Form.Group className="mb-3">
                <Form.Label>Tarih</Form.Label>
                <div className="w-100">
                  <DatePicker
                    selected={editedTicket.date ? new Date(editedTicket.date) : null}
                    onChange={(date) => {
                      handleChange({
                        target: {
                          name: 'date',
                          value: date ? date.toISOString().split('T')[0] : ''
                        }
                      });
                    }}
                    dateFormat="dd/MM/yyyy"
                    locale="tr"
                    className="form-control"
                    placeholderText="Tarih seçin"
                    wrapperClassName="w-100"
                    customInput={<Form.Control />}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Saat</Form.Label>
                <Row>
                  <Col md={6}>
                    <Form.Control
                      type="number"
                      name="hour"
                      value={editedTicket.hour}
                      onChange={handleChange}
                      placeholder="Saat"
                      min="0"
                      max="23"
                      onBlur={(e) => {
                        const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 23);
                        handleChange({
                          target: {
                            name: 'hour',
                            value: value.toString()
                          }
                        });
                      }}
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Control
                      type="number"
                      name="minute"
                      value={editedTicket.minute}
                      onChange={handleChange}
                      placeholder="Dakika"
                      min="0"
                      max="59"
                      onBlur={(e) => {
                        const value = Math.min(Math.max(parseInt(e.target.value) || 0, 0), 59);
                        handleChange({
                          target: {
                            name: 'minute',
                            value: value.toString()
                          }
                        });
                      }}
                    />
                  </Col>
                </Row>
              </Form.Group>

              

       

             
            </Col>

            <Col md={6}>
           
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Yetişkin</Form.Label>
                    <Form.Control
                      type="number"
                      name="adult_count"
                      value={editedTicket.adult_count || 0}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Çocuk</Form.Label>
                    <Form.Control
                      type="number"
                      name="child_count"
                      value={editedTicket.child_count || 0}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Ücretsiz</Form.Label>
                    <Form.Control
                      type="number"
                      name="free_count"
                      value={editedTicket.free_count || 0}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Yetişkin Fiyatı</Form.Label>
                <Form.Control
                  type="number"
                  name="adult_price"
                  value={editedTicket.adult_price || 0}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Çocuk Fiyatı</Form.Label>
                <Form.Control
                  type="number"
                  name="child_price"
                  value={editedTicket.child_price || 0}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Rest Tutarlar</Form.Label>
                <Row>
                  {CURRENCIES.map((currency, index) => (
                    <Col md={6} key={currency}>
                      <div className="input-group mb-2">
                        <Form.Control
                          type="number"
                          name={`rest_amount_${currency}`}
                          value={editedTicket.rest_amounts[currency]}
                          onChange={handleChange}
                          placeholder={`${currency} tutarı`}
                        />
                        <span className="input-group-text">{currency}</span>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Açıklama</Form.Label>
                <Form.Control
                  as="textarea"
                  name="comment"
                  value={editedTicket.comment || ''}
                  onChange={handleChange}
                  placeholder="Bilet ile ilgili notlar..."
                  rows={3}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>İptal Açıklaması</Form.Label>
                <Form.Control
                  as="textarea"
                  name="cancellation_reason"
                  value={editedTicket.cancellation_reason || ''}
                  onChange={handleChange}
                  placeholder="İptal nedeni..."
                  rows={3}
                />
              </Form.Group>
               <Form.Group className="mb-3">
                <Form.Label>Para Birimi</Form.Label>
                <Form.Select
                  name="currency"
                  value={editedTicket.currency || ''}
                  onChange={handleChange}
                  disabled
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
           
          </Row>

          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Opsiyonlar</Form.Label>
              <div className="border rounded p-3 mb-3">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Opsiyon Adı</th>
                      <th>Fiyat</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {options.map((option) => (
                      <tr key={option.id}>
                        <td>{option.option_name}</td>
                        <td>{option.price} </td>
                        <td>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteOption(option.id)}
                          >
                            Sil
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-3">
                  <Row>
                    <Col md={6}>
                      <Form.Control
                        placeholder="Opsiyon Adı"
                        value={newOption.option_name}
                        onChange={(e) => setNewOption({
                          ...newOption,
                          option_name: e.target.value
                        })}
                      />
                    </Col>
                    <Col md={4}>
                      <Form.Control
                        type="number"
                        placeholder="Fiyat"
                        value={newOption.price}
                        onChange={(e) => setNewOption({
                          ...newOption,
                          price: e.target.value
                        })}
                      />
                    </Col>
                    <Col md={2}>
                      <Button
                        variant="success"
                        onClick={handleAddOption}
                        disabled={!newOption.option_name || !newOption.price}
                      >
                        Ekle
                      </Button>
                    </Col>
                  </Row>
                </div>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Aktif"
                  name="status"
                  checked={editedTicket.status}
                  onChange={handleChange}
                />
              </Form.Group>
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