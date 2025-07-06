import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { registerAgencyRoleMember, loginAgencyRoleMember } from '../../../services/api';
import LoginForm from './signinsignup/LoginForm';
import RegisterForm from './signinsignup/RegisterForm';

function DashboardHome({ company, subscription, setIsLoggedIn }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showForms, setShowForms] = useState(false);
  const [activeForm, setActiveForm] = useState('login'); // 'login' veya 'register'
  const [rememberMe, setRememberMe] = useState(false);
  
  // Form state'leri
  const [loginForm, setLoginForm] = useState({
    username: '',
    position: '',
    password: ''
  });
  
  const [registerForm, setRegisterForm] = useState({
    username: '',
    verification: '',
    position: '',
    password: '',
    confirmPassword: ''
  });

  // Memoize company info to prevent re-renders
  const companyInfo = useMemo(() => ({
    companyName: company.company_name,
    position: company.position,
    refCode: company.ref_code,
    durationUse: company.duration_use,
    createdAt: new Date(company.created_at).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    expiryDate: new Date(subscription.expiryDate).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }), [company, subscription.expiryDate]);

  useEffect(() => {
    const initializeState = () => {
      const agencyUserStr = localStorage.getItem('agencyUser');
      const savedCredentialsStr = localStorage.getItem('savedAgencyCredentials');
      
      if (agencyUserStr) {
        const agencyUser = JSON.parse(agencyUserStr);
        setLoggedInUser(agencyUser);
        setIsLoggedIn(true);
        setShowForms(false);
      } else {
        setIsLoggedIn(false);
        setLoggedInUser(null);
        setShowForms(true);
      }

      if (savedCredentialsStr) {
        const credentials = JSON.parse(savedCredentialsStr);
        if (credentials.remember) {
          setLoginForm({
            username: credentials.username,
            position: credentials.position,
            password: credentials.password
          });
          setRememberMe(true);
        }
      }
    };

    initializeState();
  }, [setIsLoggedIn]);

  // Otomatik verification kodu doldurma
  useEffect(() => {
    if (loggedInUser?.position === 'admin' && showForms) {
      setRegisterForm(prev => ({
        ...prev,
        verification: company.verification
      }));
    }
  }, [loggedInUser, showForms, company.verification]);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await loginAgencyRoleMember({
        ...loginForm,
        companyId: company.id
      });

      if (response.data.user) {
        const storageUpdates = {
          agencyUser: JSON.stringify(response.data.user),
          [`rolePermissions_${company.id}`]: JSON.stringify({
            [loginForm.position]: response.data.permissions
          })
        };

        if (rememberMe) {
          storageUpdates.savedAgencyCredentials = JSON.stringify({
            ...loginForm,
            remember: true
          });
        } else {
          localStorage.removeItem('savedAgencyCredentials');
        }

        Object.entries(storageUpdates).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });

        setLoggedInUser(response.data.user);
        setIsLoggedIn(true);
        setSuccess('Giriş başarılı');
        setLoginForm({ username: '', position: '', password: '' });
        setShowForms(false);
        window.location.reload();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş sırasında bir hata oluştu');
      setIsLoggedIn(false);
      setLoggedInUser(null);
      localStorage.removeItem('agencyUser');
      localStorage.removeItem(`rolePermissions_${company.id}`);
    }
  }, [company.id, loginForm, rememberMe, setIsLoggedIn]);

  const handleRegister = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!registerForm.verification) {
      setError('Verification kodu zorunludur');
      return;
    }

    if (registerForm.verification !== company.verification) {
      setError('Verification kodu hatalı! Lütfen şirket bilgilerinde görünen kodu giriniz.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    try {
      const response = await registerAgencyRoleMember({
        username: registerForm.username,
        position: registerForm.position,
        password: registerForm.password,
        verification: registerForm.verification.trim(),
        companyId: company.id
      });

      if (response && response.data) {
        setSuccess('Kayıt başarıyla tamamlandı');
        setRegisterForm({
          username: '',
          verification: '',
          position: '',
          password: '',
          confirmPassword: ''
        });
        setActiveForm('login');
        setShowForms(false);
      }
    } catch (err) {
      console.error('Kayıt hatası:', err.response?.data);
      setError(err.response?.data?.error || 'Kayıt sırasında bir hata oluştu');
    }
  }, [company.id, company.verification, registerForm]);

  return (
    <div className="container">
      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>Şirket Dashboard</h2>
              {loggedInUser && (
                <p className="text-muted mb-2">
                  Giriş Yapan Kullanıcı: <strong>{loggedInUser.username}</strong> ({loggedInUser.position})
                </p>
              )}
              <div className="subscription-info">
                <span className={`badge ${subscription.remainingDays > 30 ? 'bg-success' : 'bg-warning'}`}>
                  Kalan Süre: {subscription.remainingDays} gün
                </span>
              </div>
            </div>
            {loggedInUser && (
              <div>
                <button 
                  className="btn btn-outline-primary me-2"
                  onClick={() => {
                    setShowForms(true);
                    setActiveForm('login');
                  }}
                >
                  <i className="bi bi-person-fill me-1"></i>
                  Kullanıcı Değiştir
                </button>
                {loggedInUser.position === 'admin' && (
                  <button 
                    className="btn btn-outline-success me-2"
                    onClick={() => {
                      setShowForms(true);
                      setActiveForm('register');
                    }}
                  >
                    <i className="bi bi-person-plus-fill me-1"></i>
                    Yeni Kullanıcı Ekle
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="company-info mb-4">
            <h4>Şirket Bilgileri</h4>
            
            <div className="row mt-5">
              <div className="col-md-6">
                <p><strong>Şirket Adı:</strong> {company.company_name}</p>
                <p><strong>Pozisyon:</strong> {company.position}</p>
                <p><strong>Referans Kodu:</strong> {company.ref_code}</p>
              </div>
              <div className="col-md-6">
                <p><strong>Kullanım Süresi:</strong> {company.duration_use} Yıl</p>
                <p><strong>Başlangıç Tarihi:</strong> {new Date(company.created_at).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
                <p><strong>Bitiş Tarihi:</strong> {new Date(subscription.expiryDate).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='card mt-5' style={{display: !loggedInUser || showForms ? 'block' : 'none'}}>
        <div className='card-body'>
          <div className="row">
            {activeForm === 'login' && (
              <LoginForm
                error={error}
                success={success}
                loginForm={loginForm}
                handleLoginChange={handleLoginChange}
                handleLogin={handleLogin}
                rememberMe={rememberMe}
                setRememberMe={setRememberMe}
                loggedInUser={loggedInUser}
                setActiveForm={setActiveForm}
              />
            )}

            {activeForm === 'register' && (
              <RegisterForm
                error={error}
                success={success}
                registerForm={registerForm}
                handleRegisterChange={handleRegisterChange}
                handleRegister={handleRegister}
                loggedInUser={loggedInUser}
                setActiveForm={setActiveForm}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome; 