import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Nav } from 'react-bootstrap';

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="sidebar-sticky pt-3">
      <Nav className="flex-column">
        <Nav.Item>
          <Nav.Link as={Link} to="/" active={location.pathname === '/'}>
            <i className="bi bi-speedometer2 me-2"></i>
            Dashboard
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/users" active={location.pathname.startsWith('/users')}>
            <i className="bi bi-people me-2"></i>
            Users
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/attendance" active={location.pathname.startsWith('/attendance')}>
            <i className="bi bi-calendar-check me-2"></i>
            Attendance
          </Nav.Link>
        </Nav.Item>
        <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-2 text-muted text-uppercase small">
          <span>Firestore Collections</span>
        </h6>
        <Nav.Item>
          <Nav.Link as={Link} to="/firestore/agbya" active={location.pathname.startsWith('/firestore/agbya')}>
            <i className="bi bi-book me-2"></i>
            Agbya
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/firestore/taks" active={location.pathname.startsWith('/firestore/taks')}>
            <i className="bi bi-journal-text me-2"></i>
            Taks
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/firestore/coptic" active={location.pathname.startsWith('/firestore/coptic')}>
            <i className="bi bi-translate me-2"></i>
            Coptic
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/firestore/hymns" active={location.pathname.startsWith('/firestore/hymns')}>
            <i className="bi bi-music-note-list me-2"></i>
            Hymns
          </Nav.Link>
        </Nav.Item>
      </Nav>
    </div>
  );
};

export default Sidebar;
