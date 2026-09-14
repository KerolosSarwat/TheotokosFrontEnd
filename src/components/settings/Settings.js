import { useState, useEffect, useCallback } from 'react';
import { Card, Form, Button, Row, Col, Alert, Tabs, Tab, Spinner, Table, Modal, Badge } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { configService, idCardService } from '../../services/services';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';

const Settings = () => {
    const { t } = useTranslation();
    const { hasPermission } = useAuth();
    const { refreshConfig } = useConfig();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Level editing state
    const [showLevelModal, setShowLevelModal] = useState(false);
    const [editingLevel, setEditingLevel] = useState(null);
    const [levelForm, setLevelForm] = useState({
        arName: '', engName: '', id: 0, saintName: '', sortOrder: 1
    });

    // ID Card settings state
    const [idCardConfig, setIdCardConfig] = useState(null);
    const [bgFile, setBgFile] = useState(null);
    const [bgPreview, setBgPreview] = useState(null);
    const [idCardSaving, setIdCardSaving] = useState(false);

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

    // Fetch ID card config
    useEffect(() => {
        const fetchIdCardConfig = async () => {
            try {
                const data = await idCardService.getConfig();
                setIdCardConfig(data);
            } catch (err) {
                console.error('Error fetching ID card config:', err);
                setIdCardConfig({
                    width: 85.6,
                    height: 53.98,
                    backgroundUrl: null,
                    selectedFields: ['fullName', 'code', 'level', 'church']
                });
            }
        };
        fetchIdCardConfig();
    }, []);

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
    // --- Level List CRUD handlers ---
    const openAddLevelModal = () => {
        const levels = config?.levelList || [];
        const maxId = levels.length > 0 ? Math.max(...levels.map(l => l.id)) : -1;
        const maxSort = levels.length > 0 ? Math.max(...levels.map(l => l.sortOrder)) : 0;
        setEditingLevel(null);
        setLevelForm({ arName: '', engName: '', id: maxId + 1, saintName: '', sortOrder: maxSort + 1 });
        setShowLevelModal(true);
    };

    const openEditLevelModal = (level) => {
        setEditingLevel(level);
        setLevelForm({ ...level });
        setShowLevelModal(true);
    };

    const handleLevelFormChange = (field, value) => {
        setLevelForm(prev => ({
            ...prev,
            [field]: field === 'id' || field === 'sortOrder' ? Number(value) : value
        }));
    };

    const handleSaveLevel = () => {
        setConfig(prev => {
            const levels = [...(prev.levelList || [])];
            if (editingLevel !== null) {
                // Edit existing
                const idx = levels.findIndex(l => l.id === editingLevel.id);
                if (idx !== -1) levels[idx] = { ...levelForm };
            } else {
                // Add new
                levels.push({ ...levelForm });
            }
            levels.sort((a, b) => a.sortOrder - b.sortOrder);
            return { ...prev, levelList: levels };
        });
        setShowLevelModal(false);
    };

    const handleDeleteLevel = (levelId) => {
        if (!window.confirm('Are you sure you want to delete this level?')) return;
        setConfig(prev => ({
            ...prev,
            levelList: (prev.levelList || []).filter(l => l.id !== levelId)
        }));
    };

    const handleMoveLevelUp = (index) => {
        setConfig(prev => {
            const levels = [...(prev.levelList || [])].sort((a, b) => a.sortOrder - b.sortOrder);
            if (index <= 0) return prev;
            const temp = levels[index].sortOrder;
            levels[index].sortOrder = levels[index - 1].sortOrder;
            levels[index - 1].sortOrder = temp;
            levels.sort((a, b) => a.sortOrder - b.sortOrder);
            return { ...prev, levelList: levels };
        });
    };

    const handleMoveLevelDown = (index) => {
        setConfig(prev => {
            const levels = [...(prev.levelList || [])].sort((a, b) => a.sortOrder - b.sortOrder);
            if (index >= levels.length - 1) return prev;
            const temp = levels[index].sortOrder;
            levels[index].sortOrder = levels[index + 1].sortOrder;
            levels[index + 1].sortOrder = temp;
            levels.sort((a, b) => a.sortOrder - b.sortOrder);
            return { ...prev, levelList: levels };
        });
    };

    // --- General config handlers ---
    const handleGeneralChange = (field, value) => {
        setConfig(prev => ({
            ...prev,
            [field]: field === 'currentYear' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            await configService.updateConfig(config);
            await refreshConfig(); // Refresh global config context so all components pick up changes
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

                    <Tab eventKey="idCard" title={t('idCard.settingsTab')}>
                        <Card className="shadow-sm border-0">
                            <Card.Body>
                                <Card.Title className="mb-4">{t('idCard.dimensions')}</Card.Title>
                                <Row className="g-3 mb-4">
                                    <Col md={4}>
                                        <Form.Group controlId="id-card-width">
                                            <Form.Label>{t('idCard.width')}</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.1"
                                                value={idCardConfig?.width || 85.6}
                                                onChange={(e) => setIdCardConfig(prev => ({ ...prev, width: Number(e.target.value) }))}
                                                disabled={!canEdit}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group controlId="id-card-height">
                                            <Form.Label>{t('idCard.height')}</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.1"
                                                value={idCardConfig?.height || 53.98}
                                                onChange={(e) => setIdCardConfig(prev => ({ ...prev, height: Number(e.target.value) }))}
                                                disabled={!canEdit}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <hr />

                                <Card.Title className="mb-3">{t('idCard.background')}</Card.Title>
                                <Row className="g-3 mb-4">
                                    <Col md={6}>
                                        <Form.Group controlId="id-card-background">
                                            <Form.Label>{t('idCard.uploadBackground')}</Form.Label>
                                            <Form.Control
                                                type="file"
                                                accept="image/*"
                                                disabled={!canEdit}
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setBgFile(file);
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setBgPreview(reader.result);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Label>{t('idCard.currentBackground')}</Form.Label>
                                        <div className="border rounded p-2 bg-light text-center" style={{ minHeight: '80px' }}>
                                            {(bgPreview || idCardConfig?.backgroundUrl) ? (
                                                <img
                                                    src={bgPreview || idCardConfig.backgroundUrl}
                                                    alt="Background"
                                                    style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }}
                                                />
                                            ) : (
                                                <span className="text-muted small">{t('idCard.noBackground')}</span>
                                            )}
                                        </div>
                                    </Col>
                                </Row>

                                <hr />

                                <Card.Title className="mb-3">{t('idCard.selectFields')}</Card.Title>
                                <Row className="g-2">
                                    {['fullName', 'code', 'level', 'phoneNumber', 'church', 'address', 'gender', 'birthdate'].map(field => (
                                        <Col xs={6} md={4} lg={3} key={field}>
                                            <Form.Check
                                                type="checkbox"
                                                id={`field-${field}`}
                                                label={t(`idCard.fields.${field}`)}
                                                checked={idCardConfig?.selectedFields?.includes(field) || false}
                                                disabled={!canEdit}
                                                onChange={(e) => {
                                                    setIdCardConfig(prev => {
                                                        const fields = prev.selectedFields || [];
                                                        if (e.target.checked) {
                                                            return { ...prev, selectedFields: [...fields, field] };
                                                        } else {
                                                            return { ...prev, selectedFields: fields.filter(f => f !== field) };
                                                        }
                                                    });
                                                }}
                                            />
                                        </Col>
                                    ))}
                                </Row>

                                {canEdit && (
                                    <div className="d-flex justify-content-end mt-4">
                                        <Button
                                            variant="primary"
                                            disabled={idCardSaving}
                                            onClick={async () => {
                                                try {
                                                    setIdCardSaving(true);
                                                    setError(null);

                                                    // Upload background if a new file was selected
                                                    if (bgFile) {
                                                        const uploadResult = await idCardService.uploadBackground(bgFile);
                                                        setIdCardConfig(prev => ({ ...prev, backgroundUrl: uploadResult.backgroundUrl }));
                                                        setBgFile(null);
                                                        setBgPreview(null);
                                                    }

                                                    // Save dimensions and fields
                                                    await idCardService.updateConfig({
                                                        width: idCardConfig.width,
                                                        height: idCardConfig.height,
                                                        selectedFields: idCardConfig.selectedFields
                                                    });

                                                    setSuccess(t('settings.saveSuccess'));
                                                    setTimeout(() => setSuccess(null), 3000);
                                                } catch (err) {
                                                    console.error('Error saving ID card config:', err);
                                                    setError(t('settings.saveError'));
                                                } finally {
                                                    setIdCardSaving(false);
                                                }
                                            }}
                                            className="px-5"
                                        >
                                            {idCardSaving ? t('common.processing') : t('settings.saveAll')}
                                        </Button>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab>

                    <Tab eventKey="configuration" title={<><i className="bi bi-gear-wide-connected me-1"></i> Configuration</>}>
                        {/* General Settings */}
                        <Card className="shadow-sm border-0 mb-4">
                            <Card.Body>
                                <Card.Title className="mb-4">
                                    <i className="bi bi-sliders me-2"></i>
                                    General Settings
                                </Card.Title>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group controlId="academicYear">
                                            <Form.Label>Academic Year</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="e.g. 2027-2028"
                                                value={config?.academicYear || ''}
                                                onChange={(e) => handleGeneralChange('academicYear', e.target.value)}
                                                disabled={!canEdit}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="currentYear">
                                            <Form.Label>Current Year Number</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min="1"
                                                value={config?.currentYear || 1}
                                                onChange={(e) => handleGeneralChange('currentYear', e.target.value)}
                                                disabled={!canEdit}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Level List Management */}
                        <Card className="shadow-sm border-0">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <Card.Title className="mb-0">
                                        <i className="bi bi-list-ol me-2"></i>
                                        Level List
                                        <Badge bg="secondary" className="ms-2">{(config?.levelList || []).length}</Badge>
                                    </Card.Title>
                                    {canEdit && (
                                        <Button variant="primary" size="sm" onClick={openAddLevelModal}>
                                            <i className="bi bi-plus-lg me-1"></i> Add Level
                                        </Button>
                                    )}
                                </div>

                                {(!config?.levelList || config.levelList.length === 0) ? (
                                    <Alert variant="info">
                                        <i className="bi bi-info-circle me-2"></i>
                                        No levels configured. Click "Add Level" to create your first level.
                                    </Alert>
                                ) : (
                                    <div className="table-responsive">
                                        <Table striped bordered hover size="sm">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th style={{ width: '50px' }}>#</th>
                                                    <th>Arabic Name</th>
                                                    <th>English Name</th>
                                                    <th>ID</th>
                                                    <th>Saint Name</th>
                                                    <th style={{ width: '80px' }}>Order</th>
                                                    {canEdit && <th style={{ width: '150px' }}>Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[...(config.levelList || [])]
                                                    .sort((a, b) => a.sortOrder - b.sortOrder)
                                                    .map((level, index, arr) => (
                                                    <tr key={level.id}>
                                                        <td className="text-center text-muted">{index + 1}</td>
                                                        <td>
                                                            <span className="fw-semibold">{level.arName}</span>
                                                        </td>
                                                        <td>{level.engName}</td>
                                                        <td>
                                                            <Badge bg="outline-secondary" className="border text-body">{level.id}</Badge>
                                                        </td>
                                                        <td>
                                                            <small className="text-muted">{level.saintName}</small>
                                                        </td>
                                                        <td className="text-center">
                                                            <Badge bg="info">{level.sortOrder}</Badge>
                                                        </td>
                                                        {canEdit && (
                                                            <td>
                                                                <div className="d-flex gap-1">
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        onClick={() => handleMoveLevelUp(index)}
                                                                        disabled={index === 0}
                                                                        title="Move Up"
                                                                    >
                                                                        <i className="bi bi-arrow-up"></i>
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        onClick={() => handleMoveLevelDown(index)}
                                                                        disabled={index === arr.length - 1}
                                                                        title="Move Down"
                                                                    >
                                                                        <i className="bi bi-arrow-down"></i>
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline-warning"
                                                                        size="sm"
                                                                        onClick={() => openEditLevelModal(level)}
                                                                        title="Edit"
                                                                    >
                                                                        <i className="bi bi-pencil"></i>
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteLevel(level.id)}
                                                                        title="Delete"
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
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

            {/* Level Add/Edit Modal */}
            <Modal show={showLevelModal} onHide={() => setShowLevelModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className={`bi ${editingLevel ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                        {editingLevel ? 'Edit Level' : 'Add New Level'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group controlId="level-arName">
                                <Form.Label>Arabic Name <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    value={levelForm.arName}
                                    onChange={(e) => handleLevelFormChange('arName', e.target.value)}
                                    placeholder="e.g. حضانة"
                                    dir="rtl"
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="level-engName">
                                <Form.Label>English Name <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    value={levelForm.engName}
                                    onChange={(e) => handleLevelFormChange('engName', e.target.value)}
                                    placeholder="e.g. primary"
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="level-id">
                                <Form.Label>ID</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={levelForm.id}
                                    onChange={(e) => handleLevelFormChange('id', e.target.value)}
                                    min="0"
                                    disabled={!!editingLevel}
                                />
                                {editingLevel && <Form.Text className="text-muted">ID cannot be changed after creation</Form.Text>}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="level-sortOrder">
                                <Form.Label>Sort Order</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={levelForm.sortOrder}
                                    onChange={(e) => handleLevelFormChange('sortOrder', e.target.value)}
                                    min="1"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group controlId="level-saintName">
                                <Form.Label>Saint Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={levelForm.saintName}
                                    onChange={(e) => handleLevelFormChange('saintName', e.target.value)}
                                    placeholder="e.g. الملاك ميخائيل"
                                    dir="rtl"
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowLevelModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSaveLevel}
                        disabled={!levelForm.arName.trim() || !levelForm.engName.trim()}
                    >
                        <i className={`bi ${editingLevel ? 'bi-check-lg' : 'bi-plus-lg'} me-1`}></i>
                        {editingLevel ? 'Save Changes' : 'Add Level'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Settings;
