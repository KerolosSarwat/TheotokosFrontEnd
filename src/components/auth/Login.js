import React, { useState } from 'react';
import { Form, Button, FloatingLabel, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from './AuthLayout';

const Login = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');

    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect if already authenticated
    React.useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(email, password);

            if (result.success) {
                // Redirect to the page they tried to visit or dashboard
                const from = location.state?.from?.pathname || '/';
                navigate(from, { replace: true });
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
            title="Welcome Back"
            subtitle="Please sign in to your dashboard to continue."
        >
            <Form onSubmit={handleSubmit}>
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError('')}>
                        {error}
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

                <FloatingLabel
                    controlId="floatingPassword"
                    label="Password"
                    className="mb-3 text-muted"
                >
                    <Form.Control
                        type="password"
                        placeholder="Password"
                        className="form-control-lg bg-transparent border-secondary"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </FloatingLabel>

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Form.Check
                        type="checkbox"
                        id="rememberMe"
                        label="Remember me"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <Link to="/forgot-password" style={{ textDecoration: 'none' }} className="small text-primary fw-semibold">
                        Forgot password?
                    </Link>
                </div>

                <Button
                    variant="primary"
                    type="submit"
                    className="w-100 btn-lg rounded-pill shadow-sm"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Signing in...
                        </>
                    ) : (
                        <>
                            Sign In <i className="bi bi-arrow-right ms-2"></i>
                        </>
                    )}
                </Button>

                <div className="text-center mt-4">
                    <p className="mb-0 text-muted">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary fw-bold text-decoration-none">
                            Create account
                        </Link>
                    </p>
                </div>
            </Form>
        </AuthLayout>
    );
};

export default Login;
