import React, { useState, useEffect, useMemo } from 'react';
import { userService } from '../../services/services';
import { Table, Button, Card, Form, InputGroup, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

const UserList = () => {
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: 'code',
    direction: 'ascending'
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Export to Excel function
  const exportToExcel = () => {
    const dataForExport = sortedUsers.map(user => ({
      Code: user.code || '',
      'Full Name': user.fullName || '',
      Level: user.level || 'N/A',
      'Phone Number': user.phoneNumber || 'N/A',
      Church: user.church || 'N/A'
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
        setError('Error fetching users. Please try again later.');
        setLoading(false);
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, []);

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
            code: item.Code || item.code || '',
            fullName: item['Full Name'] || item.fullName || '',
            level: item.Level || item.level || '',
            phoneNumber: item['Phone Number'] || item.phoneNumber || '',
            church: item.Church || item.church || ''
          }));

          // Send to server
          const result = await userService.bulkUpdateUsers(transformedData);
          
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
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

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
        <h1 className="h2">Pendding Users</h1>
        <div className="d-flex gap-2">
          <Button
            variant="primary"
            onClick={() => setShowUploadModal(true)}
            className="d-flex align-items-center"
          >
            <i className="bi bi-upload me-1"></i> Bulk Update
          </Button>
          <Button
            variant="success"
            onClick={exportToExcel}
            className="d-flex align-items-center"
          >
            <i className="bi bi-file-earmark-excel me-1"></i> Export to Excel
          </Button>
          <Link to="/users/new" className="btn btn-primary">
            <i className="bi bi-person-plus-fill me-1"></i> Add New User
          </Link>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={() => setShowUploadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Bulk Update Users</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {uploadSuccess ? (
            <div className="alert alert-success">
              <i className="bi bi-check-circle-fill me-2"></i>
              Bulk update completed successfully!
            </div>
          ) : (
            <>
              <p>Upload an Excel file with user data. The file should have the following columns:</p>
              <ul>
                <li>Code</li>
                <li>Full Name</li>
                <li>Level</li>
                <li>Phone Number</li>
                <li>Church</li>
              </ul>
              
              <Form.Group controlId="formFile" className="mb-3">
                <Form.Label>Select Excel File</Form.Label>
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
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={processBulkUpdate}
                disabled={uploadLoading || !uploadFile}
              >
                {uploadLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Processing...
                  </>
                ) : (
                  'Upload and Update'
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
                placeholder="Search by name, code, phone number, or level..."
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

      <span className="badge bg-primary">حضانة: {sortedUsers.filter(user => user.level === "حضانة").length}</span>
      <span className="badge bg-secondary">ابتدائى: {sortedUsers.filter(user => user.level.includes("ابتدائى")).length}</span>
      <span className="badge bg-success">اعدادى: {sortedUsers.filter(user => user.level === "اعدادى").length}</span>
      <span className="badge bg-danger">ثانوى: {sortedUsers.filter(user => user.level === "ثانوى").length}</span>
      <span className="badge bg-warning">جامعة أو خريج: {sortedUsers.filter(user => user.level.includes("خريج")).length}</span>
      <span className="badge bg-info">غير محدد: {sortedUsers.filter(user => user.level === "").length}</span>
      
      {sortedUsers.length === 0 ? (
        <div className="alert alert-info">No users found.</div>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th className={getClassNamesFor('code')}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      requestSort('code');
                    }}
                    className="sortable-header-link"
                  >
                    Code
                    {sortConfig.key === 'code' && (
                      <span className="sort-icon">
                        {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </a>
                </th>
                <th className={getClassNamesFor('fullName')}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      requestSort('fullName');
                    }}
                    className="sortable-header-link"
                  >
                    Full Name
                    {sortConfig.key === 'fullName' && (
                      <span className="sort-icon">
                        {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </a>
                </th>
                <th className={getClassNamesFor('level')}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      requestSort('level');
                    }}
                    className="sortable-header-link"
                  >
                    Level
                    {sortConfig.key === 'level' && (
                      <span className="sort-icon">
                        {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </a>
                </th>
                <th className={getClassNamesFor('phoneNumber')}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      requestSort('phoneNumber');
                    }}
                    className="sortable-header-link"
                  >
                    Phone Number
                    {sortConfig.key === 'phoneNumber' && (
                      <span className="sort-icon">
                        {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </a>
                </th>
                <th className={getClassNamesFor('church')}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      requestSort('church');
                    }}
                    className="sortable-header-link"
                  >
                    Church
                    {sortConfig.key === 'church' && (
                      <span className="sort-icon">
                        {sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </a>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.code}>
                  <td>{user.code}</td>
                  <td>{user.fullName}</td>
                  <td>{user.level || 'N/A'}</td>
                  <td>{user.phoneNumber || 'N/A'}</td>
                  <td>{user.church || 'N/A'}</td>
                  <td>
                    <Link to={`/users/${user.code}`} className="btn btn-sm btn-info btn-action">
                      <i className="bi bi-eye"></i>
                    </Link>
                    <Link to={`/users/edit/${user.code}`} className="btn btn-sm btn-warning btn-action">
                      <i className="bi bi-pencil"></i>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default UserList;