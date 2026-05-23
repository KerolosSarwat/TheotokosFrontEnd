import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar, Nav, Container, Form, InputGroup, Button, Dropdown } from 'react-bootstrap';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const AppNavbar = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const isDark = theme === 'dark';
  const isRTL = i18n.language === 'ar';

  return (
    <Navbar bg={isDark ? 'dark' : 'white'} variant={isDark ? 'dark' : 'light'} sticky="top" className={`border-bottom ${isDark ? 'border-secondary' : 'border-light'} shadow-sm py-2`} style={{ backdropFilter: 'blur(10px)' }}>
      <Container fluid className="px-2 px-sm-4">
        {/* Left Section - Menu Button & Brand */}
        <div className="d-flex align-items-center me-auto">
          <Button 
            variant={isDark ? "link text-light" : "link text-dark"} 
            className="d-md-none p-1 me-2 text-decoration-none" 
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <i className="bi bi-list fs-3"></i>
          </Button>
          
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center m-0 pe-2">
            <i className="bi bi-fire text-primary me-2 fs-4"></i>
            <span className="d-none d-sm-inline fw-bold bg-gradient-primary-text fs-5">Firebase Portal</span>
            <span className="d-inline d-sm-none fw-bold bg-gradient-primary-text fs-5">Portal</span>
          </Navbar.Brand>
        </div>

        {/* Center Section - Search (Desktop) */}
        <Form className="d-none d-md-flex mx-auto w-100" style={{ maxWidth: '400px' }}>
          <InputGroup>
            <InputGroup.Text className={`border-0 border-end-0 rounded-start-pill ${isDark ? 'bg-secondary text-light' : 'bg-light'}`}>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder={t('common.search', 'Search...')}
              className={`border-0 border-start-0 rounded-end-pill shadow-none ${isDark ? 'bg-secondary text-light' : 'bg-light'}`}
            />
          </InputGroup>
        </Form>

        {/* Right Section - Actions */}
        <Nav className="d-flex align-items-center ms-auto gap-1 gap-sm-2 flex-row">
          
          {/* Mobile Search Toggle */}
          <Button 
            variant={isDark ? "link text-light" : "link text-dark"} 
            className="d-md-none p-1 text-decoration-none rounded-circle"
            onClick={() => setShowSearch(!showSearch)}
          >
            <i className="bi bi-search fs-5"></i>
          </Button>

          {/* Language Dropdown */}
          <Dropdown align={isRTL ? "start" : "end"}>
            <Dropdown.Toggle variant={isDark ? "link text-light" : "link text-dark"} className="text-decoration-none d-flex align-items-center gap-1 p-1 p-sm-2 rounded-pill shadow-none border-0">
              <i className="bi bi-globe2 fs-5"></i>
              <span className="d-none d-lg-inline small fw-medium">{i18n.language === 'ar' ? 'العربية' : 'English'}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow-sm border-0 mt-2">
              <Dropdown.Item onClick={() => changeLanguage('ar')} active={i18n.language === 'ar'} className="text-end">العربية</Dropdown.Item>
              <Dropdown.Item onClick={() => changeLanguage('en')} active={i18n.language === 'en'}>English</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* Theme Toggle */}
          <Button 
            variant={isDark ? "link text-warning" : "link text-secondary"} 
            className="p-1 p-sm-2 text-decoration-none rounded-circle" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <i className={isDark ? "bi bi-sun-fill fs-5" : "bi bi-moon-stars-fill fs-5"}></i>
          </Button>

          {/* Admin Link - Desktop only */}
          {(user?.role === 'admin' || user?.role === 'super_admin' || user?.admin) && (
            <Button 
              as={Link} 
              to="/admin/portal-users" 
              variant={isDark ? "outline-secondary text-light" : "outline-secondary"} 
              size="sm" 
              className="d-none d-xl-flex align-items-center gap-1 rounded-pill px-3 py-1 mx-1"
            >
              <i className="bi bi-shield-check"></i>
              <span>Staff</span>
            </Button>
          )}

          {/* User Dropdown */}
          {user && (
            <Dropdown align={isRTL ? "start" : "end"}>
              <Dropdown.Toggle variant="link" className="text-decoration-none d-flex align-items-center gap-2 p-1 pe-sm-2 rounded-pill shadow-none border-0 text-dark">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  <i className="bi bi-person-fill fs-5"></i>
                </div>
                <span className={`d-none d-lg-inline small fw-medium text-truncate ${isDark ? 'text-light' : 'text-dark'}`} style={{ maxWidth: '120px' }}>
                  {user.email}
                </span>
              </Dropdown.Toggle>

              <Dropdown.Menu className="shadow border-0 mt-2 p-0" style={{ minWidth: '240px', borderRadius: '1rem', overflow: 'hidden' }}>
                <div className={`px-4 py-3 border-bottom ${isDark ? 'bg-dark border-secondary text-light' : 'bg-light border-light'}`}>
                  <div className="fw-bold text-truncate">{user.name || user.email}</div>
                  <div className={`small text-truncate ${isDark ? 'text-white-50' : 'text-muted'}`}>{user.email}</div>
                </div>
                
                <div className="py-2">
                  <Dropdown.Item as={Link} to="/profile" className="d-flex align-items-center gap-3 px-4 py-2">
                    <i className="bi bi-person-circle text-primary fs-5"></i> 
                    <span className="fw-medium">{t('nav.profile')}</span>
                  </Dropdown.Item>

                  {(user?.role === 'admin' || user?.role === 'super_admin' || user?.admin) && (
                    <Dropdown.Item as={Link} to="/admin/portal-users" className="d-xl-none d-flex align-items-center gap-3 px-4 py-2">
                      <i className="bi bi-shield-lock-fill text-primary fs-5"></i> 
                      <span className="fw-medium">Staff</span>
                    </Dropdown.Item>
                  )}

                  <Dropdown.Divider className={isDark ? 'border-secondary' : ''} />
                  
                  <Dropdown.Item onClick={handleLogout} className="text-danger d-flex align-items-center gap-3 px-4 py-2">
                    <i className="bi bi-box-arrow-right fs-5"></i> 
                    <span className="fw-medium">{t('nav.logout')}</span>
                  </Dropdown.Item>
                </div>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </Nav>
      </Container>
      
      {/* Mobile Search Bar Expandable */}
      {showSearch && (
        <div className="d-md-none w-100 px-3 pb-2 pt-1 position-absolute start-0 top-100 bg-white border-bottom shadow-sm" style={{ zIndex: 1000 }}>
          <InputGroup size="sm">
            <InputGroup.Text className="bg-light border-0 border-end-0 rounded-start-pill">
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              type="search"
              placeholder={t('common.search', 'Search...')}
              className="bg-light border-0 border-start-0 rounded-end-pill shadow-none"
              autoFocus
            />
          </InputGroup>
        </div>
      )}
    </Navbar>
  );
};

export default AppNavbar;

