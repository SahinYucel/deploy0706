import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import TimeInput from '../TimeInput';
import {
  togglePickupTimeList,
  selectPickupTimeListVisibility
} from '../../../../../../store/slices/pickupTimeSlice';
import PickupTimeFilters from './PickupTimeFilters';

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


const PickupTimeForm = ({ 
  pickupTimes, 
  savedRegions, 
  savedAreas, 
  onTimeChange, 
  onAddTime, 
  onRemoveTime 
}) => {
  const dispatch = useDispatch();
  const showList = useSelector(selectPickupTimeListVisibility);
  
  // Filtreleme state'leri
  const [filters, setFilters] = useState({
    region: '',
    area: '',
    period: '',
    status: 'all' // 'all', 'active', 'passive'
  });

  // Add state for filter visibility
  const [showFilters, setShowFilters] = useState(false);

  const getAreasForRegion = (regionName) => {
    if (!regionName) return [];
    
    // Önce bölgeyi bul
    const region = savedRegions.find(r => r.name === regionName);
    if (!region) return [];

    // Eğer bölgenin kendi içinde areas dizisi varsa onu kullan
    if (region.areas && Array.isArray(region.areas)) {
      return region.areas;
    }
    
    // Yoksa savedAreas'dan filtrele
    return savedAreas.filter(area => {
      return area.region === regionName || area.region_id === region.id;
    });
  };

  // Get available areas based on selected region filter
  const availableAreas = useMemo(() => {
    return getAreasForRegion(filters.region);
  }, [filters.region, savedRegions, savedAreas]);

  // Sıralama ve filtreleme fonksiyonu
  const sortAndFilterPickupTimes = (times) => {
    return [...times]
      .map((time, index) => ({ ...time, originalIndex: index }))
      .filter(time => {
        // Bölge filtresi
        if (filters.region && time.region !== filters.region) return false;
        
        // Alan filtresi
        if (filters.area && time.area !== filters.area) return false;
        
        // Periyot filtresi
        if (filters.period && time.period !== filters.period) return false;
        
        // Durum filtresi
        if (filters.status === 'active' && !time.isActive) return false;
        if (filters.status === 'passive' && time.isActive) return false;
        
        return true;
      })
      .sort((a, b) => {
        const regionCompare = (a.region || '').localeCompare(b.region || '');
        if (regionCompare !== 0) return regionCompare;

        const areaCompare = (a.area || '').localeCompare(b.area || '');
        if (areaCompare !== 0) return areaCompare;

        return Number(a.period) - Number(b.period);
      });
  };

  // Mevcut kayıtları sırala ve filtrele (son kayıt hariç)
  const sortedAndFilteredPickupTimes = sortAndFilterPickupTimes(pickupTimes.slice(0, -1));

  return (
    <div className="mb-3">
      <label className="form-label d-flex justify-content-between align-items-center">
        <span>
          <i className="bi bi-clock me-2"></i>
          Kalkış Zamanları ve Bölgeler
        </span>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
          onClick={() => setShowFilters(!showFilters)}
          style={{ fontSize: '0.875rem' }}
        >
          <i className={`bi bi-funnel${showFilters ? '-fill' : ''}`}></i>
          Filtrele
          <i className={`bi bi-chevron-${showFilters ? 'up' : 'down'}`}></i>
        </button>
      </label>

      <PickupTimeFilters 
        filters={filters}
        setFilters={setFilters}
        savedRegions={savedRegions}
        availableAreas={availableAreas}
        TIME_PERIODS={TIME_PERIODS}
        showFilters={showFilters}
      />

      <div className="card mb-3 border-primary">
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-3">
              <TimeInput
                id="newPickupTime"
                value={pickupTimes[pickupTimes.length - 1] || {}}
                onChange={(e) => {
                  const { name, value } = e.target;
                  const field = name.split('.')[1];
                  onTimeChange(pickupTimes.length - 1, field, value);
                }}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">
                <i className="bi bi-geo me-2"></i>
                Bölge
              </label>
              <select
                className="form-select"
                value={pickupTimes[pickupTimes.length - 1]?.region || ''}
                onChange={(e) => {
                  const lastIndex = pickupTimes.length - 1;
                  onTimeChange(lastIndex, 'region', e.target.value);
                  onTimeChange(lastIndex, 'area', '');
                }}
              >
                <option value="">Bölge seçiniz</option>
                {savedRegions.map(region => (
                  <option key={region.id} value={region.name}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">
                <i className="bi bi-geo-alt me-2"></i>
                Alan
              </label>
              <select
                className="form-select"
                value={pickupTimes[pickupTimes.length - 1]?.area || ''}
                onChange={(e) => onTimeChange(pickupTimes.length - 1, 'area', e.target.value)}
                disabled={!pickupTimes[pickupTimes.length - 1]?.region}
              >
                <option value="">Alan seçiniz</option>
                {getAreasForRegion(pickupTimes[pickupTimes.length - 1]?.region).map(area => (
                  <option key={area.id || area.name} value={area.name}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">
                <i className="bi bi-clock-history me-2"></i>
                Periyot
              </label>
              <select
                className="form-select"
                value={(pickupTimes[pickupTimes.length - 1]?.period) || '1'}
                onChange={(e) => onTimeChange(pickupTimes.length - 1, 'period', e.target.value)}
              >
                {TIME_PERIODS.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-1">
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={onAddTime}
              >
                <i className="bi bi-plus-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {sortedAndFilteredPickupTimes.length > 0 ? (
        sortedAndFilteredPickupTimes.map((time) => (
          <div key={time.originalIndex} className="card mb-2">
            <div className="card-body py-2">
              <div className="row align-items-end">
                <div className="col-md-3">
                  <TimeInput
                    id={`pickupTime-${time.originalIndex}`}
                    value={time}
                    onChange={(e) => {
                      const { name, value } = e.target;
                      const field = name.split('.')[1];
                      onTimeChange(time.originalIndex, field, value);
                    }}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">
                    <i className="bi bi-geo me-2"></i>
                    Bölge
                  </label>
                  <select
                    className="form-select"
                    value={time.region}
                    onChange={(e) => {
                      onTimeChange(time.originalIndex, 'region', e.target.value);
                      onTimeChange(time.originalIndex, 'area', '');
                    }}
                  >
                    <option value="">Bölge seçiniz</option>
                    {savedRegions.map(region => (
                      <option key={region.id} value={region.name}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">
                    <i className="bi bi-geo-alt me-2"></i>
                    Alan
                  </label>
                  <select
                    className="form-select"
                    value={time.area}
                    onChange={(e) => onTimeChange(time.originalIndex, 'area', e.target.value)}
                    disabled={!time.region}
                  >
                    <option value="">Alan seçiniz</option>
                    {getAreasForRegion(time.region).map(area => (
                      <option key={area.id || area.name} value={area.name}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">
                    <i className="bi bi-clock-history me-2"></i>
                    Periyot
                  </label>
                  <select
                    className="form-select"
                    value={time.period || '1'}
                    onChange={(e) => onTimeChange(time.originalIndex, 'period', e.target.value)}
                  >
                    {TIME_PERIODS.map(period => (
                      <option key={period.value} value={period.value}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-1">
                  <div className="d-flex flex-column align-items-center gap-3">
                    <button
                      type="button"
                      className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
                      style={{ 
                        minWidth: '70px', 
                        height: '35px',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      title="Sil"
                      onClick={() => onRemoveTime(time.originalIndex)}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Sil
                    </button>
                    <div 
                      className="form-check form-switch d-flex align-items-center gap-2"
                      style={{ 
                        backgroundColor: time.isActive !== false ? '#e8f5e9' : '#ffebee',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onClick={(e) => {
                        const newValue = !(time.isActive !== false);
                        onTimeChange(time.originalIndex, 'isActive', newValue);
                      }}
                    >
                      <input
                        className="form-check-input m-0"
                        type="checkbox"
                        style={{ 
                          cursor: 'pointer',
                          width: '35px',
                          height: '18px'
                        }}
                        checked={time.isActive !== false}
                        onChange={(e) => onTimeChange(time.originalIndex, 'isActive', e.target.checked)}
                      />
                      <small style={{ 
                        fontSize: '0.75rem', 
                        color: time.isActive !== false ? '#2e7d32' : '#c62828',
                        whiteSpace: 'nowrap'
                      }}>
                        {time.isActive !== false ? 'Aktif' : 'Pasif'}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          Seçili filtrelere uygun kayıt bulunamadı
        </div>
      )}
    </div>
  );
};

export default PickupTimeForm; 