import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, FloatingLabel, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const result = await updateProfile(formData.name, formData.email);
            if (result.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setIsEditing(false);
            } else {
                setMessage({ type: 'danger', text: result.error || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'danger', text: 'An error occurred while updating profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        // Validation
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'danger', text: 'New passwords do not match' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'danger', text: 'Password must be at least 6 characters long' });
            return;
        }

        setLoading(true);

        try {
            // TODO: Implement actual password change with backend
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setIsChangingPassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMessage({ type: 'danger', text: 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData({
            name: user?.name || '',
            email: user?.email || ''
        });
        setIsEditing(false);
        setMessage({ type: '', text: '' });
    };

    const handleCancelPasswordChange = () => {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsChangingPassword(false);
        setMessage({ type: '', text: '' });
    };

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col lg={8}>
                    <h2 className="mb-4 fw-bold">My Profile</h2>

                    {message.text && (
                        <Alert variant={message.type} dismissible onClose={() => setMessage({ type: '', text: '' })}>
                            {message.text}
                        </Alert>
                    )}

                    {/* Profile Information Card */}
                    <Card className="card-dashboard mb-4 border-0 shadow-lg">
                        <Card.Body className="p-4">
                            <div className="d-flex align-items-center mb-4">
                                <div className="bg-primary bg-gradient rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style={{ width: '80px', height: '80px' }}>
                                    <i className="bi bi-person-fill text-white" style={{ fontSize: '2.5rem' }}></i>
                                </div>
                                <div>
                                    <h4 className="mb-1 fw-bold">{user?.name}</h4>
                                    <p className="text-muted mb-0">{user?.email}</p>
                                </div>
                            </div>

                            {!isEditing ? (
                                <>
                                    <div className="mb-3">
                                        <label className="text-muted small mb-1">Full Name</label>
                                        <p className="mb-0 fw-semibold">{user?.name}</p>
                                    </div>
                                    <div className="mb-4">
                                        <label className="text-muted small mb-1">Email Address</label>
                                        <p className="mb-0 fw-semibold">{user?.email}</p>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button variant="primary" onClick={() => setIsEditing(true)}>
                                            <i className="bi bi-pencil-fill me-2"></i>
                                            Edit Profile
                                        </Button>
                                        <Button variant="outline-primary" onClick={() => setIsChangingPassword(true)}>
                                            <i className="bi bi-key-fill me-2"></i>
                                            Change Password
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <Form onSubmit={handleSaveProfile}>
                                    <FloatingLabel controlId="name" label="Full Name" className="mb-3">
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </FloatingLabel>

                                    <FloatingLabel controlId="email" label="Email Address" className="mb-4">
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </FloatingLabel>

                                    <div className="d-flex gap-2">
                                        <Button variant="primary" type="submit" disabled={loading}>
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-lg me-2"></i>
                                                    Save Changes
                                                </>
                                            )}
                                        </Button>
                                        <Button variant="outline-secondary" onClick={handleCancelEdit} disabled={loading}>
                                            Cancel
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Change Password Card */}
                    {isChangingPassword && (
                        <Card className="card-dashboard border-0 shadow-lg">
                            <Card.Body className="p-4">
                                <h5 className="mb-4 fw-bold">Change Password</h5>
                                <Form onSubmit={handleChangePassword}>
                                    <FloatingLabel controlId="currentPassword" label="Current Password" className="mb-3">
                                        <Form.Control
                                            type="password"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </FloatingLabel>

                                    <FloatingLabel controlId="newPassword" label="New Password" className="mb-3">
                                        <Form.Control
                                            type="password"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </FloatingLabel>

                                    <FloatingLabel controlId="confirmPassword" label="Confirm New Password" className="mb-4">
                                        <Form.Control
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </FloatingLabel>

                                    <div className="d-flex gap-2">
                                        <Button variant="primary" type="submit" disabled={loading}>
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Changing...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-lg me-2"></i>
                                                    Change Password
                                                </>
                                            )}
                                        </Button>
                                        <Button variant="outline-secondary" onClick={handleCancelPasswordChange} disabled={loading}>
                                            Cancel
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default Profile;
