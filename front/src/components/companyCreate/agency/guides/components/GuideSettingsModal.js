import React, { useState, useEffect } from 'react';
import { NumberInput, PaxInput } from '../../companies/SettingFormComponents';

const GuideSettingsModal = ({ show, onHide, guide, onSave }) => {
  const [settings, setSettings] = useState({
    earnings: guide.earnings || '',
    promotionRate: guide.promotionRate || '',
    revenue: guide.revenue || '',
    entitlement: guide.entitlement || '',
    pax: {
      adult: guide.pax?.adult || '',
      child: guide.pax?.child || '',
      free: guide.pax?.free || ''
    }
  });

  useEffect(() => {
    if (show) {
      setSettings({
        earnings: guide.earnings || '',
        promotionRate: guide.promotionRate || '',
        revenue: guide.revenue || '',
        entitlement: guide.entitlement || '',
        pax: {
          adult: guide.pax?.adult || '',
          child: guide.pax?.child || '',
          free: guide.pax?.free || ''
        }
      });
    }
  }, [show, guide]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('pax.')) {
      const paxField = name.split('.')[1];
      setSettings(prev => ({
        ...prev,
        pax: {
          ...prev.pax,
          [paxField]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedSettings = {
      earnings: parseFloat(settings.earnings) || 0,
      promotionRate: parseFloat(settings.promotionRate) || 0,
      revenue: parseFloat(settings.revenue) || 0,
      entitlement: parseFloat(settings.entitlement) || 0,
      pax: {
        adult: parseInt(settings.pax.adult) || 0,
        child: parseInt(settings.pax.child) || 0,
        free: parseInt(settings.pax.free) || 0
      }
    };
    
    console.log('Kaydedilen ayarlar:', formattedSettings);
    onSave(formattedSettings);
    onHide();
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show" style={{ display: 'block' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-gear-fill me-2"></i>
                {guide.name} {guide.surname} - Rehber Ayarları
              </h5>
              <button type="button" className="btn-close" onClick={onHide}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row mb-3">
                  <NumberInput
                    label="Rehber Ciro €"
                    name="revenue"
                    value={settings.revenue}
                    onChange={handleChange}
                    placeholder="0.00 €"
                    step="0.01"
                  />
                  <NumberInput
                    label="Rehber Hak Edişi Oranı"
                    name="promotionRate"
                    value={settings.promotionRate}
                    onChange={handleChange}
                    placeholder="0 %"
                    min="0"
                    max="100"
                    suffix="%"
                  />
                </div>

                <div className="row mb-3">
                  <NumberInput
                    label="Rehber Hak Edişi"
                    name="earnings"
                    value={settings.earnings}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                  />
                  <div className="col-md-6">
                    <label className="form-label">Para Birimi</label>
                    <select 
                      className="form-select w-100"
                      name="currency"
                      value={settings.currency}
                      onChange={handleChange}
                    >
                      <option selected value="EUR">€ (EUR)</option>
                      <option value="USD">$ (USD)</option>
                      <option value="TRY">₺ (TRY)</option>
                    </select>
                  </div>
                </div>

                <div className="row mb-3">
                  <NumberInput
                    label="Hak Ediş Oranı"
                    name="entitlement"
                    value={settings.entitlement}
                    onChange={handleChange}
                    placeholder="0 %"
                    min="0"
                    max="100"
                    suffix="%"
                  />
                </div>

                <div className="row">
                  <PaxInput
                    label="Pax Yetişkin"
                    name="pax.adult"
                    value={settings.pax.adult}
                    onChange={handleChange}
                  />
                  <PaxInput
                    label="Pax Çocuk"
                    name="pax.child"
                    value={settings.pax.child}
                    onChange={handleChange}
                  />
                  <PaxInput
                    label="Free"
                    name="pax.free"
                    value={settings.pax.free}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onHide}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-save me-2"></i>
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default GuideSettingsModal; 