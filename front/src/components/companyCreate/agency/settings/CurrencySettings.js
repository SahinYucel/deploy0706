import React, { useState, useEffect } from 'react';

const CurrencySettings = () => {
  const [currencies, setCurrencies] = useState([
    { id: 1, code: 'EUR', name: 'Euro', symbol: '€', rate: 1.00, isBase: true },
    { id: 2, code: 'USD', name: 'Dolar', symbol: '$', rate: 1.08, isBase: false },
    { id: 3, code: 'GBP', name: 'İngiliz Sterlini', symbol: '£', rate: 0.86, isBase: false },
    { id: 4, code: 'TRY', name: 'Türk Lirası', symbol: '₺', rate: 32.50, isBase: false }
  ]);

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    rate: '',
    isBase: false
  });

  useEffect(() => {
    // Burada API'den kurları çekebilirsiniz
    // Örnek: fetchCurrencies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = (currency) => {
    setEditingId(currency.id);
    setFormData(currency);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.isBase) {
      // Eğer yeni para birimi base olarak ayarlanıyorsa, diğerlerinin base'ini kaldır
      setCurrencies(prev => prev.map(c => ({ ...c, isBase: false })));
    }

    if (editingId) {
      // Güncelleme
      setCurrencies(prev => prev.map(currency => 
        currency.id === editingId ? { ...formData, id: editingId } : currency
      ));
    } else {
      // Yeni ekleme
      setCurrencies(prev => [...prev, { ...formData, id: Date.now() }]);
    }

    // Formu sıfırla
    setFormData({
      code: '',
      name: '',
      symbol: '',
      rate: '',
      isBase: false
    });
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bu para birimini silmek istediğinizden emin misiniz?')) {
      setCurrencies(prev => prev.filter(currency => currency.id !== id));
    }
  };

  return (
    <div className="container mt-4">
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-currency-exchange me-2"></i>
            Para Birimi Ayarları
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-2">
                <div className="form-group">
                  <label className="form-label">Para Birimi Kodu</label>
                  <input
                    type="text"
                    className="form-control"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="EUR"
                    required
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label className="form-label">Para Birimi Adı</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Euro"
                    required
                  />
                </div>
              </div>
              <div className="col-md-2">
                <div className="form-group">
                  <label className="form-label">Sembol</label>
                  <input
                    type="text"
                    className="form-control"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="€"
                    required
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="form-group">
                  <label className="form-label">Kur Değeri</label>
                  <input
                    type="number"
                    className="form-control"
                    name="rate"
                    value={formData.rate}
                    onChange={handleInputChange}
                    placeholder="1.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name="isBase"
                    checked={formData.isBase}
                    onChange={handleInputChange}
                    id="isBaseCurrency"
                  />
                  <label className="form-check-label" htmlFor="isBaseCurrency">
                    Ana Para Birimi
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <button type="submit" className={`btn ${editingId ? 'btn-success' : 'btn-primary'}`}>
                {editingId ? 'Güncelle' : 'Ekle'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary ms-2"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      code: '',
                      name: '',
                      symbol: '',
                      rate: '',
                      isBase: false
                    });
                  }}
                >
                  İptal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Kod</th>
                  <th>İsim</th>
                  <th>Sembol</th>
                  <th>Kur Değeri</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map(currency => (
                  <tr key={currency.id}>
                    <td>{currency.code}</td>
                    <td>{currency.name}</td>
                    <td>{currency.symbol}</td>
                    <td>{currency.rate.toFixed(2)}</td>
                    <td>
                      {currency.isBase ? (
                        <span className="badge bg-success">Ana Para Birimi</span>
                      ) : (
                        <span className="badge bg-secondary">İkincil</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => handleEdit(currency)}
                      >
                        Düzenle
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(currency.id)}
                        disabled={currency.isBase}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencySettings; 