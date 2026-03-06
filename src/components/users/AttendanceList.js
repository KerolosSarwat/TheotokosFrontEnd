// components/AttendanceReport/AttendanceReport.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { userService } from '../../services/services';
import { Table, Card, Form, InputGroup, Button, Modal, Badge, Dropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

const AttendanceReport = () => {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const [sortConfig, setSortConfig] = useState({
    key: 'code',
    direction: 'ascending'
  });

  useEffect(() => {
    document.title = `${t('attendance.title')} | Firebase Portal`;
  }, [t]);

  // Common levels for filtering
  const LEVELS = [
    'حضانة',
    'أولى ابتدائى',
    'ثانية ابتدائى',
    'ثالثة ابتدائى',
    'رابعة ابتدائى',
    'خامسة ابتدائى',
    'سادسة ابتدائى',
    'إعدادى',
    'ثانوى',
    'جامعيين و خريجين',
  ];

  const fetchAttendanceReport = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all if multi-level or none selected to facilitate client filtering
      const data = await userService.getUsersAttendance('all');
      setStudents(data);
      setLoading(false);
    } catch (err) {
      setError(t('common.noResults'));
      setLoading(false);
      console.error('Error fetching attendance report:', err);
    }
  }, [t]);

  useEffect(() => {
    fetchAttendanceReport();
  }, [fetchAttendanceReport]);

  // Filter students by search term, levels, and date
  const filteredStudents = useMemo(() => {
    let result = students;

    // 1. Level Filter
    if (selectedLevels.length > 0) {
      result = result.filter(student => student.level && selectedLevels.includes(student.level));
    }

    // 2. Date Filter
    if (dateFilter) {
      result = result.filter(student =>
        student.attendance && student.attendance.some(record =>
          (record.date || record.dateTime || '').includes(dateFilter)
        )
      );
    }

    // 3. Search Term
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(student =>
        (student.fullName && String(student.fullName).toLowerCase().includes(lowerSearchTerm)) ||
        (student.code && String(student.code).toLowerCase().includes(lowerSearchTerm)) ||
        (student.phoneNumber && String(student.phoneNumber).includes(searchTerm)) ||
        (student.level && String(student.level).toLowerCase().includes(lowerSearchTerm)) ||
        (student.church && String(student.church).toLowerCase().includes(lowerSearchTerm))
      );
    }

    return result;
  }, [students, searchTerm, selectedLevels, dateFilter]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedLevels, dateFilter]);

  // Sort students
  const sortedStudents = useMemo(() => {
    const sortableStudents = [...filteredStudents];
    if (sortConfig.key) {
      sortableStudents.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableStudents;
  }, [filteredStudents, sortConfig]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedStudents.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

  const exportToExcel = () => {
    const dataForExport = [];

    sortedStudents.forEach(student => {
      const attendance = student.attendance || [];

      if (attendance.length === 0) {
        // Include students with no attendance records
        dataForExport.push({
          [t('users.code')]: student.code || '',
          [t('users.fullName')]: student.fullName || '',
          [t('users.level')]: student.level || 'N/A',
          [t('users.church')]: student.church || 'N/A',
          [t('attendance.table.date')]: t('common.noResults'),
          [t('attendance.table.status')]: 'N/A',
          [t('attendance.table.term')]: 'N/A'
        });
      } else {
        // Create a row for each attendance record
        attendance.forEach(record => {
          dataForExport.push({
            [t('users.code')]: student.code || '',
            [t('users.fullName')]: student.fullName || '',
            [t('users.level')]: student.level || 'N/A',
            [t('users.church')]: student.church || 'N/A',
            [t('attendance.table.date')]: formatExcelDate(record.date || record.dateTime),
            [t('attendance.table.status')]: record.status || 'N/A',
            [t('attendance.table.term')]: record.term || 'N/A'
          });
        });
      }
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(dataForExport);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

    // Generate file name with timestamp
    const fileName = `attendance_report_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // Export to Excel
    XLSX.writeFile(wb, fileName);
  };

  const formatExcelDate = (date) => {
    if (!date) return 'N/A';
    return date.split(' ')[0]; // Return only the date part
  };

  const formatDisplayDate = (date) => {
    if (!date) return <div className="text-center text-muted">N/A</div>;
    const [datePart, time] = date.split(' ');
    return (
      <div className="text-center">
        <div className="fw-bold">{datePart}</div>
        <div className="text-muted small">{time}</div>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'تم الحضور':
        return <Badge bg="success">{t('attendance.status.present')}</Badge>;
      case 'متأخر':
        return <Badge bg="warning" text="dark">{t('attendance.status.late')}</Badge>;
      case 'غائب':
        return <Badge bg="danger">{t('attendance.status.absent')}</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const getAttendanceStats = (student) => {
    const attendance = student.attendance || [];
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'تم الحضور').length;
    const late = attendance.filter(a => a.status === 'متأخر').length;
    const absent = attendance.filter(a => a.status === 'غائب').length;

    return { total, present, late, absent };
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">{t('common.processing')}</span>
        </div>
        <div className="mt-2 text-muted">{t('common.processing')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mt-3 text-center">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        {error}
        <Button
          variant="outline-danger"
          size="sm"
          className="ms-2"
          onClick={fetchAttendanceReport}
        >
          {t('common.refresh')}
        </Button>
      </div>
    );
  }

  return (
    <div className="attendance-report">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">{t('attendance.title')}</h1>
        <div className="d-flex gap-2">
          <Button
            variant="success"
            onClick={exportToExcel}
            className="d-flex align-items-center"
          >
            <i className="bi bi-file-earmark-excel me-1"></i> {t('users.exportExcel')}
          </Button>
          <Button
            variant="primary"
            onClick={fetchAttendanceReport}
            className="d-flex align-items-center"
          >
            <i className="bi bi-arrow-clockwise me-1"></i> {t('attendance.refreshData')}
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="mb-4 shadow-sm border-0 bg-light">
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-4">
              <Form.Label className="fw-bold small text-muted text-uppercase">{t('common.filterByLevel')}</Form.Label>
              <Dropdown autoClose="outside" className="w-100">
                <Dropdown.Toggle variant="white" className="w-100 text-start d-flex justify-content-between align-items-center border shadow-sm">
                  <span className="text-truncate">
                    {selectedLevels.length > 0
                      ? `${selectedLevels.length} ${t('common.students')}`
                      : t('attendance.allLevels')}
                  </span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100 p-2 shadow-lg border-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <div className="px-2 pb-2">
                    <Form.Check
                      type="checkbox"
                      id="selectAllLevels"
                      label={t('common.selectAll')}
                      className="fw-bold"
                      checked={selectedLevels.length === LEVELS.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedLevels([...LEVELS]);
                        else setSelectedLevels([]);
                      }}
                    />
                  </div>
                  <Dropdown.Divider />
                  {LEVELS.map(level => (
                    <div key={level} className="px-2 py-1">
                      <Form.Check
                        type="checkbox"
                        id={`check-${level}`}
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
            <div className="col-md-4">
              <Form.Label className="fw-bold small text-muted text-uppercase">{t('common.filterByDate')}</Form.Label>
              <Form.Control
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border shadow-sm"
              />
            </div>
            <div className="col-md-4">
              <Form.Label className="fw-bold small text-muted text-uppercase">{t('common.search')}</Form.Label>
              <InputGroup className="shadow-sm">
                <InputGroup.Text className="bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder={t('attendance.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
                {searchTerm && (
                  <Button
                    variant="white"
                    className="border border-start-0"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="bi bi-x-lg text-muted"></i>
                  </Button>
                )}
              </InputGroup>
            </div>
          </div>

          {/* Statistics */}
          <div className="row mt-4 g-2">
            <div className="col-6 col-md-3">
              <div className="p-3 rounded bg-white shadow-sm border-start border-primary border-4">
                <div className="h4 mb-0 fw-bold">{sortedStudents.length}</div>
                <div className="small text-muted">{t('attendance.stats.totalStudents')}</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 rounded bg-white shadow-sm border-start border-success border-4">
                <div className="h4 mb-0 fw-bold">
                  {sortedStudents.filter(s => s.attendance?.length > 0).length}
                </div>
                <div className="small text-muted">{t('attendance.stats.withAttendance')}</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 rounded bg-white shadow-sm border-start border-warning border-4">
                <div className="h4 mb-0 fw-bold">
                  {sortedStudents.reduce((total, student) => total + (student.attendance?.length || 0), 0)}
                </div>
                <div className="small text-muted">{t('attendance.stats.totalRecords')}</div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 rounded bg-white shadow-sm border-start border-info border-4">
                <div className="h4 mb-0 fw-bold text-truncate" title={selectedLevels.length > 0 ? selectedLevels.join(', ') : t('attendance.allLevels')}>
                  {selectedLevels.length > 0 ? selectedLevels.length : t('attendance.allLevels')}
                </div>
                <div className="small text-muted">{t('attendance.stats.selectedLevel')}</div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Students Table */}
      {sortedStudents.length === 0 ? (
        <Card className="border-0 shadow-sm text-center p-5">
          <Card.Body>
            <i className="bi bi-search display-1 text-muted opacity-25 mb-3"></i>
            <h5 className="text-muted">{t('common.noResults')}</h5>
            <p className="small text-muted mb-0">Try adjusting your filters or search term</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <div className="table-responsive shadow-sm rounded-3">
            <Table hover className="bg-white mb-0 align-middle">
              <thead className="table-dark">
                <tr>
                  <th
                    className={`${getClassNamesFor('code')} cursor-pointer`}
                    style={{ cursor: 'pointer', minWidth: '100px' }}
                    onClick={() => requestSort('code')}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      {t('users.code')}
                      <i className={`bi bi-caret-${sortConfig.key === 'code' ? (sortConfig.direction === 'ascending' ? 'up-fill' : 'down-fill') : 'up-down'} ms-1 small text-muted`}></i>
                    </div>
                  </th>
                  <th
                    className={`${getClassNamesFor('fullName')} cursor-pointer`}
                    style={{ cursor: 'pointer', minWidth: '180px' }}
                    onClick={() => requestSort('fullName')}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      {t('users.fullName')}
                      <i className={`bi bi-caret-${sortConfig.key === 'fullName' ? (sortConfig.direction === 'ascending' ? 'up-fill' : 'down-fill') : 'up-down'} ms-1 small text-muted`}></i>
                    </div>
                  </th>
                  <th
                    className={`${getClassNamesFor('level')} cursor-pointer`}
                    style={{ cursor: 'pointer', minWidth: '130px' }}
                    onClick={() => requestSort('level')}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      {t('users.level')}
                      <i className={`bi bi-caret-${sortConfig.key === 'level' ? (sortConfig.direction === 'ascending' ? 'up-fill' : 'down-fill') : 'up-down'} ms-1 small text-muted`}></i>
                    </div>
                  </th>
                  <th
                    className={`${getClassNamesFor('church')} cursor-pointer`}
                    style={{ cursor: 'pointer', minWidth: '150px' }}
                    onClick={() => requestSort('church')}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      {t('users.church')}
                      <i className={`bi bi-caret-${sortConfig.key === 'church' ? (sortConfig.direction === 'ascending' ? 'up-fill' : 'down-fill') : 'up-down'} ms-1 small text-muted`}></i>
                    </div>
                  </th>
                  <th style={{ minWidth: '220px' }}>{t('attendance.table.recentAttendance')}</th>
                  <th style={{ minWidth: '130px' }}>{t('subjects.attendance')}</th>
                  <th style={{ minWidth: '100px' }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((student) => {
                  const stats = getAttendanceStats(student);
                  const recentAttendance = student.attendance?.slice(0, 3) || [];

                  // Helper to get level color
                  const getLevelColor = (level) => {
                    if (!level) return 'var(--bs-gray-500)';
                    if (level.includes('حضانة')) return 'var(--level-kindergarten)';
                    if (level.includes('ابتدائى')) return 'var(--level-primary)';
                    if (level.includes('إعدادى')) return 'var(--level-secondary)';
                    if (level.includes('ثانوى')) return 'var(--level-highschool)';
                    if (level.includes('جامعيين') || level.includes('خريجين')) return 'var(--level-university)';
                    return 'var(--bs-primary)';
                  };

                  return (
                    <tr key={student.code} className="border-bottom">
                      <td className="fw-bold text-primary">{student.code}</td>
                      <td className="fw-semibold">{student.fullName}</td>
                      <td>
                        <Badge style={{ backgroundColor: getLevelColor(student.level || '') }}>
                          {student.level}
                        </Badge>
                      </td>
                      <td className="text-muted small">{student.church}</td>
                      <td>
                        {recentAttendance.length === 0 ? (
                          <span className="text-muted small italic">{t('common.noResults')}</span>
                        ) : (
                          <div className="d-flex flex-column gap-1">
                            {recentAttendance.map((record, index) => (
                              <div key={index} className="d-flex justify-content-between align-items-center bg-light p-1 rounded px-2 border-start border-2 border-primary">
                                <small className="fw-bold" style={{ fontSize: '0.75rem' }}>{formatDisplayDate(record.date || record.dateTime)}</small>
                                {getStatusBadge(record.status)}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          <Badge bg="success" pill>{stats.present}</Badge>
                          <Badge bg="warning" text="dark" pill>{stats.late}</Badge>
                          <Badge bg="danger" pill>{stats.absent}</Badge>
                          <Badge bg="secondary" pill>{stats.total}</Badge>
                        </div>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="rounded-pill px-3"
                          onClick={() => handleStudentClick(student)}
                        >
                          <i className="bi bi-eye-fill"></i>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 gap-3">
            <div className="text-muted small fw-medium order-2 order-md-1">
              {t('common.displaying')} <span className="text-dark fw-bold">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedStudents.length)}</span> {t('common.of')} <span className="text-dark fw-bold">{sortedStudents.length}</span> {t('common.students')}
            </div>
            <div className="d-flex gap-2 order-1 order-md-2">
              <Button
                variant="white"
                size="sm"
                className="border shadow-sm px-3 rounded-pill"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="bi bi-chevron-left me-1"></i> {t('common.previous')}
              </Button>
              <div className="d-none d-md-flex gap-1">
                {Array.from({ length: Math.ceil(sortedStudents.length / itemsPerPage) }, (_, i) => i + 1)
                  .filter(num => num === 1 || num === Math.ceil(sortedStudents.length / itemsPerPage) || (num >= currentPage - 1 && num <= currentPage + 1))
                  .map((pageNum, index, array) => (
                    <React.Fragment key={pageNum}>
                      {index > 0 && array[index - 1] !== pageNum - 1 && <span className="text-muted">...</span>}
                      <Button
                        variant={currentPage === pageNum ? "primary" : "white"}
                        size="sm"
                        className={`rounded-circle border-0 shadow-sm ${currentPage === pageNum ? '' : 'text-muted'}`}
                        style={{ width: '32px', height: '32px', padding: '0' }}
                        onClick={() => paginate(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    </React.Fragment>
                  ))
                }
              </div>
              <Button
                variant="white"
                size="sm"
                className="border shadow-sm px-3 rounded-pill"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === Math.ceil(sortedStudents.length / itemsPerPage) || sortedStudents.length === 0}
              >
                {t('common.next')} <i className="bi bi-chevron-right ms-1"></i>
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Student Details Modal */}
      <Modal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        size="lg"
        centered
        className="attendance-details-modal"
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            <i className="bi bi-person-badge text-primary me-2"></i>
            {t('attendance.table.details')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedStudent && (
            <div>
              <div className="student-profile-summary p-4 rounded-4 bg-light mb-4 shadow-sm">
                <div className="row g-4 align-items-center">
                  <div className="col-auto">
                    <div className="bg-white rounded-circle d-flex align-items-center justify-content-center border" style={{ width: '80px', height: '80px' }}>
                      <i className="bi bi-person-fill display-4 text-primary opacity-75"></i>
                    </div>
                  </div>
                  <div className="col">
                    <h4 className="mb-0 fw-bold">{selectedStudent.fullName}</h4>
                    <p className="text-muted mb-0">ID: {selectedStudent.code}</p>
                    <Badge pill className="mt-2" style={{ backgroundColor: 'var(--bs-primary)' }}>{selectedStudent.level}</Badge>
                  </div>
                </div>
                <div className="row mt-4 pt-3 border-top g-3">
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block text-uppercase small ls-1">{t('users.church')}</small>
                    <span className="fw-bold">{selectedStudent.church}</span>
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block text-uppercase small ls-1">Presence</small>
                    <span className="fw-bold text-success">
                      {Math.round((getAttendanceStats(selectedStudent).present / Math.max(1, getAttendanceStats(selectedStudent).total)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 fw-bold text-uppercase small text-muted letter-spacing-1">{t('attendance.table.fullLog')}</h6>
              </div>

              {!selectedStudent.attendance || selectedStudent.attendance.length === 0 ? (
                <div className="text-center py-5 bg-white border rounded">
                  <i className="bi bi-calendar-x display-4 text-muted opacity-25"></i>
                  <p className="mt-3 text-muted">{t('attendance.table.noLog')}</p>
                </div>
              ) : (
                <div className="table-responsive rounded-3 border">
                  <Table hover className="mb-0 table-sm">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3 py-2">{t('common.birthdate')}</th>
                        <th className="py-2">{t('common.actions')}</th>
                        <th className="py-2 text-center">{t('common.active')}</th>
                        <th className="py-2 text-center">Term</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...selectedStudent.attendance].reverse().map((record, index) => (
                        <tr key={index}>
                          <td className="ps-3 py-2 fw-medium">{(record.date || record.dateTime || '').split(' ')[0] || 'N/A'}</td>
                          <td className="py-2 text-muted">{(record.date || record.dateTime || '').split(' ')[1] || 'N/A'}</td>
                          <td className="py-2 text-center">{getStatusBadge(record.status)}</td>
                          <td className="py-2 text-center fw-bold text-primary">{record.term ?? 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 pb-4 justify-content-center">
          <Button variant="secondary" className="px-5 rounded-pill shadow-sm" onClick={() => setShowDetailsModal(false)}>
            {t('common.close')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AttendanceReport;