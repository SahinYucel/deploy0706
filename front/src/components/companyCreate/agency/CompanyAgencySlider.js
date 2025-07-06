import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import MenuSliderRoute from './MenuSliderRoute';
import { loadMenuItems } from './CompanyAgencySliderPermission';

// Add CSS for popup menu
const popupMenuStyle = {
  position: 'absolute',
  left: '100%',
  top: '0',
  backgroundColor: '#343a40',
  borderRadius: '0 4px 4px 0',
  boxShadow: '2px 0 5px rgba(0,0,0,0.2)',
  zIndex: 1050,
  minWidth: '200px'
};

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center p-5">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Yükleniyor...</span>
    </div>
  </div>
);

function CompanyAgencySlider() {
  const [company, setCompany] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [menuItems, setMenuItems] = useState([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [activePopupMenu, setActivePopupMenu] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initializeState = () => {
      const companyStr = localStorage.getItem('company');
      const subscriptionStr = localStorage.getItem('subscription');
      const agencyUserStr = localStorage.getItem('agencyUser');
      
      if (!companyStr || !subscriptionStr) {
        navigate('/company-login');
        return;
      }

      const subscription = JSON.parse(subscriptionStr);
      const now = new Date();
      const expiryDate = new Date(subscription.expiryDate);

      if (now > expiryDate) {
        localStorage.removeItem('company');
        localStorage.removeItem('subscription');
        localStorage.removeItem('agencyUser');
        navigate('/company-login');
        return;
      }

      setCompany(JSON.parse(companyStr));
      setSubscription(subscription);
      
      if (agencyUserStr) {
        const agencyUser = JSON.parse(agencyUserStr);
        setLoggedInUser(agencyUser);
        setIsLoggedIn(true);
      }
    };

    initializeState();
  }, [navigate]);

  useEffect(() => {
    if (loggedInUser) {
      loadMenuItems(loggedInUser, company, setMenuItems, setIsMenuLoading);
    }
  }, [loggedInUser, company]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('company');
    localStorage.removeItem('subscription');
    localStorage.removeItem('agencyUser');
    setIsLoggedIn(false);
    setLoggedInUser(null);
    navigate('/company-login');
    window.location.reload();
  }, [navigate]);

  const toggleSubmenu = useCallback((menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  }, []);

  const handleMenuClick = (itemId) => {
    if (isMenuOpen) {
      toggleSubmenu(itemId);
    } else {
      setActivePopupMenu(activePopupMenu === itemId ? null : itemId);
    }
  };

  // Add click event listener to close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activePopupMenu && !event.target.closest('.nav-item')) {
        setActivePopupMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activePopupMenu]);

  if (!company || !subscription) {
    return <LoadingSpinner />;
  }

  return (
    <div className="d-flex">
      {isLoggedIn && (
        <nav 
          className={`bg-dark text-white ${isMenuOpen ? 'w-250' : 'w-65'}`} 
          style={{
            width: isMenuOpen ? '250px' : '65px',
            minHeight: '100vh',
            position: 'fixed',
            transition: 'width 0.3s ease',
            zIndex: 1040
          }}
        >
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
            {isMenuOpen && (
              <div className="d-flex flex-column">
                <h5 className="mb-0">Menü</h5>
                {loggedInUser && (
                  <small className="text-muted">{loggedInUser.position}</small>
                )}
              </div>
            )}
            <button 
              className="btn btn-link text-white" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <i className={`bi ${isMenuOpen ? 'bi-chevron-left' : 'bi-chevron-right'}`}></i>
            </button>
          </div>

          <ul className="nav flex-column mt-3">
            {isMenuLoading ? (
              <div className="text-center p-3">
                <div className="spinner-border spinner-border-sm text-light" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </div>
              </div>
            ) : (
              <>
                {menuItems.map((item) => (
                  <li className="nav-item position-relative" key={item.path}>
                    {item.subItems ? (
                      <>
                        <div 
                          className={`nav-link text-white d-flex justify-content-between align-items-center ${location.pathname === item.path ? 'active bg-primary' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleMenuClick(item.id)}
                        >
                          <div>
                            <i className={`bi ${item.icon} me-2`}></i>
                            {isMenuOpen && item.text}
                          </div>
                          {isMenuOpen && (
                            <i className={`bi ${expandedMenus[item.id] ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                          )}
                        </div>
                        {!isMenuOpen && activePopupMenu === item.id ? (
                          <div style={popupMenuStyle}>
                            <ul className="nav flex-column">
                              {item.subItems.map(subItem => (
                                <li className="nav-item" key={subItem.path}>
                                  <Link 
                                    to={subItem.path} 
                                    className={`nav-link text-white ${location.pathname === subItem.path ? 'active bg-primary' : ''}`}
                                  >
                                    <i className={`bi ${subItem.icon} me-2`}></i>
                                    {subItem.text}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          isMenuOpen && expandedMenus[item.id] && (
                            <ul className="nav flex-column ms-3">
                              {item.subItems.map(subItem => (
                                <li className="nav-item" key={subItem.path}>
                                  <Link 
                                    to={subItem.path} 
                                    className={`nav-link text-white ${location.pathname === subItem.path ? 'active bg-primary' : ''}`}
                                  >
                                    <i className={`bi ${subItem.icon} me-2`}></i>
                                    {subItem.text}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )
                        )}
                      </>
                    ) : (
                      <Link 
                        to={item.path} 
                        className={`nav-link text-white ${location.pathname === item.path ? 'active bg-primary' : ''}`}
                      >
                        <i className={`bi ${item.icon} me-2`}></i>
                        {isMenuOpen && item.text}
                      </Link>
                    )}
                  </li>
                ))}
                <li className="nav-item mt-auto">
                  <button 
                    onClick={handleLogout} 
                    className="nav-link text-white border-0 bg-transparent w-100 text-start"
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    {isMenuOpen && 'Çıkış Yap'}
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}

      <main style={{ 
        marginLeft: isLoggedIn ? (isMenuOpen ? '250px' : '65px') : '0', 
        transition: 'margin-left 0.3s ease', 
        width: '100%',
        minHeight: '100vh',
        height: '100%',
        overflow: 'auto'
      }}>
        <MenuSliderRoute 
          company={company} 
          subscription={subscription} 
          setIsLoggedIn={setIsLoggedIn} 
        />
      </main>
    </div>
  );
}

export default CompanyAgencySlider; 