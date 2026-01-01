// components/AttendanceReport/AttendanceReport.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { userService } from '../../services/services';
import { Table, Card, Form, InputGroup, Button, Modal, Badge } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

const AttendanceReport = () => {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
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
    'all',
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
      const data = await userService.getUsersAttendance(selectedLevel);
      setStudents(data);
      setLoading(false);
    } catch (err) {
      setError(t('common.noResults'));
      setLoading(false);
      console.error('Error fetching attendance report:', err);
    }
  }, [selectedLevel, t]);

  useEffect(() => {
    fetchAttendanceReport();
  }, [fetchAttendanceReport]);

  // Filter students by search term
  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.code?.includes(searchTerm) ||
      student.church?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  // Reset pagination when search or level changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedLevel]);

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
    // Prepare data for export
    const dataForExport = sortedStudents.map(student => ({
      [t('users.code')]: student.code || '',
      [t('users.fullName')]: student.fullName || '',
      [t('users.level')]: student.level || 'N/A',
      [t('users.church')]: student.church || 'N/A',
      [t('subjects.attendance')]: student.attendance?.length || 0,
      [t('attendance.table.recentAttendance')]: student.attendance?.length > 0
        ? formatExcelDate(student.attendance[0].dateTime)
        : t('common.noResults')
    }));

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

  const formatExcelDate = (dateTime) => {
    return dateTime.split(' ')[0]; // Return only the date part
  };

  const formatDisplayDate = (dateTime) => {
    const [date, time] = dateTime.split(' ');
    return (
      <div className="text-center">
        <div className="fw-bold">{date}</div>
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
      <Card className="mb-4">
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Label htmlFor="levelFilter">{t('attendance.studyLevel')}:</Form.Label>
              <Form.Select
                id="levelFilter"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                {LEVELS.map(level => (
                  <option key={level} value={level}>
                    {level === 'all' ? t('attendance.allLevels') : level}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-md-6">
              <Form.Label htmlFor="search">{t('common.search')}:</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  id="search"
                  placeholder={t('attendance.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="bi bi-x-lg"></i>
                  </Button>
                )}
              </InputGroup>
            </div>
          </div>

          {/* Statistics */}
          <div className="row mt-3 text-center">
            <div className="col-md-3">
              <div className="border rounded p-2 bg-light">
                <div className="h5 mb-1 text-primary">{sortedStudents.length}</div>
                <small className="text-muted">{t('attendance.stats.totalStudents')}</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-2 bg-light">
                <div className="h5 mb-1 text-success">
                  {sortedStudents.filter(s => s.attendance?.length > 0).length}
                </div>
                <small className="text-muted">{t('attendance.stats.withAttendance')}</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-2 bg-light">
                <div className="h5 mb-1 text-warning">
                  {sortedStudents.reduce((total, student) => total + (student.attendance?.length || 0), 0)}
                </div>
                <small className="text-muted">{t('attendance.stats.totalRecords')}</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-2 bg-light">
                <div className="h5 mb-1 text-info">
                  {selectedLevel === 'all' ? t('attendance.allLevels') : selectedLevel}
                </div>
                <small className="text-muted">{t('attendance.stats.selectedLevel')}</small>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Students Table */}
      {sortedStudents.length === 0 ? (
        <div className="alert alert-info text-center">
          <i className="bi bi-info-circle-fill me-2"></i>
          {t('common.noResults')}
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="table-dark">
                <tr>
                  <th
                    className={getClassNamesFor('code')}
                    style={{ cursor: 'pointer', width: '120px' }}
                    onClick={() => requestSort('code')}
                  >
                    {t('users.code')}
                    {sortConfig.key === 'code' && (
                      <span className="sort-icon ms-1">
                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    className={getClassNamesFor('fullName')}
                    style={{ cursor: 'pointer', width: '200px' }}
                    onClick={() => requestSort('fullName')}
                  >
                    {t('users.fullName')}
                    {sortConfig.key === 'fullName' && (
                      <span className="sort-icon ms-1">
                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    className={getClassNamesFor('level')}
                    style={{ cursor: 'pointer', width: '150px' }}
                    onClick={() => requestSort('level')}
                  >
                    {t('users.level')}
                    {sortConfig.key === 'level' && (
                      <span className="sort-icon ms-1">
                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    className={getClassNamesFor('church')}
                    style={{ cursor: 'pointer', width: '200px' }}
                    onClick={() => requestSort('church')}
                  >
                    {t('users.church')}
                    {sortConfig.key === 'church' && (
                      <span className="sort-icon ms-1">
                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th width="250">{t('attendance.table.recentAttendance')}</th>
                  <th width="120">{t('subjects.attendance')}</th>
                  <th width="100">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((student) => {
                  const stats = getAttendanceStats(student);
                  const recentAttendance = student.attendance?.slice(0, 3) || [];

                  // Helper to get level color
                  const getLevelColor = (level) => {
                    if (level.includes('حضانة')) return 'var(--level-kindergarten)';
                    if (level.includes('ابتدائى')) return 'var(--level-primary)';
                    if (level.includes('إعدادى')) return 'var(--level-secondary)';
                    if (level.includes('ثانوى')) return 'var(--level-highschool)';
                    if (level.includes('جامعيين') || level.includes('خريجين')) return 'var(--level-university)';
                    return 'var(--bs-primary)';
                  };

                  return (
                    <tr key={student.code}>
                      <td data-label={t('users.code')} className="fw-bold text-primary">{student.code}</td>
                      <td data-label={t('users.fullName')}>{student.fullName}</td>
                      <td data-label={t('users.level')}>
                        <Badge style={{ backgroundColor: getLevelColor(student.level || '') }}>
                          {student.level}
                        </Badge>
                      </td>
                      <td data-label={t('users.church')}>{student.church}</td>
                      <td data-label={t('attendance.table.recentAttendance')}>
                        {recentAttendance.length === 0 ? (
                          <span className="text-muted">{t('common.noResults')}</span>
                        ) : (
                          <div className="d-flex flex-column gap-1">
                            {recentAttendance.map((record, index) => (
                              <div key={index} className="d-flex justify-content-between align-items-center">
                                <small>{formatDisplayDate(record.dateTime)}</small>
                                {getStatusBadge(record.status)}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td data-label={t('subjects.attendance')}>
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          <span className="badge bg-success" title={t('attendance.status.present')}>{stats.present}</span>
                          <span className="badge bg-warning text-dark" title={t('attendance.status.late')}>{stats.late}</span>
                          <span className="badge bg-danger" title={t('attendance.status.absent')}>{stats.absent}</span>
                          <span className="badge bg-secondary" title={t('subjects.attendance')}>{stats.total}</span>
                        </div>
                      </td>
                      <td data-label={t('common.actions')}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="w-100"
                          onClick={() => handleStudentClick(student)}
                        >
                          <i className="bi bi-eye me-1"></i>
                          {t('attendance.table.details')}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted small">
              {t('common.actions')} {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedStudents.length)} {t('common.noResults')} {sortedStudents.length} {t('common.actions')}
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {t('common.back')}
              </Button>
              {Array.from({ length: Math.min(5, Math.ceil(sortedStudents.length / itemsPerPage)) }, (_, i) => {
                // Logic to show a window of pages around current page
                let pageNum;
                const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
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
                    onClick={() => paginate(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === Math.ceil(sortedStudents.length / itemsPerPage)}
              >
                {t('common.actions')}
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
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {t('attendance.table.details')} - {selectedStudent?.fullName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudent && (
            <div>
              <div className="row mb-4">
                <div className="col-md-6">
                  <strong>{t('users.code')}:</strong> {selectedStudent.code}
                </div>
                <div className="col-md-6">
                  <strong>{t('users.level')}:</strong> {selectedStudent.level}
                </div>
                <div className="col-md-6 mt-2">
                  <strong>{t('users.church')}:</strong> {selectedStudent.church}
                </div>
                <div className="col-md-6 mt-2">
                  <strong>{t('subjects.attendance')}:</strong>
                  <Badge bg="primary" className="ms-2">
                    {selectedStudent.attendance?.length || 0}
                  </Badge>
                </div>
              </div>

              <h6>{t('attendance.table.fullLog')}:</h6>
              {!selectedStudent.attendance || selectedStudent.attendance.length === 0 ? (
                <div className="alert alert-info text-center">
                  {t('attendance.table.noLog')}
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>{t('common.birthdate')}</th>
                        <th>{t('common.actions')}</th>
                        <th>{t('common.active')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.attendance.map((record, index) => (
                        <tr key={index}>
                          <td>{record.dateTime.split(' ')[0]}</td>
                          <td>{record.dateTime.split(' ')[1]}</td>
                          <td>{getStatusBadge(record.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            {t('common.close')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AttendanceReport;