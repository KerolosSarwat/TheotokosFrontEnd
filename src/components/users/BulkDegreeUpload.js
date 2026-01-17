import { useState } from 'react';
import { Button, Card, Form, Alert } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { userService } from '../../services/services';
import { useTranslation } from 'react-i18next';

const BulkDegreeUpload = () => {
    const { t } = useTranslation();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const handleDownloadTemplate = () => {
        const headers = ['Code', 'Hymns', 'Agbya', 'Taks', 'Coptic', 'Attendance'];
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Degrees_Template.xlsx");
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setResults(null);
        setError(null);
    };

    const processFile = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }

        setUploading(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    setError("File is empty.");
                    setUploading(false);
                    return;
                }

                // Validate headers (basic check)
                const firstRow = jsonData[0];
                if (!firstRow.hasOwnProperty('Code')) {
                    setError("Invalid template. Missing 'Code' column.");
                    setUploading(false);
                    return;
                }

                // Prepare payload
                // We need to fetch current users or check existence. 
                // For bulk, we can optimistically send to backend if backend verifies.
                // But the requirement says "display to user the not exist codes".
                // So we should probably check first.

                // Fetch all users to validate codes
                // Optimization: Maybe fetching all users (just codes) is better? 
                // `getAllUsers` returns everything. If DB is huge this is bad. 
                // But for now, let's assume it's manageable or use `userService.getAllUsers()`.

                const allUsers = await userService.getAllUsers();
                if (!allUsers) throw new Error("Could not fetch unique users for validation.");

                // allUsers is an object { code: { ... }, ... } or array depending on implementation
                // userController says: `const users = snapshot.val();` (Object with keys as codes usually, or keys as IDs?) 
                // Wait, userController `getAllUsers`: `const usersRef = db.ref('users'); ... return res.status(200).json(users);`
                // Firebase returns an object where keys are the node keys.
                // In `api.js` (userService), we need to see how it transforms it.
                // Usually it returns the raw object.

                const validUpdates = [];
                const notFoundCodes = [];

                // Assuming user keys in DB are the codes (based on `getUserByCode`: `db.ref('users/${code}')`)
                const existingCodes = Object.keys(allUsers);

                jsonData.forEach(row => {
                    const code = row['Code']?.toString();
                    if (!code) return; // Skip empty rows

                    if (existingCodes.includes(code)) {
                        // Construct update object
                        // Which term? The requirement doesn't specify which term. 
                        // "the 4 subjects (hymns, agbya, taks, coptic)"
                        // Assuming CURRENT term or all terms? 
                        // Usually these bulk uploads are for the current active exam period.
                        // For now, let's assume "First Term" or make it selectable?
                        // Requirement says "degrees for student" simply.
                        // Let's assume 'firstTerm' for MVP or add a dropdown to select term.

                        // Wait, I should add a Term Selector.

                        validUpdates.push({
                            code: code,
                            // We just pass the raw numbers. The term selection will decide where they go.
                            hymns: row['Hymns'] || 0,
                            agbya: row['Agbya'] || 0,
                            taks: row['Taks'] || 0,
                            coptic: row['Coptic'] || 0,
                            attendance: row['Attendance'] || 0,
                            total: (row['Hymns'] || 0) + (row['Agbya'] || 0) + (row['Taks'] || 0) + (row['Coptic'] || 0) + (row['Attendance'] || 0)
                        });
                    } else {
                        notFoundCodes.push(code);
                    }
                });

                if (validUpdates.length > 0) {
                    await submitUpdates(validUpdates, notFoundCodes);
                } else {
                    setResults({
                        successCount: 0,
                        failedCodes: notFoundCodes
                    });
                    setUploading(false);
                }

            } catch (err) {
                console.error(err);
                setError("Error processing file: " + err.message);
                setUploading(false);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const [selectedTerm, setSelectedTerm] = useState('firstTerm');

    const submitUpdates = async (updates, failedCodes) => {
        try {
            // Transform to the structure backend expects for `updateUser` (bulk)
            // or we make individual calls? Backend has `bulk-update`.
            // `userController`: `if (Array.isArray(userData)) ... for (const user of userData) ... await userRef.update(updateData);`

            // We need to construct the nested object `degree.firstTerm...`
            // But we can't easily do partial update of deep nested fields in Firebase Realtime DB 
            // WITHOUT overwriting the parent `degree` if we send `{ degree: { ... } }`?
            // Actually `update()` performs patch at the level of keys provided.
            // If we provide paths "degree/firstTerm/agbya": value, it works.
            // But `userController` takes `updateData` and does `userRef.update(updateData)`.
            // So if we send `{ "degree/firstTerm/agbya": 10 }`, it works?
            // Yes, Firebase update keys can be paths. 
            // But JSON body in HTTP usually is nested objects.

            // If we send:
            /*
              {
                code: "123",
                degree: {
                    firstTerm: { ... }
                }
              }
            */
            // `userRef.update({ degree: ... })` -> This REPLACES `degree` node! Warning!
            // We don't want to wipe other terms.
            // We need to read the specific students first? Or use path keys in the object?
            // If we use `updateUser`, it does `const { code, ...updateData } = user; await userRef.update(updateData);`

            // If we want to preserve other terms, we have to refer to the exact paths.
            // But we can't send keys with slashes cleanly in JSON sometimes? No, it's fine.
            // Let's try sending flat keys with paths.

            const payload = updates.map(u => ({
                code: u.code,
                [`degree/${selectedTerm}/hymns`]: u.hymns,
                [`degree/${selectedTerm}/agbya`]: u.agbya,
                [`degree/${selectedTerm}/taks`]: u.taks,
                [`degree/${selectedTerm}/coptic`]: u.coptic,
                [`degree/${selectedTerm}/attencance`]: u.attendance, // Preserving typo 'attencance'
                [`degree/${selectedTerm}/total`]: u.total
            }));

            // We need to handle this in `userService` properly.
            // `userService.bulkUpdate(payload)`

            const response = await userService.bulkUpdateUsers(payload);

            setResults({
                successCount: response.results.successful.length,
                failedCodes: failedCodes.concat(response.results.failed.map(f => f.user.code))
            });
        } catch (err) {
            setError("Bulk update failed: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mt-4">
            <h2>{t('Bulk Degree Upload')}</h2>
            <Card className="p-4 mt-3">
                <div className="mb-3">
                    <Button variant="info" onClick={handleDownloadTemplate} className="mb-3">
                        Download Template (Excel)
                    </Button>
                </div>

                <Form.Group className="mb-3">
                    <Form.Label>Select Term</Form.Label>
                    <Form.Select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
                        <option value="firstTerm">{t('terms.first')}</option>
                        <option value="secondTerm">{t('terms.second')}</option>
                        <option value="thirdTerm">{t('terms.third')}</option>
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Upload Excel File</Form.Label>
                    <Form.Control type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
                </Form.Group>

                <Button
                    variant="primary"
                    onClick={processFile}
                    disabled={!file || uploading}
                >
                    {uploading ? 'Processing...' : 'Upload & Update'}
                </Button>

                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

                {results && (
                    <div className="mt-4">
                        <Alert variant="success">Updated {results.successCount} students successfully.</Alert>

                        {results.failedCodes.length > 0 && (
                            <Card className="mt-2 border-danger">
                                <Card.Header className="bg-danger text-white">
                                    Student Codes Not Found / Failed ({results.failedCodes.length})
                                </Card.Header>
                                <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    <ul>
                                        {results.failedCodes.map((c, i) => <li key={i}>{c}</li>)}
                                    </ul>
                                </Card.Body>
                            </Card>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default BulkDegreeUpload;
