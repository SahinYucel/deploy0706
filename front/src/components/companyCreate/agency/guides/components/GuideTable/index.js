import React, { useState } from 'react';
import GuideSettingsModal from '../GuideSettingsModal';

const GuideTable = ({ guides, onEdit, onDelete, onSettingsSave }) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState(null);

  const handleSettingsClick = (guide) => {
    setSelectedGuide(guide);
    setShowSettingsModal(true);
  };

  const handleSettingsSave = (settings) => {
    if (selectedGuide) {
      onSettingsSave(selectedGuide.id, settings);
    }
    setShowSettingsModal(false);
    setSelectedGuide(null);
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>İsim</th>
            <th>Soyisim</th>
            <th>Kod</th>
            <th>Hakediş Oranı</th>
            <th>Şifre</th>
            <th>Bölgeler</th>
            <th>Diller</th>
            <th>Telefon</th>
            <th>Durum</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {guides.map((guide) => (
            <tr key={guide.id}>

              <td>{guide.name}</td>
              <td>{guide.surname}</td>
              <td>{guide.code}</td>
              <td>{guide.entitlement}%</td>
              <td>{guide.guide_password}</td>
              <td>{Array.isArray(guide.region) ? guide.region.join(', ') : guide.region}</td>
              <td>{guide.languagesDisplay}</td>
              <td>{guide.phone}</td>
              <td>
                <span className={`badge ${guide.isActive ? 'bg-success' : 'bg-danger'}`}>
                  {guide.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-primary me-2"
                  onClick={() => onEdit(guide)}
                >
                  Düzenle
                </button>
                <button
                  className="btn btn-sm btn-danger me-2"
                  onClick={() => onDelete(guide.id)}
                >
                  Sil
                </button>
               
              </td>
            </tr>
          ))}
        </tbody>
      </table>

   
    </div>
  );
};

export default GuideTable; 