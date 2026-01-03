import { Link, useLocation } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { t } = useTranslation();
  // const { user } = useAuth(); // Removed unused

  return (
    <div className="sidebar-sticky pt-3 pb-5">
      <Nav className="flex-column gap-1 px-2">
        <Nav.Item>
          <Nav.Link
            as={Link}
            to="/"
            active={location.pathname === '/'}
            className="rounded-3 d-flex align-items-center py-2 px-3"
          >
            <i className="bi bi-speedometer2 me-2"></i>
            {t('nav.dashboard')}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            as={Link}
            to="/users"
            active={location.pathname.startsWith('/users')}
            className="rounded-3 d-flex align-items-center py-2 px-3"
          >
            <i className="bi bi-people me-2"></i>
            {t('nav.users')}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            as={Link}
            to="/attendance"
            active={location.pathname.startsWith('/attendance')}
            className="rounded-3 d-flex align-items-center py-2 px-3"
          >
            <i className="bi bi-calendar-check me-2"></i>
            {t('nav.attendance')}
          </Nav.Link>
        </Nav.Item>



        <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-2 text-muted text-uppercase fw-bold small">
          <span>{t('nav.firestore')}</span>
        </h6>

        <Nav.Item>
          <Nav.Link
            as={Link}
            to="/firestore/agbya"
            active={location.pathname.startsWith('/firestore/agbya')}
            className="rounded-3 d-flex align-items-center py-2 px-3"
          >
            <i className="bi bi-book me-2"></i>
            {t('nav.agbya')}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            as={Link}
            to="/firestore/taks"
            active={location.pathname.startsWith('/firestore/taks')}
            className="rounded-3 d-flex align-items-center py-2 px-3"
          >
            <i className="bi bi-journal-text me-2"></i>
            {t('nav.taks')}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            as={Link}
            to="/firestore/coptic"
            active={location.pathname.startsWith('/firestore/coptic')}
            className="rounded-3 d-flex align-items-center py-2 px-3"
          >
            <i className="bi bi-translate me-2"></i>
            {t('nav.coptic')}
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link
            as={Link}
            to="/firestore/hymns"
            active={location.pathname.startsWith('/firestore/hymns')}
            className="rounded-3 d-flex align-items-center py-2 px-3"
          >
            <i className="bi bi-music-note-list me-2"></i>
            {t('nav.hymns')}
          </Nav.Link>
        </Nav.Item>
      </Nav>
    </div>
  );
};

export default Sidebar;

