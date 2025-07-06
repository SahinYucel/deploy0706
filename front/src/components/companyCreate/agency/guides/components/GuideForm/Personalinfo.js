import React from 'react';

const PersonalInfo = ({ formData, onChange }) => {
  return (
    <>
      <div className="col-md-6">
        <div className="form-group">
          <label className="form-label">Ad</label>
          <input
            type="text"
            className="form-control"
            name="name"
            value={formData.name}
            onChange={onChange}
            required
          />
        </div>
      </div>
      
      <div className="col-md-6">
        <div className="form-group">
          <label className="form-label">Soyad</label>
          <input
            type="text"
            className="form-control"
            name="surname"
            value={formData.surname}
            onChange={onChange}
            required
          />
        </div>
      </div>

      <div className="col-md-6">
        <div className="form-group">
          <label className="form-label">Nickname</label>
          <input
            type="text"
            className="form-control"
            name="nickname"
            value={formData.nickname}
            onChange={onChange}
            required
          />
        </div>
      </div>

      <div className="col-md-6">
        <div className="form-group">
          <label className="form-label">Telefon</label>
          <input
            type="tel"
            className="form-control"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            placeholder="05XX XXX XX XX"
            required
          />
        </div>
      </div>

      <div className="col-md-12">
        <div className="form-group">
          <label className="form-label">Şifre</label>
          <input
            type="text"
            className="form-control"
            name="guide_password"
            value={formData.guide_password}
            onChange={onChange}
            pattern="[0-9]{6}"
            maxLength="12"
            placeholder="6 haneli şifre giriniz"
            required
          />
        </div>
      </div>

      <div className="col-md-12">
        <div className="form-group">
          <label className="form-label">Rehber Grubu</label>
          <input
            type="text"
            className="form-control"
            name="guideGroup"
            value={formData.guideGroup}
            onChange={onChange}
            placeholder="Rehber Grubu"
          />
        </div>
      </div>

      <div className="col-md-12">
        <div className="form-group">
          <label className="form-label">Hak Ediş Oranı (%)</label>
          <input
            type="number"
            className="form-control"
            name="entitlement"
            value={formData.entitlement}
            onChange={onChange}
            placeholder="0"
            step="0.01"
            min="0"
            max="100"
          />
        </div>
      </div>

    </>
  );
};

export default PersonalInfo; 