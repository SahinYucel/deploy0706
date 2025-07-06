import React from 'react';

const TimeInput = ({ id, value, onChange }) => {
  return (
    <div className="d-flex gap-2 flex-grow-1">
      <div className="input-group">
        <span className="input-group-text">Saat</span>
        <input
          type="number"
          className="form-control"
          name={`${id}.hour`}
          value={value.hour}
          onChange={onChange}
          min="0"
          max="23"
          placeholder="00"
        />
      </div>
      <div className="input-group">
        <span className="input-group-text">Dakika</span>
        <input
          type="number"
          className="form-control"
          name={`${id}.minute`}
          value={value.minute}
          onChange={onChange}
          min="0"
          max="59"
          placeholder="00"
        />
      </div>
    </div>
  );
};

export default TimeInput; 