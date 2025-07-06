import React from 'react';

const FormInput = ({ label, icon, type = 'text', id, value, onChange, placeholder, options }) => {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        <i className={`bi ${icon} me-2`}></i>{label}
      </label>
      {type === 'select' ? (
        <select
          className="form-select"
          id={id}
          name={id}
          value={value}
          onChange={onChange}
        >
          <option value="">{placeholder}</option>
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          className="form-control"
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

export default FormInput; 