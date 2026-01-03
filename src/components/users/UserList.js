import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/services';
import { Table, Button, Card, Form, InputGroup, Modal, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx'; // Add this import

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
  const [selectedUser, setSelectedUser] = useState(null); // For Quick View Modal

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    document.title = `${t('users.title')} | Firebase Portal`;
  }, [t]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await userService.getAllUsers();
        setUsers(data);
        setFilteredUsers(data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching users. Please try again later.');
        setLoading(false);
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, []);

  const exportToExcel = () => {
    // Prepare data for export
    const dataForExport = sortedUsers.map(user => ({
      [t('users.code')]: user.code || '',
      [t('users.fullName')]: user.fullName || '',
      [t('common.address')]: user.address,
      [t('users.level')]: user.level || 'N/A',
      [t('users.phone')]: user.phoneNumber || 'N/A',
      [t('users.church')]: user.church || 'N/A'
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(dataForExport);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");

    // Generate file name with timestamp
    const fileName = `users_export_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // Export to Excel
    XLSX.writeFile(wb, fileName);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadFile(file);
      setUploadError(null);
    }
  };

  const processBulkUpdate = async () => {
    if (!uploadFile) {
      setUploadError('Please select a file first');
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
            code: item.Code || item.code || item[t('users.code')] || '',
            fullName: item['Full Name'] || item.fullName || item[t('users.fullName')] || '',
            // address: item['Address'] || item.address || '',
            level: item.Level || item.level || item[t('users.level')] || '',
            phoneNumber: item['Phone Number'] || item.phoneNumber || item[t('users.phone')] || '',
            church: item.Church || item.church || item[t('users.church')] || ''
          }));

          // Send to server
          await userService.bulkUpdateUsers(transformedData);

          setUploadSuccess(true);
          setUploadLoading(false);

          // Refresh the user list
          const updatedData = await userService.getAllUsers();
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
          (user.level && String(user.level).toLowerCase().includes(lowerSearchTerm)) ||
          (user.church && String(user.church).toLowerCase().includes(lowerSearchTerm));

        if (matchesSearch) {
          filtered[key] = user;
        }
      });

      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

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

  const handleDelete = async (code) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(code);

        const updatedUsers = { ...users };
        delete updatedUsers[code];
        setUsers(updatedUsers);

        alert('User deleted successfully');
      } catch (err) {
        alert('Error deleting user. Please try again.');
        console.error('Error deleting user:', err);
      }
    }
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-3">{error}</div>;
  }

  return (
    <div className="user-list">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">{t('users.title')}</h1>
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            onClick={() => setShowUploadModal(true)}
            className="d-flex align-items-center rounded-pill shadow-sm"
          >
            <i className="bi bi-upload me-1"></i> {t('users.bulkUpdate')}
          </Button>
          <Button
            variant="outline-success"
            onClick={exportToExcel}
            className="d-flex align-items-center rounded-pill shadow-sm"
          >
            <i className="bi bi-file-earmark-excel me-1"></i> {t('users.exportExcel')}
          </Button>
          {hasPermission('users', 'edit') && (
            <Link to="/users/new" className="btn btn-primary rounded-pill shadow-sm d-flex align-items-center">
              <i className="bi bi-person-plus-fill me-1"></i> {t('nav.addUser')}
            </Link>
          )}
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
                    {t('users.processing')}
                  </>
                ) : (
                  t('users.uploadAndUpdate')
                )}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

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

      {sortedUsers.length === 0 ? (
        <div className="alert alert-info">{t('common.noResults')}</div>
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
                        <div className="btn-group" role="group">
                          {/* Quick View Trigger */}
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="btn-action"
                            onClick={() => setSelectedUser(user)}
                            title={t('users.quickView')}
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          {/* Full Details Link */}
                          <Link
                            to={`/users/${user.code}`}
                            className="btn btn-sm btn-outline-primary btn-action"
                            title={t('users.fullProfile')}
                          >
                            <i className="bi bi-person-vcard"></i>
                          </Link>
                          {hasPermission('users', 'edit') && (
                            <Link
                              to={`/users/edit/${user.code}`}
                              className="btn btn-sm btn-outline-warning btn-action"
                              title={t('common.edit')}
                            >
                              <i className="bi bi-pencil"></i>
                            </Link>
                          )}
                          {hasPermission('users', 'delete') && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="btn-action"
                              onClick={() => handleDelete(user.code)}
                              title={t('common.delete')}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          )}
                        </div>
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
              Displaying {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedUsers.length)} of {sortedUsers.length} users
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
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
                Next
              </Button>
            </div>
          </div>
        </>
      )}


      {/* Quick View Modal */}
      <Modal
        show={!!selectedUser}
        onHide={() => setSelectedUser(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-lines-fill me-2 text-primary"></i>
            {t('users.details')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedUser && (
            <div className="p-3">
              <div className="text-center mb-4">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-person-circle display-4 text-secondary"></i>
                </div>
                <h5 className="mt-2 text-dark">{selectedUser.fullName}</h5>
                <Badge bg="primary" className="rounded-pill px-3">{selectedUser.code}</Badge>
              </div>

              <div className="row g-3">
                <div className="col-6">
                  <small className="text-muted d-block">{t('users.level')}</small>
                  <span className="fw-medium">{selectedUser.level || 'N/A'}</span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">{t('users.phone')}</small>
                  {selectedUser.phoneNumber ? (
                    <a href={`tel:${selectedUser.phoneNumber}`} className="text-decoration-none">{selectedUser.phoneNumber}</a>
                  ) : 'N/A'}
                </div>
                <div className="col-12">
                  <small className="text-muted d-block">{t('common.address')}</small>
                  <span className="fw-medium">{selectedUser.address || 'N/A'}</span>
                </div>
                <div className="col-12">
                  <small className="text-muted d-block">{t('users.church')}</small>
                  <span className="fw-medium">{selectedUser.church || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Link to={`/users/edit/${selectedUser?.code}`} className="btn btn-sm btn-outline-warning">
            <i className="bi bi-pencil me-1"></i> {t('users.editFullProfile')}
          </Link>
          <Button variant="secondary" size="sm" onClick={() => setSelectedUser(null)}>
            {t('common.close')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
};

export default UserList;