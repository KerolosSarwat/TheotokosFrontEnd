import React from 'react';
import { Navbar as BootstrapNavbar, Container, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="navbar-dark sticky-top flex-md-nowrap p-0 shadow">
      <Container fluid>
        <BootstrapNavbar.Brand as={Link} to="/" className="col-md-3 col-lg-2 me-0 px-3">Firebase Portal</BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/users/new" className="btn btn-sm btn-outline-light me-2">
              <i className="bi bi-person-plus-fill me-1"></i> Add User
            </Nav.Link>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
