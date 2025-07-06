import React from 'react';

const RegionSelector = ({ formData, bolgeler, onChange, onSwitchChange }) => {
  return (
    <>
      <div className="col-12">
        <div className="form-group">
          <label className="form-label">Çalışacağı Bölgeler</label>
          <select
            className="form-select"
            name="region"
            value={formData.region}
            onChange={onChange}
            required
            multiple
            size="8"
            style={{ minHeight: '200px' }}
          >
            {bolgeler.map((bolge) => (
              <option key={bolge.id} value={bolge.name}>
                {bolge.name}
              </option>
            ))}
          </select>
          <small className="text-muted mt-1 d-block">
            <i className="bi bi-info-circle me-1"></i>
            Birden fazla seçim için CTRL tuşuna basılı tutarak seçim yapınız
          </small>
        </div>
      </div>

      <div className="col-md-6">
        <div className="form-group">
          <label className="form-label">Rehber Kodu</label>
          <input
            type="text"
            className="form-control bg-light"
            value={formData.code}
            readOnly
          />
        </div>
      </div>

      <div className="col-md-6">
        <div className="form-group">
          <label className="form-label d-block">Durum</label>
          <div className="form-check form-switch mt-2">
            <input
              className="form-check-input"
              type="checkbox"
              checked={formData.isActive}
              onChange={onSwitchChange}
              name="isActive"
            />
            <label className="form-check-label">
              {formData.isActive ? 'Aktif' : 'Pasif'}
            </label>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegionSelector; 