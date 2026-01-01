import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { BiBroadcast, BiSend, BiText, BiMessageDetail } from 'react-icons/bi';

const NotificationSender = () => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });

  useEffect(() => {
    document.title = `${t('notifications.title')} | Firebase Portal`;
  }, [t]);

  const sendNotification = async () => {
    try {
      await axios.post('https://theotokosbackend-production.up.railway.app/api/users/send-notification', {
        title,
        body: message
      });
      setAlert({
        show: true,
        variant: 'success',
        message: t('notifications.success')
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      setAlert({
        show: true,
        variant: 'danger',
        message: t('notifications.failed')
      });
    }
  };

  return (
    <div className="container py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h2 className="h4 mb-0">
            <BiBroadcast className="me-2" />
            {t('notifications.title')}
          </h2>
        </Card.Header>

        <Card.Body>
          {alert.show && (
            <Alert
              variant={alert.variant}
              onClose={() => setAlert({ ...alert, show: false })}
              dismissible
            >
              {alert.message}
            </Alert>
          )}

          <div className="mb-3">
            <label htmlFor="notificationTitle" className="form-label">
              <BiText className="me-2" />
              {t('notifications.formTitle')}
            </label>
            <input
              type="text"
              className="form-control"
              id="notificationTitle"
              placeholder={t('notifications.placeholderTitle')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="notificationMessage" className="form-label">
              <BiMessageDetail className="me-2" />
              {t('notifications.message')}
            </label>
            <textarea
              className="form-control"
              id="notificationMessage"
              rows={4}
              placeholder={t('notifications.placeholderMsg')}
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
              {t('notifications.sendAll')}
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default NotificationSender;
