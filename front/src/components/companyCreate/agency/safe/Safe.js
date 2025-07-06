import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Currency from './Currency';
import { getSafes, saveSafe, deleteSafe } from '../../../../services/api';

export default function Safe() {
  const [safes, setSafes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    type: '', // 'cash' or 'card'
    pos_commission_rate: '',
    balance: '0', // Varsayılan değer 0
    negativebalance: '0', // Varsayılan değer 0
    created_at: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const navigate = useNavigate();

  const formatDate = (date) => {
    return new Date(date).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // İşlem no'ya tıklama fonksiyonu
  const handleTransactionClick = (transactionNo) => {
    if (transactionNo) {
      // localStorage'a işlem no'yu kaydet
      localStorage.setItem('collectionTransactionFilter', transactionNo);
      // GuideOperations sayfasına yönlendir
      navigate('/companyAgencyDashboard/guide-operations');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Eğer nakit seçilirse komisyon oranını sıfırla
      ...(name === 'type' && value === 'cash' ? { pos_commission_rate: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await saveSafe(companyId, {
        id: editingId,
        ...formData
      });

      // Kasaları yeniden yükle
      const loadedSafes = await getSafes(companyId);
      setSafes(loadedSafes);

      // Formu temizle
      setFormData({ name: '', type: '', pos_commission_rate: '', balance: '0', negativebalance: '0', created_at: '' });
      setEditingId(null);

    } catch (err) {
      setError('Kasa kaydedilirken bir hata oluştu');
      console.error('Error saving safe:', err);
    }
  };

  const handleEdit = (safe) => {
    setFormData({
      name: safe.name,
      type: safe.type,
      pos_commission_rate: safe.pos_commission_rate,
      balance: safe.balance,
      negativebalance: safe.negativebalance,
      created_at: safe.created_at
    });
    setEditingId(safe.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu kasayı silmek istediğinizden emin misiniz?')) {
      try {
        await deleteSafe(id);
        setSafes(prev => prev.filter(safe => safe.id !== id));
      } catch (err) {
        setError('Kasa silinirken bir hata oluştu');
        console.error('Error deleting safe:', err);
      }
    }
  };

  // CompanyId'yi localStorage'dan al
  useEffect(() => {
    const agencyUser = JSON.parse(localStorage.getItem('agencyUser'));
    if (agencyUser?.companyId) {
      setCompanyId(agencyUser.companyId);
    }
  }, []);

  // Kasaları yükle
  useEffect(() => {
    const loadSafes = async () => {
      if (!companyId) return;
      
      try {
        const loadedSafes = await getSafes(companyId);
        setSafes(loadedSafes);
      } catch (error) {
        setError('Kasalar yüklenirken bir hata oluştu');
        console.error('Error loading safes:', error);
      }
    };

    loadSafes();
  }, [companyId]);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Kasa Yönetimi</h2>
       
      </div>

      {/* Kur Ayarları Bileşeni */}
      <Currency />
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button 
            type="button" 
            className="btn-close float-end" 
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-3">
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Kasa İsmi</label>
                  <input 
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Kasa ismini giriniz"
                    required
                    
                  />
                </div>
              </div>
              <div className="col-md-2">
                <div className="mb-3">
                  <label htmlFor="type" className="form-label">Kasa Tipi</label>
                  <select
                    className="form-select"
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seçiniz</option>
                    <option value="cash">Nakit</option>
                    <option value="card">Kart</option>
                  </select>
                </div>
              </div>
              {formData.type === 'card' && (
                <div className="col-md-2">
                  <div className="mb-3">
                    <label htmlFor="pos_commission_rate" className="form-label">Kart Komisyon (%)</label>
                    <input 
                      type="number"
                      className="form-control"
                      id="pos_commission_rate"
                      name="pos_commission_rate"
                      value={formData.pos_commission_rate}
                      onChange={handleInputChange}
                      placeholder="Oran giriniz"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>
              )}
              <div className="col-md-3">
                <div className="mb-3">
                  <label htmlFor="balance" className="form-label">Kasa Gelir</label>
                  <input 
                    type="number"
                    className="form-control"
                    id="balance"
                    name="balance"
                    value={formData.balance}
                    onChange={handleInputChange}
                    placeholder="Kasa değerini giriniz"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label htmlFor="negativebalance" className="form-label">Kasa Gider</label>
                  <input 
                    type="number"
                    className="form-control"
                    id="negativebalance"
                    name="negativebalance"
                    value={formData.negativebalance}
                    onChange={handleInputChange}
                    placeholder="Kasa değerini giriniz"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="col-md-2 d-flex align-items-end mb-3">
                <button 
                  type="submit" 
                  className={`btn ${editingId ? 'btn-success' : 'btn-primary'} w-100`}
                >
                  {editingId ? 'Güncelle' : 'OLUŞTUR'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Kasa İsmi</th>
                  <th>Kasa Tipi</th>
                  <th>POS Komisyon Oranı</th>
                  <th>Kasa Gelir</th>
                  <th>Kasa Gider</th>
                  <th>Oluşturma Tarihi</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {safes.map(safe => (
                  <tr key={safe.id}>
                    <td>{safe.name}</td>
                    <td>{safe.type === 'cash' ? 'Nakit' : 'Kart'}</td>
                    <td>{safe.type === 'card' ? `%${safe.pos_commission_rate}` : '-'}</td>
                    <td>{formatCurrency(safe.balance)}</td>
                    <td>{formatCurrency(safe.negativebalance || 0)}</td>
                    <td>{formatDate(safe.created_at)}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => handleEdit(safe)}
                      >
                        Düzenle
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(safe.id)}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
                {safes.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Henüz kasa eklenmemiş
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
