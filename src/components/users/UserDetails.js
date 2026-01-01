import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/services';

const UserDetails = () => {
  const { t } = useTranslation();
  const { code } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      document.title = `${user.fullName} | Firebase Portal`;
    } else {
      document.title = `${t('users.details')} | Firebase Portal`;
    }
  }, [t, user]);

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
    if (window.confirm(t('users.confirmDelete'))) {
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
        <h1 className="h2">{t('users.details')}</h1>
        <div>
          <Link to={`/users/edit/${code}`} className="btn btn-warning me-2">
            <i className="bi bi-pencil me-1"></i> {t('common.edit')}
          </Link>
          <Button variant="danger" onClick={handleDelete}>
            <i className="bi bi-trash me-1"></i> {t('common.delete')}
          </Button>
        </div>
      </div>

      <Card className="user-details-card mb-4">
        <Card.Header className="bg-primary text-white">
          <h3>{user.fullName}</h3>
          <div>{t('users.code')}: {user.code}</div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Table className="table-borderless">
                <tbody>
                  <tr>
                    <th>{t('common.gender')}:</th>
                    <td>{user.gender === 'Male' ? t('common.male') : user.gender === 'Female' ? t('common.female') : 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>{t('common.birthdate')}:</th>
                    <td>{user.birthdate || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>{t('users.phone')}:</th>
                    <td>{user.phoneNumber || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>{t('users.level')}:</th>
                    <td>{user.level || 'N/A'}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
            <Col md={6}>
              <Table className="table-borderless">
                <tbody>
                  <tr>
                    <th>{t('users.church')}:</th>
                    <td>{user.church || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>{t('common.address')}:</th>
                    <td>{user.address || 'N/A'}</td>
                  </tr>
                  <tr>
                    <th>{t('common.active')}:</th>
                    <td>
                      {user.active ? (
                        <Badge bg="success">{t('common.active')}</Badge>
                      ) : (
                        <Badge bg="danger">{t('common.inactive')}</Badge>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>{t('common.admin')}:</th>
                    <td>
                      {user.admin ? (
                        <Badge bg="success">{t('common.admin')}</Badge>
                      ) : (
                        <Badge bg="danger">{t('common.notAdmin')}</Badge>
                      )}
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <h3 className="mb-3">{t('terms.degreeInfo')}</h3>

      <Card className="mb-4">
        <Card.Header className="bg-info text-white">{t('terms.first')}</Card.Header>
        <Card.Body>
          <Table striped bordered>
            <thead>
              <tr>
                <th>{t('subjects.agbya')}</th>
                <th>{t('subjects.coptic')}</th>
                <th>{t('subjects.hymns')}</th>
                <th>{t('subjects.taks')}</th>
                <th>{t('subjects.attendance')}</th>
                <th>{t('subjects.result')}</th>
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
        <Card.Header className="bg-warning">{t('terms.second')}</Card.Header>
        <Card.Body>
          <Table striped bordered>
            <thead>
              <tr>
                <th>{t('subjects.agbya')}</th>
                <th>{t('subjects.coptic')}</th>
                <th>{t('subjects.hymns')}</th>
                <th>{t('subjects.taks')}</th>
                <th>{t('subjects.attendance')}</th>
                <th>{t('subjects.result')}</th>
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
        <Card.Header className="bg-success text-white">{t('terms.third')}</Card.Header>
        <Card.Body>
          <Table striped bordered>
            <thead>
              <tr>
                <th>{t('subjects.agbya')}</th>
                <th>{t('subjects.coptic')}</th>
                <th>{t('subjects.hymns')}</th>
                <th>{t('subjects.taks')}</th>
                <th>{t('subjects.attendance')}</th>
                <th>{t('subjects.result')}</th>
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
          {t('common.back')}
        </Button>
        <Link to={`/users/edit/${code}`} className="btn btn-primary">
          {t('users.edit')}
        </Link>
      </div>
    </div>
  );
};

export default UserDetails;

