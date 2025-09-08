import React from 'react';
import { Link } from 'react-router-dom';
import { Nav } from 'react-bootstrap';

const Sidebar = () => {
  return (
    <div className="sidebar-sticky pt-3">
      <Nav className="flex-column">
        <Nav.Item>
          <Nav.Link as={Link} to="/" className="nav-link">
            <i className="bi bi-speedometer2 me-2"></i>
            Dashboard
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/users" className="nav-link">
            <i className="bi bi-people me-2"></i>
            Users
          </Nav.Link>
        </Nav.Item>
        <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
          <span>Firestore Collections</span>
        </h6>
        <Nav.Item>
          <Nav.Link as={Link} to="/firestore/agbya" className="nav-link">
            <i className="bi bi-book me-2"></i>
            Agbya
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/firestore/taks" className="nav-link">
            <i className="bi bi-journal-text me-2"></i>
            Taks
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/firestore/coptic" className="nav-link">
            <i className="bi bi-translate me-2"></i>
            Coptic
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as={Link} to="/firestore/hymns" className="nav-link">
            <i className="bi bi-music-note-list me-2"></i>
            Hymns
          </Nav.Link>
        </Nav.Item>
      </Nav>
    </div>
  );
};

export default Sidebar;
