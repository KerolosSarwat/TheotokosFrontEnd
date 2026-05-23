import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Modal, Form, Badge, FloatingLabel, Alert } from 'react-bootstrap';
import { userService } from '../../services/services';
import { useAuth } from '../../context/AuthContext';
import { USER_API } from '../../services/api';

const PortalUserList = () => {
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.admin;
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Permissions Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        role: 'staff',
        permissions: {}
    });

    // Reset Password Modal
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetUser, setResetUser] = useState(null);
    const [resetPassword, setResetPassword] = useState('');
    const [confirmResetPassword, setConfirmResetPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await userService.getAllPortalUsers();
            setUsers(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            role: user.role || 'staff',
            permissions: user.permissions || {
                users: { view: false, edit: false, delete: false },
                attendance: { view: false, edit: false, delete: false },
                content: { view: false, edit: false, delete: false },
                degrees: { view: false, edit: false, delete: false },
                settings: { view: true, edit: false }
            }
        });
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value, checked } = e.target;

        if (name.includes('.')) {
            // Handle nested permission change
            const [, module, action] = name.split('.'); // e.g. permissions.users.edit
            setFormData(prev => ({
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [module]: {
                        ...prev.permissions[module],
                        [action]: checked
                    }
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async () => {
        try {
            if (!selectedUser) return;

            await userService.updatePortalUser(selectedUser.uid, formData);
            alert('Permissions updated successfully');
            setShowModal(false);
            fetchUsers(); // Refresh list
        } catch (err) {
            console.error(err);
            alert('Failed to update permissions');
        }
    };

    const handleResetPassword = (user) => {
        setResetUser(user);
        setResetPassword('');
        setConfirmResetPassword('');
        setResetMessage({ type: '', text: '' });
        setShowResetModal(true);
    };

    const handleSubmitResetPassword = async () => {
        setResetMessage({ type: '', text: '' });

        if (!resetPassword || resetPassword.length < 6) {
            setResetMessage({ type: 'danger', text: 'Password must be at least 6 characters.' });
            return;
        }

        if (resetPassword !== confirmResetPassword) {
            setResetMessage({ type: 'danger', text: 'Passwords do not match.' });
            return;
        }

        setResetLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(USER_API.ADMIN_RESET_PASSWORD, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ targetUid: resetUser.uid, newPassword: resetPassword })
            });

            const data = await response.json();

            if (response.ok) {
                setResetMessage({ type: 'success', text: `Password for ${resetUser.displayName} has been reset successfully.` });
                setResetPassword('');
                setConfirmResetPassword('');
            } else {
                setResetMessage({ type: 'danger', text: data.message || 'Failed to reset password.' });
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setResetMessage({ type: 'danger', text: 'An error occurred. Please try again.' });
        } finally {
            setResetLoading(false);
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;

    return (
        <div className="portal-users-list p-4">
            <h2 className="mb-4">Portal Users & Permissions</h2>

            <Card>
                <Card.Body>
                    <div className="table-responsive">
                        <Table striped hover>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Permissions Summary</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.uid}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                {user.photoURL && <img src={user.photoURL} alt="" className="rounded-circle me-2" width="30" />}
                                                {user.displayName}
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            <Badge bg={user.role === 'admin' || user.role === 'super_admin' ? 'danger' : 'success'}>
                                                {user.role}
                                            </Badge>
                                        </td>
                                        <td>
                                            <small>
                                                {Object.entries(user.permissions || {}).map(([module, actions]) => (
                                                    <div key={module}>
                                                        <strong>{module}:</strong> {Object.keys(actions).filter(k => actions[k]).join(', ')}
                                                    </div>
                                                ))}
                                            </small>
                                        </td>
                                        <td>
                                            <Button variant="outline-primary" size="sm" onClick={() => handleEdit(user)} className="me-1">
                                                <i className="bi bi-shield-lock"></i> Permissions
                                            </Button>
                                            {isAdmin && (
                                                <Button variant="outline-warning" size="sm" onClick={() => handleResetPassword(user)}>
                                                    <i className="bi bi-key"></i> Reset Password
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Permissions Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Manage Permissions: {selectedUser?.displayName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-4">
                            <Form.Label>Role</Form.Label>
                            <Form.Select name="role" value={formData.role} onChange={handleChange}>
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </Form.Select>
                            <Form.Text className="text-muted">
                                Admins generally have full access, while Staff relies on granular permissions.
                            </Form.Text>
                        </Form.Group>

                        <h5>Granular Permissions</h5>
                        <Table bordered>
                            <thead>
                                <tr>
                                    <th>Module</th>
                                    <th className="text-center">View</th>
                                    <th className="text-center">Edit</th>
                                    <th className="text-center">Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {['users', 'attendance', 'content', 'degrees', 'settings'].map(module => (
                                    <tr key={module}>
                                        <td className="text-capitalize">{module}</td>
                                        {['view', 'edit', 'delete'].map(action => (
                                            <td key={action} className="text-center">
                                                {/* Hide delete for settings as it's not applicable */}
                                                {(module !== 'settings' || action !== 'delete') ? (
                                                    <Form.Check
                                                        type="checkbox"
                                                        name={`permissions.${module}.${action}`}
                                                        checked={formData.permissions?.[module]?.[action] || false}
                                                        onChange={handleChange}
                                                        disabled={formData.role === 'admin' || formData.role === 'super_admin'}
                                                    />
                                                ) : null}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmit}>Save Changes</Button>
                </Modal.Footer>
            </Modal>

            {/* Reset Password Modal */}
            <Modal show={showResetModal} onHide={() => setShowResetModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Reset Password: {resetUser?.displayName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {resetMessage.text && (
                        <Alert variant={resetMessage.type} dismissible onClose={() => setResetMessage({ type: '', text: '' })}>
                            {resetMessage.text}
                        </Alert>
                    )}

                    {!resetMessage.text?.includes('successfully') && (
                        <>
                            <p className="text-muted small">
                                Set a new password for <strong>{resetUser?.email}</strong>.
                                The user will need to use this new password to log in.
                            </p>

                            <FloatingLabel controlId="resetNewPassword" label="New Password" className="mb-3">
                                <Form.Control
                                    type="password"
                                    value={resetPassword}
                                    onChange={(e) => setResetPassword(e.target.value)}
                                    placeholder="New Password"
                                />
                            </FloatingLabel>

                            <FloatingLabel controlId="resetConfirmPassword" label="Confirm Password" className="mb-3">
                                <Form.Control
                                    type="password"
                                    value={confirmResetPassword}
                                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                                    placeholder="Confirm Password"
                                />
                            </FloatingLabel>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowResetModal(false)}>
                        {resetMessage.text?.includes('successfully') ? 'Close' : 'Cancel'}
                    </Button>
                    {!resetMessage.text?.includes('successfully') && (
                        <Button variant="warning" onClick={handleSubmitResetPassword} disabled={resetLoading}>
                            {resetLoading ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>Resetting...</>
                            ) : (
                                <><i className="bi bi-key me-2"></i>Reset Password</>
                            )}
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default PortalUserList;
