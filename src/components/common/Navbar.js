import React from 'react';
import { Navbar as BootstrapNavbar, Container, Nav, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <BootstrapNavbar
      expand="lg"
      className={`sticky-top p-2 glass ${theme === 'dark' ? 'navbar-dark bg-dark' : 'navbar-light bg-light'} mb-4`}
      style={{
        borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        background: theme === 'dark' ? 'rgba(33, 37, 41, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <Container fluid>
        <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center fw-bold fs-4">
          <i className="bi bi-fire text-primary me-2"></i>
          <span className="bg-gradient-primary-text">Firebase Portal</span>
        </BootstrapNavbar.Brand>

        <div className="d-flex align-items-center ms-auto order-lg-last gap-2">
          {/* Global Search Bar */}
          <div className="d-none d-md-flex align-items-center mx-3 position-relative" style={{ minWidth: '300px' }}>
            <i className="bi bi-search position-absolute ms-3 text-muted"></i>
            <input
              type="text"
              className="form-control rounded-pill ps-5 bg-light border-0"
              placeholder={t('common.search', 'Search...')}
            />
          </div>

          {/* Language Switcher */}
          <Dropdown align="end">
            <Dropdown.Toggle variant="outline-secondary" size="sm" className="rounded-pill px-3 d-flex align-items-center gap-2">
              <i className="bi bi-translate"></i>
              <span>{i18n.language === 'ar' ? 'العربية' : 'English'}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="shadow-sm border-0 glass">
              <Dropdown.Item onClick={() => changeLanguage('ar')} active={i18n.language === 'ar'}>
                العربية
              </Dropdown.Item>
              <Dropdown.Item onClick={() => changeLanguage('en')} active={i18n.language === 'en'}>
                English
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <ThemeToggle />
          <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        </div>

        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto me-3 align-items-center gap-2">
            {/* Admin Only Link for Staff Management */}
            {(user?.role === 'admin' || user?.role === 'super_admin' || user?.admin) && (
              <Nav.Link as={Link} to="/admin/portal-users" className="btn btn-outline-secondary rounded-pill px-3 py-2 d-inline-flex align-items-center ms-2">
                <i className="bi bi-shield-lock me-1"></i>
                Staff
              </Nav.Link>
            )}

            {user && (
              <Dropdown align="end" className="ms-3">
                <Dropdown.Toggle variant="link" className="text-decoration-none p-0 profile-toggle" style={{ color: 'var(--bs-body-color)' }}>
                  <div className="d-flex align-items-center bg-light-soft p-1 pe-3 rounded-pill border">
                    <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                      <i className="bi bi-person-fill text-white"></i>
                    </div>
                    <span className="d-none d-md-inline small fw-medium">{user.email}</span>
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow-lg border-0 py-2 glass mt-2">
                  <Dropdown.Item disabled className="py-2">
                    <div className="d-flex flex-column">
                      <span className="fw-bold">{user.name}</span>
                      <small className="text-muted">{user.email}</small>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to="/profile" className="py-2">
                    <i className="bi bi-person-fill text-primary me-2"></i>
                    {t('nav.profile')}
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="py-2 text-danger">
                    <i className="bi bi-box-arrow-right me-2"></i>
                    {t('nav.logout')}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;

