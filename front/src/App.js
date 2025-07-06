import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import CompanyCreateLogin from './components/CompanyCreateLogin';
import Register from './components/Register';
import Dashboard from './components/companyCreate/Dashboard';
import CompanyManagement from './components/companyCreate/CompanyManagement';
import CompanyLogin from './components/CompanyLogin';
import CompanyAgencySlider from './components/companyCreate/agency/CompanyAgencySlider';
import ProviderLogin from './components/ProviderLogin';
import Providers from './components/Providers';
import { ProviderAuthProvider } from './context/ProviderAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
//import messaging from '@react-native-firebase/messaging';

// guide components


function App() {



  return (
    <ProviderAuthProvider>
      <Router>
        <div className="container-fluid p-0">
          <Routes>
            {/* Company Routes */}

            
            <Route path="/" element={<CompanyLogin />} />
            <Route path="/login" element={<CompanyCreateLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/company-management" element={<CompanyManagement />} />
            <Route path="/company-login" element={<CompanyLogin />} />
            <Route path="/companyAgencyDashboard/*" element={<CompanyAgencySlider />} />
            
            {/* Provider Routes */}
            <Route path="/provider-login" element={<ProviderLogin />} />
            <Route 
              path="/providers" 
              element={
                <ProtectedRoute>
                  <Providers />
                </ProtectedRoute>
              } 
            />
       
         
          </Routes>
        </div>
      </Router>
    </ProviderAuthProvider>
  );
}

export default App;
