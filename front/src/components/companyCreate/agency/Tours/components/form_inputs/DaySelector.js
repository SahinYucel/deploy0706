import React from 'react';

const DAYS = [
  { id: 1, label: 'Pazartesi', shortLabel: 'Pzt' },
  { id: 2, label: 'Salı', shortLabel: 'Sal' },
  { id: 3, label: 'Çarşamba', shortLabel: 'Çar' },
  { id: 4, label: 'Perşembe', shortLabel: 'Per' },
  { id: 5, label: 'Cuma', shortLabel: 'Cum' },
  { id: 6, label: 'Cumartesi', shortLabel: 'Cmt' },
  { id: 7, label: 'Pazar', shortLabel: 'Paz' }
];

const DaySelector = ({ selectedDays, onDaySelect, onSelectAll }) => {

  
  const handleDayClick = (dayId) => {
    const isMobile = window.innerWidth < 768;
    if (isMobile && selectedDays.includes(dayId)) {
      onDaySelect(dayId, true);
    } else {
      onDaySelect(dayId);
    }
  };

  return (
    <div className="mb-4">
      <label className="form-label d-block mb-3 text-center">
        <i className="bi bi-calendar-week me-2"></i>Günler
      </label>
      <div className="row g-2 mb-3 justify-content-center">
        {DAYS.map(day => (
          <div key={day.id} className="col-auto">
            <button
              type="button"
              className={`btn btn-sm day-button ${
                selectedDays.includes(day.id) 
                  ? 'btn-primary active' 
                  : 'btn-outline-primary'
              }`}
              onClick={() => handleDayClick(day.id)}
              style={{
                borderRadius: '20px',
                minWidth: '90px',
                padding: '8px 16px',
                transition: 'all 0.2s ease',
                fontWeight: selectedDays.includes(day.id) ? '600' : '400',
                border: selectedDays.includes(day.id) ? 'none' : '1px solid #0d6efd',
                margin: '0 4px'
              }}
            >
              <span className="d-none d-md-inline">{day.label}</span>
              <span className="d-md-none">{day.shortLabel}</span>
            </button>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button
          type="button"
          className={`btn btn-sm ${
            selectedDays.length === DAYS.length 
              ? 'btn-primary' 
              : 'btn-outline-primary'
          }`}
          onClick={onSelectAll}
          style={{
            borderRadius: '20px',
            padding: '8px 24px',
            transition: 'all 0.2s ease',
            fontWeight: selectedDays.length === DAYS.length ? '600' : '400',
            minWidth: '140px'
          }}
        >
          <i className="bi bi-calendar-check me-1"></i>
          Tüm Günler
        </button>
      </div>
      {selectedDays.length === 0 && (
        <div className="text-muted small mt-2 text-center">
          <i className="bi bi-info-circle me-1"></i>
          Lütfen en az bir gün seçiniz
        </div>
      )}

      <style jsx="true">{`
        .day-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .day-button.active {
          box-shadow: 0 2px 4px rgba(13, 110, 253, 0.2);
        }
        
        .day-button:active {
          transform: translateY(0);
          box-shadow: none;
        }

        @media (max-width: 767px) {
          .day-button {
            padding: 8px 0 !important;
            width: 48px !important;
            height: 48px !important;
            min-width: unset !important;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50% !important;
            margin: 0 2px !important;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

export { DAYS };
export default DaySelector; 