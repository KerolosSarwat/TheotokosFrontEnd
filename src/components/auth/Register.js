import React, { useState } from 'react';
import { Form, Button, FloatingLabel, Row, Col, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/services';
import AuthLayout from './AuthLayout';

const Register = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);

    const { register, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect if already authenticated
    React.useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (!termsAccepted) {
            setError('You must accept the Terms of Service and Privacy Policy');
            return;
        }

        setIsLoading(true);

        try {
            const result = await register(formData.name, formData.email, formData.password);

            if (result.success) {
                // Explicitly sync to create portalUsers node
                await userService.syncPortalUser({
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: formData.name,
                    photoURL: result.user.photoURL
                });

                // Redirect to dashboard
                // navigate('/', { replace: true }); // AuthContext listener usually handles this via PrivateRoute or parent, but explicit redirect is safe too.
                navigate('/', { replace: true });
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
            title="Create Account"
            subtitle="Join us today and start managing your community."
        >
            <Form onSubmit={handleSubmit}>
                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Row>
                    <Col md={12}>
                        <FloatingLabel
                            controlId="floatingName"
                            label="Full Name"
                            className="mb-3 text-muted"
                        >
                            <Form.Control
                                type="text"
                                name="name"
                                placeholder="John Doe"
                                className="form-control-lg bg-transparent border-secondary"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </FloatingLabel>
                    </Col>
                </Row>

                <FloatingLabel
                    controlId="floatingEmail"
                    label="Email address"
                    className="mb-3 text-muted"
                >
                    <Form.Control
                        type="email"
                        name="email"
                        placeholder="name@example.com"
                        className="form-control-lg bg-transparent border-secondary"
                        value={formData.email}
                        onChange={handleChange}
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
                        name="password"
                        placeholder="Password"
                        className="form-control-lg bg-transparent border-secondary"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </FloatingLabel>

                <FloatingLabel
                    controlId="floatingConfirmPassword"
                    label="Confirm Password"
                    className="mb-4 text-muted"
                >
                    <Form.Control
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        className="form-control-lg bg-transparent border-secondary"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                </FloatingLabel>

                <Form.Check
                    type="checkbox"
                    id="terms"
                    label={
                        <span className="small text-muted"> I agree to the <Link to="/terms" className="text-decoration-none">Terms of Service</Link> and <Link to="/privacy" className="text-decoration-none">Privacy Policy</Link></span>
                    }
                    className="mb-4"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                />

                <Button
                    variant="primary"
                    type="submit"
                    className="w-100 btn-lg rounded-pill shadow-sm"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Creating Account...
                        </>
                    ) : (
                        <>
                            Get Started <i className="bi bi-arrow-right ms-2"></i>
                        </>
                    )}
                </Button>

                <div className="text-center mt-4">
                    <p className="mb-0 text-muted">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary fw-bold text-decoration-none">
                            Sign In
                        </Link>
                    </p>
                </div>
            </Form>
        </AuthLayout>
    );
};

export default Register;
