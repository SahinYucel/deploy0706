import React from 'react';

const BolgeCell = ({ bolgeIds, bolgeler }) => {
  const getBolgeNames = (bolgeIds) => {
    if (!Array.isArray(bolgeIds) || !Array.isArray(bolgeler)) return '-';
    return bolgeIds
      .map(id => bolgeler.find(bolge => bolge.id === id)?.name)
      .filter(name => name)
      .join(', ');
  };

  return (
    <div className="d-flex flex-wrap gap-1">
      {getBolgeNames(bolgeIds).split(', ').map((bolge, i) => (
        <span key={i} className="badge bg-secondary">
          {bolge}
        </span>
      ))}
    </div>
  );
};

export default BolgeCell; 