import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/services';

const StudentDegrees = () => {
    const { t } = useTranslation();
    const { code } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        degree: {
            firstTerm: { agbya: 0, coptic: 0, hymns: 0, taks: 0 },
            secondTerm: { agbya: 0, attencance: 0, coptic: 0, hymns: 0, result: 0, taks: 0 },
            thirdTerm: { agbya: 0, attencance: 0, coptic: 0, hymns: 0, result: 0, taks: 0 }
        }
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [studentName, setStudentName] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                const userData = await userService.getUserByCode(code);
                if (userData) {
                    setStudentName(userData.fullName);
                    // Ensure degree structure exists, if not, keep default
                    if (userData.degree) {
                        setFormData(prev => ({ ...prev, degree: userData.degree }));
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching user:', err);
                setError('Error fetching user data.');
                setLoading(false);
            }
        };

        fetchUser();
    }, [code]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (name.includes('.')) {
            const parts = name.split('.');
            setFormData(prevData => {
                const newData = { ...prevData };
                let current = newData;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]]) current[parts[i]] = {}; // Safety check
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = type === 'number' ? Number(value) : value;
                return newData;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            // We only want to update the 'degree' field.
            // However, the current updateUser API replaces the whole object or merges.
            // If we send only { degree: ... }, does the backend merge?
            // Looking at controller: Use `userRef.update(userData)`. Firebase update merges at the top level keys provided.
            // So if we send { degree: ... }, it will replace the 'degree' node with the new one, which is exactly what we want.

            await userService.updateUser(code, { degree: formData.degree });
            setSuccess(true);
        } catch (err) {
            setError('Error saving degrees.');
            console.error('Error saving degrees:', err);
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{t('terms.degreeInfo')} - {studentName} ({code})</h2>
                <Button variant="outline-secondary" onClick={() => navigate('/users')}>
                    {t('common.back')}
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{t('common.saved')}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Card className="mb-3">
                    <Card.Header>{t('terms.first')}</Card.Header>
                    <Card.Body>
                        <Row>
                            {['agbya', 'coptic', 'hymns', 'taks'].map(subject => (
                                <Col md={3} key={`first-${subject}`}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>{t(`subjects.${subject}`)}</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name={`degree.firstTerm.${subject}`}
                                            value={formData.degree.firstTerm?.[subject] || 0}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>
                            ))}
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="mb-3">
                    <Card.Header>{t('terms.second')}</Card.Header>
                    <Card.Body>
                        <Row>
                            {['agbya', 'coptic', 'hymns', 'taks', 'attencance'].map(subject => (
                                <Col md={2} key={`second-${subject}`}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>{t(`subjects.${subject === 'attencance' ? 'attendance' : subject}`)}</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name={`degree.secondTerm.${subject}`}
                                            value={formData.degree.secondTerm?.[subject] || 0}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>
                            ))}
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('subjects.result')}</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="degree.secondTerm.result"
                                        disabled
                                        value={formData.degree.secondTerm?.result || 0}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="mb-3">
                    <Card.Header>{t('terms.third')}</Card.Header>
                    <Card.Body>
                        <Row>
                            {['agbya', 'coptic', 'hymns', 'taks', 'attencance'].map(subject => (
                                <Col md={2} key={`third-${subject}`}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>{t(`subjects.${subject === 'attencance' ? 'attendance' : subject}`)}</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name={`degree.thirdTerm.${subject}`}
                                            value={formData.degree.thirdTerm?.[subject] || 0}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                </Col>
                            ))}
                            <Col md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>{t('subjects.result')}</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="degree.thirdTerm.result"
                                        disabled
                                        value={formData.degree.thirdTerm?.result || 0}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Button variant="primary" type="submit">
                    {t('common.save')}
                </Button>
            </Form>
        </div>
    );
};

export default StudentDegrees;
