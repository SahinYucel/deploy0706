import React from 'react';
import { DAYS } from '../components/form_inputs/DaySelector';

const TourTableExpandedRow = ({ tour, bolgeler }) => {
  // Prop kontrolü
  if (!tour || typeof tour !== 'object') {
    console.error('Invalid tour data:', tour);
    return null;
  }

  // Güvenli veri erişimi için kontroller
  const days = Array.isArray(tour.relatedData?.days) ? tour.relatedData.days : [];
  const pickupTimes = Array.isArray(tour.relatedData?.pickupTimes) ? tour.relatedData.pickupTimes : [];
  const options = Array.isArray(tour.relatedData?.options) ? tour.relatedData.options : [];

  const getDayLabel = (dayId) => {
    const day = DAYS.find(d => d.id === dayId);
    return day ? day.label : dayId;
  };

  return (
    <tr>
      <td colSpan="7">
        <div className="container-fluid">
          {/* Günler */}
          <div className="row mb-3">
            <div className="col">
              <h6>Tur Günleri:</h6>
              <div className="d-flex gap-2">
                {days.length > 0 ? (
                  days.map((day) => (
                    <span key={day} className="badge bg-primary">
                      {getDayLabel(day)}
                    </span>
                  ))
                ) : (
                  <span className="text-muted">Gün seçilmedi</span>
                )}
              </div>
            </div>
          </div>

          {/* Kalkış Zamanları */}
          <div className="row mb-3">
            <div className="col">
              <h6>Kalkış Zamanları:</h6>
              {pickupTimes.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm table-striped bg-light">
                    <thead>
                      <tr>
                        <th>Saat</th>
                        <th>Bölge</th>
                        <th>Alan</th>
                        <th>Periyod</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pickupTimes.map((time, index) => (
                        <tr key={index}>
                          <td>{`${time?.hour || '00'}:${time?.minute || '00'}`}</td>
                          <td>{time?.region || '-'}</td>
                          <td>{time?.area || '-'}</td>
                          <td>
                            {time?.periodActive ? (time?.period || '-') : 'Periyod Yok'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">Kalkış zamanı eklenmedi</p>
              )}
            </div>
          </div>

          {/* Seçenekler */}
          {options.length > 0 && (
            <div className="row">
              <div className="col">
                <h6>Ek Seçenekler:</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th>Seçenek</th>
                        <th>Fiyat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {options.map((option, index) => (
                        <tr key={index}>
                          <td>{option?.name || option?.option_name || '-'}</td>
                          <td>{option?.price || '0'} ₺</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default TourTableExpandedRow; 