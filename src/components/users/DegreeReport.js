import { useState, useEffect, useMemo } from 'react';
import { Table, Card, Form, Button, Badge, InputGroup, Dropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/services';
import * as XLSX from 'xlsx';

const DegreeReport = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevels, setSelectedLevels] = useState([]);
    const [selectedTerm, setSelectedTerm] = useState('firstTerm');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    // Sorting
    const [sortConfig, setSortConfig] = useState({ key: 'code', direction: 'ascending' });

    const ALL_LEVELS = useMemo(() => {
        const levels = new Set([
            "حضانة",
            "أولى ابتدائى", "ثانية ابتدائى", "ثالثة ابتدائى",
            "رابعة ابتدائى", "خامسة ابتدائى", "سادسة ابتدائى",
            "اعدادى", "ثانوى ", "جامعة أو خريج"
        ]);
        if (users) {
            Object.values(users).forEach(u => {
                if (u.level) levels.add(u.level);
            });
        }
        return Array.from(levels).sort();
    }, [users]);

    const TERMS = [
        { value: 'firstTerm', label: t('terms.first') },
        { value: 'secondTerm', label: t('terms.second') },
        { value: 'thirdTerm', label: t('terms.third') }
    ];

    const SUBJECTS = ['agbya', 'coptic', 'hymns', 'taks', 'attencance'];

    useEffect(() => {
        document.title = `${t('degreeReport.title')} | Firebase Portal`;
    }, [t]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const data = await userService.getAllUsers();
                setUsers(data);
                setLoading(false);
            } catch (err) {
                setError('Error fetching users. Please try again later.');
                setLoading(false);
                console.error('Error fetching users:', err);
            }
        };
        fetchUsers();
    }, []);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedLevels, selectedTerm]);

    // Filtered & sorted users
    const filteredUsers = useMemo(() => {
        let result = Object.values(users);

        // Text search
        if (searchTerm.trim() !== '') {
            const lower = searchTerm.toLowerCase();
            result = result.filter(user =>
                (user.fullName && String(user.fullName).toLowerCase().includes(lower)) ||
                (user.code && String(user.code).toLowerCase().includes(lower))
            );
        }

        // Level filter
        if (selectedLevels.length > 0) {
            result = result.filter(user => user.level && selectedLevels.includes(user.level));
        }

        return result;
    }, [users, searchTerm, selectedLevels]);

    const sortedUsers = useMemo(() => {
        const sortable = [...filteredUsers];
        if (sortConfig.key) {
            sortable.sort((a, b) => {
                let aValue, bValue;

                // Check if sorting by a degree subject
                if (SUBJECTS.includes(sortConfig.key) || sortConfig.key === 'total') {
                    aValue = a.degree?.[selectedTerm]?.[sortConfig.key] || 0;
                    bValue = b.degree?.[selectedTerm]?.[sortConfig.key] || 0;
                } else {
                    aValue = a[sortConfig.key] || '';
                    bValue = b[sortConfig.key] || '';
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortable;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredUsers, sortConfig, selectedTerm]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getClassNamesFor = (name) => {
        if (!sortConfig) return;
        return sortConfig.key === name ? sortConfig.direction : undefined;
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

    // Statistics
    const stats = useMemo(() => {
        const usersWithDegrees = filteredUsers.filter(u => u.degree?.[selectedTerm]);
        const totalStudents = filteredUsers.length;
        const withDegrees = usersWithDegrees.length;

        let avgTotal = 0;
        let highestTotal = 0;
        let highestStudent = '';

        if (usersWithDegrees.length > 0) {
            let sumTotal = 0;
            usersWithDegrees.forEach(u => {
                const total = u.degree?.[selectedTerm]?.total || 0;
                sumTotal += total;
                if (total > highestTotal) {
                    highestTotal = total;
                    highestStudent = u.fullName;
                }
            });
            avgTotal = Math.round(sumTotal / usersWithDegrees.length);
        }

        return { totalStudents, withDegrees, avgTotal, highestTotal, highestStudent };
    }, [filteredUsers, selectedTerm]);

    // Export to Excel
    const exportToExcel = () => {
        const termLabel = TERMS.find(tm => tm.value === selectedTerm)?.label || selectedTerm;
        const dataForExport = sortedUsers.map(user => {
            const termData = user.degree?.[selectedTerm] || {};
            return {
                [t('users.code')]: user.code || '',
                [t('users.fullName')]: user.fullName || '',
                [t('users.level')]: user.level || '',
                [t('subjects.agbya')]: termData.agbya || 0,
                [t('subjects.coptic')]: termData.coptic || 0,
                [t('subjects.hymns')]: termData.hymns || 0,
                [t('subjects.taks')]: termData.taks || 0,
                [t('subjects.attendance')]: termData.attencance || 0,
                [t('subjects.result')]: termData.total || 0
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataForExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, termLabel);
        XLSX.writeFile(wb, `Degrees_${termLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const getLevelColor = (level) => {
        if (!level) return 'var(--bs-gray-500)';
        if (level.includes('حضانة')) return 'var(--level-kindergarten, #9c27b0)';
        if (level.includes('ابتدائى')) return 'var(--level-primary, #2196f3)';
        if (level.includes('إعدادى') || level.includes('اعدادى')) return 'var(--level-secondary, #ff9800)';
        if (level.includes('ثانوى')) return 'var(--level-highschool, #4caf50)';
        if (level.includes('جامعة') || level.includes('خريج')) return 'var(--level-university, #e91e63)';
        return 'var(--bs-primary)';
    };

    const getGradeBadge = (total) => {
        if (total >= 90) return { bg: 'success', text: t('degreeReport.excellent') };
        if (total >= 75) return { bg: 'primary', text: t('degreeReport.veryGood') };
        if (total >= 60) return { bg: 'info', text: t('degreeReport.good') };
        if (total >= 50) return { bg: 'warning', text: t('degreeReport.pass') };
        if (total > 0) return { bg: 'danger', text: t('degreeReport.fail') };
        return { bg: 'secondary', text: '-' };
    };

    if (loading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border" role="status"></div>
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-danger mt-3">{error}</div>;
    }

    return (
        <div className="degree-report">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 className="h2">
                    <i className="bi bi-mortarboard-fill me-2 text-primary"></i>
                    {t('degreeReport.title')}
                </h1>
                <div className="d-flex gap-2">
                    <Button
                        variant="outline-success"
                        onClick={exportToExcel}
                        className="d-flex align-items-center rounded-pill shadow-sm"
                    >
                        <i className="bi bi-file-earmark-excel me-1"></i> {t('users.exportExcel')}
                    </Button>
                    <Button
                        variant="outline-primary"
                        onClick={() => window.print()}
                        className="d-flex align-items-center rounded-pill shadow-sm"
                    >
                        <i className="bi bi-printer me-1"></i> {t('degreeReport.print')}
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center">
                            <div className="text-primary mb-1"><i className="bi bi-people-fill fs-3"></i></div>
                            <h3 className="mb-0">{stats.totalStudents}</h3>
                            <small className="text-muted">{t('degreeReport.totalStudents')}</small>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center">
                            <div className="text-success mb-1"><i className="bi bi-check-circle-fill fs-3"></i></div>
                            <h3 className="mb-0">{stats.withDegrees}</h3>
                            <small className="text-muted">{t('degreeReport.withDegrees')}</small>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center">
                            <div className="text-info mb-1"><i className="bi bi-bar-chart-fill fs-3"></i></div>
                            <h3 className="mb-0">{stats.avgTotal}</h3>
                            <small className="text-muted">{t('degreeReport.avgTotal')}</small>
                        </Card.Body>
                    </Card>
                </div>
                <div className="col-md-3">
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="text-center">
                            <div className="text-warning mb-1"><i className="bi bi-trophy-fill fs-3"></i></div>
                            <h3 className="mb-0">{stats.highestTotal}</h3>
                            <small className="text-muted">{stats.highestStudent || t('degreeReport.topStudent')}</small>
                        </Card.Body>
                    </Card>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-4 border-0 shadow-sm">
                <Card.Body>
                    <Form>
                        <div className="row g-3">
                            {/* Search */}
                            <div className="col-md-4">
                                <InputGroup>
                                    <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                                    <Form.Control
                                        placeholder={t('degreeReport.searchPlaceholder')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                                            <i className="bi bi-x-lg"></i>
                                        </Button>
                                    )}
                                </InputGroup>
                            </div>

                            {/* Term Select */}
                            <div className="col-md-3">
                                <Form.Select
                                    value={selectedTerm}
                                    onChange={(e) => setSelectedTerm(e.target.value)}
                                    className="border-primary"
                                >
                                    {TERMS.map(term => (
                                        <option key={term.value} value={term.value}>{term.label}</option>
                                    ))}
                                </Form.Select>
                            </div>

                            {/* Level Dropdown */}
                            <div className="col-md-5">
                                <Dropdown autoClose="outside" className="w-100">
                                    <Dropdown.Toggle variant="outline-secondary" id="levelDropdownReport" className="w-100 text-start d-flex justify-content-between align-items-center">
                                        <span>{selectedLevels.length > 0 ? `${selectedLevels.length} ${t('degreeReport.levelsSelected')}` : t('common.filterByLevel')}</span>
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu className="w-100 p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <div className="px-2 pb-2">
                                            <Form.Check
                                                type="checkbox"
                                                id="selectAllLevelsReport"
                                                label={t('common.selectAll')}
                                                checked={selectedLevels.length === ALL_LEVELS.length && ALL_LEVELS.length > 0}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedLevels([...ALL_LEVELS]);
                                                    else setSelectedLevels([]);
                                                }}
                                            />
                                        </div>
                                        <Dropdown.Divider />
                                        {ALL_LEVELS.map(level => (
                                            <div key={level} className="px-2 py-1">
                                                <Form.Check
                                                    type="checkbox"
                                                    id={`report-check-${level}`}
                                                    label={level}
                                                    value={level}
                                                    checked={selectedLevels.includes(level)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedLevels([...selectedLevels, level]);
                                                        else setSelectedLevels(selectedLevels.filter(l => l !== level));
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            {/* Results Table */}
            {sortedUsers.length === 0 ? (
                <div className="alert alert-info">{t('common.noResults')}</div>
            ) : (
                <>
                    <div className="table-responsive">
                        <Table striped bordered hover className="align-middle">
                            <thead className="table-dark">
                                <tr>
                                    <th style={{ width: '50px' }}>#</th>
                                    <th
                                        className={`${getClassNamesFor('code')} cursor-pointer`}
                                        onClick={() => requestSort('code')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center justify-content-between">
                                            {t('users.code')}
                                            <i className={`bi bi-caret-${sortConfig.key === 'code' ? (sortConfig.direction === 'ascending' ? 'up-fill' : 'down-fill') : 'up-down'} ms-1 small`}></i>
                                        </div>
                                    </th>
                                    <th
                                        className={`${getClassNamesFor('fullName')} cursor-pointer`}
                                        onClick={() => requestSort('fullName')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center justify-content-between">
                                            {t('users.fullName')}
                                            <i className={`bi bi-caret-${sortConfig.key === 'fullName' ? (sortConfig.direction === 'ascending' ? 'up-fill' : 'down-fill') : 'up-down'} ms-1 small`}></i>
                                        </div>
                                    </th>
                                    <th
                                        className={`${getClassNamesFor('level')} cursor-pointer`}
                                        onClick={() => requestSort('level')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center justify-content-between">
                                            {t('users.level')}
                                            <i className={`bi bi-caret-${sortConfig.key === 'level' ? (sortConfig.direction === 'ascending' ? 'up-fill' : 'down-fill') : 'up-down'} ms-1 small`}></i>
                                        </div>
                                    </th>
                                    {SUBJECTS.map(subject => (
                                        <th
                                            key={subject}
                                            className={`${getClassNamesFor(subject)} cursor-pointer text-center`}
                                            onClick={() => requestSort(subject)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="d-flex align-items-center justify-content-between">
                                                {t(`subjects.${subject === 'attencance' ? 'attendance' : subject}`)}
                                                <i className={`bi bi-caret-${sortConfig.key === subject ? (sortConfig.direction === 'ascending' ? 'up-fill' : 'down-fill') : 'up-down'} ms-1 small`}></i>
                                            </div>
                                        </th>
                                    ))}
                                    <th
                                        className={`${getClassNamesFor('total')} cursor-pointer text-center`}
                                        onClick={() => requestSort('total')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center justify-content-between">
                                            {t('subjects.result')}
                                            <i className={`bi bi-caret-${sortConfig.key === 'total' ? (sortConfig.direction === 'ascending' ? 'up-fill' : 'down-fill') : 'up-down'} ms-1 small`}></i>
                                        </div>
                                    </th>
                                    <th className="text-center">{t('degreeReport.grade')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((user, index) => {
                                    const termData = user.degree?.[selectedTerm] || {};
                                    const total = termData.total || 0;
                                    const gradeBadge = getGradeBadge(total);

                                    return (
                                        <tr key={user.code}>
                                            <td className="text-muted">{indexOfFirstItem + index + 1}</td>
                                            <td>{user.code}</td>
                                            <td className="fw-medium">{user.fullName}</td>
                                            <td>
                                                <Badge
                                                    style={{ backgroundColor: getLevelColor(user.level) }}
                                                    className="rounded-pill px-2"
                                                >
                                                    {user.level || 'N/A'}
                                                </Badge>
                                            </td>
                                            {SUBJECTS.map(subject => (
                                                <td key={subject} className="text-center">
                                                    {termData[subject] || 0}
                                                </td>
                                            ))}
                                            <td className="text-center fw-bold">{total}</td>
                                            <td className="text-center">
                                                <Badge bg={gradeBadge.bg} className="rounded-pill px-2">
                                                    {gradeBadge.text}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <div className="text-muted small">
                            {t('common.displaying')} {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedUsers.length)} {t('common.of')} {sortedUsers.length} {t('common.students')}
                        </div>
                        <div className="d-flex gap-2">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                {t('common.previous')}
                            </Button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "primary" : "outline-secondary"}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                {t('common.next')}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DegreeReport;
