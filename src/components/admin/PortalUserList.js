import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Button, Card, Modal, Form, Badge, Tab, Tabs } from 'react-bootstrap';
import { userService } from '../../services/services';
import { useAuth } from '../../context/AuthContext';

const PortalUserList = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Permissions Modal
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        role: 'staff',
        permissions: {}
    });

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
            setError('Failed to fetch portal users');
            setLoading(false);
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
                content: { view: false, edit: false, delete: false }
            }
        });
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            // Handle nested permission change
            const [root, module, action] = name.split('.'); // e.g. permissions.users.edit
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
                                            <Button variant="outline-primary" size="sm" onClick={() => handleEdit(user)}>
                                                <i className="bi bi-shield-lock"></i> Permissions
                                            </Button>
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
                                {['users', 'attendance', 'content'].map(module => (
                                    <tr key={module}>
                                        <td className="text-capitalize">{module}</td>
                                        {['view', 'edit', 'delete'].map(action => (
                                            <td key={action} className="text-center">
                                                <Form.Check
                                                    type="checkbox"
                                                    name={`permissions.${module}.${action}`}
                                                    checked={formData.permissions?.[module]?.[action] || false}
                                                    onChange={handleChange}
                                                    disabled={formData.role === 'admin' || formData.role === 'super_admin'}
                                                />
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
        </div>
    );
};

export default PortalUserList;
