import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const TIME_PERIODS = [
  { value: '1', label: '1. PERIYOT' },
  { value: '2', label: '2. PERIYOT' },
  { value: '3', label: '3. PERIYOT' },
  { value: '4', label: '4. PERIYOT' },
  { value: '5', label: '5. PERIYOT' },
  { value: '6', label: '6. PERIYOT' },
  { value: '7', label: '7. PERIYOT' },
  { value: '8', label: '8. PERIYOT' },
  { value: '9', label: '9. PERIYOT' },
  { value: '10', label: '10. PERIYOT' }
];

const WEEKDAYS = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  7: 'Pazar'
};

const formatDateTR = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const StopSaleModal = ({ show, onClose, selectedTime, stopSaleData, onSave, onRemove, setStopSaleData, tour }) => {
  if (!show) return null;

  const hasTourStop = tour.start_date || tour.end_date;

  return ReactDOM.createPortal(
    <>
      <div className="modal fade show" 
           style={{ display: 'block' }}
           tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Satış Durdurma Ayarları</h5>
              <button type="button" 
                      className="btn-close" 
                      onClick={onClose}
                      aria-label="Close">
              </button>
            </div>
            <div className="modal-body">
              {hasTourStop ? (
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Bu tur için genel durdurma işlemi aktif ({formatDateTR(tour.start_date)} - {formatDateTR(tour.end_date)}). 
                  Kalkış zamanı için stop işlemi yapmak için önce genel tur durdurma işlemini kaldırmanız gerekmektedir.
                </div>
              ) : (
                <>
                  {selectedTime?.stopSelling ? (
                    <div className="alert alert-warning">
                      <small>
                        <strong>Mevcut Satış Durdurma:</strong><br/>
                        {formatDateTR(selectedTime.stopSaleStartDate)} - {formatDateTR(selectedTime.stopSaleEndDate)}
                      </small>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Başlangıç Tarihi</label>
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="date"
                            className="form-control"
                            value={stopSaleData.startDate}
                            onChange={(e) => setStopSaleData(prev => ({ ...prev, startDate: e.target.value }))}
                          />
                          <span className="text-muted" style={{ minWidth: '130px' }}>
                            {stopSaleData.startDate ? formatDateTR(stopSaleData.startDate) : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Bitiş Tarihi</label>
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="date"
                            className="form-control"
                            value={stopSaleData.stopDate}
                            onChange={(e) => setStopSaleData(prev => ({ ...prev, stopDate: e.target.value }))}
                          />
                          <span className="text-muted" style={{ minWidth: '130px' }}>
                            {stopSaleData.stopDate ? formatDateTR(stopSaleData.stopDate) : '-'}
                          </span>
                        </div>
                      </div>
                      {stopSaleData.startDate && stopSaleData.stopDate && (
                        <div className="alert alert-info">
                          <i className="bi bi-info-circle me-2"></i>
                          <small>
                            Bu kalkış için satış durdurma tarihleri:<br/>
                            <strong>{formatDateTR(stopSaleData.startDate)} - {formatDateTR(stopSaleData.stopDate)}</strong>
                          </small>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
              <div className="alert alert-info mt-3">
                <small>
                  <strong>Seçili Kalkış:</strong> {selectedTime?.region}
                  {selectedTime?.area && ` - ${selectedTime.area}`} 
                  ({selectedTime?.hour}:{selectedTime?.minute})
                </small>
              </div>
            </div>
            <div className="modal-footer">
              {!hasTourStop && (
                selectedTime?.stopSelling ? (
                  <>
                    <button type="button" 
                            className="btn btn-danger"
                            onClick={() => {
                              onRemove(selectedTime);
                              onClose();
                            }}>
                      Satış Durdurma İptal
                    </button>
                    <button type="button" 
                            className="btn btn-secondary"
                            onClick={onClose}>
                      Kapat
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" 
                            className="btn btn-primary"
                            onClick={onSave}>
                      Kaydet
                    </button>
                    <button type="button" 
                            className="btn btn-secondary"
                            onClick={onClose}>
                      İptal
                    </button>
                  </>
                )
              )}
              {hasTourStop && (
                <button type="button" 
                        className="btn btn-secondary"
                        onClick={onClose}>
                  Kapat
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>,
    document.body
  );
};

const TourTableExpandedRow = ({ tour, tourIndex }) => {
  const [showStopSaleModal, setShowStopSaleModal] = useState(false);
  const [selectedPickupTime, setSelectedPickupTime] = useState(null);
  const [stopSaleData, setStopSaleData] = useState({
    startDate: '',
    stopDate: ''
  });

  // Local storage'dan stop sale verilerini yükleme
  useEffect(() => {
    const loadStopSaleData = () => {
      const storageKey = `tourStopSale_${tour.id}`;
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Pickup time ID'ye göre stop sale verilerini state'e yükle
        tour.relatedData?.pickupTimes?.forEach(time => {
          if (parsedData[time.id]) {
            time.stopSelling = true;
            time.stopSaleStartDate = parsedData[time.id].startDate;
            time.stopSaleEndDate = parsedData[time.id].stopDate;
          }
        });
      }
    };

    loadStopSaleData();
  }, [tour.id]);

  const handleStopSaleClick = (time) => {
    // Eğer genel tur durdurma varsa, işlemi engelle
    if (tour.start_date || tour.end_date) {
      alert('Genel tur durdurma aktif olduğu için kalkış zamanı stop işlemi yapamazsınız.');
      return;
    }

    setSelectedPickupTime(time);
    setStopSaleData({
      startDate: time.stopSaleStartDate || '',
      stopDate: time.stopSaleEndDate || ''
    });
    setShowStopSaleModal(true);
  };

  const removeStopSale = (time) => {
    // Local storage'dan kaldır
    const storageKey = `tourStopSale_${tour.id}`;
    const existingData = localStorage.getItem(storageKey);
    if (existingData) {
      const parsedData = JSON.parse(existingData);
      delete parsedData[time.id];
      
      if (Object.keys(parsedData).length === 0) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(parsedData));
      }
    }

    // Time objesindeki stop sale verilerini temizle
    time.stopSelling = false;
    time.stopSaleStartDate = null;
    time.stopSaleEndDate = null;
    time.start_pickup_date = null;  // Veritabanı field'ı
    time.end_pickup_date = null;    // Veritabanı field'ı

    setSelectedPickupTime(null);
  };

  const handleSaveStopSale = async () => {
    try {
      // Local storage'a kaydetme
      const storageKey = `tourStopSale_${tour.id}`;
      const existingData = localStorage.getItem(storageKey);
      const parsedData = existingData ? JSON.parse(existingData) : {};
      
      // Seçili pickup time için stop sale verilerini güncelle
      parsedData[selectedPickupTime.id] = {
        startDate: stopSaleData.startDate,
        stopDate: stopSaleData.stopDate
      };

      localStorage.setItem(storageKey, JSON.stringify(parsedData));

      // Seçili pickup time'ın state'ini güncelle
      selectedPickupTime.stopSelling = true;
      selectedPickupTime.stopSaleStartDate = stopSaleData.startDate;
      selectedPickupTime.stopSaleEndDate = stopSaleData.stopDate;
      selectedPickupTime.start_pickup_date = stopSaleData.startDate; // Veritabanı field'ı
      selectedPickupTime.end_pickup_date = stopSaleData.stopDate;   // Veritabanı field'ı

      setShowStopSaleModal(false);
    } catch (error) {
      console.error('Stop sale update failed:', error);
    }
  };

  // Kalkış zamanlarını area'ya göre gruplama ve tekrarları engelleme
  const groupedPickupTimes = tour.relatedData?.pickupTimes?.reduce((acc, time) => {
    const area = time.area || 'Diğer';
    if (!acc[area]) {
      acc[area] = [];
    }
    
    // Aynı area, saat ve periyotta başka kayıt var mı kontrol et
    const isDuplicate = acc[area].some(existingTime => 
      existingTime.hour === time.hour &&
      existingTime.minute === time.minute &&
      existingTime.period === time.period &&
      existingTime.region === time.region
    );
    
    // Eğer aynı kayıt yoksa ekle
    if (!isDuplicate) {
      acc[area].push(time);
    }
    
    return acc;
  }, {});

  // Her area grubu içindeki zamanları sırala
  Object.keys(groupedPickupTimes || {}).forEach(area => {
    groupedPickupTimes[area].sort((a, b) => {
      // Önce saate göre sırala
      const aTime = parseInt(a.hour) * 60 + parseInt(a.minute);
      const bTime = parseInt(b.hour) * 60 + parseInt(b.minute);
      if (aTime !== bTime) return aTime - bTime;
      
      // Saat aynıysa periyoda göre sırala
      return parseInt(a.period) - parseInt(b.period);
    });
  });

  return (
    <>
      <tr>
        <td colSpan="12">
          <div className="p-4" style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            {/* Tur Günleri */}
            <div className="mb-4">
              <h6 className="mb-3 d-flex align-items-center">
                <i className="bi bi-calendar-week me-2 text-primary"></i>
                <span className="fw-bold">Tur Günleri</span>
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {Object.entries(WEEKDAYS).map(([id, name]) => {
                  const isSelected = tour.relatedData?.days?.includes(Number(id));
                  return (
                    <span
                      key={id}
                      className={`badge ${isSelected ? 'bg-success' : 'bg-secondary'}`}
                      style={{ 
                        fontSize: '0.9em', 
                        padding: '8px 12px',
                        opacity: isSelected ? 1 : 0.6 
                      }}
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Kalkış Zamanları */}
            <div className="mb-4">
              <h6 className="mb-3 d-flex align-items-center">
                <i className="bi bi-clock me-2 text-primary"></i>
                <span className="fw-bold">Kalkış Zamanları</span>
              </h6>
              {Object.entries(groupedPickupTimes || {}).map(([area, times], areaIndex) => (
                <div key={areaIndex} className="mb-3">
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle bg-white" style={{
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}>
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '100px', textAlign: 'center' }}>Durum</th>
                          <th style={{ width: '100px', textAlign: 'center' }}>Saat</th>
                          <th>Bölge / Alan</th>
                          <th style={{ width: '150px', textAlign: 'center' }}>Periyot</th>
                          <th style={{ width: '200px', textAlign: 'center' }}>Satış Stop</th>
                        </tr>
                      </thead>
                      <tbody>
                        {times.map((time, timeIndex) => (
                          <tr key={timeIndex}>
                            <td className="text-center">
                              <span className={`badge ${time.isActive ? 'bg-success' : 'bg-secondary'}`}
                                    style={{ minWidth: '80px' }}>
                                {time.isActive ? 'Aktif' : 'Pasif'}
                              </span>
                            </td>
                            <td className="text-center fw-medium">
                              {`${time.hour.padStart(2, '0')}:${time.minute.padStart(2, '0')}`}
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="fw-medium">{time.region}</span>
                                {time.area && (
                                  <>
                                    <i className="bi bi-chevron-right mx-2 text-muted"></i>
                                    <span className="text-muted">{time.area}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-light text-dark"
                                    style={{ minWidth: '120px', fontSize: '0.9em' }}>
                                {TIME_PERIODS.find(p => p.value === time.period)?.label || time.period}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="d-flex flex-column align-items-center">
                                <button 
                                  className="btn btn-link text-danger p-0 mb-1" 
                                  title={time.stopSelling ? "Satış Durdurma İptal" : "Satışı Durdur"}
                                  onClick={() => handleStopSaleClick(time)}
                                >
                                  <i className={`bi bi-${time.stopSelling ? 'dash-circle-fill' : 'dash-circle'}`}></i>
                                </button>
                                {time.stopSelling && (
                                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    {formatDateTR(time.stopSaleStartDate)} - 
                                    <br />
                                    {formatDateTR(time.stopSaleEndDate)}
                                  </small>
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Opsiyonlar */}
            {tour.relatedData?.options?.length > 0 && (
              <div>
                <h6 className="mb-3 d-flex align-items-center">
                  <i className="bi bi-list-check me-2 text-primary"></i>
                  <span className="fw-bold">Opsiyonlar</span>
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover bg-white" style={{
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}>
                    <thead>
                      <tr>
                        <th>Opsiyon</th>
                        <th>Fiyat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tour.relatedData.options.map((option, optIndex) => (
                        <tr key={optIndex}>
                          <td>{option.name || option.option_name}</td>
                          <td>{option.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>

      <StopSaleModal 
        show={showStopSaleModal}
        onClose={() => setShowStopSaleModal(false)}
        selectedTime={selectedPickupTime}
        stopSaleData={stopSaleData}
        onSave={handleSaveStopSale}
        onRemove={removeStopSale}
        setStopSaleData={setStopSaleData}
        tour={tour}
      />
    </>
  );
};

export default TourTableExpandedRow; 