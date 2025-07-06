import React from 'react';

const OptionInput = ({ label, icon, options, onChange, onAdd, onRemove }) => {
  return (
    <div className="mb-3">
      <label className="form-label">
        <i className={`bi ${icon} me-2`}></i>{label}
      </label>
      {options.map((option, index) => (
        <div key={index} className="input-group mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Opsiyon adı"
            value={option.name}
            onChange={(e) => onChange(index, 'name', e.target.value)}
          />
          <input
            type="number"
            className="form-control"
            placeholder="Fiyat"
            value={option.price}
            onChange={(e) => onChange(index, 'price', e.target.value)}
          />
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => onRemove(index)}
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-outline-primary btn-sm mt-2"
        onClick={onAdd}
      >
        <i className="bi bi-plus-lg me-2"></i>Yeni Opsiyon Ekle
      </button>
    </div>
  );
};

export default OptionInput; 