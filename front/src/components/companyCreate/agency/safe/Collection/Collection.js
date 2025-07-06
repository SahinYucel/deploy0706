import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getSafeRecords, getSafes, createManualSafeRecord } from '../../../../../services/api';

export default function Collection() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [filterDate, setFilterDate] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    currency: '',
    paymentType: ''
  });
  const [totals, setTotals] = useState({
    gelir: { cash: {}, card: {} },
    gider: { cash: {}, card: {} }
  });

  // Manuel kayıt için state'ler
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualRecord, setManualRecord] = useState({
    transaction_no: '',
    account_name: '',
    description: '',
    amount: '',
    currency: '',
    payment_type: 'gelir',
    payment_method: 'cash'
  });
  const [savingManual, setSavingManual] = useState(false);

  // 6 haneli alfanumerik kod oluştur
  const generateTransactionCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  useEffect(() => {
    const agencyUser = JSON.parse(localStorage.getItem('agencyUser'));
    if (agencyUser?.companyId) {
      setCompanyId(agencyUser.companyId);
    }
  }, []);

  useEffect(() => {
    const loadRecords = async () => {
      if (!companyId) return;
      
      try {
        setLoading(true);
        const [loadedRecords, safes] = await Promise.all([
          getSafeRecords(companyId),
          getSafes(companyId)
        ]);
        
        setRecords(loadedRecords);
        
        // Safe tablosundan toplamları hesapla
        const safeTotals = {
          gelir: { cash: {}, card: {} },
          gider: { cash: {}, card: {} }
        };

        safes.forEach(safe => {
          const paymentMethod = safe.type === 'card' ? 'card' : 'cash';
          
          // Gelir (balance)
          if (safe.balance > 0) {
            safeTotals.gelir[paymentMethod][safe.name] = (safeTotals.gelir[paymentMethod][safe.name] || 0) + safe.balance;
          }
          
          // Gider (negativebalance)
          if (safe.negativebalance > 0) {
            safeTotals.gider[paymentMethod][safe.name] = (safeTotals.gider[paymentMethod][safe.name] || 0) + safe.negativebalance;
          }
        });
        
        setTotals(safeTotals);
        setError(null);
      } catch (error) {
        setError('Kasa kayıtları yüklenirken bir hata oluştu');
        console.error('Error loading safe records:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, [companyId]);

  const handleDateFilter = (e) => {
    const { name, value } = e.target;
    setFilterDate(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleManualRecordChange = (e) => {
    const { name, value } = e.target;
    setManualRecord(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleManualRecordSubmit = async (e) => {
    e.preventDefault();
    
    if (!manualRecord.transaction_no || !manualRecord.account_name || !manualRecord.amount || !manualRecord.currency) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    // Para birimi kontrolü
    const allowedCurrencies = ['TL', 'USD', 'EUR', 'GBP'];
    if (!allowedCurrencies.includes(manualRecord.currency)) {
      alert('Lütfen geçerli bir para birimi seçin (TL, USD, EUR, GBP)');
      return;
    }

    try {
      setSavingManual(true);
      await createManualSafeRecord(companyId, manualRecord);
      
      // Modal'ı kapat ve formu temizle
      setShowManualModal(false);
      setManualRecord({
        transaction_no: '',
        account_name: '',
        description: '',
        amount: '',
        currency: '',
        payment_type: 'gelir',
        payment_method: 'cash'
      });
      
      // Kayıtları yenile
      const [loadedRecords, safes] = await Promise.all([
        getSafeRecords(companyId),
        getSafes(companyId)
      ]);
      setRecords(loadedRecords);
      
      alert('Manuel kayıt başarıyla oluşturuldu');
    } catch (error) {
      console.error('Manuel kayıt oluşturma hatası:', error);
      alert('Manuel kayıt oluşturulurken bir hata oluştu: ' + error.message);
    } finally {
      setSavingManual(false);
    }
  };

  const openManualModal = () => {
    setManualRecord({
      transaction_no: generateTransactionCode(),
      account_name: '',
      description: '',
      amount: '',
      currency: '',
      payment_type: 'gelir',
      payment_method: 'cash'
    });
    setShowManualModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Mevcut para birimlerini al
  const getAvailableCurrencies = () => {
    const currencies = new Set();
    records.forEach(record => {
      if (record.amounts) {
        record.amounts.split(';').forEach(amount => {
          const [currency] = amount.split(':');
          currencies.add(currency);
        });
      }
    });
    return Array.from(currencies).sort();
  };

  // Filtrelenmiş kayıtları al
  const getFilteredRecords = () => {
    return records.filter(record => {
      // Para birimi filtresi
      if (filters.currency && record.amounts) {
        const recordCurrencies = record.amounts.split(';').map(amount => amount.split(':')[0]);
        if (!recordCurrencies.includes(filters.currency)) {
          return false;
        }
      }
      
      // Gelir/Gider filtresi
      if (filters.paymentType && record.payment_type !== filters.paymentType) {
        return false;
      }
      
      return true;
    });
  };

  const handleTransactionClick = (transactionNo, paymentType) => {
    if (paymentType === 'gelir') {
      localStorage.setItem('collectionTransactionFilter', transactionNo);
      navigate('/companyAgencyDashboard/operations/guide-operations');
    } else {
      navigate(`/companyAgencyDashboard/operations/tour-operations?transaction_no=${transactionNo}`);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  const filteredRecords = getFilteredRecords();
  const availableCurrencies = getAvailableCurrencies();

  return (
    <Container fluid className="mt-4">
      <Card>
        <Card.Body>
          <Row className="mb-4">
            <Col>
              <h4>Kasa Kayıtları</h4>
            </Col>
            <Col xs="auto">
              <Button 
                variant="success" 
                onClick={openManualModal}
                className="me-2"
              >
                <i className="fas fa-plus me-2"></i>
                Manuel Gelir/Gider Ekle
              </Button>
            </Col>
          </Row>

          {/* Toplam Gelir ve Gider Özeti - Sayfanın Üstünde */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="border-success h-100">
                <Card.Body className="text-center">
                  <h5 className="text-success mb-3">
                    <i className="fas fa-arrow-up me-2"></i>
                    Toplam Gelir
                  </h5>
                  {Object.keys(totals.gelir.cash).length > 0 || Object.keys(totals.gelir.card).length > 0 ? (
                    <>
                      {Object.keys(totals.gelir.cash).length > 0 && (
                        <>
                          <div className="mb-2">
                            <span className="fs-6 fw-bold text-success">Nakit Gelir:</span>
                          </div>
                          {Object.entries(totals.gelir.cash).map(([currency, amount]) => (
                            <div key={`cash-gelir-${currency}`} className="mb-1 ms-3">
                              <span className="fs-6 text-success">
                                {formatCurrency(amount)} {currency}
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                      {Object.keys(totals.gelir.card).length > 0 && (
                        <>
                          <div className="mb-2 mt-3">
                            <span className="fs-6 fw-bold text-success">Kart Gelir:</span>
                          </div>
                          {Object.entries(totals.gelir.card).map(([currency, amount]) => (
                            <div key={`card-gelir-${currency}`} className="mb-1 ms-3">
                              <span className="fs-6 text-success">
                                {formatCurrency(amount)} {currency}
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-muted fs-6">Gelir kaydı bulunamadı</div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-danger h-100">
                <Card.Body className="text-center">
                  <h5 className="text-danger mb-3">
                    <i className="fas fa-arrow-down me-2"></i>
                    Toplam Gider
                  </h5>
                  {Object.keys(totals.gider.cash).length > 0 || Object.keys(totals.gider.card).length > 0 ? (
                    <>
                      {Object.keys(totals.gider.cash).length > 0 && (
                        <>
                          <div className="mb-2">
                            <span className="fs-6 fw-bold text-danger">Nakit Gider:</span>
                          </div>
                          {Object.entries(totals.gider.cash).map(([currency, amount]) => (
                            <div key={`cash-gider-${currency}`} className="mb-1 ms-3">
                              <span className="fs-6 text-danger">
                                {formatCurrency(amount)} {currency}
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                      {Object.keys(totals.gider.card).length > 0 && (
                        <>
                          <div className="mb-2 mt-3">
                            <span className="fs-6 fw-bold text-danger">Kart Gider:</span>
                          </div>
                          {Object.entries(totals.gider.card).map(([currency, amount]) => (
                            <div key={`card-gider-${currency}`} className="mb-1 ms-3">
                              <span className="fs-6 text-danger">
                                {formatCurrency(amount)} {currency}
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-muted fs-6">Gider kaydı bulunamadı</div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-info h-100">
                <Card.Body className="text-center">
                  <h5 className="text-info mb-3">
                    <i className="fas fa-balance-scale me-2"></i>
                    Bakiye
                  </h5>
                  {(() => {
                    const allCurrencies = new Set([
                      ...Object.keys(totals.gelir.cash),
                      ...Object.keys(totals.gelir.card),
                      ...Object.keys(totals.gider.cash),
                      ...Object.keys(totals.gider.card)
                    ]);
                    
                    if (allCurrencies.size > 0) {
                      const balanceItems = [];
                      
                      // Nakit bakiyeleri
                      const cashCurrencies = new Set([
                        ...Object.keys(totals.gelir.cash),
                        ...Object.keys(totals.gider.cash)
                      ]);
                      
                      cashCurrencies.forEach(currency => {
                        const gelirCash = totals.gelir.cash[currency] || 0;
                        const giderCash = totals.gider.cash[currency] || 0;
                        const bakiyeCash = gelirCash - giderCash;
                        const isPositiveCash = bakiyeCash >= 0;
                        
                        balanceItems.push(
                          <div key={`cash-${currency}`} className="mb-2">
                            <span className={`fs-6 fw-bold ${isPositiveCash ? 'text-success' : 'text-danger'}`}>
                              {isPositiveCash ? '+' : ''}{formatCurrency(bakiyeCash)} {currency} (Nakit)
                            </span>
                          </div>
                        );
                      });
                      
                      // Kart bakiyeleri
                      const cardCurrencies = new Set([
                        ...Object.keys(totals.gelir.card),
                        ...Object.keys(totals.gider.card)
                      ]);
                      
                      cardCurrencies.forEach(currency => {
                        const gelirCard = totals.gelir.card[currency] || 0;
                        const giderCard = totals.gider.card[currency] || 0;
                        const bakiyeCard = gelirCard - giderCard;
                        const isPositiveCard = bakiyeCard >= 0;
                        
                        balanceItems.push(
                          <div key={`card-${currency}`} className="mb-2">
                            <span className={`fs-6 fw-bold ${isPositiveCard ? 'text-success' : 'text-danger'}`}>
                              {isPositiveCard ? '+' : ''}{formatCurrency(bakiyeCard)} {currency} (Kart)
                            </span>
                          </div>
                        );
                      });
                      
                      return balanceItems;
                    } else {
                      return <div className="text-muted fs-6">Bakiye hesaplanamadı</div>;
                    }
                  })()}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col>
              <h5>Filtreler</h5>
            </Col>
            <Col md={8}>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Başlangıç Tarihi</Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={filterDate.startDate}
                      onChange={handleDateFilter}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Bitiş Tarihi</Form.Label>
                    <Form.Control
                      type="date"
                      name="endDate"
                      value={filterDate.endDate}
                      onChange={handleDateFilter}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Para Birimi</Form.Label>
                    <Form.Select
                      name="currency"
                      value={filters.currency}
                      onChange={handleFilterChange}
                    >
                      <option value="">Tümü</option>
                      {availableCurrencies.map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Gelir/Gider</Form.Label>
                    <Form.Select
                      name="paymentType"
                      value={filters.paymentType}
                      onChange={handleFilterChange}
                    >
                      <option value="">Tümü</option>
                      <option value="gelir">Gelir</option>
                      <option value="gider">Gider</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Col>
          </Row>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <Table responsive striped hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>İşlem No</th>
                <th>Hesap Adı</th>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th>Tutar</th>
                <th>Para Birimi</th>
                <th>Gelir-Gider</th>
                <th>Ödeme Yöntemi</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>
                    <button 
                      className="btn btn-link p-0"
                      onClick={() => handleTransactionClick(record.transaction_no, record.payment_type)}
                    >
                      {record.transaction_no}
                    </button>
                  </td>
                  <td style={{textTransform: 'capitalize'}}>{record.account_name}</td>
                  <td>{formatDate(record.created_at)}</td>
                  <td>{record.description}</td>
                  <td>
                    {record.amounts ? record.amounts.split(';').map(amount => {
                      const [currency, value] = amount.split(':');
                      return (
                        <div key={currency}>
                          {Number(value).toFixed(2)}
                        </div>
                      );
                    }) : '-'}
                  </td>
                  <td>
                    {record.amounts ? record.amounts.split(';').map(amount => {
                      const [currency] = amount.split(':');
                      return (
                        <div key={currency}>
                          {currency}
                        </div>
                      );
                    }) : '-'}
                  </td>
                  <td style={{textTransform: 'capitalize'}}>{record.payment_type}</td>
                  <td>{record.payment_method === 'card' ? 'Kart' : record.payment_method === 'cash' ? 'Nakit' : '-'}</td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center">
                    Kayıt bulunamadı
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Manuel Kayıt Modal */}
      <Modal show={showManualModal} onHide={() => setShowManualModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Manuel Gelir/Gider Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleManualRecordSubmit}>
            <Form.Group>
              <Form.Label>İşlem No</Form.Label>
              <Form.Control
                type="text"
                name="transaction_no"
                value={manualRecord.transaction_no}
                onChange={handleManualRecordChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Hesap Adı</Form.Label>
              <Form.Control
                type="text"
                name="account_name"
                value={manualRecord.account_name}
                onChange={handleManualRecordChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={manualRecord.description}
                onChange={handleManualRecordChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Tutar</Form.Label>
              <Form.Control
                type="text"
                name="amount"
                value={manualRecord.amount}
                onChange={handleManualRecordChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Para Birimi</Form.Label>
              <Form.Select
                name="currency"
                value={manualRecord.currency}
                onChange={handleManualRecordChange}
                required
              >
                <option value="">Para Birimi Seçin</option>
                <option value="TL">TL</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Gelir/Gider</Form.Label>
              <Form.Select
                name="payment_type"
                value={manualRecord.payment_type}
                onChange={handleManualRecordChange}
              >
                <option value="gelir">Gelir</option>
                <option value="gider">Gider</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Ödeme Yöntemi</Form.Label>
              <Form.Select
                name="payment_method"
                value={manualRecord.payment_method}
                onChange={handleManualRecordChange}
              >
                <option value="cash">Nakit</option>
                <option value="card">Kart</option>
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit" disabled={savingManual}>
              {savingManual ? 'Kayıt Ediliyor...' : 'Kaydet'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
