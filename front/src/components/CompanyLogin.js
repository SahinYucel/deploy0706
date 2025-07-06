import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyLogin } from '../services/api';

function CompanyLogin() {
  const [companyUser, setCompanyUser] = useState('');
  const [companyPass, setCompanyPass] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Sayfa yüklendiğinde kaydedilmiş bilgileri kontrol et
  useEffect(() => {
    const savedCredentials = localStorage.getItem('savedCredentials');
    if (savedCredentials) {
      const { username, password, position: savedPosition, remember } = JSON.parse(savedCredentials);
      if (remember) {
        setCompanyUser(username);
        setCompanyPass(password);
        setPosition(savedPosition);
        setRememberMe(true);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await companyLogin({
        companyUser,
        companyPass,
        position
      });
      
      // Beni hatırla seçeneği işaretliyse bilgileri kaydet
      if (rememberMe) {
        localStorage.setItem('savedCredentials', JSON.stringify({
          username: companyUser,
          password: companyPass,
          position: position,
          remember: true
        }));
      } else {
        // İşaretli değilse kaydedilmiş bilgileri sil
        localStorage.removeItem('savedCredentials');
      }

      localStorage.setItem('company', JSON.stringify(response.data.company));
      localStorage.setItem('subscription', JSON.stringify(response.data.subscription));
      
      if (position === 'Agency') {
        navigate('/companyAgencyDashboard');
      } else {
        setError('Bu pozisyon için giriş yetkisi bulunmamaktadır.');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        const expiryDate = new Date(err.response.data.expiredAt);
        setError(`Kullanım süreniz ${expiryDate.toLocaleDateString('tr-TR')} tarihinde sona ermiştir. Lütfen yönetici ile iletişime geçin.`);
      } else {
        setError(err.response?.data?.error || 'Giriş başarısız');
      }
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="text-center mb-4">Şirket Girişi</h2>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="companyUser" className="form-label">Kullanıcı Adı:</label>
                  <input
                    type="text"
                    className="form-control"
                    id="companyUser"
                    value={companyUser}
                    onChange={(e) => setCompanyUser(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="position" className="form-label">Pozisyon:</label>
                  <select
                    className="form-select"
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required
                  >
                    <option value="">Pozisyon Seçiniz</option>
                    <option value="Agency">Agency</option>
                    <option value="Tour Provider">Tour Provider</option>
                    <option value="Street Agency">Street Agency</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="companyPass" className="form-label">Şifre:</label>
                  <input
                    type="password"
                    className="form-control"
                    id="companyPass"
                    value={companyPass}
                    onChange={(e) => setCompanyPass(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Beni Hatırla
                  </label>
                </div>
                <button type="submit" className="btn btn-primary w-100">Giriş Yap</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyLogin; 