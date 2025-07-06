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

const RegionList = ({
  isRegionCollapsed,
  setIsRegionCollapsed,
  bolgelendir,
  setBolgelendir,
  handleBolgelendirSubmit,
  bolgeler,
  handleDelete,
  onUpdate
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [oldValue, setOldValue] = useState('');

  const handleEdit = (bolge) => {
    setEditingId(bolge.id);
    setEditValue(bolge.name);
    setOldValue(bolge.name);
  };

  const handleSave = async (id) => {
    if (!editValue.trim()) return;
    try {
      const agencyUser = JSON.parse(localStorage.getItem('agencyUser'));
      if (!agencyUser || !agencyUser.companyId) {
        throw new Error('Şirket ID bulunamadı. Lütfen tekrar giriş yapın.');
      }

      const formattedValue = formatInput(editValue);
      const requestData = {
        companyId: agencyUser.companyId,
        tourId: id,
        oldName: oldValue,
        newName: formattedValue,
        type: 'tour_region'
      };

      console.log('Bölge güncelleme isteği:', requestData);

      const response = await updateTourName(requestData);

      if (response.success) {
        onUpdate(id, formattedValue);
        setEditingId(null);
        setEditValue('');
        setOldValue('');
      }
    } catch (error) {
      console.error('Bölge güncelleme hatası:', error);
      alert(error.message || 'Bölge güncellenirken bir hata oluştu');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
    setOldValue('');
  };

  return (
    <div className="card mb-4">
      <div 
        className="card-header" 
        style={{ cursor: 'pointer' }} 
        onClick={() => setIsRegionCollapsed(prev => !prev)}
      >
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Bölgelendirme</h4>
          <i className={`bi ${isRegionCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
        </div>
      </div>
      <div className={`card-body ${isRegionCollapsed ? 'd-none' : ''}`}>
        <form onSubmit={handleBolgelendirSubmit} className="mb-4">
          <div className="input-group">
            <input
              type="text"
              className="form-control text-uppercase"
              placeholder="Bölge adı giriniz"
              value={bolgelendir}
              onChange={(e) => setBolgelendir(formatInput(e.target.value))}
            />
            <button type="submit" className="btn btn-primary">
              <i className="bi bi-plus-lg me-2"></i>Ekle
            </button>
          </div>
        </form>

        {bolgeler.length > 0 && (
          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="table table-hover">
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Bölge Adı</th>
                  <th scope="col">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {bolgeler.map(bolge => (
                  <tr key={bolge.id} className="table-light">
                    <th scope="row">{bolge.id}</th>
                    <td>
                      {editingId === bolge.id ? (
                        <input
                          type="text"
                          className="form-control text-uppercase"
                          value={editValue}
                          onChange={(e) => setEditValue(formatInput(e.target.value))}
                        />
                      ) : bolge.name}
                    </td>
                    <td>
                      {editingId === bolge.id ? (
                        <>
                          <button 
                            className="btn btn-sm btn-success me-2"
                            onClick={() => handleSave(bolge.id)}
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
                            onClick={() => handleEdit(bolge)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => {
                              if (window.confirm('DİKKAT: Bu bölgelendirmeyi sildiğinizde, Rehber ve Turlar kısmından bölge seçimlerini yeniden yapmanız gerekecektir. Devam etmek istiyor musunuz?')) {
                                handleDelete(bolge.id, 'bölge');
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
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionList; 