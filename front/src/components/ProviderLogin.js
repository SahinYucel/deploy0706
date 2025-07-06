import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProviderAuth } from '../context/ProviderAuthContext';
import { providerLogin } from '../services/api';
import { Form, Button, Card, Alert } from 'react-bootstrap';

const ProviderLogin = () => {
  const [credentials, setCredentials] = useState({
    companyRef: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { login } = useProviderAuth();

  useEffect(() => {
    const storedCompanyRef = localStorage.getItem('companyRef');
    const storedPassword = localStorage.getItem('password');
    if (storedCompanyRef) {
      setCredentials(prev => ({ ...prev, companyRef: storedCompanyRef }));
      setRememberMe(true);
    }
    if (storedPassword) {
      setCredentials(prev => ({ ...prev, password: storedPassword }));
    }
  }, []);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      
      const response = await providerLogin(credentials.companyRef, credentials.password);
      
      if (response.success) {
        if (rememberMe) {
          localStorage.setItem('companyRef', credentials.companyRef);
          localStorage.setItem('password', credentials.password);
        } else {
          localStorage.removeItem('companyRef');
          localStorage.removeItem('password');
        }
        localStorage.setItem('providerRef', response.providerRef);
        localStorage.setItem('isLoggedIn', 'true');
        login();
        navigate('/providers');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
      setError(errorMessage);
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <Card>
            <Card.Body>
              <h3 className="text-center mb-4">Provider Girişi</h3>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Referans Kodu</Form.Label>
                  <Form.Control
                    type="text"
                    name="companyRef"
                    value={credentials.companyRef}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Şifre</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox" 
                    label="Beni Hatırla" 
                    checked={rememberMe} 
                    onChange={handleRememberMeChange} 
                  />
                </Form.Group>
                <Button 
                  type="submit" 
                  className="w-100" 
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProviderLogin; 