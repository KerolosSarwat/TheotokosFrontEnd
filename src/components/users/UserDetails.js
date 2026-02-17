import { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge } from 'react-bootstrap';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/services';

const UserDetails = () => {
  const { t } = useTranslation();
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
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
        const data = await userService.getUserByCode(code, type);
        setUser(data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching user data. Please try again.');
        setLoading(false);
        console.error('Error fetching user:', err);
      }
    };

    fetchUser();
  }, [code, type]);

  // const handleDelete = async () => {
  //   if (window.confirm(t('users.confirmDelete'))) {
  //     try {
  //       await userService.deleteUser(code);
  //       alert('User deleted successfully');
  //       // navigate('/users');
  //     } catch (err) {
  //       alert('Error deleting user. Please try again.');
  //       console.error('Error deleting user:', err);
  //     }
  //   }
  // };

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
          <Link to={`/users/edit/${code}${type === 'pending' ? '?type=pending' : ''}`} className="btn btn-warning me-2">
            <i className="bi bi-pencil me-1"></i> {t('common.edit')}
          </Link>
          <Link to={type === 'pending' ? '/penddingusers' : '/users'} className="btn btn-secondary">
            <i className="bi bi-arrow-left me-1"></i> {t('common.back')}
          </Link>
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

      <div className="d-flex justify-content-between mb-4 mt-4">
        <h3 className="mb-0">{t('terms.degreeInfo')}</h3>
        <Link to={`/users/${code}/degrees`} className="btn btn-outline-primary">
          <i className="bi bi-mortarboard me-1"></i> {t('Manage Degrees')}
        </Link>
      </div>

      <div className="d-flex justify-content-between mb-5">
        <Link to={type === 'pending' ? '/penddingusers' : '/users'} className="btn btn-secondary">
          {t('common.back')}
        </Link>
        <Link to={`/users/edit/${code}${type === 'pending' ? '?type=pending' : ''}`} className="btn btn-primary">
          {t('users.edit')}
        </Link>
      </div>
    </div>
  );
};

export default UserDetails;
