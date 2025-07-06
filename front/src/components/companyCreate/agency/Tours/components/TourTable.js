import React, { useState, useEffect } from 'react';
import TourTableRow from './table/TourTableRow';
import TourTableExpandedRow from './table/TourTableExpandedRow';

const TourTable = ({ 
  tours, 
  onEdit, 
  onDelete, 
  onCopy, 
  onStatusChange,
  onPickupTimeStatusChange,
  onDayStatusChange,
  onSaveToDatabase,
  onDateChange,
  onTourNameClick,
  searchQuery
}) => {
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    setExpandedRows({});
  }, [searchQuery]);

  const toggleRow = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (!tours.length) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        Henüz tur oluşturulmamış.
      </div>
    );
  }

  return (
    <div>
      <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <table className="table">
          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
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
          <tbody>
            {tours.map((tour, index) => (
              <React.Fragment key={index}>
                <TourTableRow 
                  tour={tour}
                  index={index}
                  isExpanded={expandedRows[index]}
                  onToggle={toggleRow}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onCopy={onCopy}
                  onStatusChange={onStatusChange}
                  onDateChange={onDateChange}
                  onTourNameClick={onTourNameClick}
                />
                {expandedRows[index] && (
                  <TourTableExpandedRow 
                    tour={tour}
                    tourIndex={index}
                  />
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <button 
        className='btn btn-primary btn-block w-100 mt-3'
        onClick={onSaveToDatabase}
        disabled={!tours.length}
      >
        <i className='bi bi-cloud-upload me-2'></i>
        Veritabanına Kaydet
      </button>
    </div>
  );
};

export default TourTable; 