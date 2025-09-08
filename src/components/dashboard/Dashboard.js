import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">Dashboard</h1>
      </div>
      
      <Row className="mt-4">
        <Col md={6} lg={3} className="mb-4">
          <Card className="card-dashboard h-100">
            <Card.Body className="d-flex flex-column">
              <div className="text-center mb-4">
                <i className="bi bi-people text-primary" style={{ fontSize: '3rem' }}></i>
              </div>
              <Card.Title className="text-center">Users</Card.Title>
              <Card.Text className="text-center">
                Manage user information from the Realtime Database
              </Card.Text>
              <div className="mt-auto text-center">
                <Link to="/users" className="btn btn-primary">View Users</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-4">
          <Card className="card-dashboard h-100">
            <Card.Body className="d-flex flex-column">
              <div className="text-center mb-4">
                <i className="bi bi-people text-secondary" style={{ fontSize: '3rem' }}></i>
              </div>
              <Card.Title className="text-center">Pendding Users</Card.Title>
              <Card.Text className="text-center">
                Manage user information from the Realtime Database
              </Card.Text>
              <div className="mt-auto text-center">
                <Link to="/penddingusers" className="btn btn-secondary">View Pendding Users</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-4">
          <Card className="card-dashboard h-100">
            <Card.Body className="d-flex flex-column">
              <div className="text-center mb-4">
                <i className="bi bi-book text-success" style={{ fontSize: '3rem' }}></i>
              </div>
              <Card.Title className="text-center">Agbya</Card.Title>
              <Card.Text className="text-center">
                View Agbya collection data from Firestore
              </Card.Text>
              <div className="mt-auto text-center">
                <Link to="/firestore/agbya" className="btn btn-success">View Agbya</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-4">
          <Card className="card-dashboard h-100">
            <Card.Body className="d-flex flex-column">
              <div className="text-center mb-4">
                <i className="bi bi-journal-text text-info" style={{ fontSize: '3rem' }}></i>
              </div>
              <Card.Title className="text-center">Taks</Card.Title>
              <Card.Text className="text-center">
                View Taks collection data from Firestore
              </Card.Text>
              <div className="mt-auto text-center">
                <Link to="/firestore/taks" className="btn btn-info">View Taks</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-4">
          <Card className="card-dashboard h-100">
            <Card.Body className="d-flex flex-column">
              <div className="text-center mb-4">
                <i className="bi bi-translate text-warning" style={{ fontSize: '3rem' }}></i>
              </div>
              <Card.Title className="text-center">Coptic</Card.Title>
              <Card.Text className="text-center">
                View Coptic collection data from Firestore
              </Card.Text>
              <div className="mt-auto text-center">
                <Link to="/firestore/coptic" className="btn btn-warning">View Coptic</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} lg={3} className="mb-4">
          <Card className="card-dashboard h-100">
            <Card.Body className="d-flex flex-column">
              <div className="text-center mb-4">
                <i className="bi bi-music-note-list text-danger" style={{ fontSize: '3rem' }}></i>
              </div>
              <Card.Title className="text-center">Hymns</Card.Title>
              <Card.Text className="text-center">
                View Hymns collection data from Firestore
              </Card.Text>
              <div className="mt-auto text-center">
                <Link to="/firestore/hymns" className="btn btn-danger">View Hymns</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-4">
          <Card className="card-dashboard h-100">
            <Card.Body className="d-flex flex-column">
              <div className="text-center mb-4">
                <i class="bi bi-bell-fill text-dark" style={{ fontSize: '3rem' }}></i>
              </div>
              <Card.Title className="text-center">Notification</Card.Title>
              <Card.Text className="text-center">
                Can send a broadcast notification
              </Card.Text>
              <div className="mt-auto text-center">
                <Link to="/users/notification" className="btn btn-dark">Send Notification</Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
