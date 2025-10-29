import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { userService } from '../../services/services';

const UserDetails = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await userService.getUserByCode(code);
        setUser(userData);
        setLoading(false);
      } catch (err) {
        setError('Error fetching user data. Please try again.');
        setLoading(false);
        console.error('Error fetching user:', err);
      }
    };

    fetchUser();
  }, [code]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(code);
        alert('User deleted successfully');
        navigate('/users');
      } catch (err) {
        alert('Error deleting user. Please try again.');
        console.error('Error deleting user:', err);
      }
    }
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }

  if (error || !user) {
    return <div className="alert alert-danger mt-3">{error || 'User not found'}</div>;
  }

  return (
    <div className="user-details">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">User Details</h1>
        <div>
          <Link to={`/users/edit/${code}`} className="btn btn-warning me-2">
            <i className="bi bi-pencil me-1"></i> Edit
          </Link>
          <Button variant="danger" onClick={handleDelete}>
            <i className="bi bi-trash me-1"></i> Delete
          </Button>
        </div>
      </div>

      <Card className="user-details-card mb-4">
        <Card.Header className="bg-primary text-white">
          <h3>{user.fullName}</h3>
          <div>Code: {user.code}</div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Table className="table-borderless">
                <tbody>
                  <tr>
                    <th>Gender:</th>
                    <td>{user.gender || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Birthdate:</th>
                    <td>{user.birthdate || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Phone Number:</th>
                    <td>{user.phoneNumber || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Level:</th>
                    <td>{user.level || 'N/A'}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
            <Col md={6}>
              <Table className="table-borderless">
                <tbody>
                  <tr>
                    <th>Church:</th>
                    <td>{user.church || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Address:</th>
                    <td>{user.address || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>Active:</th>
                    <td>
                      {user.active ? (
                        <Badge bg="success">Active</Badge>
                      ) : (
                        <Badge bg="danger">Inactive</Badge>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>Admin:</th>
                    <td>
                      {user.admin ? (
                        <Badge bg="success">Admin</Badge>
                      ) : (
                        <Badge bg="danger">Not Admin</Badge>
                      )}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <h3 className="mb-3">Degree Information</h3>
      
      <Card className="mb-4">
        <Card.Header className="bg-info text-white">الترم الأول</Card.Header>
        <Card.Body>
          <Table striped bordered>
            <thead>
              <tr>
                <th>الأجبية</th>
                <th>لغة قبطية</th>
                <th>ألحان</th>
                <th>طقس</th>
                <th>الحضور</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{user.degree.firstTerm.agbya}</td>
                <td>{user.degree.firstTerm.coptic}</td>
                <td>{user.degree.firstTerm.hymns}</td>
                <td>{user.degree.firstTerm.taks}</td>
                <td>{user.degree.firstTerm.attencance}</td>
                <td>{(user.degree.firstTerm.agbya + user.degree.firstTerm.coptic + user.degree.firstTerm.hymns + user.degree.firstTerm.taks + user.degree.firstTerm.attencance)}</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header className="bg-warning">الترم الثانى</Card.Header>
        <Card.Body>
          <Table striped bordered>
            <thead>
              <tr>
                <th>الأجبية</th>
                <th>لغة قبطية</th>
                <th>ألحان</th>
                <th>طقس</th>
                <th>الحضور</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{user.degree.secondTerm.agbya}</td>
                <td>{user.degree.secondTerm.coptic}</td>
                <td>{user.degree.secondTerm.hymns}</td>
                <td>{user.degree.secondTerm.taks}</td>
                <td>{user.degree.secondTerm.attencance}</td>
                <td>{(user.degree.secondTerm.agbya + user.degree.secondTerm.coptic + user.degree.secondTerm.hymns + user.degree.secondTerm.taks + user.degree.secondTerm.attencance)}</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header className="bg-success text-white">الترم الثالث</Card.Header>
        <Card.Body>
          <Table striped bordered>
            <thead>
              <tr>
                <th>أجبية</th>
                <th>لغة قبطية</th>
                <th>ألحان</th>
                <th>طقس</th>
                <th>الحضور</th>
                <th>المجموع</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{user.degree.thirdTerm.agbya}</td>
                <td>{user.degree.thirdTerm.coptic}</td>
                <td>{user.degree.thirdTerm.hymns}</td>
                <td>{user.degree.thirdTerm.taks}</td>
                <td>{user.degree.thirdTerm.attencance}</td>
                <td>{(user.degree.thirdTerm.agbya + user.degree.thirdTerm.coptic + user.degree.thirdTerm.hymns + user.degree.thirdTerm.taks + user.degree.thirdTerm.attencance)}</td>

              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between mb-5">
        <Button variant="secondary" onClick={() => navigate('/users')}>
          Back to Users
        </Button>
        <Link to={`/users/edit/${code}`} className="btn btn-primary">
          Edit User
        </Link>
      </div>
    </div>
  );
};

export default UserDetails;
