import React from 'react';
import PersonalInfo from './Personalinfo';
import LanguageSelector from './LanguageSelector';
import RegionSelector from './RegionSelector';

const GuideForm = ({ 
  formData, 
  editingId, 
  bolgeler, 
  onSubmit, 
  onChange, 
  onLanguageChange, 
  onSwitchChange,
  onCancel 
}) => {
  return (
    <div className="card mb-4">
      <div className="card-header">
        <h6 className="mb-0">{editingId ? 'Rehber Düzenle' : 'Yeni Rehber Ekle'}</h6>
      </div>
      <div className="card-body">
        <form onSubmit={onSubmit}>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="row g-4">
                <PersonalInfo 
                  formData={formData} 
                  onChange={onChange} 
                />
                <LanguageSelector 
                  formData={formData}
                  onChange={onChange}
                  onLanguageChange={onLanguageChange}
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="row g-4">
                <RegionSelector 
                  formData={formData}
                  bolgeler={bolgeler}
                  onChange={onChange}
                  onSwitchChange={onSwitchChange}
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button type="submit" className="btn btn-primary me-2">
              {editingId ? 'Güncelle' : 'Rehber Ekle'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                İptal
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuideForm; 