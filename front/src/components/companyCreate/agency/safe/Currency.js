import React, { useState, useEffect } from 'react';
import { getCurrencyRates, saveCurrencyRates, getSavedCurrencyRates } from '../../../../services/api';

const Currency = () => {
  const [currencies, setCurrencies] = useState([
    { id: 1, code: 'EUR', name: 'Euro', symbol: '€', rate: 0, isBase: false },
    { id: 2, code: 'USD', name: 'US Dollar', symbol: '$', rate: 0, isBase: false },
    { id: 3, code: 'GBP', name: 'British Pound', symbol: '£', rate: 0, isBase: false },
    { id: 4, code: 'TRY', name: 'Turkish Lira', symbol: '₺', rate: 1, isBase: true }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedRates, setEditedRates] = useState({});

  const fetchExchangeRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCurrencyRates();
      
      if (response.data.success && response.data.data) {
        const rates = response.data.data;
        
        const updatedCurrencies = currencies.map(currency => {
          const rate = rates[currency.code];
          if (!rate) return currency;

          return {
            ...currency,
            rate: parseFloat(rate.buying) || 0,
            name: rate.name
          };
        });

        setCurrencies(updatedCurrencies);
        setLastUpdate(response.data.lastUpdateTime);
      } else {
        throw new Error(response.data.message || 'Kur verileri alınamadı');
      }
    } catch (err) {
      console.error('Kurlar çekilirken hata:', err);
      let errorMessage = 'Kurlar güncellenirken bir hata oluştu';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // CompanyId'yi localStorage'dan al
    const agencyUser = JSON.parse(localStorage.getItem('agencyUser'));
    if (agencyUser?.companyId) {
      setCompanyId(agencyUser.companyId);
      // Sadece kaydedilmiş kurları getir
      loadSavedRates(agencyUser.companyId);
    }

    // Otomatik güncelleme kaldırıldı çünkü sadece manuel güncellemek istiyoruz
  }, []);

  const loadSavedRates = async (companyId) => {
    setLoading(true); // Loading durumunu ekleyelim
    try {
      const response = await getSavedCurrencyRates(companyId);
      if (response.data.success && response.data.data.length > 0) {
        const savedRates = response.data.data.map(rate => ({
          id: rate.id,
          code: rate.currency_code,
          name: rate.currency_name,
          symbol: rate.symbol,
          rate: parseFloat(rate.buying_rate) || 0,
          isBase: rate.currency_code === 'TRY'
        }));
        setCurrencies(savedRates);
      } else {
        // Eğer veritabanında kayıtlı kur yoksa varsayılan kurları göster
        setCurrencies([
          { id: 1, code: 'EUR', name: 'Euro', symbol: '€', rate: 0, isBase: false },
          { id: 2, code: 'USD', name: 'US Dollar', symbol: '$', rate: 0, isBase: false },
          { id: 3, code: 'GBP', name: 'British Pound', symbol: '£', rate: 0, isBase: false },
          { id: 4, code: 'TRY', name: 'Turkish Lira', symbol: '₺', rate: 1, isBase: true }
        ]);
      }
      setLastUpdate(response.data.lastUpdateTime);
    } catch (error) {
      console.error('Kaydedilmiş kurlar yüklenirken hata:', error);
      setError('Kaydedilmiş kurlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Düzenleme modundan çıkarken değişiklikleri iptal et
      setEditedRates({});
    }
    setEditMode(!editMode);
  };

  const handleRateChange = (currencyCode, value) => {
    setEditedRates(prev => ({
      ...prev,
      [currencyCode]: value
    }));
  };

  const handleSaveEdits = async () => {
    const updatedCurrencies = currencies.map(currency => ({
      ...currency,
      rate: editedRates[currency.code] !== undefined ? 
        parseFloat(editedRates[currency.code]) : 
        currency.rate
    }));

    setSaving(true);
    try {
      await saveCurrencyRates(companyId, updatedCurrencies);
      setCurrencies(updatedCurrencies);
      setEditMode(false);
      setEditedRates({});
      alert('Kurlar başarıyla güncellendi');
    } catch (err) {
      setError('Kurlar kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-currency-exchange me-2"></i>
            Kur Ayarları
          </h5>
          <div className="d-flex align-items-center gap-3">
            {lastUpdate && (
              <small className="text-muted">
                <i className="bi bi-clock-history me-1"></i>
                Son Güncelleme: {new Date(lastUpdate).toLocaleString('tr-TR')}
              </small>
            )}
            <button 
              className={`btn btn-sm ${editMode ? 'btn-warning' : 'btn-info'} me-2`}
              onClick={handleEditToggle}
              disabled={loading || saving}
            >
              <i className={`bi bi-${editMode ? 'x-circle' : 'pencil'} me-2`}></i>
              {editMode ? 'Düzenlemeyi İptal Et' : 'Kurları Düzenle'}
            </button>
            {editMode && (
              <button 
                className="btn btn-sm btn-success me-2"
                onClick={handleSaveEdits}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
            )}
            <button 
              className="btn btn-sm btn-primary" 
              onClick={fetchExchangeRates}
              disabled={loading || saving || editMode}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Merkez Bankası Kurlarını Al
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Para Birimi</th>
                <th>Kod</th>
                <th>Sembol</th>
                <th>Alış Kuru</th>
              </tr>
            </thead>
            <tbody>
              {currencies.map(currency => (
                <tr key={currency.id}>
                  <td>{currency.name}</td>
                  <td>{currency.code}</td>
                  <td>{currency.symbol}</td>
                  <td>
                    {editMode && !currency.isBase ? (
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={editedRates[currency.code] !== undefined ? 
                          editedRates[currency.code] : 
                          currency.rate}
                        onChange={(e) => handleRateChange(currency.code, e.target.value)}
                        step="0.0001"
                        min="0"
                      />
                    ) : (
                      (parseFloat(currency.rate) || 0).toFixed(4)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Currency; 