import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <div className="d-flex align-items-center min-vh-100 py-5 auth-bg">
            <Container>
                <Row className="justify-content-center">
                    <Col md={6} lg={5} xl={4}>
                        <div className="text-center mb-4">
                            {/* Placeholder for Logo if needed */}
                            <h1 className="display-5 fw-bold ls-tight" style={{ color: 'var(--bs-body-color)' }}>
                                Firebase Portal
                            </h1>
                        </div>

                        <div className="card-dashboard p-4 p-md-5 glass border-0 shadow-lg">
                            <div className="text-center mb-4">
                                <h3 className="fw-bold">{title}</h3>
                                <p className="text-muted">{subtitle}</p>
                            </div>
                            {children}
                        </div>

                        <div className="text-center mt-4 text-muted small">
                            © {new Date().getFullYear()} Firebase Portal. All rights reserved.
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default AuthLayout;
