import React from 'react';
import { Offcanvas, Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

const MobileSidebar = ({ show, onHide }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { hasPermission, user } = useAuth();
  const { theme } = useTheme();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const navLinkClass = (isActive) =>
    `rounded-3 d-flex align-items-center py-3 px-3 ${isActive ? 'active bg-primary text-white' : ''}`;

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement={i18n.language === 'ar' ? 'end' : 'start'}
      className={`mobile-sidebar ${theme === 'dark' ? 'bg-dark text-light' : 'bg-white'}`}
      style={{
        width: '280px',
        backgroundColor: theme === 'dark' ? '#212529' : '#ffffff'
      }}
    >
      <Offcanvas.Header closeButton className="border-bottom">
        <Offcanvas.Title className="d-flex align-items-center fw-bold">
          <i className="bi bi-fire text-primary me-2"></i>
          <span className="bg-gradient-primary-text">Firebase Portal</span>
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body className="p-0">
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <ThemeToggle />
            <span className="small text-muted">
              {theme === 'dark' ? t('common.darkMode', 'Dark Mode') : t('common.lightMode', 'Light Mode')}
            </span>
          </div>
          <div className="btn-group" role="group">
            <button
              className={`btn btn-sm ${i18n.language === 'ar' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => changeLanguage('ar')}
            >
              عربي
            </button>
            <button
              className={`btn btn-sm ${i18n.language === 'en' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
          </div>
        </div>

        <Nav className="flex-column gap-1 p-3">
          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/"
              onClick={onHide}
              active={location.pathname === '/'}
              className={navLinkClass(location.pathname === '/')}
            >
              <i className="bi bi-speedometer2 me-3 fs-5"></i>
              {t('nav.dashboard')}
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/users"
              onClick={onHide}
              active={location.pathname.startsWith('/users')}
              className={navLinkClass(location.pathname.startsWith('/users'))}
            >
              <i className="bi bi-people me-3 fs-5"></i>
              {t('nav.users')}
            </Nav.Link>
          </Nav.Item>

          {hasPermission('attendance', 'view') && (
            <Nav.Item>
              <Nav.Link
                as={Link}
                to="/attendance"
                onClick={onHide}
                active={location.pathname.startsWith('/attendance')}
                className={navLinkClass(location.pathname.startsWith('/attendance'))}
              >
                <i className="bi bi-calendar-check me-3 fs-5"></i>
                {t('nav.attendance')}
              </Nav.Link>
            </Nav.Item>
          )}

          {hasPermission('degrees', 'edit') && (
            <Nav.Item>
              <Nav.Link
                as={Link}
                to="/degrees"
                onClick={onHide}
                active={location.pathname === '/degrees'}
                className={navLinkClass(location.pathname === '/degrees')}
              >
                <i className="bi bi-file-earmark-spreadsheet me-3 fs-5"></i>
                {t('Bulk Degrees')}
              </Nav.Link>
            </Nav.Item>
          )}

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/degree-report"
              onClick={onHide}
              active={location.pathname === '/degree-report'}
              className={navLinkClass(location.pathname === '/degree-report')}
            >
              <i className="bi bi-mortarboard me-3 fs-5"></i>
              {t('nav.degreeReport')}
            </Nav.Link>
          </Nav.Item>

          <div className="border-top my-3"></div>

          <h6 className="sidebar-heading px-3 mb-2 text-muted text-uppercase fw-bold small">
            {t('nav.firestore')}
          </h6>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/firestore/agbya"
              onClick={onHide}
              active={location.pathname.startsWith('/firestore/agbya')}
              className={navLinkClass(location.pathname.startsWith('/firestore/agbya'))}
            >
              <i className="bi bi-book me-3 fs-5"></i>
              {t('nav.agbya')}
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/firestore/taks"
              onClick={onHide}
              active={location.pathname.startsWith('/firestore/taks')}
              className={navLinkClass(location.pathname.startsWith('/firestore/taks'))}
            >
              <i className="bi bi-journal-text me-3 fs-5"></i>
              {t('nav.taks')}
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/firestore/coptic"
              onClick={onHide}
              active={location.pathname.startsWith('/firestore/coptic')}
              className={navLinkClass(location.pathname.startsWith('/firestore/coptic'))}
            >
              <i className="bi bi-translate me-3 fs-5"></i>
              {t('nav.coptic')}
            </Nav.Link>
          </Nav.Item>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/firestore/hymns"
              onClick={onHide}
              active={location.pathname.startsWith('/firestore/hymns')}
              className={navLinkClass(location.pathname.startsWith('/firestore/hymns'))}
            >
              <i className="bi bi-music-note-list me-3 fs-5"></i>
              {t('nav.hymns')}
            </Nav.Link>
          </Nav.Item>

          {hasPermission('settings', 'view') && (
            <>
              <div className="border-top my-3"></div>
              <Nav.Item>
                <Nav.Link
                  as={Link}
                  to="/settings"
                  onClick={onHide}
                  active={location.pathname === '/settings'}
                  className={navLinkClass(location.pathname === '/settings')}
                >
                  <i className="bi bi-gear me-3 fs-5"></i>
                  {t('nav.settings')}
                </Nav.Link>
              </Nav.Item>
            </>
          )}

          {(user?.role === 'admin' || user?.role === 'super_admin' || user?.admin) && (
            <Nav.Item>
              <Nav.Link
                as={Link}
                to="/admin/portal-users"
                onClick={onHide}
                active={location.pathname.startsWith('/admin')}
                className={navLinkClass(location.pathname.startsWith('/admin'))}
              >
                <i className="bi bi-shield-lock me-3 fs-5"></i>
                Staff
              </Nav.Link>
            </Nav.Item>
          )}

          <div className="border-top my-3"></div>

          <Nav.Item>
            <Nav.Link
              as={Link}
              to="/profile"
              onClick={onHide}
              active={location.pathname === '/profile'}
              className={navLinkClass(location.pathname === '/profile')}
            >
              <i className="bi bi-person me-3 fs-5"></i>
              {t('nav.profile')}
            </Nav.Link>
          </Nav.Item>
        </Nav>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default MobileSidebar;
