import React, { useState, useEffect } from 'react';
import { createBackup, restoreBackup, getAutoBackupStatus, toggleAutoBackup } from '../../../services/api';

const DatabaseBackup = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '', details: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);

  useEffect(() => {
    const checkAutoBackupStatus = async () => {
      try {
        const response = await getAutoBackupStatus(1);
        setAutoBackupEnabled(response.data.enabled);
      } catch (error) {
        console.error('Otomatik yedekleme durumu kontrol edilemedi:', error);
      }
    };

    checkAutoBackupStatus();
  }, []);

  const handleAutoBackupToggle = async () => {
    try {
      setLoading(true);
      const response = await toggleAutoBackup(1, !autoBackupEnabled);

      if (response.data.success) {
        setAutoBackupEnabled(!autoBackupEnabled);
        setMessage({
          type: 'success',
          text: response.data.message
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Otomatik yedekleme ayarı değiştirilirken bir hata oluştu',
        details: error.response?.data?.details || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '', details: '' });
      
      const company = JSON.parse(localStorage.getItem('company'));
      const companyName = company ? company.company_name : 'default';
      
      const currentDate = new Date().toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\./g, '-');

      const response = await createBackup(1, `${companyName}_${currentDate}`);
      
      setMessage({
        type: 'success',
        text: 'Veritabanı yedeği başarıyla alındı!',
        details: `Dosya adı: ${response.data.fileName}`
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Yedekleme sırasında bir hata oluştu',
        details: error.response?.data?.details || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      setMessage({
        type: 'error',
        text: 'Lütfen bir yedek dosyası seçin'
      });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '', details: '' });

      const formData = new FormData();
      formData.append('backupFile', selectedFile);

      const response = await restoreBackup(formData);

      setMessage({
        type: 'success',
        text: 'Veritabanı başarıyla geri yüklendi!',
        details: `Dosya adı: ${response.data.fileName}`
      });
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Geri yükleme sırasında bir hata oluştu',
        details: error.response?.data?.details || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="card">
        <div className="card-body">
          <h5 className="card-title mb-4">Veritabanı Yedekleme ve Geri Yükleme</h5>

          {message.text && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mb-4`} role="alert">
              <h6 className="alert-heading">{message.text}</h6>
              {message.details && <small className="d-block mt-2">{message.details}</small>}
            </div>
          )}

          <div className="mb-4">
            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="autoBackup"
                checked={autoBackupEnabled}
                onChange={handleAutoBackupToggle}
                disabled={loading}
              />
              <label className="form-check-label" htmlFor="autoBackup">
                Otomatik Günlük Yedekleme (Her gece 00:00'da)
              </label>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleBackup}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Yedekleniyor...
                </>
              ) : (
                <>
                  <i className="bi bi-download me-2"></i>
                  Yedek Al
                </>
              )}
            </button>
          </div>

          <div className="mt-4">
            <h6 className="mb-3">Yedek Dosyasından Geri Yükle</h6>
            
            <div className="mb-3">
              <div className="input-group">
                <input
                  type="file"
                  className="form-control"
                  accept=".sql"
                  onChange={handleFileSelect}
                  id="backupFile"
                />
                <button
                  className="btn btn-warning"
                  onClick={handleRestore}
                  disabled={!selectedFile || loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Yükleniyor...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload me-2"></i>
                      Geri Yükle
                    </>
                  )}
                </button>
              </div>
              {selectedFile && (
                <div className="form-text">
                  Seçilen dosya: {selectedFile.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseBackup; 