import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/services';
import { Table, Button, Card, Form, InputGroup, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

const UserList = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState({});
  const [sortConfig] = useState({
    key: 'code',
    direction: 'ascending'
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    document.title = `${t('users.pending')} | Firebase Portal`;
  }, [t]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Export to Excel function
  const exportToExcel = () => {
    const dataForExport = sortedUsers.map(user => ({
      [t('users.code')]: user.code || '',
      [t('users.fullName')]: user.fullName || '',
      [t('users.level')]: user.level || 'N/A',
      [t('users.phone')]: user.phoneNumber || 'N/A',
      [t('users.church')]: user.church || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    const fileName = `users_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await userService.getPenddingUsers();
        setUsers(data);
        setFilteredUsers(data);
        setLoading(false);
      } catch (err) {
        setError(t('common.noResults'));
        setLoading(false);
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, [t]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = {};
      const lowerSearchTerm = searchTerm.toLowerCase();

      Object.keys(users).forEach(key => {
        const user = users[key];
        const matchesSearch =
          (user.fullName && String(user.fullName).toLowerCase().includes(lowerSearchTerm)) ||
          (user.code && String(user.code).toLowerCase().includes(lowerSearchTerm)) ||
          (user.phoneNumber && String(user.phoneNumber).includes(searchTerm)) ||
          (user.level && String(user.level).toLowerCase().includes(lowerSearchTerm));

        if (matchesSearch) {
          filtered[key] = user;
        }
      });

      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Handle user approval
  const handleApprove = async (code, name) => {
    if (window.confirm(t('users.confirmApprove', { name }))) {
      try {
        setLoading(true);
        await userService.approveUser(code);
        // Refresh list
        const data = await userService.getPenddingUsers();
        setUsers(data);
        setFilteredUsers(data);
        setLoading(false);
        alert(t('users.approveSuccess'));
      } catch (err) {
        console.error('Error approving user:', err);
        setError(t('common.error'));
        setLoading(false);
      }
    }
  };

  // Handle user delete
  const handleDelete = async (code, name) => {
    if (window.confirm(t('users.confirmDelete', { name }))) {
      try {
        setLoading(true);
        await userService.deletePenddingUser(code);
        // Refresh list
        const data = await userService.getPenddingUsers();
        setUsers(data);
        setFilteredUsers(data);
        setLoading(false);
      } catch (err) {
        console.error('Error deleting user:', err);
        setError(t('common.error'));
        setLoading(false);
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadError(null);
    }
  };

  // Process Excel file and send to server
  const processBulkUpdate = async () => {
    if (!uploadFile) {
      setUploadError(t('users.selectFile'));
      return;
    }

    setUploadLoading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // Read Excel file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Validate and transform data
          const transformedData = jsonData.map(item => ({
            code: item[t('users.code')] || item.code || item.Code || '',
            fullName: item[t('users.fullName')] || item.fullName || item['Full Name'] || '',
            level: item[t('users.level')] || item.level || item.Level || '',
            phoneNumber: item[t('users.phone')] || item.phoneNumber || item['Phone Number'] || '',
            church: item[t('users.church')] || item.church || item.Church || ''
          }));

          // Send to server
          await userService.bulkUpdateUsers(transformedData);

          setUploadSuccess(true);
          setUploadLoading(false);

          // Refresh the user list
          const updatedData = await userService.getPenddingUsers();
          setUsers(updatedData);
          setFilteredUsers(updatedData);

          // Close modal after 2 seconds
          setTimeout(() => {
            setShowUploadModal(false);
            setUploadFile(null);
            setUploadSuccess(false);
          }, 2000);

        } catch (error) {
          setUploadError('Error processing file: ' + error.message);
          setUploadLoading(false);
        }
      };

      reader.readAsArrayBuffer(uploadFile);
    } catch (error) {
      setUploadError('Error reading file: ' + error.message);
      setUploadLoading(false);
    }
  };

  // Sort users
  // const requestSort = (key) => {
  //   let direction = 'ascending';
  //   if (sortConfig.key === key && sortConfig.direction === 'ascending') {
  //     direction = 'descending';
  //   }
  //   setSortConfig({ key, direction });
  // };

  const sortedUsers = useMemo(() => {
    const sortableUsers = Object.values(filteredUsers);
    if (sortConfig.key) {
      sortableUsers.sort((a, b) => {
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
    return sortableUsers;
  }, [filteredUsers, sortConfig]);

  const getClassNamesFor = (name) => {
    if (!sortConfig) return;
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-3">{error}</div>;
  }

  return (
    <div className="user-list">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">{t('users.pending')}</h1>
        <div className="d-flex gap-2">
          <Button
            variant="primary"
            onClick={() => setShowUploadModal(true)}
            className="d-flex align-items-center"
          >
            <i className="bi bi-upload me-1"></i> {t('users.bulkUpdate')}
          </Button>
          <Button
            variant="success"
            onClick={exportToExcel}
            className="d-flex align-items-center"
          >
            <i className="bi bi-file-earmark-excel me-1"></i> {t('users.exportExcel')}
          </Button>
          <Link to="/users/new" className="btn btn-primary">
            <i className="bi bi-person-plus-fill me-1"></i> {t('users.new')}
          </Link>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{t('users.bulkUpdateTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {uploadSuccess ? (
            <div className="alert alert-success">
              <i className="bi bi-check-circle-fill me-2"></i>
              {t('users.successMsg')}
            </div>
          ) : (
            <>
              <p>{t('users.bulkUpdateDesc')}</p>
              <ul>
                <li>{t('users.code')}</li>
                <li>{t('users.fullName')}</li>
                <li>{t('users.level')}</li>
                <li>{t('users.phone')}</li>
                <li>{t('users.church')}</li>
              </ul>

              <Form.Group controlId="formFile" className="mb-3">
                <Form.Label>{t('users.selectFile')}</Form.Label>
                <Form.Control
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={uploadLoading}
                />
              </Form.Group>

              {uploadError && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {uploadError}
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!uploadSuccess && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowUploadModal(false)}
                disabled={uploadLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={processBulkUpdate}
                disabled={uploadLoading || !uploadFile}
              >
                {uploadLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    {t('common.processing')}
                  </>
                ) : (
                  t('users.uploadAndUpdate')
                )}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* Rest of your component remains the same */}
      <Card className="mb-4">
        <Card.Body>
          <Form>
            <InputGroup className="mb-3">
              <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
              <Form.Control
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
          </Form>
        </Card.Body>
      </Card>

      {/* <span className="badge bg-primary">حضانة: {sortedUsers.filter(user => user.level === "حضانة").length}</span>
      <span className="badge bg-secondary">ابتدائى: {sortedUsers.filter(user => user.level.includes("ابتدائى")).length}</span>
      <span className="badge bg-success">اعدادى: {sortedUsers.filter(user => user.level === "اعدادى").length}</span>
      <span className="badge bg-danger">ثانوى: {sortedUsers.filter(user => user.level === "ثانوى").length}</span>
      <span className="badge bg-warning">جامعة أو خريج: {sortedUsers.filter(user => user.level.includes("خريج")).length}</span>
      <span className="badge bg-info">غير محدد: {sortedUsers.filter(user => user.level === "").length}</span> */}

      {sortedUsers.length === 0 ? (
        <div className="alert alert-info">{t('users.noUsers')}</div>
      ) : (
        <>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th className={getClassNamesFor('code')}>
                    {t('users.code')}
                  </th>
                  <th className={getClassNamesFor('fullName')}>
                    {t('users.fullName')}
                  </th>
                  <th className={getClassNamesFor('level')}>
                    {t('users.level')}
                  </th>
                  <th className={getClassNamesFor('phoneNumber')}>
                    {t('users.phone')}
                  </th>
                  <th className={getClassNamesFor('church')}>
                    {t('users.church')}
                  </th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((user) => {
                  // Helper to get level color
                  const getLevelColor = (level) => {
                    if (!level) return 'var(--bs-gray-500)';
                    if (level.includes('حضانة')) return 'var(--level-kindergarten)';
                    if (level.includes('ابتدائى')) return 'var(--level-primary)';
                    if (level.includes('إعدادى')) return 'var(--level-secondary)';
                    if (level.includes('ثانوى')) return 'var(--level-highschool)';
                    if (level.includes('جامعيين') || level.includes('خريجين') || level.includes('Graduate')) return 'var(--level-university)';
                    return 'var(--bs-primary)';
                  };

                  return (
                    <tr key={user.code}>
                      <td data-label={t('users.code')}>{user.code}</td>
                      <td data-label={t('users.fullName')}>{user.fullName}</td>
                      <td data-label={t('users.level')}>
                        <span className="badge" style={{ backgroundColor: getLevelColor(user.level) }}>
                          {user.level || 'N/A'}
                        </span>
                      </td>
                      <td data-label={t('users.phone')}>{user.phoneNumber || 'N/A'}</td>
                      <td data-label={t('users.church')}>{user.church || 'N/A'}</td>
                      <td data-label={t('common.actions')}>
                        {hasPermission('users', 'view') && (
                          <Link to={`/users/${user.code}?type=pending`} className="btn btn-sm btn-info btn-action" title={t('users.quickView')}>
                            <i className="bi bi-eye"></i>
                          </Link>
                        )}
                        {hasPermission('users', 'edit') && (
                          <Link to={`/users/edit/${user.code}?type=pending`} className="btn btn-sm btn-warning btn-action" title={t('common.edit')}>
                            <i className="bi bi-pencil"></i>
                          </Link>
                        )}
                        {hasPermission('users', 'delete') && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="btn-action"
                            onClick={() => handleDelete(user.code, user.fullName)}
                            title={t('common.delete')}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        )}
                        {hasPermission('users', 'edit') && (
                          <Button
                            variant="success"
                            size="sm"
                            className="btn-action"
                            onClick={() => handleApprove(user.code, user.fullName)}
                            title={t('users.approve')}
                          >
                            <i className="bi bi-check-lg"></i>
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted small">
              {t('common.actions')} {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedUsers.length)} {t('common.noResults')} {sortedUsers.length} {t('users.title')}
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
              {Array.from({ length: Math.min(5, Math.ceil(sortedUsers.length / itemsPerPage)) }, (_, i) => {
                // Logic to show a window of pages around current page
                let pageNum;
                const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
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
                disabled={currentPage === Math.ceil(sortedUsers.length / itemsPerPage)}
              >
                {t('common.actions')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserList;