import React from 'react';

export const NumberInput = ({ label, name, value, onChange, placeholder = "0", min, max, step, suffix, readOnly }) => {
  return (
    <div className="col-md-6">
      <label className="form-label">{label}</label>
      <div className="input-group">
        <input
          type="number"
          className="form-control"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
        />
        {suffix && <span className="input-group-text">{suffix}</span>}
      </div>
    </div>
  );
};

export const PaxInput = ({ label, name, value, onChange, readOnly }) => {
  return (
    <div className="col-md-4">
      <label className="form-label">{label}</label>
      <input
        readOnly = {readOnly}
        type="number"
        className="form-control"
        name={name}
        value={value}
        onChange={onChange}
        placeholder="0"
        min="0"
      />
    </div>
  );
}; 