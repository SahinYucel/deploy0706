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

const TourList = ({
  isCollapsed,
  setIsCollapsed,
  tourName,
  setTourName,
  handleTourSubmit: originalHandleTourSubmit,
  tours,
  handleDelete: originalHandleDelete,
  onUpdate,
  onSubTourSubmit: originalOnSubTourSubmit
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editingParentId, setEditingParentId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isEditingSubTour, setIsEditingSubTour] = useState(false);
  const [subTourName, setSubTourName] = useState('');
  const [selectedTourId, setSelectedTourId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tours based on search query
  const filteredTours = tours.filter(tour => {
    const matchesTour = tour.name.includes(searchQuery.toUpperCase());
    const matchesSubTours = tour.subTours?.some(subTour => 
      subTour.name.includes(searchQuery.toUpperCase())
    );
    return matchesTour || matchesSubTours;
  });

  // Check for duplicate tour name
  const checkDuplicateTourName = (name) => {
    return tours.some(tour => tour.name === name.trim().toUpperCase());
  };

  // Check for duplicate sub-tour name across all tours
  const checkDuplicateSubTourName = (tourId, name) => {
    const trimmedName = name.trim().toUpperCase();
    return tours.some(tour => 
      tour.subTours?.some(subTour => 
        subTour.name === trimmedName && 
        // Allow the same name if we're editing and it's the same sub-tour
        !(isEditingSubTour && editingId === subTour.id)
      )
    );
  };

  // Wrap the original handleTourSubmit with validation
  const handleTourSubmit = (e) => {
    e.preventDefault();
    const formattedName = formatInput(tourName);
    if (!formattedName) return;

    if (checkDuplicateTourName(formattedName)) {
      alert('Bu isimde bir tur zaten mevcut. Lutfen farkli bir isim seciniz.');
      return;
    }

    originalHandleTourSubmit(e);
  };

  // Wrap the original onSubTourSubmit with validation
  const handleSubTourSubmit = (e) => {
    e.preventDefault();
    const formattedName = formatInput(subTourName);
    if (!formattedName || !selectedTourId) return;

    if (checkDuplicateSubTourName(selectedTourId, formattedName)) {
      alert('Bu isimde bir alt tur baska bir turda zaten mevcut. Alt turlar benzersiz olmalidir.');
      return;
    }

    originalOnSubTourSubmit(selectedTourId, formattedName);
    setSubTourName('');
  };

  const handleDelete = (id, type, parentId = null) => {
    const confirmMessage = "DIKKAT: Bu tur veya alt-tur alani sildiginizde, Rehber ve Turlar kismindan bolge secimlerini yeniden yapmaniz gerekecektir. Devam etmek istiyor musunuz?";
    
    if (window.confirm(confirmMessage)) {
      originalHandleDelete(id, type, parentId);
    }
  };

  const handleEdit = (tour, isSubTour = false, parentId = null) => {
    setEditingId(tour.id);
    setEditValue(tour.name);
    setIsEditingSubTour(isSubTour);
    setEditingParentId(parentId);
  };

  const handleSave = async (id) => {
    if (!editValue.trim()) return;
    
    const formattedValue = formatInput(editValue);
    
    // Check for duplicates when editing
    if (isEditingSubTour) {
      if (checkDuplicateSubTourName(editingParentId, formattedValue)) {
        alert('Bu isimde bir alt tur zaten mevcut. Lutfen farkli bir isim seciniz.');
        return;
      }
    } else {
      if (checkDuplicateTourName(formattedValue)) {
        alert('Bu isimde bir tur zaten mevcut. Lutfen farkli bir isim seciniz.');
        return;
      }
    }
    
    setIsUpdating(true);
    try {
      const agencyUser = JSON.parse(localStorage.getItem('agencyUser'));
      if (!agencyUser?.companyId) {
        alert('Sirket bilgisi bulunamadi!');
        return;
      }

      // API'ye istek at
      const response = await updateTourName({
        companyId: agencyUser.companyId,
        tourId: isEditingSubTour ? null : id,
        subTourId: isEditingSubTour ? id : null,
        newName: formattedValue
      });

      if (response.success) {
        // Local state'i güncelle
        onUpdate(id, formattedValue, isEditingSubTour, editingParentId);
        setEditingId(null);
        setEditValue('');
        setIsEditingSubTour(false);
        setEditingParentId(null);
      } else {
        alert('Isim guncellenirken bir hata olustu: ' + response.error);
      }
    } catch (error) {
      console.error('Isim guncelleme hatasi:', error);
      alert('Isim guncellenirken bir hata olustu');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  return (
    <div className="card mb-4">
      <div 
        className="card-header" 
        style={{ cursor: 'pointer' }} 
        onClick={() => setIsCollapsed(prev => !prev)}
      >
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Turlar</h4>
          <i className={`bi ${isCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
        </div>
      </div>
      <div className={`card-body ${isCollapsed ? 'd-none' : ''}`}>
        {/* Search Filter */}
        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Tur veya alt tur ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setSearchQuery('')}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
        </div>

        {/* Ana Tur Form */}
        <form onSubmit={handleTourSubmit} className="mb-3">
          <div className="input-group">
            <input
              type="text"
              className="form-control text-uppercase"
              placeholder="Tur adı giriniz"
              value={tourName}
              onChange={(e) => setTourName(formatInput(e.target.value))}
            />
            <button type="submit" className="btn btn-primary">
              <i className="bi bi-plus-lg me-2"></i>Tur Adı Ekle
            </button>
          </div>
        </form>

        {/* Alt Tur Form */}
        <form onSubmit={handleSubTourSubmit} className="mb-4">
          <div className="input-group">
            <select
              className="form-select"
              value={selectedTourId || ''}
              onChange={(e) => setSelectedTourId(Number(e.target.value))}
              style={{ maxWidth: '200px' }}
            >
              <option value="">Tur adı seçiniz</option>
              {tours.map(tour => (
                <option key={tour.id} value={tour.id}>
                  {tour.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="form-control text-uppercase"
              placeholder="Alt tur adı giriniz"
              value={subTourName}
              onChange={(e) => setSubTourName(formatInput(e.target.value))}
              disabled={!selectedTourId}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!selectedTourId}
            >
              <i className="bi bi-plus-lg me-2"></i>Alt Tur Ekle
            </button>
          </div>
        </form>

        {/* Tur Listesi */}
        {filteredTours.length > 0 ? (
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
                {filteredTours.map(tour => (
                  <React.Fragment key={tour.id}>
                    {/* Ana Tur Satırı */}
                    <tr className="table-light">
                      <th scope="row">{tour.id}</th>
                      <td>
                        {editingId === tour.id ? (
                          <input
                            type="text"
                            className="form-control text-uppercase"
                            value={editValue}
                            onChange={(e) => setEditValue(formatInput(e.target.value))}
                          />
                        ) : tour.name}
                      </td>
                      <td>
                        {editingId === tour.id ? (
                          <>
                            <button 
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleSave(tour.id)}
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                              ) : (
                                <i className="bi bi-check-lg"></i>
                              )}
                            </button>
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={handleCancel}
                              disabled={isUpdating}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => handleEdit(tour)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(tour.id, 'tur')}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                    {/* Alt Turlar burada listelenecek */}
                    {tour.subTours?.map(subTour => (
                      <tr key={subTour.id} className="table-light">
                        <th scope="row" style={{ paddingLeft: '2rem' }}>└ {subTour.id}</th>
                        <td style={{ paddingLeft: '2rem' }}>
                          {editingId === subTour.id ? (
                            <input
                              type="text"
                              className="form-control text-uppercase"
                              value={editValue}
                              onChange={(e) => setEditValue(formatInput(e.target.value))}
                            />
                          ) : subTour.name}
                        </td>
                        <td>
                          {editingId === subTour.id ? (
                            <>
                              <button 
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleSave(subTour.id)}
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                  <i className="bi bi-check-lg"></i>
                                )}
                              </button>
                              <button 
                                className="btn btn-sm btn-secondary"
                                onClick={handleCancel}
                                disabled={isUpdating}
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                className="btn btn-sm btn-warning me-2"
                                onClick={() => handleEdit(subTour, true, tour.id)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(subTour.id, 'alt-tur', tour.id)}
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
        ) : (
          <div className="alert alert-info">
            {tours.length === 0 ? 'Henüz tur eklenmemiş.' : 'Arama kriterlerine uygun tur bulunamadı.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TourList;