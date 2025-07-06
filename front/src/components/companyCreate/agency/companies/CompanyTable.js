import React from 'react'

const CompanyTable = ({ companies, editingId, onEdit, onSave, onDelete, onInputChange }) => {
  return (
    <div className="row mt-4">
      <div className="col-12">
        <div style={{ 
          maxHeight: '500px', 
          overflowY: 'auto',
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          <table className="table table-striped table-hover mb-0">
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
              <tr>
                <th>AlphanumericId</th>
                <th>Şirket İsmi</th>
                <th>Telefon</th>
                <th>Şifre</th>
                <th>Giriş Saati</th>
                <th>Son değiştirme Saati</th>
                <th>Operatör Tipi</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(company => (
                <tr key={company.id}>
                  <td>
                    <span className="badge bg-secondary">{company.alphanumericId}</span>
                  </td>
                  <td>
                    {editingId === company.id ? (
                      <input
                        type="text"
                        className="form-control"
                        name="companyName"
                        value={company.companyName}
                        onChange={(e) => onInputChange(e, company.id)}
                      />
                    ) : company.companyName}
                  </td>
                  <td>
                    {editingId === company.id ? (
                      <div className="input-group">
                        <span className="input-group-text">+90</span>
                        <input
                          type="tel"
                          className="form-control"
                          name="phoneNumber"
                          value={company.phoneNumber.replace('+90 ', '')}
                          onChange={(e) => onInputChange(e, company.id)}
                          maxLength="12"
                        />
                      </div>
                    ) : company.phoneNumber}
                  </td>
                  <td>
                    {editingId === company.id ? (
                      <input
                        type="text"
                        className="form-control"
                        name="password"
                        value={company.password || ''}
                        onChange={(e) => onInputChange(e, company.id)}
                        placeholder="Şifre (opsiyonel)"
                      />
                    ) : company.password || '-'}
                  </td>
                  <td>
                    {editingId === company.id ? (
                      <div className="d-flex gap-2">
                        <select
                          className="form-select"
                          style={{ width: '70px' }}
                          value={company.entryTime.split(':')[0]}
                          onChange={(e) => {
                            const minutes = company.entryTime.split(':')[1];
                            onInputChange({
                              target: {
                                name: 'entryTime',
                                value: `${e.target.value}:${minutes}`
                              }
                            }, company.id);
                          }}
                        >
                          {[...Array(24)].map((_, i) => (
                            <option key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        <select
                          className="form-select"
                          style={{ width: '70px' }}
                          value={company.entryTime.split(':')[1]}
                          onChange={(e) => {
                            const hours = company.entryTime.split(':')[0];
                            onInputChange({
                              target: {
                                name: 'entryTime',
                                value: `${hours}:${e.target.value}`
                              }
                            }, company.id);
                          }}
                        >
                          {[...Array(60)].map((_, i) => (
                            <option key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : company.entryTime}
                  </td>
                  <td>
                    {editingId === company.id ? (
                      <div className="d-flex gap-2">
                        <select
                          className="form-select"
                          style={{ width: '70px' }}
                          value={company.exitTime?.split(':')[0] || '20'}
                          onChange={(e) => {
                            const minutes = company.exitTime?.split(':')[1] || '00';
                            onInputChange({
                              target: {
                                name: 'exitTime',
                                value: `${e.target.value}:${minutes}`
                              }
                            }, company.id);
                          }}
                        >
                          {[...Array(24)].map((_, i) => (
                            <option key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        <select
                          className="form-select"
                          style={{ width: '70px' }}
                          value={company.exitTime?.split(':')[1] || '00'}
                          onChange={(e) => {
                            const hours = company.exitTime?.split(':')[0] || '20';
                            onInputChange({
                              target: {
                                name: 'exitTime',
                                value: `${hours}:${e.target.value}`
                              }
                            }, company.id);
                          }}
                        >
                          {[...Array(60)].map((_, i) => (
                            <option key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : company.exitTime || '20:00'}
                  </td>
                  <td>
                    {editingId === company.id ? (
                      <select
                        className="form-select"
                        name="operatorType"
                        value={company.operatorType}
                        onChange={(e) => onInputChange(e, company.id)}
                      >
                        <option value="Tour">Tour</option>
                        <option value="Shop">Shop</option>
                        <option value="Restaurant">Restaurant</option>
                      </select>
                    ) : (
                      <span className="badge bg-info">
                        {company.operatorType}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        name="status"
                        checked={company.status}
                        onChange={(e) => onInputChange({ target: { name: 'status', value: e.target.checked }}, company.id)}
                      />
                    </div>
                  </td>
                  <td>
                    {editingId === company.id ? (
                      <button 
                        className="btn btn-sm btn-success me-2"
                        onClick={() => onSave(company.id)}
                      >
                        Kaydet
                      </button>
                    ) : (
                      <button 
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => onEdit(company.id)}
                      >
                        Düzenle
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => onDelete(company.id)}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CompanyTable 