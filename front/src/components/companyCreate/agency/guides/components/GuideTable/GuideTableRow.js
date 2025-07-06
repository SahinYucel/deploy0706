import React from 'react';

const GuideTableRow = ({ guide, onEdit, onDelete, onSettingsClick }) => {
  return (
    <tr>
      <td>{guide.code}</td>
      <td>{guide.name}</td>
      <td>{guide.surname}</td>
      <td>{guide.guideGroup}</td>
      <td>{guide.entitlement ? `%${guide.entitlement}` : '%0'}</td>
      <td>{Array.isArray(guide.region) ? guide.region.join(', ') : guide.region}</td>
      <td>
        {Object.entries(guide.languages || {})
          .filter(([_, isSelected]) => isSelected)
          .map(([lang]) => lang)
          .join(', ')}
        {guide.otherLanguages && `, ${guide.otherLanguages}`}
      </td>
      <td>{guide.phone}</td>
      <td>
        <span className={`badge ${guide.isActive ? 'bg-success' : 'bg-danger'}`}>
          {guide.isActive ? 'Aktif' : 'Pasif'}
        </span>
      </td>
      <td>
        <div className="btn-group">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => onEdit(guide)}
          >
            <i className="bi bi-pencil"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => onDelete(guide.id)}
          >
            <i className="bi bi-trash"></i>
          </button>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => onSettingsClick(guide)}
          >
            <i className="bi bi-gear"></i>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default GuideTableRow;