import React from 'react';

function RegisterForm({ 
  error, 
  success, 
  registerForm, 
  handleRegisterChange, 
  handleRegister, 
  loggedInUser,
  setActiveForm 
}) {
  return (
    <div style={{display: 'block'}}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Kayıt Ol</h4>
        {loggedInUser?.position === 'admin' && (
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Yeni kullanıcı kaydı yapıyorsunuz
          </small>
        )}
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleRegister}>
        <div className="mb-3">
          <label htmlFor="registerUsername" className="form-label">Kullanıcı Adı:</label>
          <input
            type="text"
            className="form-control"
            id="registerUsername"
            name="username"
            value={registerForm.username}
            onChange={handleRegisterChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="verification" className="form-label">
            Verification Kodu:
            {loggedInUser?.position === 'admin' && (
              <small className="text-muted ms-2">(Otomatik dolduruldu)</small>
            )}
          </label>
          <input
            type="password"
            className="form-control"
            id="verification"
            name="verification"
            value={registerForm.verification}
            onChange={handleRegisterChange}
            required
            readOnly={loggedInUser?.position === 'admin'}
            autoComplete="new-password"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="registerPosition" className="form-label">Pozisyon:</label>
          <select
            className="form-select"
            id="registerPosition"
            name="position"
            value={registerForm.position}
            onChange={handleRegisterChange}
            required
          >
            <option value="">Pozisyon Seçiniz</option>
            <option value="admin">Admin</option>
            <option value="muhasebe">Muhasebe</option>
            <option value="operasyon">Operasyon</option>
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="registerPassword" className="form-label">Şifre:</label>
          <input
            type="password"
            className="form-control"
            id="registerPassword"
            name="password"
            value={registerForm.password}
            onChange={handleRegisterChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="confirmPassword" className="form-label">Şifre Tekrar:</label>
          <input
            type="password"
            className="form-control"
            id="confirmPassword"
            name="confirmPassword"
            value={registerForm.confirmPassword}
            onChange={handleRegisterChange}
            required
          />
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-success">Kayıt Ol</button>
          <button 
            type="button" 
            className="btn btn-outline-secondary"
            onClick={() => setActiveForm('login')}
          >
            Geri dön
          </button>
        </div>
      </form>
    </div>
  );
}

export default RegisterForm; 