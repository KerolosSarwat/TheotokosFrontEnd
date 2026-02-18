import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/services';
import { Table, Button, Card, Form, InputGroup, Modal, Badge, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx'; // Add this import
import * as htmlToImage from 'html-to-image';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

import StudentDegreesModal from './StudentDegreesModal'; // Import the new modal
import StudentIDCard from './StudentIDCard';

const UserList = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState({});

  // Dynamic levels from data
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
  const [sortConfig] = useState({
    key: 'code',
    direction: 'ascending'
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedUser, setSelectedUser] = useState(null); // For Quick View Modal
  const [selectedUserIds, setSelectedUserIds] = useState(new Set()); // For Bulk Selection

  const [showDegreeModal, setShowDegreeModal] = useState(false);
  const [selectedDegreeUser, setSelectedDegreeUser] = useState(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // ID Card State
  const [showIDModal, setShowIDModal] = useState(false);
  const [selectedIDUser, setSelectedIDUser] = useState(null);
  const [cardTime, setCardTime] = useState('5:00 م');
  const [cardSaint, setCardSaint] = useState('');
  const [cardLocation, setCardLocation] = useState('');

  // Bulk Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTime, setBulkTime] = useState('5:00 م');
  const [bulkSaint, setBulkSaint] = useState('');
  const [bulkLocation, setBulkLocation] = useState(''); // New state

  // const componentRef = React.useRef();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (selectedIDUser) {
      const element = document.getElementById('print-section');
      if (element) {
        try {
          // Filter out non-element nodes to avoid potential errors
          // const filter = (node) => {
          //   return (node.tagName !== 'i'); // Example filter if needed, though usually not for basic cleanup
          // }

          const dataUrl = await htmlToImage.toPng(element, { backgroundColor: 'white' });
          saveAs(dataUrl, `ID_${selectedIDUser.code}.png`);
        } catch (error) {
          console.error('Could not generate image', error);
          alert('Error generating image');
        }
      }
    }
  };

  const toggleSelectUser = (code) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedUserIds(newSelected);
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      const allCodes = currentItems.map(u => u.code);
      setSelectedUserIds(new Set(allCodes));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleBulkDownload = async () => {
    if (selectedUserIds.size === 0) return;

    setLoading(true); // Re-use main loading or add specific one
    const zip = new JSZip();

    // We need a hidden container to render items temporarily
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    // Temporary root for React to render into (if we were using ReactDOM.render)
    // But since we are in a functional component, we might not easily render React components to a string synchronously with full styles involved for html-to-image
    // A common workaround is to render them one by one in the visible modal or a hidden div that we assume behaves like the modal

    // STRATEGY: 
    // Iterate through selected users.
    // For each user, we need to generate the ID Card HTML. 
    // Since `StudentIDCard` is a React component, we can use a trick:
    // We can just reuse the existing `StudentIDCard` component but mount it into a DOM node.
    // However, mounting React components programmatically needs `createRoot` or similar.
    // Simpler approach: 
    // We will loop through the selected IDs, find the user object.
    // We will use the existing `print-section` in the modal if strictly needed, BUT checking if we can just render components to static markup is harder with styles.
    // Better: Create a hidden area in the JSX that renders ALL selected cards, wait for them to mount, then snap them? 
    // No, that might be too heavy.

    // Better approach for bulk: Loop sequentially.
    // 1. Set a "bulkProcessing" state.
    // 2. Render a hidden div in the main return that maps through `selectedUserIds` and renders `StudentIDCard` for each.
    // 3. Use `useEffect` to detect when they are rendered? Or just use a delay?

    try {
      // Alternative: Just render one card at a time in the background?
      // Let's try rendering ALL selected cards in a hidden container in the JSX (see below return)
      // We will assign them unique IDs like `bulk-card-${code}`

      const promises = Array.from(selectedUserIds).map(async (code) => {
        const user = users[code] || Object.values(users).find(u => u.code === code);
        if (!user) return null;

        // We need to find the DOM element. 
        // We will make sure they are rendered in the DOM.
        const el = document.getElementById(`bulk-card-${code}`);
        if (!el) return null;

        try {
          const blob = await htmlToImage.toBlob(el, { backgroundColor: 'white' });
          if (blob) {
            zip.file(`${user.fullName}_${code}.png`, blob);
          }
        } catch (err) {
          console.error(`Failed to generate ID for ${code}`, err);
        }
      });

      await Promise.all(promises);

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Student_IDs.zip");

      setSelectedUserIds(new Set()); // Create logic to clear selection

    } catch (error) {
      console.error("Bulk download failed", error);
      alert("Failed to generate bulk IDs");
    } finally {
      setLoading(false);
      document.body.removeChild(container);
    }
  };

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

          await userService.bulkUpdateUsers(transformedData);

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
    let result = Object.values(users);

    // 1. Text Search
    if (searchTerm.trim() !== '') {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(user =>
        (user.fullName && String(user.fullName).toLowerCase().includes(lowerSearchTerm)) ||
        (user.code && String(user.code).toLowerCase().includes(lowerSearchTerm)) ||
        (user.phoneNumber && String(user.phoneNumber).includes(searchTerm)) ||
        (user.level && String(user.level).toLowerCase().includes(lowerSearchTerm)) ||
        (user.church && String(user.church).toLowerCase().includes(lowerSearchTerm))
      );
    }

    // 2. Level Filter
    if (selectedLevels.length > 0) {
      result = result.filter(user => user.level && selectedLevels.includes(user.level));
    }

    setFilteredUsers(result);
  }, [searchTerm, users, selectedLevels]);

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
          {hasPermission('degrees', 'edit') && (
            <Button
              variant="outline-primary"
              onClick={() => setShowUploadModal(true)}
              className="d-flex align-items-center rounded-pill shadow-sm"
            >
              <i className="bi bi-upload me-1"></i> {t('users.bulkUpdate')}
            </Button>
          )}
          <Button
            variant="outline-success"
            onClick={exportToExcel}
            className="d-flex align-items-center rounded-pill shadow-sm"
          >
            <i className="bi bi-file-earmark-excel me-1"></i> {t('users.exportExcel')}
          </Button>
          {selectedUserIds.size > 0 && (
            <Button
              variant="primary"
              onClick={() => setShowBulkModal(true)}
              className="d-flex align-items-center rounded-pill shadow-sm"
            >
              <i className="bi bi-images me-1"></i> Download IDs ({selectedUserIds.size})
            </Button>
          )}
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
            <div className="row g-3">
              <div className="col-md-8">
                <InputGroup>
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
              </div>
              <div className="col-md-4">
                <Dropdown autoClose="outside" className="w-100">
                  <Dropdown.Toggle variant="outline-secondary" id="levelDropdown" className="w-100 text-start d-flex justify-content-between align-items-center">
                    <span>{selectedLevels.length > 0 ? `${selectedLevels.length} selected` : t('Filter by Level')}</span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="w-100 p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <div className="px-2 pb-2">
                      <Form.Check
                        type="checkbox"
                        id="selectAllLevels"
                        label="Select All"
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
            </div>
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
                  <th>
                    <Form.Check
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={currentItems.length > 0 && selectedUserIds.size === currentItems.length}
                    />
                  </th>
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
                  console.log(user.key);
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
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedUserIds.has(user.code)}
                          onChange={() => toggleSelectUser(user.code)}
                        />
                      </td>
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
                          {/* Generate ID Card */}
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="btn-action"
                            onClick={() => {
                              setSelectedIDUser(user);
                              setCardLocation(user.church || ""); // Prefill with user's church
                              setCardSaint(""); // Reset or prefill if available
                              setShowIDModal(true);
                            }}
                            title="Generate ID Card"
                          >
                            <i className="bi bi-person-badge"></i>
                          </Button>
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
                          {hasPermission('degrees', 'edit') && (
                            <Button
                              variant="outline-info"
                              size="sm"
                              className="btn-action"
                              onClick={() => {
                                setSelectedDegreeUser(user.code);
                                setShowDegreeModal(true);
                              }}
                              title={t('Manage Degrees')}
                            >
                              <i className="bi bi-mortarboard-fill"></i>
                            </Button>
                          )}
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

      {/* ID Card Modal */}
      <Modal
        show={showIDModal}
        onHide={() => setShowIDModal(false)}
        size="lg"
        centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-card-heading me-2"></i>
            Student ID Card Preview
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-4 border-end">
              <h5>Card Details</h5>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Class Location (مكان الفصل)</Form.Label>
                  <Form.Control
                    type="text"
                    value={cardLocation}
                    onChange={(e) => setCardLocation(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Time (الميعاد)</Form.Label>
                  <Form.Control
                    type="text"
                    value={cardTime}
                    onChange={(e) => setCardTime(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Class Saint (شفيع الفصل)</Form.Label>
                  <Form.Control
                    type="text"
                    value={cardSaint}
                    onChange={(e) => setCardSaint(e.target.value)}
                  />
                </Form.Group>
              </Form>
              <div className="d-grid gap-2 mt-4">
                <Button variant="success" onClick={handlePrint}>
                  <i className="bi bi-printer me-2"></i> Print Card
                </Button>
                <Button variant="primary" onClick={handleDownloadImage}>
                  <i className="bi bi-download me-2"></i> Download Image
                </Button>
              </div>
            </div>
            <div className="col-md-8 d-flex justify-content-center align-items-center bg-light p-4">
              {selectedIDUser && (
                <div id="print-section">
                  <StudentIDCard
                    user={selectedIDUser}
                    additionalInfo={{
                      time: cardTime,
                      saint: cardSaint,
                      location: cardLocation
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* Bulk Download Modal */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title><i className="bi bi-collection me-2"></i> Bulk Download Options</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Generating IDs for <strong>{selectedUserIds.size}</strong> students.</p>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Unified Location (مكان موحد)</Form.Label>
              <Form.Control
                type="text"
                value={bulkLocation}
                placeholder="Leave empty to use student's original church"
                onChange={(e) => setBulkLocation(e.target.value)}
              />
              <Form.Text className="text-muted">
                Overrides student's church if set.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Unified Time (ميعاد موحد)</Form.Label>
              <Form.Control
                type="text"
                value={bulkTime}
                onChange={(e) => setBulkTime(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Unified Saint (شفيع موحد)</Form.Label>
              <Form.Control
                type="text"
                value={bulkSaint}
                placeholder="Leave empty if variable"
                onChange={(e) => setBulkSaint(e.target.value)}
              />
              <Form.Text className="text-muted">
                This value will be applied to all cards.
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => {
            setShowBulkModal(false);
            handleBulkDownload();
          }}>
            <i className="bi bi-download me-2"></i> Start Download
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Degree Management Modal */}
      <StudentDegreesModal
        show={showDegreeModal}
        onHide={() => {
          setShowDegreeModal(false);
          setSelectedDegreeUser(null);
        }}
        userCode={selectedDegreeUser} />
      {/* We use absolute positioning off-screen with opacity 1 to ensure full rendering consistency */}
      <div style={{ position: 'absolute', left: '-5000px', top: 0, zIndex: -1000, width: '1000px', backgroundColor: 'white' }}>
        {Array.from(selectedUserIds).map(code => {
          const user = users[code] || Object.values(users).find(u => u.code === code);
          if (!user) return null;

          return (
            <div key={`bulk-${code}`} id={`bulk-card-${code}`} style={{ display: 'inline-block', margin: '20px', backgroundColor: 'white' }}>
              <StudentIDCard
                user={user}
                additionalInfo={{
                  time: bulkTime,
                  location: bulkLocation || user.church, // Use bulk override or user specific
                  saint: bulkSaint
                }}
              />
            </div>
          );
        })}
      </div>

    </div >
  );
};

export default UserList;