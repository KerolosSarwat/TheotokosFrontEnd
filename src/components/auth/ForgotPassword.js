import React, { useState } from 'react';
import { Form, Button, FloatingLabel, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from './AuthLayout';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const result = await resetPassword(email);

            if (result.success) {
                setMessage('Check your inbox for further instructions.');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Reset Password"
            subtitle="Enter your email to receive a password reset link."
        >
            <Form onSubmit={handleSubmit}>
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                {message && (
                    <Alert variant="success" dismissible onClose={() => setMessage('')}>
                        {message}
                    </Alert>
                )}

                <FloatingLabel
                    controlId="floatingInput"
                    label="Email address"
                    className="mb-3 text-muted"
                >
                    <Form.Control
                        type="email"
                        placeholder="name@example.com"
                        className="form-control-lg bg-transparent border-secondary"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </FloatingLabel>

                <Button
                    variant="primary"
                    type="submit"
                    className="w-100 btn-lg rounded-pill shadow-sm"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending...
                        </>
                    ) : (
                        <>
                            Reset Password <i className="bi bi-arrow-right ms-2"></i>
                        </>
                    )}
                </Button>

                <div className="text-center mt-4">
                    <Link to="/login" className="text-primary fw-bold text-decoration-none">
                        <i className="bi bi-arrow-left me-1"></i> Back to Login
                    </Link>
                </div>
            </Form>
        </AuthLayout>
    );
};

export default ForgotPassword;
