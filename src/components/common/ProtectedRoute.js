import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner, Alert, Button } from 'react-bootstrap';

const ProtectedRoute = ({ children, requiredPermission }) => {
    const { isAuthenticated, loading, hasPermission } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                    <p className="mt-3 text-muted">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredPermission && !hasPermission(requiredPermission.module, requiredPermission.action)) {
        return (
            <div className="p-4 text-center mt-5">
                <Alert variant="danger">
                    Access Denied: You do not have permission to access this page.
                </Alert>
                <div className="mt-3">
                    <Button onClick={() => window.history.back()}>Go Back</Button>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
