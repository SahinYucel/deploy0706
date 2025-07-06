

/*bu sayfa şirket yönetimi sayfasıdır şirket yönetimi ekranının dashboardıdır.*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanies, updateCompany, deleteCompany } from '../../services/api';

function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }

    fetchCompanies();
  }, [navigate]);

  const fetchCompanies = async () => {
    try {
      const response = await getCompanies();
      console.log('Gelen veriler:', response.data); // Debug için
      setCompanies(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Şirketler yüklenirken hata oluştu:', error);
      setLoading(false);
    }
  };

  const handleEdit = (company) => {
    setEditingCompany({ ...company });
  };

  const handleUpdate = async () => {
    try {
      const updateData = {
        companyName: editingCompany.company_name,
        position: editingCompany.position,
        companyUser: editingCompany.company_user,
        durationuse: editingCompany.duration_use
      };
      await updateCompany(editingCompany.id, updateData);
      setEditingCompany(null);
      fetchCompanies();
      alert('Şirket başarıyla güncellendi!');
    } catch (error) {
      alert('Güncelleme sırasında hata oluştu: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu şirketi silmek istediğinizden emin misiniz?')) {
      try {
        await deleteCompany(id);
        fetchCompanies();
        alert('Şirket başarıyla silindi!');
      } catch (error) {
        alert('Silme işlemi sırasında hata oluştu: ' + error.message);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return <div className="container mt-5">Yükleniyor...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Şirket Yönetimi</h2>
            <div>
              <button className="btn btn-secondary me-2" onClick={handleBack}>
                Geri Dön
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                Çıkış Yap
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Şirket Adı</th>
                  <th>Pozisyon</th>
                  <th>Referans Kodu</th>
                  <th>Kullanıcı Adı</th>
                  <th>Kullanım Süresi</th>
                  <th>Verification Kodu</th>
                  <th>Oluşturma Tarihi</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(company => (
                  <tr key={company.id}>
                    <td>
                      {editingCompany && editingCompany.id === company.id ? (
                        <input
                          type="text"
                          className="form-control"
                          value={editingCompany.company_name}
                          onChange={(e) => setEditingCompany({
                            ...editingCompany,
                            company_name: e.target.value
                          })}
                        />
                      ) : (
                        company.company_name
                      )}
                    </td>
                    <td>
                      {editingCompany && editingCompany.id === company.id ? (
                        <select
                          className="form-select"
                          value={editingCompany.position}
                          onChange={(e) => setEditingCompany({
                            ...editingCompany,
                            position: e.target.value
                          })}
                        >
                          <option value="Agency">Agency</option>
                          <option value="Tour Provider">Tour Provider</option>
                          <option value="Street Agency">Street Agency</option>
                        </select>
                      ) : (
                        company.position
                      )}
                    </td>
                    <td>{company.ref_code}</td>
                    <td>
                      {editingCompany && editingCompany.id === company.id ? (
                        <input
                          type="text"
                          className="form-control"
                          value={editingCompany.company_user}
                          onChange={(e) => setEditingCompany({
                            ...editingCompany,
                            company_user: e.target.value
                          })}
                        />
                      ) : (
                        company.company_user
                      )}
                    </td>
                    <td>
                      {editingCompany && editingCompany.id === company.id ? (
                        <select
                          className="form-select"
                          value={editingCompany.duration_use}
                          onChange={(e) => setEditingCompany({
                            ...editingCompany,
                            duration_use: e.target.value
                          })}
                        >
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                      ) : (
                        company.duration_use
                      )}
                    </td>
                    <td>{company.verification}</td>
                    <td>
                      {new Date(company.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </td>
                    <td>
                      {editingCompany && editingCompany.id === company.id ? (
                        <>
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={handleUpdate}
                          >
                            Kaydet
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setEditingCompany(null)}
                          >
                            İptal
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-primary btn-sm me-2"
                            onClick={() => handleEdit(company)}
                          >
                            Düzenle
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(company.id)}
                          >
                            Sil
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyManagement; 