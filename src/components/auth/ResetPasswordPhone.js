import React, { useState, useRef, useEffect } from 'react';
import { Form, Button, FloatingLabel, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { auth } from '../../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { USER_API } from '../../services/api';
import AuthLayout from './AuthLayout';

const ResetPasswordPhone = () => {
    const [step, setStep] = useState(1); // 1: phone, 2: otp, 3: new password
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);

    const recaptchaContainerRef = useRef(null);
    const recaptchaVerifierRef = useRef(null);

    // Cleanup reCAPTCHA on unmount
    useEffect(() => {
        return () => {
            if (recaptchaVerifierRef.current) {
                try {
                    recaptchaVerifierRef.current.clear();
                } catch (e) {
                    // Ignore cleanup errors
                }
                recaptchaVerifierRef.current = null;
            }
        };
    }, []);

    const setupRecaptcha = () => {
        if (recaptchaVerifierRef.current) {
            try {
                recaptchaVerifierRef.current.clear();
            } catch (e) {
                // Ignore
            }
        }

        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
            size: 'invisible',
            callback: () => {
                // reCAPTCHA solved
            },
            'expired-callback': () => {
                setError('reCAPTCHA expired. Please try again.');
            }
        });
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            // Format phone number (ensure it starts with +)
            let formattedPhone = phoneNumber.trim();
            if (!formattedPhone.startsWith('+')) {
                formattedPhone = '+' + formattedPhone;
            }

            setupRecaptcha();

            const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
            setConfirmationResult(result);
            setStep(2);
            setMessage('OTP sent to your phone number.');
        } catch (err) {
            console.error('Error sending OTP:', err);
            let errorMessage = 'Failed to send OTP. Please try again.';
            if (err.code === 'auth/invalid-phone-number') {
                errorMessage = 'Invalid phone number format. Please include country code (e.g., +20xxxxxxxxxx).';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Too many attempts. Please try again later.';
            } else if (err.code === 'auth/captcha-check-failed') {
                errorMessage = 'reCAPTCHA verification failed. Please refresh and try again.';
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            await confirmationResult.confirm(otp);
            setStep(3);
            setMessage('Phone verified successfully! Set your new password.');
        } catch (err) {
            console.error('Error verifying OTP:', err);
            let errorMessage = 'Invalid OTP code. Please try again.';
            if (err.code === 'auth/code-expired') {
                errorMessage = 'OTP expired. Please request a new one.';
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);

        try {
            // Get the ID token from the current phone-authenticated user
            const currentUser = auth.currentUser;
            if (!currentUser) {
                setError('Session expired. Please start over.');
                setStep(1);
                return;
            }

            const idToken = await currentUser.getIdToken();

            // Call backend to reset the password
            const response = await fetch(USER_API.RESET_PASSWORD_PHONE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken, newPassword })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Password reset successfully! You can now log in with your new password.');
                // Sign out the phone-auth session
                await auth.signOut();
            } else {
                setError(data.message || 'Failed to reset password.');
            }
        } catch (err) {
            console.error('Error resetting password:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <Form onSubmit={handleSendOtp}>
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

                        <p className="text-muted small mb-3">
                            Enter your phone number with country code (e.g., +20xxxxxxxxxx)
                        </p>

                        <FloatingLabel
                            controlId="phoneNumber"
                            label="Phone Number"
                            className="mb-3 text-muted"
                        >
                            <Form.Control
                                type="tel"
                                placeholder="+20xxxxxxxxxx"
                                className="form-control-lg bg-transparent border-secondary"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
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
                                    Sending OTP...
                                </>
                            ) : (
                                <>
                                    Send OTP <i className="bi bi-phone ms-2"></i>
                                </>
                            )}
                        </Button>
                    </Form>
                );

            case 2:
                return (
                    <Form onSubmit={handleVerifyOtp}>
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

                        <p className="text-muted small mb-3">
                            Enter the 6-digit code sent to <strong>{phoneNumber}</strong>
                        </p>

                        <FloatingLabel
                            controlId="otpCode"
                            label="OTP Code"
                            className="mb-3 text-muted"
                        >
                            <Form.Control
                                type="text"
                                placeholder="123456"
                                className="form-control-lg bg-transparent border-secondary text-center"
                                style={{ letterSpacing: '0.5em', fontSize: '1.5rem' }}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                required
                            />
                        </FloatingLabel>

                        <Button
                            variant="primary"
                            type="submit"
                            className="w-100 btn-lg rounded-pill shadow-sm"
                            disabled={isLoading || otp.length !== 6}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Verify Code <i className="bi bi-check-circle ms-2"></i>
                                </>
                            )}
                        </Button>

                        <div className="text-center mt-3">
                            <Button
                                variant="link"
                                className="text-muted small"
                                onClick={() => { setStep(1); setOtp(''); setError(''); setMessage(''); }}
                            >
                                <i className="bi bi-arrow-left me-1"></i> Change phone number
                            </Button>
                        </div>
                    </Form>
                );

            case 3:
                return (
                    <Form onSubmit={handleResetPassword}>
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

                        {!message.includes('successfully') ? (
                            <>
                                <FloatingLabel
                                    controlId="newPassword"
                                    label="New Password"
                                    className="mb-3 text-muted"
                                >
                                    <Form.Control
                                        type="password"
                                        placeholder="New Password"
                                        className="form-control-lg bg-transparent border-secondary"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </FloatingLabel>

                                <FloatingLabel
                                    controlId="confirmNewPassword"
                                    label="Confirm New Password"
                                    className="mb-4 text-muted"
                                >
                                    <Form.Control
                                        type="password"
                                        placeholder="Confirm New Password"
                                        className="form-control-lg bg-transparent border-secondary"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                            Resetting...
                                        </>
                                    ) : (
                                        <>
                                            Set New Password <i className="bi bi-lock ms-2"></i>
                                        </>
                                    )}
                                </Button>
                            </>
                        ) : null}
                    </Form>
                );

            default:
                return null;
        }
    };

    const stepTitles = {
        1: 'Reset via Phone',
        2: 'Verify OTP',
        3: 'Set New Password'
    };

    const stepSubtitles = {
        1: 'Enter your registered phone number to receive a verification code.',
        2: 'Enter the verification code sent to your phone.',
        3: 'Choose a new password for your account.'
    };

    return (
        <AuthLayout
            title={stepTitles[step]}
            subtitle={stepSubtitles[step]}
        >
            {/* Step indicator */}
            <div className="d-flex justify-content-center mb-4">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className="d-flex align-items-center"
                    >
                        <div
                            className={`rounded-circle d-flex align-items-center justify-content-center ${s <= step ? 'bg-primary text-white' : 'bg-secondary bg-opacity-25 text-muted'
                                }`}
                            style={{ width: '32px', height: '32px', fontSize: '0.85rem', fontWeight: 'bold' }}
                        >
                            {s < step ? <i className="bi bi-check"></i> : s}
                        </div>
                        {s < 3 && (
                            <div
                                className={`mx-2 ${s < step ? 'bg-primary' : 'bg-secondary bg-opacity-25'}`}
                                style={{ width: '40px', height: '3px', borderRadius: '2px' }}
                            />
                        )}
                    </div>
                ))}
            </div>

            {renderStep()}

            {/* Invisible reCAPTCHA container */}
            <div ref={recaptchaContainerRef} id="recaptcha-container"></div>

            <div className="text-center mt-4">
                <Link to="/forgot-password" className="text-muted small text-decoration-none me-3">
                    <i className="bi bi-envelope me-1"></i> Reset via Email
                </Link>
                <Link to="/login" className="text-primary fw-bold text-decoration-none">
                    <i className="bi bi-arrow-left me-1"></i> Back to Login
                </Link>
            </div>
        </AuthLayout>
    );
};

export default ResetPasswordPhone;
