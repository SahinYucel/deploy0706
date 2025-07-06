import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import StatusCell from './StatusCell';
import ActionButtons from './ActionButtons';

const DateModal = ({ 
  show, 
  onClose, 
  tour, 
  onDateChange, 
  formatDate 
}) => {
  if (!show) return null;

  // Herhangi bir pickup time'da stop var mı kontrol et
  const hasPickupTimeStops = tour.relatedData?.pickupTimes?.some(time => 
    time.stopSelling || time.start_pickup_date || time.end_pickup_date
  );

  return ReactDOM.createPortal(
    <>
      <div className="modal fade show" 
           style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Tur Durdurma Tarihleri</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {hasPickupTimeStops ? (
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Bu turda kalkış zamanları için aktif stop işlemleri bulunmaktadır. 
                  Genel tur durdurma işlemi yapmak için önce kalkış zamanlarındaki 
                  stop işlemlerini kaldırmanız gerekmektedir.
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="form-label">Başlangıç Tarihi</label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="date"
                        className="form-control"
                        value={tour.start_date || ''}
                        onChange={(e) => onDateChange(tour, 'start_date', e.target.value)}
                      />
                      <span className="text-muted">
                        {tour.start_date ? formatDate(tour.start_date) : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Bitiş Tarihi</label>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="date"
                        className="form-control"
                        value={tour.end_date || ''}
                        onChange={(e) => onDateChange(tour, 'end_date', e.target.value)}
                      />
                      <span className="text-muted">
                        {tour.end_date ? formatDate(tour.end_date) : '-'}
                      </span>
                    </div>
                  </div>
                  {(tour.start_date || tour.end_date) && (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Bu tur {formatDate(tour.start_date)} - {formatDate(tour.end_date)} tarihleri arasında durdurulacak.
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              {!hasPickupTimeStops && (tour.start_date || tour.end_date) && (
                <button 
                  type="button" 
                  className="btn btn-danger me-auto"
                  onClick={() => {
                    onDateChange(tour, 'start_date', null);
                    onDateChange(tour, 'end_date', null);
                    onClose();
                  }}
                >
                  <i className="bi bi-calendar-x me-2"></i>
                  Tarihleri Kaldır
                </button>
              )}
              {!hasPickupTimeStops && (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    // Eğer tarihler geçerliyse kaydet ve kapat
                    if (tour.start_date && tour.end_date) {
                      onClose();
                    } else if (!tour.start_date && !tour.end_date) {
                      onClose();
                    } else {
                      alert('Lütfen hem başlangıç hem de bitiş tarihini seçin veya her ikisini de boş bırakın.');
                    }
                  }}
                >
                  <i className="bi bi-check2 me-2"></i>
                  Kaydet
                </button>
              )}
              {hasPickupTimeStops && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={onClose}
                >
                  Kapat
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

const TourTableRow = ({ 
  tour, 
  index, 
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete, 
  onCopy, 
  onStatusChange,
  onDateChange,
  onTourNameClick
}) => {
  const [showDateModal, setShowDateModal] = useState(false);

  // Öncelik badge'inin rengini ve metnini belirleyen yardımcı fonksiyon
  const getPriorityBadge = (priority) => {
    const priorityMap = {
      1: { bg: 'danger', text: 'En Yüksek' },
      2: { bg: 'warning', text: 'Yüksek' },
      3: { bg: 'info', text: 'Normal' },
      4: { bg: 'success', text: 'Düşük' },
      5: { bg: 'primary', text: 'En Düşük' },
      0: { bg: 'light text-dark', text: 'Belirsiz' }
    };
    
    const priorityInfo = priorityMap[priority] || priorityMap[0];
    return (
      <span className={`badge bg-${priorityInfo.bg}`}>
        {priorityInfo.text} ({priority})
      </span>
    );
  };

  const formatPrice = (price, currency = 'EUR') => {
    if (!price) return '-';
    return `${price} ${currency}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Pickup time'larda stop var mı kontrol et
  const hasPickupTimeStops = tour.relatedData?.pickupTimes?.some(time => 
    time.stopSelling || time.start_pickup_date || time.end_pickup_date
  );

  return (
    <>
      <tr 
        className="tour-header position-relative" 
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backgroundColor: isExpanded ? '#f8f9fa' : 'transparent'
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <td 
          onClick={() => onToggle(index)}
          style={{
            width: '40px',
            textAlign: 'center'
          }}
        >
          <div 
            className={`d-flex align-items-center justify-content-center rounded-circle ${isExpanded ? 'bg-primary' : 'bg-light'}`}
            style={{
              width: '24px',
              height: '24px',
              transition: 'all 0.2s ease'
            }}
          >
            <i className={`bi bi-${isExpanded ? 'dash' : 'plus'}-lg ${isExpanded ? 'text-white' : 'text-primary'}`}></i>
          </div>
        </td>
        <td>
          <StatusCell 
            isActive={tour.isActive}
            onChange={() => onStatusChange(tour)}
            index={index}
          />
        </td>
        {/* Öncelik sütunu eklendi */}
        <td onClick={() => onToggle(index)} style={{ width: '120px' }}>
          {getPriorityBadge(parseInt(tour.priority) || 0)}
        </td>
        <td onClick={(e) => {
          onTourNameClick(tour.tourName);
          onToggle(index);
        }} style={{ cursor: 'pointer' }}>
          <span className="fw-medium">
            {tour.tourName}
            <i className="bi bi-search ms-2 text-muted" style={{ fontSize: '0.8em' }}></i>
          </span>
        </td>
        <td onClick={() => onToggle(index)}>
          <div className="d-flex flex-column">
            <span>{tour.operator}</span>
            {tour.operatorId && (
              <small className="text-muted">ID: {tour.operatorId}</small>
            )}
          </div>
        </td>
        <td onClick={() => onToggle(index)}>
          <div className="d-flex flex-column">
            {tour.bolgeler && tour.bolgeler.length > 0 ? (
              <span className="badge bg-info text-wrap">
                {tour.bolgeler.join(', ')}
              </span>
            ) : (
              <span className="text-muted">Bölge seçilmemiş</span>
            )}
          </div>
        </td>
        <td>
          <div className="d-flex flex-column align-items-start">
            <div className="btn-group mb-1">
              <button
                className={`btn btn-sm ${tour.start_date || tour.end_date ? 'btn-outline-danger' : 'btn-outline-secondary'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDateModal(true);
                }}
                title="Tur Durdurma Tarihleri"
                style={{ 
                  position: 'relative',
                  fontWeight: tour.start_date || tour.end_date ? '600' : 'normal'
                }}
              >
                <i className="bi bi-calendar-x" style={{ 
                  fontSize: '1.1em',
                  color: tour.start_date || tour.end_date ? '#dc3545' : '#6c757d'
                }}></i>
                {(tour.start_date || tour.end_date) && (
                  <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                    <span className="visually-hidden">Durdurma Aktif</span>
                  </span>
                )}
              </button>
              <ActionButtons
                onEdit={() => onEdit(tour)}
                onDelete={() => onDelete(tour)}
                onCopy={() => onCopy(tour)}
              />
            </div>
            {/* Pickup time stop badge - butonların altında */}
            {hasPickupTimeStops && !tour.start_date && !tour.end_date && (
              <span 
                className="badge rounded-pill bg-danger d-inline-flex align-items-center mt-1"
                style={{ 
                  fontSize: '11px',
                  padding: '3px 5px'
                }}
                title="Kalkış zamanı durdurmaları mevcut"
              >
                <i className="bi bi-clock me-1"></i>
                pickup Stop
              </span>
            )}
          </div>
        </td>
      </tr>
      
      {/* Fiyatlar satırını sadece expanded durumunda göster */}
      {isExpanded && (
        <tr 
          className="price-row"
          style={{ 
            backgroundColor: '#f8f9fa',
            fontSize: '0.9em'
          }}
        >
          <td colSpan="5">
            <div className="d-flex justify-content-start gap-3 m-3">
              <div className="price-card p-2 rounded border" style={{ minWidth: '200px' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted fw-medium">Normal Fiyatlar</span>
                  <span className="badge bg-light text-dark">{tour.currency}</span>
                </div>
                <div className="d-flex flex-column gap-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">Yetişkin</small>
                    <span className="fw-bold text-success">
                      {tour.adultPrice || '-'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">Çocuk</small>
                    <span className="fw-bold text-info">
                      {tour.childPrice || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="price-card p-2 rounded border" style={{ minWidth: '200px' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted fw-medium">Rehberli Fiyatlar</span>
                  <span className="badge bg-light text-dark">{tour.currency}</span>
                </div>
                <div className="d-flex flex-column gap-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">Yetişkin</small>
                    <span className="fw-bold text-warning">
                      {tour.guideAdultPrice || '-'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">Çocuk</small>
                    <span className="fw-bold text-secondary">
                      {tour.guideChildPrice || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Tarih Modal'ı Portal ile render ediyoruz */}
      <DateModal 
        show={showDateModal}
        onClose={() => setShowDateModal(false)}
        tour={tour}
        onDateChange={onDateChange}
        formatDate={formatDate}
      />
    </>
  );
};

export default TourTableRow; 