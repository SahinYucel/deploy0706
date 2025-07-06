import React from 'react';

const TourHeader = ({ 
  isEditing, 
  isCollapsed, 
  onCollapse, 
  onCancel 
}) => {
  return (
    <div 
      className="card-header" 
      style={{ cursor: 'pointer' }}
      onClick={onCollapse}
    >
      <div className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">
          <i className={`bi ${isEditing ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
          {isEditing ? 'Tur Düzenle' : 'Tur Oluştur'}
        </h4>
        <div>
          {isEditing && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary me-2"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              <i className="bi bi-x-lg me-1"></i>
              İptal
            </button>
          )}
          <i className={`bi ${isCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'}`}></i>
        </div>
      </div>
    </div>
  );
};

export default TourHeader; 