
/*bu sayfa şirket oluşturma sayfasıdır şirket kayıt ekranının dashboardıdır.*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveCompany } from '../../services/api';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [position, setposition] = useState("");
  const [refcode, setrefCode] = useState("");
  const [companyUser, setcompanyUser] = useState("");
  const [companyPass, setcompanyPass] = useState("");
  const [durationuse, setdurationuse] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (companyName.length >= 3) {
      const prefix = companyName.substring(0, 3).toUpperCase();
      const randomNum = Math.floor(1000 + Math.random() * 9000); // 1000-9999 arası rastgele sayı
      setrefCode(`${prefix}${randomNum}`);
    }
  }, [companyName]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userStr));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  const generateVerificationCode = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSaveCompany = async () => {
    // Form validasyonu
    if (!companyName || !position || !refcode || !companyUser || !companyPass || !durationuse) {
      alert('Lütfen tüm alanları doldurunuz!');
      return;
    }

    try {
      const verificationCode = generateVerificationCode();
      const companyData = {
        companyName,
        position,
        refcode,
        companyUser,
        companyPass,
        durationuse,
        verification: verificationCode
      };
      
      const response = await saveCompany(companyData);
      if (response){
        alert('Şirket bilgileri başarıyla kaydedildi!');
      }
      
      // Reset form
      setCompanyName("");
      setposition("");
      setrefCode("");
      setcompanyUser("");
      setcompanyPass("");
      setdurationuse("");
    } catch (error) {
      alert('Hata oluştu: ' + error.message);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Şirket Kayıt ekranı</h2>
            <div>
              <button className="btn btn-info me-2" onClick={() => navigate('/company-management')}>
                Şirket Yönetimi
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                Çıkış Yap
              </button>
            </div>
          </div>
          <div className="user-info">
            <h4>Kullanıcı Bilgileri</h4>
            <div className="mb-3">
              <strong>Kullanıcı Adı:</strong> {user.username}
            </div>
            <div className="mb-3">
              <strong>Email:</strong> {user.email}
            </div>
            <div className='row'>
              <div className='col-md-12'>
                <div className='card'>
                  <div className='card-body'>
                    <div className='row d-flex align-items-center mt-3'>
                      <div className='col-md-2'>
                        <label htmlFor="Company Name" className="form-label">Company Name</label>
                      </div>
                      <div className='col-md-10'>
                              <input
                                type="text"
                                className="form-control"
                                id="Company Name"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                          />
                      </div>
                    </div>

                    <div className='row d-flex align-items-center mt-3'>
                      <div className='col-md-2'>
                        <label htmlFor="Position" className="form-label">Position</label>
                      </div>
                      <div className='col-md-10'>
                      <select
                          className="form-select"
                          id="Position"
                          value={position}
                          onChange={(e) => setposition(e.target.value)}
                          required
                        >
                          <option value="">Pozisyon Seçiniz</option>
                          <option value="Agency">Agency</option>
                          <option value="Tour Provider">Tour Provider</option>
                          <option value="Street Agency">Street Agency</option>
                        </select>
                      </div>
                    </div>
                
                    <div className='row d-flex align-items-center mt-3'>
                      <div className='col-md-2'>
                        <label htmlFor="refcode" className="form-label">refcode</label>
                      </div>
                      <div className='col-md-10'>
                              <input
                            type="text"
                            className="form-control"
                            id="refcode"
                            value={refcode}
                            readOnly
                            required
                            style={{opacity: 0.5}}
                          />
                      </div>
                    </div>

                    <div className='row d-flex align-items-center mt-3'>
                      <div className='col-md-2'>
                        <label htmlFor="Company User" className="form-label">Company User</label>
                      </div>
                      <div className='col-md-10'>
                              <input
                            type="text"
                            className="form-control"
                            id="Company User"
                            value={companyUser}
                            onChange={(e) => setcompanyUser(e.target.value)}
                            required
                          />
                      </div>
                    </div>

                    <div className='row d-flex align-items-center mt-3'>
                      <div className='col-md-2'>
                        <label htmlFor="companyPass" className="form-label">Company Password</label>
                      </div>
                      <div className='col-md-10'>
                              <input
                            type="text"
                            className="form-control"
                            id="companyPass"
                            value={companyPass}
                            onChange={(e) => setcompanyPass(e.target.value)}
                            required
                          />
                      </div>
                    </div>

                    <div className='row d-flex align-items-center mt-3'>
                      <div className='col-md-2'>
                        <label htmlFor="durationuse" className="form-label">Duration of use</label>
                      </div>
                      <div className='col-md-10'>
                      <select
                          className="form-select"
                          id="durationuse"
                          value={durationuse}
                          onChange={(e) => setdurationuse(e.target.value)}
                          required
                        >
                          <option value="">Kullanım süresini seçiniz</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                      </div>
                    </div>

                    <div className='row d-flex align-items-center mt-3'>
                      <div className='col-md-12'>
                        <button className='btn btn-primary w-100' onClick={handleSaveCompany}>Kaydet</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 