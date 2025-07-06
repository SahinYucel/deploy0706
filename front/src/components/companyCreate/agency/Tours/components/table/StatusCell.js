import React from 'react';

const StatusCell = ({ isActive, onChange, index }) => {
  return (
    <div className="form-check form-switch">
      
      <input
        className="form-check-input"
        type="checkbox"
        checked={isActive}
        onChange={onChange}
        id={`status-${index}`}
      />
      <label className="form-check-label" htmlFor={`status-${index}`}>
        {isActive ? 'Aktif' : 'Pasif'}
      </label>
    </div>
  );
};

export default StatusCell; 