import React, { useState, useEffect, useMemo } from 'react';
import { userService } from '../../services/services';
import { Table, Button, Card, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx'; // Add this import

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
      Code: user.code || '',
      'Full Name': user.fullName || '',
      Level: user.level || 'N/A',
      'Phone Number': user.phoneNumber || 'N/A',
      Church: user.church || 'N/A'
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
        <h1 className="h2">Users</h1>
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
              {sortedUsers.map((user) => {
                //console.log("Current User:", user); // Log the user object
                return (
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
                      <Button variant="danger" size="sm" className="btn-action" onClick={() => handleDelete(user.code)}>
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default UserList;