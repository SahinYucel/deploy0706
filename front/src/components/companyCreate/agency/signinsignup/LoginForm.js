import React from 'react';

function LoginForm({ 
  error, 
  success, 
  loginForm, 
  handleLoginChange, 
  handleLogin, 
  rememberMe, 
  setRememberMe, 
  loggedInUser,
  setActiveForm 
}) {
  return (
    <div style={{display: 'block'}}>
      <h4>Giriş Yap</h4>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label htmlFor="loginUsername" className="form-label">Kullanıcı Adı:</label>
          <input
            type="text"
            className="form-control"
            id="loginUsername"
            name="username"
            value={loginForm.username}
            onChange={handleLoginChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="loginPosition" className="form-label">Kullanıcı seçin:</label>
          <select
            className="form-select"
            id="loginPosition"
            name="position"
            value={loginForm.position}
            onChange={handleLoginChange}
            required
          >
            <option value="">Seçiniz</option>
            <option value="admin">Admin</option>
            <option value="muhasebe">Muhasebe</option>
            <option value="operasyon">Operasyon</option>
          </select>
        </div>
        <div className="mb-3">
          <label htmlFor="loginPassword" className="form-label">Şifre:</label>
          <input
            type="password"
            className="form-control"
            id="loginPassword"
            name="password"
            value={loginForm.password}
            onChange={handleLoginChange}
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
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary">Giriş Yap</button>
          {!loggedInUser && (
            <button 
              type="button" 
              className="btn btn-outline-secondary"
              onClick={() => setActiveForm('register')}
            >
              Kayıt Ol
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default LoginForm; 