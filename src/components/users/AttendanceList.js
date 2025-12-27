// components/AttendanceReport/AttendanceReport.js
import React, { useState, useEffect, useMemo } from 'react';
import { userService } from '../../services/services';
import { Table, Card, Form, InputGroup, Button, Modal, Badge } from 'react-bootstrap';
import * as XLSX from 'xlsx';

const AttendanceReport = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: 'code',
    direction: 'ascending'
  });

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

  useEffect(() => {
    fetchAttendanceReport();
  }, [selectedLevel]);

  const fetchAttendanceReport = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsersAttendance(selectedLevel);
      console.log(data);
      setStudents(data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching attendance report. Please try again later.');
      setLoading(false);
      console.error('Error fetching attendance report:', err);
    }
  };

  // Filter students by search term
  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.code?.includes(searchTerm) ||
      student.church?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

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
      'كود الطالب': student.code || '',
      'اسم الطالب': student.fullName || '',
      'المستوى': student.level || 'N/A',
      'الكنيسة': student.church || 'N/A',
      'عدد مرات الحضور': student.attendance?.length || 0,
      'آخر حضور': student.attendance?.length > 0 
        ? formatExcelDate(student.attendance[0].dateTime) 
        : 'لا يوجد'
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
        return <Badge bg="success">حاضر</Badge>;
      case 'متأخر':
        return <Badge bg="warning" text="dark">متأخر</Badge>;
      case 'غائب':
        return <Badge bg="danger">غائب</Badge>;
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
          <span className="visually-hidden">جاري التحميل...</span>
        </div>
        <div className="mt-2">جاري تحميل تقرير الحضور...</div>
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
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="attendance-report">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">تقرير الحضور والانصراف</h1>
        <div className="d-flex gap-2">
          <Button
            variant="success"
            onClick={exportToExcel}
            className="d-flex align-items-center"
          >
            <i className="bi bi-file-earmark-excel me-1"></i> تصدير إلى Excel
          </Button>
          <Button
            variant="primary"
            onClick={fetchAttendanceReport}
            className="d-flex align-items-center"
          >
            <i className="bi bi-arrow-clockwise me-1"></i> تحديث البيانات
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="mb-4">
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-6">
              <Form.Label htmlFor="levelFilter">المستوى الدراسي:</Form.Label>
              <Form.Select
                id="levelFilter"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                {LEVELS.map(level => (
                  <option key={level} value={level}>
                    {level === 'all' ? 'جميع المستويات' : level}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-md-6">
              <Form.Label htmlFor="search">بحث:</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  id="search"
                  placeholder="ابحث باسم الطالب، الكود، أو الكنيسة..."
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
                <small className="text-muted">إجمالي الطلاب</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-2 bg-light">
                <div className="h5 mb-1 text-success">
                  {sortedStudents.filter(s => s.attendance?.length > 0).length}
                </div>
                <small className="text-muted">طلاب لديهم حضور</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-2 bg-light">
                <div className="h5 mb-1 text-warning">
                  {sortedStudents.reduce((total, student) => total + (student.attendance?.length || 0), 0)}
                </div>
                <small className="text-muted">إجمالي سجلات الحضور</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-2 bg-light">
                <div className="h5 mb-1 text-info">
                  {selectedLevel === 'all' ? 'جميع المستويات' : selectedLevel}
                </div>
                <small className="text-muted">المستوى المحدد</small>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Students Table */}
      {sortedStudents.length === 0 ? (
        <div className="alert alert-info text-center">
          <i className="bi bi-info-circle-fill me-2"></i>
          لا توجد بيانات للعرض
        </div>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="table-dark">
              <tr>
                <th 
                  className={getClassNamesFor('code')}
                  style={{ cursor: 'pointer', width: '120px' }}
                  onClick={() => requestSort('code')}
                >
                  كود الطالب
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
                  اسم الطالب
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
                  المستوى
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
                  الكنيسة
                  {sortConfig.key === 'church' && (
                    <span className="sort-icon ms-1">
                      {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th width="250">آخر 3 مرات حضور</th>
                <th width="120">الإجمالي</th>
                <th width="100">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.map((student) => {
                const stats = getAttendanceStats(student);
                const recentAttendance = student.attendance?.slice(0, 3) || [];
                
                return (
                  <tr key={student.code}>
                    <td className="fw-bold text-primary">{student.code}</td>
                    <td>{student.fullName}</td>
                    <td>
                      <Badge bg="info">{student.level}</Badge>
                    </td>
                    <td>{student.church}</td>
                    <td>
                      {recentAttendance.length === 0 ? (
                        <span className="text-muted">لا توجد سجلات</span>
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
                    <td>
                      <div className="text-center">
                        <div className="h5 mb-0">{stats.total}</div>
                        <div className="small">
                          <span className="text-success">{stats.present}</span> / 
                          <span className="text-warning"> {stats.late}</span> / 
                          <span className="text-danger"> {stats.absent}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="w-100"
                        onClick={() => handleStudentClick(student)}
                      >
                        <i className="bi bi-eye me-1"></i>
                        التفاصيل
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
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
            تفاصيل الحضور - {selectedStudent?.fullName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudent && (
            <div>
              <div className="row mb-4">
                <div className="col-md-6">
                  <strong>كود الطالب:</strong> {selectedStudent.code}
                </div>
                <div className="col-md-6">
                  <strong>المستوى:</strong> {selectedStudent.level}
                </div>
                <div className="col-md-6 mt-2">
                  <strong>الكنيسة:</strong> {selectedStudent.church}
                </div>
                <div className="col-md-6 mt-2">
                  <strong>إجمالي الحضور:</strong> 
                  <Badge bg="primary" className="ms-2">
                    {selectedStudent.attendance?.length || 0}
                  </Badge>
                </div>
              </div>

              <h6>سجل الحضور الكامل:</h6>
              {!selectedStudent.attendance || selectedStudent.attendance.length === 0 ? (
                <div className="alert alert-info text-center">
                  لا توجد سجلات حضور لهذا الطالب
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>الوقت</th>
                        <th>الحالة</th>
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
            إغلاق
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AttendanceReport;