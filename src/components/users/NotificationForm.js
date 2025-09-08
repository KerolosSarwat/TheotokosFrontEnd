import React, { useState } from 'react';
import axios from 'axios';
import { Card, Alert } from 'react-bootstrap';
import { BiBroadcast, BiSend, BiText, BiMessageDetail } from 'react-icons/bi';

const NotificationSender = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });

  const sendNotification = async () => {
    try {
      await axios.post('http://localhost:5000/api/users/send-notification', {
        title,
        body: message
      });
      setAlert({
        show: true,
        variant: 'success',
        message: 'Notification sent successfully!'
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      setAlert({
        show: true,
        variant: 'danger',
        message: 'Failed to send notification'
      });
    }
  };

  return (
    <div className="container py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h2 className="h4 mb-0">
            <BiBroadcast className="me-2" />
            Send Broadcast Notification
          </h2>
        </Card.Header>
        
        <Card.Body>
          {alert.show && (
            <Alert 
              variant={alert.variant} 
              onClose={() => setAlert({...alert, show: false})} 
              dismissible
            >
              {alert.message}
            </Alert>
          )}

          <div className="mb-3">
            <label htmlFor="notificationTitle" className="form-label">
              <BiText className="me-2" />
              Notification Title
            </label>
            <input
              type="text"
              className="form-control"
              id="notificationTitle"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="notificationMessage" className="form-label">
              <BiMessageDetail className="me-2" />
              Notification Message
            </label>
            <textarea
              className="form-control"
              id="notificationMessage"
              rows={4}
              placeholder="Enter your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          
          <div className="d-grid">
            <button 
              className="btn btn-primary"
              onClick={sendNotification}
            >
              <BiSend className="me-2" />
              Send to All Users
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default NotificationSender;