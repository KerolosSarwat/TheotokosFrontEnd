import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Row, Col, Alert, Spinner, Badge, Table, ProgressBar } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/services';
import { useAuth } from '../../context/AuthContext';

const ArchiveSync = () => {
    const { t } = useTranslation();
    const { hasPermission } = useAuth();

    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [syncResult, setSyncResult] = useState(null);

    const canEdit = hasPermission('users', 'edit');

    const fetchStatus = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await userService.getArchiveStatus();
            setStatus(data);
        } catch (err) {
            console.error('Error fetching archive status:', err);
            setError(t('archive.statusError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const handleSync = async () => {
        if (syncing) return;

        setSyncing(true);
        setError(null);
        setSuccess(null);
        setSyncResult(null);

        try {
            const data = await userService.syncArchive();
            setSuccess(t('archive.syncSuccess'));
            setSyncResult(data.result);
            // Refresh status after sync
            await fetchStatus();
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            console.error('Error syncing archive:', err);
            setError(t('archive.syncError'));
        } finally {
            setSyncing(false);
        }
    };

    const formatDuration = (ms) => {
        if (!ms) return '-';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return t('archive.never');
        const date = new Date(dateStr);
        return date.toLocaleString();
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    const usersInSync = status?.counts?.rtdb?.users === status?.counts?.archive?.users;
    const pendingInSync = status?.counts?.rtdb?.penddingUsers === status?.counts?.archive?.penddingUsers;

    return (
        <div className="p-3">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">{t('archive.title')}</h2>
                    <p className="text-muted mb-0">{t('archive.subtitle')}</p>
                </div>
                <div className="d-flex gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={fetchStatus}
                        disabled={loading}
                    >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        {t('common.refresh')}
                    </Button>
                    {canEdit && (
                        <Button
                            variant="primary"
                            onClick={handleSync}
                            disabled={syncing}
                        >
                            {syncing ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    {t('archive.syncing')}
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-cloud-upload me-1"></i>
                                    {t('archive.syncNow')}
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Alerts */}
            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

            {/* Sync Progress */}
            {syncing && (
                <Card className="mb-4 border-0 shadow-sm">
                    <Card.Body>
                        <div className="d-flex align-items-center mb-2">
                            <Spinner animation="border" size="sm" className="me-2" />
                            <strong>{t('archive.syncing')}</strong>
                        </div>
                        <ProgressBar animated now={100} variant="primary" />
                    </Card.Body>
                </Card>
            )}

            {/* Last Sync Status */}
            <Row className="mb-4">
                <Col md={6} lg={3} className="mb-3">
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <div className="text-muted small mb-1">{t('archive.syncStatus')}</div>
                            <div>
                                {status?.lastSync ? (
                                    <Badge bg={status.lastSync.status === 'success' ? 'success' : 'danger'} className="fs-6">
                                        {status.lastSync.status === 'success' ? t('archive.success') : t('archive.failed')}
                                    </Badge>
                                ) : (
                                    <Badge bg="secondary" className="fs-6">{t('archive.never')}</Badge>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <div className="text-muted small mb-1">{t('archive.lastSync')}</div>
                            <div className="fw-bold">
                                {formatDate(status?.lastSync?.syncedAt)}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <div className="text-muted small mb-1">{t('archive.duration')}</div>
                            <div className="fw-bold">
                                {formatDuration(status?.lastSync?.duration)}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3} className="mb-3">
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="text-center">
                            <div className="text-muted small mb-1">{t('archive.errorsCount')}</div>
                            <div className="fw-bold">
                                {status?.lastSync?.users?.errors != null
                                    ? (status.lastSync.users.errors + (status.lastSync.penddingUsers?.errors || 0))
                                    : '-'
                                }
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Data Comparison */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom">
                    <h5 className="mb-0">{t('archive.dataComparison')}</h5>
                </Card.Header>
                <Card.Body>
                    <Row>
                        {/* Users comparison */}
                        <Col md={6} className="mb-3 mb-md-0">
                            <Card className={`border ${usersInSync ? 'border-success' : 'border-warning'}`}>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="mb-0">{t('archive.users')}</h6>
                                        <Badge bg={usersInSync ? 'success' : 'warning'}>
                                            {usersInSync ? t('archive.matched') : t('archive.outOfSync')}
                                        </Badge>
                                    </div>
                                    <Row className="text-center">
                                        <Col>
                                            <div className="text-muted small">{t('archive.rtdbCount')}</div>
                                            <div className="fs-4 fw-bold text-primary">
                                                {status?.counts?.rtdb?.users ?? '-'}
                                            </div>
                                        </Col>
                                        <Col xs="auto" className="d-flex align-items-center">
                                            <i className={`bi ${usersInSync ? 'bi-arrow-left-right text-success' : 'bi-exclamation-triangle text-warning'} fs-4`}></i>
                                        </Col>
                                        <Col>
                                            <div className="text-muted small">{t('archive.archiveCount')}</div>
                                            <div className="fs-4 fw-bold text-info">
                                                {status?.counts?.archive?.users ?? '-'}
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Pending Users comparison */}
                        <Col md={6}>
                            <Card className={`border ${pendingInSync ? 'border-success' : 'border-warning'}`}>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h6 className="mb-0">{t('archive.pendingUsers')}</h6>
                                        <Badge bg={pendingInSync ? 'success' : 'warning'}>
                                            {pendingInSync ? t('archive.matched') : t('archive.outOfSync')}
                                        </Badge>
                                    </div>
                                    <Row className="text-center">
                                        <Col>
                                            <div className="text-muted small">{t('archive.rtdbCount')}</div>
                                            <div className="fs-4 fw-bold text-primary">
                                                {status?.counts?.rtdb?.penddingUsers ?? '-'}
                                            </div>
                                        </Col>
                                        <Col xs="auto" className="d-flex align-items-center">
                                            <i className={`bi ${pendingInSync ? 'bi-arrow-left-right text-success' : 'bi-exclamation-triangle text-warning'} fs-4`}></i>
                                        </Col>
                                        <Col>
                                            <div className="text-muted small">{t('archive.archiveCount')}</div>
                                            <div className="fs-4 fw-bold text-info">
                                                {status?.counts?.archive?.penddingUsers ?? '-'}
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Sync Result Details (shown after a manual sync) */}
            {syncResult && (
                <Card className="mb-4 border-0 shadow-sm border-start border-success border-3">
                    <Card.Header className="bg-white border-bottom">
                        <h5 className="mb-0">
                            <i className="bi bi-check-circle text-success me-2"></i>
                            Sync Result
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <h6>{t('archive.users')}</h6>
                                <ul className="list-unstyled">
                                    <li><Badge bg="success" className="me-2">{syncResult.users?.synced || 0}</Badge> {t('archive.syncedCount')}</li>
                                    <li><Badge bg="danger" className="me-2">{syncResult.users?.deleted || 0}</Badge> {t('archive.deletedCount')}</li>
                                    <li><Badge bg="warning" className="me-2">{syncResult.users?.errors || 0}</Badge> {t('archive.errorsCount')}</li>
                                </ul>
                            </Col>
                            <Col md={6}>
                                <h6>{t('archive.pendingUsers')}</h6>
                                <ul className="list-unstyled">
                                    <li><Badge bg="success" className="me-2">{syncResult.penddingUsers?.synced || 0}</Badge> {t('archive.syncedCount')}</li>
                                    <li><Badge bg="danger" className="me-2">{syncResult.penddingUsers?.deleted || 0}</Badge> {t('archive.deletedCount')}</li>
                                    <li><Badge bg="warning" className="me-2">{syncResult.penddingUsers?.errors || 0}</Badge> {t('archive.errorsCount')}</li>
                                </ul>
                            </Col>
                        </Row>
                        <div className="text-muted small mt-2">
                            {t('archive.duration')}: {formatDuration(syncResult.duration)}
                            {syncResult.snapshotId && ` • Snapshot: ${syncResult.snapshotId}`}
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Recent Snapshots */}
            <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-bottom">
                    <h5 className="mb-0">
                        <i className="bi bi-clock-history me-2"></i>
                        {t('archive.recentSnapshots')}
                    </h5>
                </Card.Header>
                <Card.Body className="p-0">
                    {status?.recentSnapshots && status.recentSnapshots.length > 0 ? (
                        <Table hover responsive className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>{t('archive.snapshotDate')}</th>
                                    <th className="text-center">{t('archive.snapshotUsers')}</th>
                                    <th className="text-center">{t('archive.snapshotPending')}</th>
                                    <th className="text-end">{t('archive.lastSync')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {status.recentSnapshots.map((snapshot) => (
                                    <tr key={snapshot.id}>
                                        <td>
                                            <Badge bg="light" text="dark" className="me-2">
                                                <i className="bi bi-calendar3 me-1"></i>
                                                {snapshot.id}
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <span className="fw-bold">{snapshot.usersCount ?? '-'}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="fw-bold">{snapshot.pendingUsersCount ?? '-'}</span>
                                        </td>
                                        <td className="text-end text-muted small">
                                            {formatDate(snapshot.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <div className="text-center text-muted py-4">
                            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                            {t('archive.noSnapshots')}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default ArchiveSync;
