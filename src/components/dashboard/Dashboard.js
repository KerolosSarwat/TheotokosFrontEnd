import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, ListGroup, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/services';

const Dashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalAttendance: 0,
    levels: {}
  });
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    document.title = `${t('dashboard.title')} | Firebase Portal`;
  }, [t]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch data in parallel
        const [usersData, pendingData, attendanceData] = await Promise.all([
          userService.getAllUsers(),
          userService.getPenddingUsers(),
          userService.getUsersAttendance('all')
        ]);

        const usersList = Object.values(usersData || {});
        const pendingList = Object.values(pendingData || {});

        // Calculate Level distribution
        const levels = {};
        usersList.forEach(user => {
          const level = user.level || 'Unknown';
          levels[level] = (levels[level] || 0) + 1;
        });

        setStats({
          totalUsers: usersList.length,
          pendingUsers: pendingList.length,
          totalAttendance: attendanceData ? attendanceData.reduce((acc, curr) => acc + (curr.attendance?.length || 0), 0) : 0,
          levels
        });

        // "Recent" users - since we don't have accurate timestamps on all, we'll just take the last 5 from the list
        setRecentUsers(usersList.slice(-5).reverse());

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-4 border-bottom">
        <h1 className="h2">{t('dashboard.title')}</h1>
        <div className="btn-toolbar mb-2 mb-md-0">
          <div className="btn-group me-2">
            <button type="button" className="btn btn-sm btn-outline-secondary">Share</button>
            <button type="button" className="btn btn-sm btn-outline-secondary">Export</button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4 g-3">
        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm" style={{ borderLeft: '4px solid var(--bs-primary)' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">{t('dashboard.totalUsers')}</h6>
                  <h3 className="mb-0 fw-bold">{stats.totalUsers}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-people-fill text-primary" style={{ fontSize: '1.5rem' }}></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm" style={{ borderLeft: '4px solid var(--bs-warning)' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">{t('dashboard.pendingRequests')}</h6>
                  <h3 className="mb-0 fw-bold">{stats.pendingUsers}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-clock-history text-warning" style={{ fontSize: '1.5rem' }}></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm" style={{ borderLeft: '4px solid var(--bs-success)' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">{t('dashboard.totalAttendance')}</h6>
                  <h3 className="mb-0 fw-bold">{stats.totalAttendance}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '1.5rem' }}></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm" style={{ borderLeft: '4px solid var(--bs-info)' }}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">{t('dashboard.topLevel')}</h6>
                  <h5 className="mb-0 fw-bold text-truncate" title={Object.keys(stats.levels).sort((a, b) => stats.levels[b] - stats.levels[a])[0] || 'N/A'}>
                    {Object.keys(stats.levels).sort((a, b) => stats.levels[b] - stats.levels[a])[0] || 'N/A'}
                  </h5>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded-circle">
                  <i className="bi bi-graph-up text-info" style={{ fontSize: '1.5rem' }}></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Main Actions Grid */}
        <Col lg={8}>
          <h5 className="mb-3">{t('dashboard.quickActions')}</h5>
          <Row className="g-3 mb-4">
            <Col sm={6} md={4}>
              <Link to="/users" className="text-decoration-none">
                <Card className="h-100 text-center p-3 hover-scale border-0 shadow-sm">
                  <div className="mb-2">
                    <i className="bi bi-people text-primary" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <h6>{t('dashboard.allUsers')}</h6>
                </Card>
              </Link>
            </Col>
            <Col sm={6} md={4}>
              <Link to="/penddingusers" className="text-decoration-none">
                <Card className="h-100 text-center p-3 hover-scale border-0 shadow-sm">
                  <div className="mb-2">
                    <i className="bi bi-person-plus text-warning" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <div className="position-relative d-inline-block">
                    <h6>{t('dashboard.pendingUsers')}</h6>
                    {stats.pendingUsers > 0 && (
                      <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">
                        {stats.pendingUsers}
                      </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            </Col>
            <Col sm={6} md={4}>
              <Link to="/users/notification" className="text-decoration-none">
                <Card className="h-100 text-center p-3 hover-scale border-0 shadow-sm">
                  <div className="mb-2">
                    <i className="bi bi-bell text-danger" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <h6>{t('dashboard.sendNotification')}</h6>
                </Card>
              </Link>
            </Col>
          </Row>

          <h5 className="mb-3">{t('dashboard.contentManagement')}</h5>
          <Row className="g-3">
            <Col sm={6} md={3}>
              <Link to="/firestore/agbya" className="text-decoration-none">
                <Card className="h-100 text-center p-2 border-0 shadow-sm">
                  <i className="bi bi-book mb-1 text-success" style={{ fontSize: '1.5rem' }}></i>
                  <small className="d-block text-dark fw-bold">{t('nav.agbya')}</small>
                </Card>
              </Link>
            </Col>
            <Col sm={6} md={3}>
              <Link to="/firestore/taks" className="text-decoration-none">
                <Card className="h-100 text-center p-2 border-0 shadow-sm">
                  <i className="bi bi-journal-text mb-1 text-info" style={{ fontSize: '1.5rem' }}></i>
                  <small className="d-block text-dark fw-bold">{t('nav.taks')}</small>
                </Card>
              </Link>
            </Col>
            <Col sm={6} md={3}>
              <Link to="/firestore/coptic" className="text-decoration-none">
                <Card className="h-100 text-center p-2 border-0 shadow-sm">
                  <i className="bi bi-translate mb-1 text-warning" style={{ fontSize: '1.5rem' }}></i>
                  <small className="d-block text-dark fw-bold">{t('nav.coptic')}</small>
                </Card>
              </Link>
            </Col>
            <Col sm={6} md={3}>
              <Link to="/firestore/hymns" className="text-decoration-none">
                <Card className="h-100 text-center p-2 border-0 shadow-sm">
                  <i className="bi bi-music-note-list mb-1 text-danger" style={{ fontSize: '1.5rem' }}></i>
                  <small className="d-block text-dark fw-bold">{t('nav.hymns')}</small>
                </Card>
              </Link>
            </Col>
          </Row>
        </Col>

        {/* Recent Activity Sidebar */}
        <Col lg={4} className="mt-4 mt-lg-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom-0 pt-3">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-activity me-2 text-primary"></i>
                {t('dashboard.recentActivity')}
              </h6>
            </Card.Header>
            <ListGroup variant="flush">
              {recentUsers.length === 0 ? (
                <ListGroup.Item className="text-center text-muted py-4">{t('dashboard.noRecentActivity')}</ListGroup.Item>
              ) : (
                recentUsers.map((user, idx) => (
                  <ListGroup.Item key={idx} className="border-0 py-3">
                    <div className="d-flex align-items-center">
                      <div className="bg-light rounded-circle p-2 me-3 text-center" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-person text-secondary"></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold text-dark small">{user.fullName}</div>
                        <div className="text-muted smaller" style={{ fontSize: '0.8rem' }}>
                          {user.level || 'No Level'}
                        </div>
                      </div>
                      <Link to={`/users/${user.code}`} className="btn btn-sm btn-light rounded-circle">
                        <i className="bi bi-chevron-right"></i>
                      </Link>
                    </div>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
            <Card.Footer className="bg-white border-top-0 text-center pb-3">
              <Link to="/users" className="small text-decoration-none">{t('dashboard.viewAllUsers')}</Link>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

