import React, { useState } from 'react';

const CollectionForm = ({ onSubmit, safes }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    amount: '',
    safeId: '', // Hangi kasaya tahsilat yapılacak
    paymentMethod: 'cash',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      companyName: '',
      amount: '',
      safeId: '',
      paymentMethod: 'cash',
      description: ''
    });
  };

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h6 className="mb-0">Yeni Tahsilat Ekle</h6>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Şirket Adı</label>
              <input
                type="text"
                className="form-control"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Tutar</label>
              <input
                type="number"
                className="form-control"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Kasa Seçimi</label>
              <select
                className="form-select"
                name="safeId"
                value={formData.safeId}
                onChange={handleChange}
                required
              >
                <option value="">Kasa Seçiniz</option>
                {safes.map(safe => (
                  <option key={safe.id} value={safe.id}>
                    {safe.name} ({safe.type === 'cash' ? 'Nakit' : 'POS'})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Ödeme Yöntemi</label>
              <select
                className="form-select"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
              >
                <option value="cash">Nakit</option>
                <option value="card">Kredi Kartı</option>
                <option value="transfer">Havale/EFT</option>
              </select>
            </div>

            <div className="col-12">
              <label className="form-label">Açıklama</label>
              <input
                type="text"
                className="form-control"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Opsiyonel açıklama"
              />
            </div>
          </div>

          <div className="mt-4">
            <button type="submit" className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              Tahsilat Ekle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectionForm; 