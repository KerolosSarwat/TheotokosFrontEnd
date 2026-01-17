import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/services';

const StudentDegreesModal = ({ show, onHide, userCode }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [studentName, setStudentName] = useState('');

    const [formData, setFormData] = useState({
        degree: {
            firstTerm: { agbya: 0, coptic: 0, hymns: 0, taks: 0, attencance: 0, total: 0 },
            secondTerm: { agbya: 0, attencance: 0, coptic: 0, hymns: 0, taks: 0, total: 0 },
            thirdTerm: { agbya: 0, attencance: 0, coptic: 0, hymns: 0, taks: 0, total: 0 }
        }
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                setError(null);
                setSuccess(false);
                const userData = await userService.getUserByCode(userCode);
                if (userData) {
                    setStudentName(userData.fullName);
                    if (userData.degree) {
                        setFormData(prev => ({ ...prev, degree: userData.degree }));
                    } else {
                        // Reset to default if no degrees found
                        setFormData({
                            degree: {
                                firstTerm: { agbya: 0, coptic: 0, hymns: 0, taks: 0, attencance: 0, total: 0 },
                                secondTerm: { agbya: 0, attencance: 0, coptic: 0, hymns: 0, taks: 0, total: 0 },
                                thirdTerm: { agbya: 0, attencance: 0, coptic: 0, hymns: 0, taks: 0, total: 0 }
                            }
                        });
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching user:', err);
                setError('Error fetching user data.');
                setLoading(false);
            }
        };

        if (show && userCode) {
            fetchUser();
        }
    }, [show, userCode]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (name.includes('.')) {
            const parts = name.split('.');
            setFormData(prevData => {
                const newData = { ...prevData };
                let current = newData;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]]) current[parts[i]] = {};
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = type === 'number' ? Number(value) : value;

                // Auto-calculate Total
                // parts[0] is 'degree', parts[1] is term (firstTerm, etc)
                if (parts[0] === 'degree' && parts[1]) {
                    const termData = newData.degree[parts[1]];
                    const subjects = ['agbya', 'coptic', 'hymns', 'taks', 'attencance'];
                    let total = 0;
                    subjects.forEach(sub => {
                        total += Number(termData[sub] || 0);
                    });
                    termData.total = total;
                }

                return newData;
            });
        }
    };

    const handleSubmit = async () => {
        setError(null);
        setSuccess(false);
        setSaving(true);

        try {
            await userService.updateUser(userCode, { degree: formData.degree });
            setSuccess(true);
            setSaving(false);
            setTimeout(() => {
                onHide();
                setSuccess(false);
            }, 1000);
        } catch (err) {
            setError('Error saving degrees.');
            console.error('Error saving degrees:', err);
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="bi bi-mortarboard-fill me-2 text-primary"></i>
                    {t('terms.degreeInfo')} - {studentName}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                ) : (
                    <>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{t('common.saved')}</Alert>}

                        <Form>
                            <Card className="mb-3 border-0 shadow-sm">
                                <Card.Header className="bg-light fw-bold">{t('terms.first')}</Card.Header>
                                <Card.Body>
                                    <Row>
                                        {['agbya', 'coptic', 'hymns', 'taks', 'attencance'].map(subject => (
                                            <Col md={2} sm={4} key={`first-${subject}`}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="small text-muted">{t(`subjects.${subject === 'attencance' ? 'attendance' : subject}`)}</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        name={`degree.firstTerm.${subject}`}
                                                        value={formData.degree.firstTerm?.[subject] || 0}
                                                        onChange={handleChange}
                                                        size="sm"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                        <Col md={2} sm={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small text-muted">{t('subjects.result')}</Form.Label>
                                                <Form.Control type="number" value={formData.degree.firstTerm?.total || 0} disabled size="sm" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            <Card className="mb-3 border-0 shadow-sm">
                                <Card.Header className="bg-light fw-bold">{t('terms.second')}</Card.Header>
                                <Card.Body>
                                    <Row>
                                        {['agbya', 'coptic', 'hymns', 'taks', 'attencance'].map(subject => (
                                            <Col md={2} sm={4} key={`second-${subject}`}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="small text-muted">{t(`subjects.${subject === 'attencance' ? 'attendance' : subject}`)}</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        name={`degree.secondTerm.${subject}`}
                                                        value={formData.degree.secondTerm?.[subject] || 0}
                                                        onChange={handleChange}
                                                        size="sm"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                        <Col md={2} sm={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small text-muted">{t('subjects.result')}</Form.Label>
                                                <Form.Control type="number" value={formData.degree.secondTerm?.total || 0} disabled size="sm" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            <Card className="mb-3 border-0 shadow-sm">
                                <Card.Header className="bg-light fw-bold">{t('terms.third')}</Card.Header>
                                <Card.Body>
                                    <Row>
                                        {['agbya', 'coptic', 'hymns', 'taks', 'attencance'].map(subject => (
                                            <Col md={2} sm={4} key={`third-${subject}`}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="small text-muted">{t(`subjects.${subject === 'attencance' ? 'attendance' : subject}`)}</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        name={`degree.thirdTerm.${subject}`}
                                                        value={formData.degree.thirdTerm?.[subject] || 0}
                                                        onChange={handleChange}
                                                        size="sm"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        ))}
                                        <Col md={2} sm={4}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="small text-muted">{t('subjects.result')}</Form.Label>
                                                <Form.Control type="number" value={formData.degree.thirdTerm?.total || 0} disabled size="sm" />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Form>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={saving}>{t('common.close')}</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={saving || loading}>
                    {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                    {t('common.save')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default StudentDegreesModal;
