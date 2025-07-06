import React from 'react'
import { formatPhoneNumber } from './companyUtils'

const CompanyForm = ({ formData, onInputChange, onSubmit }) => {
  return (
    <div className="row g-3 mb-4">
      <div className="col-md-2">
        <div className="form-group">
          <label htmlFor="companyName" className="form-label">Şirket İsmi</label>
          <input 
            type="text"
            className="form-control"
            id="companyName"
            placeholder="Şirket ismini giriniz"
            value={formData.companyName}
            onChange={onInputChange}
          />
        </div>
      </div>

      <div className="col-md-2">
        <div className="form-group">
          <label htmlFor="phoneNumber" className="form-label">Telefon</label>
          <div className="input-group">
            <span className="input-group-text">+90</span>
            <input 
              type="tel"
              className="form-control"
              id="phoneNumber"
              placeholder="5XX XXX XXXX"
              value={formData.phoneNumber}
              onChange={onInputChange}
              maxLength="12"
            />
          </div>
        </div>
      </div>

      <div className="col-md-2">
        <div className="form-group">
          <label htmlFor="password" className="form-label">Şifre (Opsiyonel)</label>
          <input 
            type="text"
            className="form-control"
            id="password"
            placeholder="Opsiyonel"
            value={formData.password || ''}
            onChange={onInputChange}
          />
        </div>
      </div>

      <div className="col-md-2">
        <div className="form-group">
          <label htmlFor="operatorType" className="form-label">Operatör Tipi</label>
          <select
            className="form-select"
            id="operatorType"
            value={formData.operatorType}
            onChange={onInputChange}
          >
            <option value="Tour">Tour</option>
            <option value="Shop">Shop</option>
            <option value="Restaurant">Restaurant</option>
          </select>
        </div>
      </div>

      <div className="col-md-2">
        <div className="form-group">
          <label className="form-label">Giriş Saati</label>
          <div className="d-flex gap-2">
            <div style={{ width: '70px' }}>
              <select
                className="form-select"
                id="entryHour"
                value={formData.entryTime.split(':')[0]}
                onChange={(e) => {
                  const minutes = formData.entryTime.split(':')[1];
                  onInputChange({
                    target: {
                      id: 'entryTime',
                      value: `${e.target.value}:${minutes}`
                    }
                  });
                }}
              >
                {[...Array(24)].map((_, i) => (
                  <option key={i} value={i.toString().padStart(2, '0')}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ width: '70px' }}>
              <select
                className="form-select"
                id="entryMinute"
                value={formData.entryTime.split(':')[1]}
                onChange={(e) => {
                  const hours = formData.entryTime.split(':')[0];
                  onInputChange({
                    target: {
                      id: 'entryTime',
                      value: `${hours}:${e.target.value}`
                    }
                  });
                }}
              >
                {[...Array(60)].map((_, i) => (
                  <option key={i} value={i.toString().padStart(2, '0')}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-2">
        <div className="form-group">
          <label className="form-label">Değiştirme Saati</label>
          <div className="d-flex gap-2">
            <div style={{ width: '70px' }}>
              <select
                className="form-select"
                id="exitHour"
                value={formData.exitTime?.split(':')[0] || '20'}
                onChange={(e) => {
                  const minutes = formData.exitTime?.split(':')[1] || '00';
                  onInputChange({
                    target: {
                      id: 'exitTime',
                      value: `${e.target.value}:${minutes}`
                    }
                  });
                }}
              >
                {[...Array(24)].map((_, i) => (
                  <option key={i} value={i.toString().padStart(2, '0')}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ width: '70px' }}>
              <select
                className="form-select"
                id="exitMinute"
                value={formData.exitTime?.split(':')[1] || '00'}
                onChange={(e) => {
                  const hours = formData.exitTime?.split(':')[0] || '20';
                  onInputChange({
                    target: {
                      id: 'exitTime',
                      value: `${hours}:${e.target.value}`
                    }
                  });
                }}
              >
                {[...Array(60)].map((_, i) => (
                  <option key={i} value={i.toString().padStart(2, '0')}>
                    {i.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-2">
        <div className="form-group">
          <label className="form-label">&nbsp;</label>
          <button 
            className="btn btn-primary w-100" 
            onClick={onSubmit}
          >
            Şirket Ekle
          </button>
        </div>
      </div>
    </div>
  )
}

export default CompanyForm 