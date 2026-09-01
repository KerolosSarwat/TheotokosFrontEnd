import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Button, Form, InputGroup, Modal, Badge, Spinner, Alert, Row, Col, Table } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import * as htmlToImage from 'html-to-image';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import { userService, idCardService } from '../../services/services';
import DynamicIDCard from './DynamicIDCard';

const IDCardGenerator = () => {
    const { t } = useTranslation();

    // Users data
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('');

    // ID Card config
    const [cardConfig, setCardConfig] = useState(null);
    const [configLoading, setConfigLoading] = useState(true);

    // Selection
    const [selectedUserIds, setSelectedUserIds] = useState(new Set());

    // Export state
    const [exporting, setExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportSuccess, setExportSuccess] = useState(null);

    // Preview modal
    const [previewUser, setPreviewUser] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    // Fetch users
    useEffect(() => {
        document.title = `${t('idCard.title')} | Firebase Portal`;
    }, [t]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const data = await userService.getAllUsers();
                setUsers(data);
            } catch (err) {
                setError('Error fetching users');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Fetch ID card config
    const fetchConfig = useCallback(async () => {
        try {
            setConfigLoading(true);
            const config = await idCardService.getConfig();
            setCardConfig(config);
        } catch (err) {
            console.error('Error fetching ID card config:', err);
            // Use defaults
            setCardConfig({
                width: 85.6,
                height: 53.98,
                backgroundUrl: null,
                selectedFields: ['fullName', 'code', 'level', 'church']
            });
        } finally {
            setConfigLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // Available levels
    const ALL_LEVELS = useMemo(() => {
        const levels = new Set();
        if (users) {
            Object.values(users).forEach(u => {
                if (u.level) levels.add(u.level);
            });
        }
        return Array.from(levels).sort();
    }, [users]);

    // Filtered and sorted users
    const filteredUsers = useMemo(() => {
        if (!users) return [];
        let arr = Object.values(users);

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            arr = arr.filter(u =>
                (u.fullName && u.fullName.toLowerCase().includes(term)) ||
                (u.code && u.code.toLowerCase().includes(term)) ||
                (u.phoneNumber && u.phoneNumber.includes(term))
            );
        }

        // Level filter
        if (selectedLevel) {
            arr = arr.filter(u => u.level === selectedLevel);
        }

        return arr.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    }, [users, searchTerm, selectedLevel]);

    // Selection handlers
    const toggleSelectUser = (code) => {
        const newSet = new Set(selectedUserIds);
        if (newSet.has(code)) {
            newSet.delete(code);
        } else {
            newSet.add(code);
        }
        setSelectedUserIds(newSet);
    };

    const toggleSelectAll = (checked) => {
        if (checked) {
            const allCodes = filteredUsers.map(u => u.code);
            setSelectedUserIds(new Set(allCodes));
        } else {
            setSelectedUserIds(new Set());
        }
    };

    const isAllSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.has(u.code));

    // Get user objects from selected IDs
    const selectedUsers = useMemo(() => {
        if (!users) return [];
        return Array.from(selectedUserIds)
            .map(code => users[code] || Object.values(users).find(u => u.code === code))
            .filter(Boolean);
    }, [users, selectedUserIds]);

    // Download single ID card
    const handleDownloadSingle = async (user) => {
        try {
            setExporting(true);
            // Small delay to ensure rendering
            await new Promise(r => setTimeout(r, 300));

            const el = document.getElementById(`id-card-${user.code}`);
            if (!el) {
                throw new Error('Card element not found');
            }

            const dataUrl = await htmlToImage.toPng(el, { backgroundColor: 'white', pixelRatio: 2 });
            saveAs(dataUrl, `ID_${user.fullName}_${user.code}.png`);
            setExportSuccess(t('idCard.downloadComplete'));
            setTimeout(() => setExportSuccess(null), 3000);
        } catch (err) {
            console.error('Error generating ID card:', err);
            setError('Error generating ID card');
        } finally {
            setExporting(false);
        }
    };

    // Bulk download as ZIP
    const handleBulkDownload = async () => {
        if (selectedUsers.length === 0) return;

        try {
            setExporting(true);
            setExportProgress(0);

            // Small delay for rendering
            await new Promise(r => setTimeout(r, 500));

            const zip = new JSZip();
            let processed = 0;

            for (const user of selectedUsers) {
                const el = document.getElementById(`bulk-gen-${user.code}`);
                if (!el) continue;

                try {
                    const blob = await htmlToImage.toBlob(el, { backgroundColor: 'white', pixelRatio: 2 });
                    if (blob) {
                        zip.file(`${user.fullName}_${user.code}.png`, blob);
                    }
                } catch (err) {
                    console.error(`Failed to generate ID for ${user.code}:`, err);
                }

                processed++;
                setExportProgress(Math.round((processed / selectedUsers.length) * 100));
            }

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'Student_IDs.zip');

            setExportSuccess(t('idCard.downloadComplete'));
            setTimeout(() => setExportSuccess(null), 3000);
        } catch (err) {
            console.error('Bulk download failed:', err);
            setError('Bulk download failed');
        } finally {
            setExporting(false);
            setExportProgress(0);
        }
    };

    // Print selected cards
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const cardsHtml = selectedUsers.map(user => {
            const el = document.getElementById(`bulk-gen-${user.code}`);
            return el ? el.outerHTML : '';
        }).join('<div style="page-break-after: always;"></div>');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Student ID Cards</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                        body { margin: 0; padding: 20px; display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
                        .dynamic-id-card { break-inside: avoid; margin: 8px; }
                        @media print {
                            body { padding: 0; }
                            .dynamic-id-card { border: none !important; box-shadow: none !important; }
                        }
                    </style>
                </head>
                <body>${cardsHtml}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    };

    if (loading || configLoading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    return (
        <div className="id-card-generator p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">
                    <i className="bi bi-person-badge me-2"></i>
                    {t('idCard.title')}
                </h2>
                {selectedUserIds.size > 0 && (
                    <Badge bg="primary" pill className="fs-6 px-3 py-2">
                        {selectedUserIds.size} {t('idCard.selectedUsers')}
                    </Badge>
                )}
            </div>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            {exportSuccess && <Alert variant="success" onClose={() => setExportSuccess(null)} dismissible>{exportSuccess}</Alert>}

            <Row className="g-4">
                {/* Left Panel — User Selection */}
                <Col lg={7}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Header className="bg-white border-bottom py-3">
                            <div className="d-flex flex-column flex-md-row gap-2">
                                <InputGroup className="flex-grow-1">
                                    <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder={t('users.searchPlaceholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                                            <i className="bi bi-x-lg"></i>
                                        </Button>
                                    )}
                                </InputGroup>
                                <Form.Select
                                    value={selectedLevel}
                                    onChange={(e) => setSelectedLevel(e.target.value)}
                                    style={{ maxWidth: '200px' }}
                                >
                                    <option value="">{t('attendance.allLevels')}</option>
                                    {ALL_LEVELS.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </Form.Select>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                            <Table hover responsive className="mb-0 align-middle">
                                <thead className="sticky-top bg-light">
                                    <tr>
                                        <th style={{ width: '40px' }}>
                                            <Form.Check
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={(e) => toggleSelectAll(e.target.checked)}
                                            />
                                        </th>
                                        <th>{t('users.code')}</th>
                                        <th>{t('users.fullName')}</th>
                                        <th>{t('users.level')}</th>
                                        <th style={{ width: '80px' }}>{t('idCard.preview')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.code} className={selectedUserIds.has(user.code) ? 'table-primary' : ''}>
                                            <td>
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={selectedUserIds.has(user.code)}
                                                    onChange={() => toggleSelectUser(user.code)}
                                                />
                                            </td>
                                            <td><code className="small">{user.code}</code></td>
                                            <td className="fw-semibold">{user.fullName}</td>
                                            <td><Badge bg="info" className="fw-normal">{user.level}</Badge></td>
                                            <td>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setPreviewUser(user);
                                                        setShowPreview(true);
                                                    }}
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="text-center py-4 text-muted">
                                                {t('common.noResults')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                        <Card.Footer className="bg-light d-flex justify-content-between align-items-center py-2">
                            <small className="text-muted">
                                {t('common.displaying')} {filteredUsers.length} {t('common.students')}
                            </small>
                            <small className="text-muted">
                                {selectedUserIds.size} {t('idCard.selectedUsers')}
                            </small>
                        </Card.Footer>
                    </Card>
                </Col>

                {/* Right Panel — Preview & Actions */}
                <Col lg={5}>
                    <Card className="shadow-sm border-0 mb-3">
                        <Card.Header className="bg-white border-bottom py-3">
                            <h5 className="mb-0">
                                <i className="bi bi-card-heading me-2"></i>
                                {t('idCard.preview')}
                            </h5>
                        </Card.Header>
                        <Card.Body className="d-flex flex-column align-items-center justify-content-center bg-light p-4"
                            style={{ minHeight: '250px' }}
                        >
                            {selectedUsers.length > 0 ? (
                                <div className="text-center">
                                    <div id={`id-card-${selectedUsers[0].code}`}>
                                        <DynamicIDCard
                                            user={selectedUsers[0]}
                                            config={cardConfig}
                                            id={`preview-card-${selectedUsers[0].code}`}
                                        />
                                    </div>
                                    {selectedUsers.length > 1 && (
                                        <p className="text-muted mt-3 small">
                                            <i className="bi bi-info-circle me-1"></i>
                                            {t('idCard.preview')} — {selectedUsers[0].fullName}
                                            {' '}(+{selectedUsers.length - 1})
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-muted py-4">
                                    <i className="bi bi-person-badge" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                                    <p className="mt-3">{t('idCard.noUsersSelected')}</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Actions Card */}
                    <Card className="shadow-sm border-0">
                        <Card.Body>
                            <div className="d-grid gap-2">
                                {selectedUsers.length === 1 && (
                                    <Button
                                        variant="primary"
                                        onClick={() => handleDownloadSingle(selectedUsers[0])}
                                        disabled={exporting}
                                    >
                                        <i className="bi bi-download me-2"></i>
                                        {exporting ? t('idCard.generating') : t('idCard.downloadSingle')}
                                    </Button>
                                )}

                                {selectedUsers.length > 0 && (
                                    <>
                                        <Button
                                            variant="success"
                                            onClick={handleBulkDownload}
                                            disabled={exporting}
                                        >
                                            {exporting ? (
                                                <>
                                                    <Spinner animation="border" size="sm" className="me-2" />
                                                    {t('idCard.generating')} ({exportProgress}%)
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-file-earmark-zip me-2"></i>
                                                    {t('idCard.downloadBulk')} ({selectedUsers.length})
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            variant="outline-secondary"
                                            onClick={handlePrint}
                                            disabled={exporting}
                                        >
                                            <i className="bi bi-printer me-2"></i>
                                            {t('idCard.printCards')}
                                        </Button>
                                    </>
                                )}

                                {selectedUsers.length === 0 && (
                                    <Button variant="outline-secondary" disabled>
                                        <i className="bi bi-download me-2"></i>
                                        {t('idCard.noUsersSelected')}
                                    </Button>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Preview Modal */}
            <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-card-heading me-2"></i>
                        {previewUser?.fullName} — {t('idCard.preview')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="d-flex justify-content-center bg-light p-4">
                    {previewUser && (
                        <div id={`id-card-${previewUser.code}`}>
                            <DynamicIDCard
                                user={previewUser}
                                config={cardConfig}
                                id={`modal-card-${previewUser.code}`}
                            />
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => previewUser && handleDownloadSingle(previewUser)} disabled={exporting}>
                        <i className="bi bi-download me-2"></i>
                        {exporting ? t('idCard.generating') : t('idCard.downloadSingle')}
                    </Button>
                    <Button variant="secondary" onClick={() => setShowPreview(false)}>
                        {t('common.close')}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Hidden off-screen container for bulk rendering */}
            <div style={{ position: 'absolute', left: '-6000px', top: 0, zIndex: -1000, backgroundColor: 'white' }}>
                {selectedUsers.map(user => (
                    <div key={`bulk-${user.code}`} id={`bulk-gen-${user.code}`}
                        style={{ display: 'inline-block', margin: '10px', backgroundColor: 'white' }}
                    >
                        <DynamicIDCard
                            user={user}
                            config={cardConfig}
                            id={`bulk-card-${user.code}`}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IDCardGenerator;
