import React from 'react';

const PriceInputs = ({ value, onChange }) => {
  return (
    <div className="mb-3">
      <div className="row g-3">
        {/* Normal Fiyatlar */}
        <div className="col-12">
          <label className="form-label">
            <i className="bi bi-currency-dollar me-2"></i>
            Fiyatlar
          </label>
          <div className="row g-2">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Yetişkin Fiyatı"
                  name="adultPrice"
                  value={value.adultPrice || ''}
                  onChange={onChange}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-person-heart"></i>
                </span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Çocuk Fiyatı"
                  name="childPrice"
                  value={value.childPrice || ''}
                  onChange={onChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rehber Fiyatları */}
        <div className="col-12">
          <label className="form-label">
            <i className="bi bi-person-vcard me-2"></i>
            Rehber Fiyatları
          </label>
          <div className="row g-2">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-person-vcard"></i>
                </span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Rehber Yetişkin Fiyatı"
                  name="guideAdultPrice"
                  value={value.guideAdultPrice || ''}
                  onChange={onChange}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-person-vcard-fill"></i>
                </span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Rehber Çocuk Fiyatı"
                  name="guideChildPrice"
                  value={value.guideChildPrice || ''}
                  onChange={onChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceInputs; 