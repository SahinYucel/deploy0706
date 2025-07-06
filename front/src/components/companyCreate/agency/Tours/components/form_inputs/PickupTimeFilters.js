import React from 'react';

const PickupTimeFilters = ({ 
  filters, 
  setFilters, 
  savedRegions, 
  availableAreas,
  TIME_PERIODS,
  showFilters 
}) => {
  return (
    <div className={`card mb-3 ${showFilters ? '' : 'd-none'}`}>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">Bölge Filtresi</label>
            <select
              className="form-select"
              value={filters.region}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                region: e.target.value,
                area: '' // Reset area when region changes
              }))}
            >
              <option value="">Tüm Bölgeler</option>
              {savedRegions.map(region => (
                <option key={region.id} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Alan Filtresi</label>
            <select
              className="form-select"
              value={filters.area}
              onChange={(e) => setFilters(prev => ({ ...prev, area: e.target.value }))}
              disabled={!filters.region}
            >
              <option value="">Tüm Alanlar</option>
              {availableAreas.map(area => (
                <option key={area.id || area.name} value={area.name}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Periyot Filtresi</label>
            <select
              className="form-select"
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
            >
              <option value="">Tüm Periyotlar</option>
              {TIME_PERIODS.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Durum Filtresi</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">Tümü</option>
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickupTimeFilters; 