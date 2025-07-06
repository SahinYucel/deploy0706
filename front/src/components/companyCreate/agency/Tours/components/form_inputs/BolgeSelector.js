import React from 'react';

const BolgeSelector = ({ value = [], onChange, bolgeler }) => {
  const handleBolgeChange = (bolgeId) => {
    let newValue = [...value];
    
    if (newValue.includes(bolgeId)) {
      // Eğer zaten seçiliyse, seçimi kaldır
      newValue = newValue.filter(id => id !== bolgeId);
    } else {
      // Seçili değilse, ekle
      newValue.push(bolgeId);
    }
    
    onChange({ target: { name: 'bolgeId', value: newValue } });
  };

  return (
    <div className="mb-3">
      <label className="form-label d-block">
        <i className="bi bi-geo-alt me-2"></i>
        Bölgelendirme
      </label>
      <div className="border rounded p-3">
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
          {Array.isArray(bolgeler) && bolgeler.length > 0 ? (
            bolgeler.map(bolge => (
              <div key={bolge.id} className="col">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`bolge-${bolge.id}`}
                    checked={value.includes(bolge.id)}
                    onChange={() => handleBolgeChange(bolge.id)}
                  />
                  <label className="form-check-label" htmlFor={`bolge-${bolge.id}`}>
                    {bolge.name}
                  </label>
                </div>
              </div>
            ))
          ) : (
            <div className="col">
              <p className="text-muted mb-0">Bölge bulunamadı</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BolgeSelector; 