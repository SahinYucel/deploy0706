import React from 'react';

const DaysCell = ({ selectedDays }) => {
  const dayMap = {
    monday: 'Pzt',
    tuesday: 'Sal',
    wednesday: 'Çar',
    thursday: 'Per',
    friday: 'Cum',
    saturday: 'Cmt',
    sunday: 'Paz'
  };

  const formatDays = (days) => {
    return days.map(day => dayMap[day]).join(', ');
  };

  return (
    <div className="badge bg-light text-dark">
      {formatDays(selectedDays)}
    </div>
  );
};

export default DaysCell; 