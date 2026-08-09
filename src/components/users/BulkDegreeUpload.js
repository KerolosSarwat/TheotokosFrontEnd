import { useState, useRef } from 'react';
import { Button, Card, Form, Alert, Table, Badge, ProgressBar } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { userService } from '../../services/services';
import { useTranslation } from 'react-i18next';

const BATCH_SIZE = 10;

const BulkDegreeUpload = () => {
    const { t } = useTranslation();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [selectedTerm, setSelectedTerm] = useState('firstTerm');
    const [parsedData, setParsedData] = useState(null);
    const [validationResult, setValidationResult] = useState(null);

    // Progress tracking
    const [progress, setProgress] = useState(0);
    const [progressStatus, setProgressStatus] = useState('');
    const [currentPhase, setCurrentPhase] = useState(''); // 'validating' | 'uploading' | 'done'
    const [processedCount, setProcessedCount] = useState(0);
    const [totalToProcess, setTotalToProcess] = useState(0);

    const fileInputRef = useRef(null);

    const handleDownloadTemplate = () => {
        const headers = ['Code', 'Hymns', 'Agbya', 'Taks', 'Coptic', 'Attendance'];
        const sampleData = [
            ['1001', 10, 8, 9, 7, 5],
            ['1002', 9, 7, 8, 6, 4],
        ];
        const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

        // Set column widths
        ws['!cols'] = headers.map(() => ({ wch: 14 }));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Degrees_Template.xlsx");
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setResults(null);
        setError(null);
        setParsedData(null);
        setValidationResult(null);
        setProgress(0);
        setCurrentPhase('');
        setProgressStatus('');

        if (selectedFile) {
            parseFile(selectedFile);
        }
    };

    const parseFile = (fileToRead) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    setError(t('bulkDegree.emptyFile', 'The uploaded file is empty. Please add data and try again.'));
                    return;
                }

                const firstRow = jsonData[0];
                if (!firstRow.hasOwnProperty('Code')) {
                    setError(t('bulkDegree.missingCode', "Invalid template. Missing 'Code' column. Please use the template."));
                    return;
                }

                // Clean data — ensure numeric values
                const cleanedData = jsonData.map(row => ({
                    code: row['Code']?.toString()?.trim(),
                    hymns: Number(row['Hymns']) || 0,
                    agbya: Number(row['Agbya']) || 0,
                    taks: Number(row['Taks']) || 0,
                    coptic: Number(row['Coptic']) || 0,
                    attendance: Number(row['Attendance']) || 0,
                    total: (Number(row['Hymns']) || 0) + (Number(row['Agbya']) || 0) +
                        (Number(row['Taks']) || 0) + (Number(row['Coptic']) || 0) +
                        (Number(row['Attendance']) || 0)
                })).filter(row => row.code); // Remove rows without code

                setParsedData(cleanedData);
            } catch (err) {
                console.error(err);
                setError(t('bulkDegree.parseError', 'Error reading file: ') + err.message);
            }
        };
        reader.readAsArrayBuffer(fileToRead);
    };

    const processFile = async () => {
        if (!parsedData || parsedData.length === 0) {
            setError(t('bulkDegree.noData', 'No valid data to process.'));
            return;
        }

        setUploading(true);
        setError(null);
        setResults(null);
        setProgress(0);
        setProcessedCount(0);

        try {
            // Phase 1: Validate codes
            setCurrentPhase('validating');
            setProgressStatus(t('bulkDegree.fetchingUsers', 'Fetching user records for validation...'));
            setProgress(5);

            const allUsers = await userService.getAllUsers();
            if (!allUsers) {
                throw new Error(t('bulkDegree.fetchError', 'Could not fetch users for validation.'));
            }

            setProgress(15);
            setProgressStatus(t('bulkDegree.validatingCodes', 'Validating student codes...'));

            const existingCodes = Object.keys(allUsers);
            const validUpdates = [];
            const notFoundCodes = [];

            parsedData.forEach(row => {
                if (existingCodes.includes(row.code)) {
                    validUpdates.push(row);
                } else {
                    notFoundCodes.push(row.code);
                }
            });

            setValidationResult({
                valid: validUpdates.length,
                notFound: notFoundCodes.length,
                notFoundCodes
            });

            setProgress(20);

            if (validUpdates.length === 0) {
                setResults({
                    successCount: 0,
                    failedCodes: notFoundCodes,
                    totalProcessed: 0
                });
                setProgress(100);
                setCurrentPhase('done');
                setProgressStatus(t('bulkDegree.noValidCodes', 'No valid student codes found.'));
                setUploading(false);
                return;
            }

            // Phase 2: Upload in batches
            setCurrentPhase('uploading');
            const totalValid = validUpdates.length;
            setTotalToProcess(totalValid);

            const batches = [];
            for (let i = 0; i < totalValid; i += BATCH_SIZE) {
                batches.push(validUpdates.slice(i, i + BATCH_SIZE));
            }

            let successCount = 0;
            const failedCodes = [...notFoundCodes];
            let processed = 0;

            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                const batchNum = batchIndex + 1;

                setProgressStatus(
                    t('bulkDegree.uploadingBatch', 'Uploading batch {{current}} of {{total}}...', {
                        current: batchNum,
                        total: batches.length
                    })
                );

                // Build payload for this batch
                const payload = batch.map(u => ({
                    code: u.code,
                    [`degree/${selectedTerm}/hymns`]: u.hymns,
                    [`degree/${selectedTerm}/agbya`]: u.agbya,
                    [`degree/${selectedTerm}/taks`]: u.taks,
                    [`degree/${selectedTerm}/coptic`]: u.coptic,
                    [`degree/${selectedTerm}/attencance`]: u.attendance,
                    [`degree/${selectedTerm}/total`]: u.total
                }));

                try {
                    const response = await userService.bulkUpdateUsers(payload);
                    successCount += response.results.successful.length;
                    if (response.results.failed.length > 0) {
                        response.results.failed.forEach(f => failedCodes.push(f.user?.code || 'Unknown'));
                    }
                } catch (batchErr) {
                    console.error(`Batch ${batchNum} failed:`, batchErr);
                    // Mark all in this batch as failed
                    batch.forEach(u => failedCodes.push(u.code));
                }

                processed += batch.length;
                setProcessedCount(processed);
                // Progress: 20% for validation, 80% for uploading
                const uploadProgress = 20 + (processed / totalValid) * 75;
                setProgress(Math.min(Math.round(uploadProgress), 95));
            }

            // Done
            setProgress(100);
            setCurrentPhase('done');
            setProgressStatus(
                t('bulkDegree.completed', 'Upload complete! {{success}} updated successfully.', {
                    success: successCount
                })
            );
            setResults({
                successCount,
                failedCodes,
                totalProcessed: processed
            });

        } catch (err) {
            console.error(err);
            setError(t('bulkDegree.uploadFailed', 'Bulk update failed: ') + err.message);
            setCurrentPhase('');
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setParsedData(null);
        setValidationResult(null);
        setResults(null);
        setError(null);
        setProgress(0);
        setCurrentPhase('');
        setProgressStatus('');
        setProcessedCount(0);
        setTotalToProcess(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getProgressVariant = () => {
        if (currentPhase === 'done') return progress === 100 && results?.failedCodes?.length === 0 ? 'success' : 'warning';
        if (currentPhase === 'validating') return 'info';
        return 'primary';
    };

    return (
        <div className="container mt-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="mb-0">
                    <i className="bi bi-upload me-2"></i>
                    {t('Bulk Degree Upload')}
                </h2>
                {(parsedData || results) && (
                    <Button variant="outline-secondary" size="sm" onClick={handleReset}>
                        <i className="bi bi-arrow-counterclockwise me-1"></i>
                        {t('bulkDegree.reset', 'Reset')}
                    </Button>
                )}
            </div>

            <Card className="p-4 mt-3 shadow-sm" style={{ borderRadius: '1rem' }}>
                {/* Step 1: Download Template */}
                <div className="mb-4">
                    <h5 className="text-muted mb-2">
                        <Badge bg="primary" className="me-2" pill>1</Badge>
                        {t('bulkDegree.downloadStep', 'Download Template')}
                    </h5>
                    <p className="text-muted small mb-2">
                        {t('bulkDegree.downloadDesc', 'Download the Excel template, fill in student codes and their degrees, then upload it below.')}
                    </p>
                    <Button variant="outline-info" onClick={handleDownloadTemplate}>
                        <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                        {t('bulkDegree.downloadTemplate', 'Download Template (Excel)')}
                    </Button>
                </div>

                <hr />

                {/* Step 2: Select Term */}
                <div className="mb-4">
                    <h5 className="text-muted mb-2">
                        <Badge bg="primary" className="me-2" pill>2</Badge>
                        {t('bulkDegree.selectTermStep', 'Select Term')}
                    </h5>
                    <Form.Group>
                        <Form.Select
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            disabled={uploading}
                            style={{ maxWidth: '300px' }}
                        >
                            <option value="firstTerm">{t('terms.first')}</option>
                            <option value="secondTerm">{t('terms.second')}</option>
                            <option value="thirdTerm">{t('terms.third')}</option>
                        </Form.Select>
                    </Form.Group>
                </div>

                <hr />

                {/* Step 3: Upload File */}
                <div className="mb-4">
                    <h5 className="text-muted mb-2">
                        <Badge bg="primary" className="me-2" pill>3</Badge>
                        {t('bulkDegree.uploadStep', 'Upload Excel File')}
                    </h5>
                    <Form.Group>
                        <Form.Control
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                    </Form.Group>
                </div>

                {/* Data Preview Table */}
                {parsedData && parsedData.length > 0 && !results && (
                    <div className="mb-4">
                        <h5 className="text-muted mb-2">
                            <Badge bg="info" className="me-2" pill>
                                <i className="bi bi-eye"></i>
                            </Badge>
                            {t('bulkDegree.preview', 'Data Preview')}
                            <Badge bg="secondary" className="ms-2">{parsedData.length} {t('common.students', 'students')}</Badge>
                        </h5>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', borderRadius: '0.5rem', border: '1px solid var(--bs-border-color)' }}>
                            <Table striped hover size="sm" className="mb-0">
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bs-card-bg)', zIndex: 1 }}>
                                    <tr>
                                        <th>#</th>
                                        <th>{t('users.code', 'Code')}</th>
                                        <th>{t('subjects.hymns', 'Hymns')}</th>
                                        <th>{t('subjects.agbya', 'Agbya')}</th>
                                        <th>{t('subjects.taks', 'Taks')}</th>
                                        <th>{t('subjects.coptic', 'Coptic')}</th>
                                        <th>{t('subjects.attendance', 'Attendance')}</th>
                                        <th>{t('subjects.result', 'Total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.map((row, index) => (
                                        <tr key={index}>
                                            <td className="text-muted">{index + 1}</td>
                                            <td><strong>{row.code}</strong></td>
                                            <td>{row.hymns}</td>
                                            <td>{row.agbya}</td>
                                            <td>{row.taks}</td>
                                            <td>{row.coptic}</td>
                                            <td>{row.attendance}</td>
                                            <td><Badge bg="primary">{row.total}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* Upload Button */}
                {parsedData && !results && (
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={processFile}
                        disabled={uploading}
                        className="mb-3"
                        style={{
                            borderRadius: '0.75rem',
                            padding: '0.75rem 2rem',
                            fontWeight: 600,
                            background: uploading ? undefined : 'linear-gradient(135deg, #0d6efd, #0dcaf0)',
                            border: 'none',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {uploading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                {t('common.processing', 'Processing...')}
                            </>
                        ) : (
                            <>
                                <i className="bi bi-cloud-upload me-2"></i>
                                {t('bulkDegree.uploadAndUpdate', 'Upload & Update Degrees')}
                                <Badge bg="light" text="dark" className="ms-2">{parsedData.length}</Badge>
                            </>
                        )}
                    </Button>
                )}

                {/* Progress Bar Section */}
                {(uploading || currentPhase === 'done') && (
                    <div className="mb-4" style={{
                        animation: 'fadeIn 0.3s ease-in',
                        padding: '1.25rem',
                        borderRadius: '0.75rem',
                        backgroundColor: 'var(--bs-secondary-bg)',
                        border: '1px solid var(--bs-border-color)'
                    }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                                {currentPhase === 'validating' && (
                                    <><i className="bi bi-search me-2 text-info"></i>{t('bulkDegree.validatingPhase', 'Validating...')}</>
                                )}
                                {currentPhase === 'uploading' && (
                                    <><i className="bi bi-cloud-arrow-up me-2 text-primary"></i>{t('bulkDegree.uploadingPhase', 'Uploading...')}</>
                                )}
                                {currentPhase === 'done' && (
                                    <><i className="bi bi-check-circle me-2 text-success"></i>{t('bulkDegree.donePhase', 'Complete')}</>
                                )}
                            </span>
                            <span className="text-muted fw-bold" style={{ fontSize: '0.85rem' }}>
                                {progress}%
                            </span>
                        </div>

                        <ProgressBar
                            now={progress}
                            variant={getProgressVariant()}
                            animated={uploading}
                            striped={uploading}
                            style={{
                                height: '12px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                backgroundColor: 'var(--bs-border-color)'
                            }}
                        />

                        <div className="mt-2 d-flex justify-content-between">
                            <small className="text-muted">{progressStatus}</small>
                            {currentPhase === 'uploading' && totalToProcess > 0 && (
                                <small className="text-muted fw-semibold">
                                    {processedCount} / {totalToProcess} {t('common.students', 'students')}
                                </small>
                            )}
                        </div>
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <Alert variant="danger" className="mt-3" dismissible onClose={() => setError(null)} style={{ borderRadius: '0.75rem' }}>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </Alert>
                )}

                {/* Results Section */}
                {results && (
                    <div className="mt-3" style={{ animation: 'fadeIn 0.4s ease-in' }}>
                        {results.successCount > 0 && (
                            <Alert variant="success" style={{ borderRadius: '0.75rem' }}>
                                <div className="d-flex align-items-center">
                                    <i className="bi bi-check-circle-fill me-2" style={{ fontSize: '1.25rem' }}></i>
                                    <div>
                                        <strong>{t('bulkDegree.successTitle', 'Upload Successful!')}</strong>
                                        <br />
                                        <small>
                                            {t('bulkDegree.successDetail', 'Updated {{count}} students for {{term}} successfully.', {
                                                count: results.successCount,
                                                term: t(`terms.${selectedTerm === 'firstTerm' ? 'first' : selectedTerm === 'secondTerm' ? 'second' : 'third'}`)
                                            })}
                                        </small>
                                    </div>
                                </div>
                            </Alert>
                        )}

                        {results.failedCodes && results.failedCodes.length > 0 && (
                            <Card className="mt-2 border-danger" style={{ borderRadius: '0.75rem', overflow: 'hidden' }}>
                                <Card.Header className="bg-danger text-white d-flex align-items-center">
                                    <i className="bi bi-exclamation-circle me-2"></i>
                                    {t('bulkDegree.failedTitle', 'Student Codes Not Found / Failed')}
                                    <Badge bg="light" text="danger" className="ms-auto">{results.failedCodes.length}</Badge>
                                </Card.Header>
                                <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    <div className="d-flex flex-wrap gap-2">
                                        {results.failedCodes.map((c, i) => (
                                            <Badge key={i} bg="outline-danger" className="border border-danger text-danger px-2 py-1">
                                                {c}
                                            </Badge>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Upload Again button */}
                        <div className="mt-3 text-center">
                            <Button variant="outline-primary" onClick={handleReset}>
                                <i className="bi bi-arrow-counterclockwise me-1"></i>
                                {t('bulkDegree.uploadAnother', 'Upload Another File')}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* CSS animation for fade-in */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default BulkDegreeUpload;
