import { useState, useEffect, useCallback } from 'react';
import { Card, Form, Button, Row, Col, Alert, Tabs, Tab, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { configService } from '../../services/services';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
    const { t } = useTranslation();
    const { hasPermission } = useAuth();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const canEdit = hasPermission('settings', 'edit');
    const canView = hasPermission('settings', 'view');

    const fetchConfig = useCallback(async () => {
        try {
            setLoading(true);
            const data = await configService.getConfig();
            setConfig(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching config:', err);
            setError(t('settings.loadError'));
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const handleDegreeChange = (subject, value) => {
        setConfig(prev => ({
            ...prev,
            degrees: {
                ...prev.degrees,
                [subject]: Number(value)
            }
        }));
    };

    // Helper to calculate weeks between two dates
    const calculateWeeks = (start, end) => {
        if (!start || !end) return 0;
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.ceil(diffDays / 7);
    };

    // Helper to format date for input (type="date" requires YYYY-MM-DD)
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        // If it's already YYYY-MM-DD, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

        // Try to parse DD/MM/YYYY or MM/DD/YYYY
        const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
        if (parts.length === 3) {
            // Check if first part is year (YYYY-MM-DD)
            if (parts[0].length === 4) return parts.join('-');

            // Assume it's DD/MM/YYYY and convert to YYYY-MM-DD
            // Given the confusion in placeholders vs example, we'll try to be robust
            // If the first part is > 12, it must be the day.
            let day, month, year;
            if (parseInt(parts[0]) > 12) {
                day = parts[0].padStart(2, '0');
                month = parts[1].padStart(2, '0');
                year = parts[2];
            } else {
                // If it could be either, we stick to the placeholder's hint (DD/MM/YYYY)
                day = parts[0].padStart(2, '0');
                month = parts[1].padStart(2, '0');
                year = parts[2];
            }
            return `${year}-${month}-${day}`;
        }
        return dateStr;
    };

    const handleTermMetaChange = (termKey, field, value) => {
        setConfig(prev => {
            const currentTermData = { ...prev.terms[termKey], [field]: field === 'week_count' ? Number(value) : value };

            // Automatic week calculation
            if (field === 'start_date' || field === 'end_date') {
                const startDate = field === 'start_date' ? value : currentTermData.start_date;
                const endDate = field === 'end_date' ? value : currentTermData.end_date;

                if (startDate && endDate) {
                    currentTermData.week_count = calculateWeeks(startDate, endDate);
                }
            }

            return {
                ...prev,
                terms: {
                    ...prev.terms,
                    [termKey]: currentTermData
                }
            };
        });
    };

    const handleCurrentTermChange = (value) => {
        setConfig(prev => ({
            ...prev,
            terms: {
                ...prev.terms,
                current_term: Number(value)
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            await configService.updateConfig(config);
            setSuccess(t('settings.saveSuccess'));
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error updating config:', err);
            setError(t('settings.saveError'));
        } finally {
            setSaving(false);
        }
    };

    if (!canView) {
        return (
            <div className="p-4 text-center">
                <Alert variant="danger">
                    {t('common.error')}: You do not have permission to view settings.
                </Alert>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div className="settings-page p-4">
            <h2 className="mb-4">{t('settings.title')}</h2>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Tabs defaultActiveKey="degrees" id="settings-tabs" className="mb-4">
                    <Tab eventKey="degrees" title={t('settings.degreesTab')}>
                        <Card className="shadow-sm border-0">
                            <Card.Body>
                                <Card.Title className="mb-4">{t('settings.degreesTitle')}</Card.Title>
                                <Row className="g-3">
                                    {['agbya', 'attendance', 'coptic', 'hymns', 'taks'].map(subject => (
                                        <Col md={6} lg={4} key={subject}>
                                            <Form.Group controlId={`degree-${subject}`}>
                                                <Form.Label className="text-capitalize">{t(`subjects.${subject}`)}</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    value={config?.degrees?.[subject] || 0}
                                                    onChange={(e) => handleDegreeChange(subject, e.target.value)}
                                                    min="0"
                                                    disabled={!canEdit}
                                                />
                                            </Form.Group>
                                        </Col>
                                    ))}
                                </Row>
                            </Card.Body>
                        </Card>
                    </Tab>

                    <Tab eventKey="terms" title={t('settings.termsTab')}>
                        <Card className="shadow-sm border-0">
                            <Card.Body>
                                <Card.Title className="mb-4">{t('settings.globalTermsTitle')}</Card.Title>
                                <Row className="mb-4">
                                    <Col md={4}>
                                        <Form.Group controlId="current-term">
                                            <Form.Label>{t('settings.currentTerm')}</Form.Label>
                                            <Form.Select
                                                value={config?.terms?.current_term || 1}
                                                onChange={(e) => handleCurrentTermChange(e.target.value)}
                                                disabled={!canEdit}
                                            >
                                                <option value={1}>{t('terms.first')}</option>
                                                <option value={2}>{t('terms.second')}</option>
                                                <option value={3}>{t('terms.third')}</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <hr />

                                {['first_term', 'second_term', 'third_term'].map((termKey, index) => (
                                    <div key={termKey} className="mb-4">
                                        <h5 className="text-capitalize mb-3">{t(`terms.${termKey.split('_')[0]}`)}</h5>
                                        <Row className="g-3">
                                            <Col md={4}>
                                                <Form.Group controlId={`${termKey}-start`}>
                                                    <Form.Label>{t('settings.startDate')}</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={formatDateForInput(config?.terms?.[termKey]?.start_date) || ''}
                                                        onChange={(e) => handleTermMetaChange(termKey, 'start_date', e.target.value)}
                                                        disabled={!canEdit}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group controlId={`${termKey}-end`}>
                                                    <Form.Label>{t('settings.endDate')}</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={formatDateForInput(config?.terms?.[termKey]?.end_date) || ''}
                                                        onChange={(e) => handleTermMetaChange(termKey, 'end_date', e.target.value)}
                                                        disabled={!canEdit}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group controlId={`${termKey}-weeks`}>
                                                    <Form.Label>{t('settings.weeksCount')}</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        value={config?.terms?.[termKey]?.week_count || 0}
                                                        onChange={(e) => handleTermMetaChange(termKey, 'week_count', e.target.value)}
                                                        min="0"
                                                        disabled={!canEdit}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        {index < 2 && <hr className="mt-4" />}
                                    </div>
                                ))}
                            </Card.Body>
                        </Card>
                    </Tab>
                </Tabs>

                {canEdit && (
                    <div className="d-flex justify-content-end mt-4">
                        <Button variant="primary" type="submit" disabled={saving} className="px-5">
                            {saving ? t('common.processing') : t('settings.saveAll')}
                        </Button>
                    </div>
                )}
            </Form>
        </div>
    );
};

export default Settings;
