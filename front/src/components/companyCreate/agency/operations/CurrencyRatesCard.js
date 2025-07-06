import React, { useState } from 'react';
import { guideOperations } from '../../../../services/api2';

const CurrencyRatesCard = ({ currencyRates, onRatesUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRates, setEditedRates] = useState({});
  const [loading, setLoading] = useState(false);

  if (!currencyRates) {
    return (
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Döviz Kurları</h5>
          <p className="text-muted">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const handleEditClick = () => {
    setEditedRates(currencyRates);
    setIsEditing(true);
  };

  const handleRateChange = (currency, value) => {
    setEditedRates(prev => ({
      ...prev,
      [currency]: parseFloat(value) || 0
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await guideOperations.updateCurrencyRates(editedRates);
      if (response.rates) {
        if (onRatesUpdate) {
          onRatesUpdate(response.rates);
        }
        setIsEditing(false);
        window.location.reload();
      }
    } catch (error) {
      alert('Kurlar güncellenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">Döviz Kurları</h5>
          {!isEditing ? (
            <button 
              className="btn btn-sm btn-primary" 
              onClick={handleEditClick}
            >
              Düzenle
            </button>
          ) : (
            <div>
              <button 
                className="btn btn-sm btn-success me-2" 
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button 
                className="btn btn-sm btn-secondary" 
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                İptal
              </button>
            </div>
          )}
        </div>

        <div className="list-group">
          {Object.entries(currencyRates).map(([currency, rate]) => (
            <div key={currency} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <strong>{currency}</strong>
                {isEditing ? (
                  <input
                    type="number"
                    className="form-control form-control-sm w-50"
                    value={editedRates[currency]}
                    onChange={(e) => handleRateChange(currency, e.target.value)}
                    step="0.0001"
                    min="0"
                  />
                ) : (
                  <span>{rate}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CurrencyRatesCard; 