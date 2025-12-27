import React from 'react';
import { Navbar as BootstrapNavbar, Container, Nav, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BootstrapNavbar
      expand="lg"
      className={`sticky-top p-0 ${theme === 'dark' ? 'navbar-dark' : 'navbar-light'}`}
    >
      <Container fluid>
        <BootstrapNavbar.Brand as={Link} to="/" className="col-md-3 col-lg-2 me-0 px-3">
          Firebase Portal
        </BootstrapNavbar.Brand>
        <div className="d-flex align-items-center ms-auto order-lg-last">
          <ThemeToggle />
          <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        </div>
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto me-3 align-items-center">
            <Nav.Link as={Link} to="/users/new" className="btn btn-sm btn-primary text-white ms-3 rounded-pill px-3">
              <i className="bi bi-person-plus-fill me-1"></i> Add User
            </Nav.Link>

            {user && (
              <Dropdown align="end" className="ms-3">
                <Dropdown.Toggle variant="link" className="text-decoration-none p-0" style={{ color: 'var(--bs-body-color)' }}>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-person-circle fs-4 me-2"></i>
                    <span className="d-none d-md-inline">{user.email}</span>
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item disabled>
                    <small className="text-muted">{user.name}</small>
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to="/profile">
                    <i className="bi bi-person-fill me-2"></i>
                    My Profile
                  </Dropdown.Item>
                  <Dropdown.Item onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
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
