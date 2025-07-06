import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { updateTourName } from '../../../../../../services/api';

// Helper function to format input
const formatInput = (input) => {
  return input
    .toUpperCase()
    .replace(/[ğĞ]/g, 'G')
    .replace(/[üÜ]/g, 'U')
    .replace(/[şŞ]/g, 'S')
    .replace(/[ıİ]/g, 'I')
    .replace(/[öÖ]/g, 'O')
    .replace(/[çÇ]/g, 'C')
    .replace(/\s+/g, '-');
};

const RegionAreaList = ({
  isAreaCollapsed,
  setIsAreaCollapsed,
  regionName,
  setRegionName,
  handleRegionSubmit: originalHandleRegionSubmit,
  areaName,
  setAreaName,
  selectedRegionId,
  setSelectedRegionId,
  handleAreaSubmit: originalHandleAreaSubmit,
  regions,
  onRegionUpdate,
  onAreaUpdate,
  handleDelete
}) => {
  const [editingRegionId, setEditingRegionId] = useState(null);
  const [editingAreaId, setEditingAreaId] = useState(null);
  const [editRegionValue, setEditRegionValue] = useState('');
  const [editAreaValue, setEditAreaValue] = useState('');
  const [oldRegionName, setOldRegionName] = useState('');
  const [oldAreaName, setOldAreaName] = useState('');

  // Check for duplicate region name
  const checkDuplicateRegionName = (name, excludeId = null) => {
    return regions.some(region => 
      region.name === name.trim().toUpperCase() && 
      region.id !== excludeId
    );
  };

  // Check for duplicate area name across all regions
  const checkDuplicateAreaName = (name, excludeId = null) => {
    return regions.some(region => 
      region.areas?.some(area => 
        area.name === name.trim().toUpperCase() && 
        area.id !== excludeId
      )
    );
  };

  // Wrap the original handleRegionSubmit with validation
  const handleRegionSubmit = (e) => {
    e.preventDefault();
    const trimmedName = regionName.trim().toUpperCase();
    if (!trimmedName) return;

    if (checkDuplicateRegionName(trimmedName)) {
      alert('Bu isimde bir bölge zaten mevcut. Lütfen farklı bir isim seçiniz.');
      return;
    }

    originalHandleRegionSubmit(e);
  };

  // Wrap the original handleAreaSubmit with validation
  const handleAreaSubmit = (e) => {
    e.preventDefault();
    const trimmedName = areaName.trim().toUpperCase();
    if (!trimmedName || !selectedRegionId) return;

    if (checkDuplicateAreaName(trimmedName)) {
      alert('Bu isimde bir alan başka bir bölgede zaten mevcut. Alanlar benzersiz olmalıdır.');
      return;
    }

    originalHandleAreaSubmit(e);
  };

  const handleEdit = (type, id, name, regionId = null) => {
    if (type === 'region') {
      setEditingRegionId(id);
      setEditingAreaId(null);
      setEditRegionValue(name);
      setOldRegionName(name);
    } else {
      setEditingAreaId(id);
      setEditingRegionId(regionId);
      setEditAreaValue(name);
      setOldAreaName(name);
    }
  };

  const handleSave = async (type, id, regionId = null) => {
    if (type === 'region') {
      if (!editRegionValue.trim()) return;
      
      const trimmedValue = formatInput(editRegionValue);
      
      // Check for duplicate region name when editing
      if (checkDuplicateRegionName(trimmedValue, id)) {
        alert('Bu isimde bir bölge zaten mevcut. Lütfen farklı bir isim seçiniz.');
        return;
      }

      try {
        const agencyUser = JSON.parse(localStorage.getItem('agencyUser'));
        if (!agencyUser || !agencyUser.companyId) {
          throw new Error('Şirket ID bulunamadı. Lütfen tekrar giriş yapın.');
        }

        const requestData = {
          companyId: agencyUser.companyId,
          tourId: id,
          oldName: oldRegionName,
          newName: trimmedValue,
          type: 'region'
        };

        console.log('Bölge güncelleme isteği:', requestData);

        const response = await updateTourName(requestData);

        if (!response.success) {
          throw new Error(response.error || 'Bölge güncellenirken bir hata oluştu');
        }

        onRegionUpdate(id, trimmedValue);
        setEditRegionValue('');
        setOldRegionName('');
      } catch (error) {
        console.error('Bölge güncelleme hatası:', error);
        alert(error.message || 'Bölge güncellenirken bir hata oluştu');
        return;
      }
    } else {
      if (!editAreaValue.trim()) return;
      
      const trimmedValue = formatInput(editAreaValue);
      
      // Check for duplicate area name when editing
      if (checkDuplicateAreaName(trimmedValue, id)) {
        alert('Bu isimde bir alan başka bir bölgede zaten mevcut. Alanlar benzersiz olmalıdır.');
        return;
      }

      try {
        const agencyUser = JSON.parse(localStorage.getItem('agencyUser'));
        if (!agencyUser || !agencyUser.companyId) {
          throw new Error('Şirket ID bulunamadı. Lütfen tekrar giriş yapın.');
        }

        const requestData = {
          companyId: agencyUser.companyId,
          tourId: id,
          oldName: oldAreaName,
          newName: trimmedValue,
          type: 'area'
        };

        console.log('Alan güncelleme isteği:', requestData);

        const response = await updateTourName(requestData);

        if (!response.success) {
          throw new Error(response.error || 'Alan güncellenirken bir hata oluştu');
        }

        onAreaUpdate(regionId, id, trimmedValue);
        setEditAreaValue('');
        setOldAreaName('');
      } catch (error) {
        console.error('Alan güncelleme hatası:', error);
        alert(error.message || 'Alan güncellenirken bir hata oluştu');
        return;
      }
    }
    setEditingRegionId(null);
    setEditingAreaId(null);
  };

  const handleCancel = () => {
    setEditingRegionId(null);
    setEditingAreaId(null);
    setEditRegionValue('');
    setEditAreaValue('');
    setOldRegionName('');
    setOldAreaName('');
  };

  return (
    <div className="card mb-4">
      <div 
        className="card-header" 
        style={{ cursor: 'pointer' }} 
        onClick={() => setIsAreaCollapsed(prev => !prev)}
      >
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Bölgeler ve Alanlar</h4>
          <i className={`bi ${isAreaCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
        </div>
      </div>
      <div className={`card-body ${isAreaCollapsed ? 'd-none' : ''}`}>
        {/* Region Form */}
        <form onSubmit={handleRegionSubmit} className="mb-4">
          <div className="input-group">
            <input
              type="text"
              className="form-control text-uppercase"
              placeholder="Bölge adı giriniz"
              value={regionName}
              onChange={(e) => setRegionName(formatInput(e.target.value))}
            />
            <button type="submit" className="btn btn-primary">
              <i className="bi bi-plus-lg me-2"></i>Bölge Ekle
            </button>
          </div>
        </form>

        {/* Area Form */}
        <form onSubmit={handleAreaSubmit} className="mb-4">
          <div className="input-group">
            <select
              className="form-select"
              value={selectedRegionId || ''}
              onChange={(e) => setSelectedRegionId(Number(e.target.value))}
              style={{ maxWidth: '200px' }}
            >
              <option value="">Alan seçiniz</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="form-control text-uppercase"
              placeholder="Alan adı giriniz"
              value={areaName}
              onChange={(e) => setAreaName(formatInput(e.target.value))}
              disabled={!selectedRegionId}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!selectedRegionId}
            >
              <i className="bi bi-plus-lg me-2"></i>Alan Ekle
            </button>
          </div>
        </form>

        {/* Region and Area Table */}
        {regions.length > 0 && (
          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="table table-hover">
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">İsim</th>
                  <th scope="col">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {regions.map(region => (
                  <React.Fragment key={region.id}>
                    <tr className="table-light">
                      <th scope="row">{region.id}</th>
                      <td>
                        {editingRegionId === region.id ? (
                          <input
                            type="text"
                            className="form-control text-uppercase"
                            value={editRegionValue}
                            onChange={(e) => setEditRegionValue(formatInput(e.target.value))}
                          />
                        ) : region.name}
                      </td>
                      <td>
                        {editingRegionId === region.id ? (
                          <>
                            <button 
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleSave('region', region.id)}
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={handleCancel}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => handleEdit('region', region.id, region.name)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                if (window.confirm('DİKKAT: Bu bölge veya alanı sildiğinizde, Rehber ve Turlar kısmından bölge seçimlerini yeniden yapmanız gerekecektir. Devam etmek istiyor musunuz?')) {
                                  handleDelete(region.id, 'region');
                                }
                              }}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                    {(region.areas || []).map(area => (
                      <tr key={area.id} className="table-light" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        <th scope="row" style={{ paddingLeft: '2rem' }}>└ {area.id}</th>
                        <td style={{ paddingLeft: '2rem' }}>
                          {editingAreaId === area.id ? (
                            <input
                              type="text"
                              className="form-control text-uppercase"
                              value={editAreaValue}
                              onChange={(e) => setEditAreaValue(formatInput(e.target.value))}
                            />
                          ) : area.name}
                        </td>
                        <td>
                          {editingAreaId === area.id ? (
                            <>
                              <button 
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleSave('area', area.id, region.id)}
                              >
                                <i className="bi bi-check-lg"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-secondary"
                                onClick={handleCancel}
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                className="btn btn-sm btn-warning me-2"
                                onClick={() => handleEdit('area', area.id, area.name, region.id)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => {
                                  if (window.confirm('DİKKAT: Bu tur adını veya alt tur adını sildiğinizde, Rehber ve Turlar kısmından bölge seçimlerini yeniden yapmanız gerekecektir. Devam etmek istiyor musunuz?')) {
                                    handleDelete(area.id, 'alan', region.id);
                                  }
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionAreaList; 