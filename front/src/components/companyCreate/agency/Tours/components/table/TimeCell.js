import React from 'react';

const TIME_PERIOD_LABELS = {
  '1': '1. PERIYOT',
  '2': '2. PERIYOT',
  '3': '3. PERIYOT',
  '4': '4. PERIYOT',
  '5': '5. PERIYOT',
  '6': '6. PERIYOT',
  '7': '7. PERIYOT',
  '8': '8. PERIYOT',
  '9': '9. PERIYOT',
  '10': '10. PERIYOT'
};

const TimeCell = ({ times }) => {
  const formatTime = (time) => {
    if (!time || !time.hour || !time.minute) return '';
    const hour = time.hour.toString().padStart(2, '0');
    const minute = time.minute.toString().padStart(2, '0');
    return `${hour}:${minute}`;
  };

  const getPeriyotColor = (period) => {
    const periodNum = parseInt(period);
    if (periodNum <= 3) return 'bg-warning';
    if (periodNum <= 6) return 'bg-info';
    return 'bg-secondary';
  };

  // Convert single time to array if needed and filter out empty times
  const timeArray = Array.isArray(times) ? times : (times ? [times] : []);
  const validTimes = timeArray.filter(time => time && (time.hour || time.minute));

  return (
    <div className="d-flex flex-column gap-1">
      {validTimes.map((time, i) => (
        <div key={i} className={`badge ${time.isActive === false ? 'bg-light text-muted' : 'bg-light text-dark'}`} style={{ opacity: time.isActive === false ? 0.6 : 1 }}>
          <span className={`me-1 badge ${getPeriyotColor(time.period || '1')}`}>
            {TIME_PERIOD_LABELS[time.period || '1']}
          </span>
          {formatTime(time)} 
          {time.region && time.area && (
            <span className="ms-1 text-muted">
              ({time.region} - {time.area})
            </span>
          )}
          <span className={`ms-1 badge ${time.isActive === false ? 'bg-danger' : 'bg-success'}`}>
            {time.isActive === false ? 'Pasif' : 'Aktif'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default TimeCell; 