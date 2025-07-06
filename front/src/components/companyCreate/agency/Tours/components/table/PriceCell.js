import React from 'react';

const PriceCell = ({ adultPrice, childPrice }) => {
  const formatPrice = (price) => {
    return price ? `${price} €` : '-';
  };

  return (
    <div className="d-flex flex-column">
      <small className="text-muted">Adult:</small>
      <div>{formatPrice(adultPrice)}</div>
      <small className="text-muted mt-1">Child:</small>
      <div>{formatPrice(childPrice)}</div>
    </div>
  );
};

export default PriceCell; 