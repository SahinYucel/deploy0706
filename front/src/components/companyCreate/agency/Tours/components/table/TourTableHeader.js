import React from 'react';

const TourTableHeader = () => {
  return (
    <thead>
      <tr>
        <th style={{ width: '40px' }}></th>
        <th style={{ width: '80px' }}>Durum</th>
        <th style={{ width: '120px' }}>Öncelik</th>
        <th>Tur Adı</th>
        <th>Operatör</th>
        <th>Bölgeler</th>
        <th style={{ width: '120px' }}>İşlemler</th>
      </tr>
    </thead>
  );
};

export default TourTableHeader; 