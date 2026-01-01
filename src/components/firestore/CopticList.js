import React, { useState, useEffect } from 'react';
import { Card, Table, Alert, Form, InputGroup, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { firestoreService } from '../../services/services';
import { COLLECTIONS } from '../../services/api';
import CreateCopticContent from './CreateCopticContent'

const CopticList = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);

  useEffect(() => {
    document.title = `${t('firestore.copticTitle')} | Firebase Portal`;
  }, [t]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const data = await firestoreService.getCollection(COLLECTIONS.COPTIC);
        setDocuments(data);
        setFilteredDocuments(data);
        setLoading(false);
      } catch (err) {
        setError(t('common.noResults'));
        setLoading(false);
        console.error('Error fetching documents:', err);
      }
    };

    fetchDocuments();
  }, [t]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(doc => {
        // Search through all properties of the document
        return Object.values(doc).some(value =>
          value && typeof value === 'string' &&
          value.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredDocuments(filtered);
    }
  }, [searchTerm, documents]);

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-3">{error}</div>;
  }

  // Function to render table based on document structure
  const renderDocumentTable = () => {
    if (filteredDocuments.length === 0) {
      return <Alert variant="info">{t('common.noResults')}</Alert>;
    }

    // Get all unique keys from all documents
    const allKeys = new Set();
    filteredDocuments.forEach(doc => {
      Object.keys(doc).forEach(key => {
        if (key !== 'id') {
          allKeys.add(key);
        }
      });
    });
    const keys = Array.from(allKeys);

    return (
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            {keys.map(key => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredDocuments.map(doc => (
            <tr key={doc.id}>
              <td>{doc.id}</td>
              {keys.map(key => (
                <td key={`${doc.id}-${key}`}>
                  {renderCellValue(doc[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  // Helper function to render cell values based on their type
  const renderCellValue = (value) => {
    if (value === undefined || value === null) {
      return 'N/A';
    } else if (typeof value === 'object') {
      return JSON.stringify(value);
    } else {
      return String(value);
    }
  };

  return (
    <div className="coptic-list">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">{t('firestore.copticTitle')}</h1>
        <Button
          variant="primary"
          onClick={() => setShowModal(true)}>
          {t('common.add')}
        </Button>
      </div>
      <Card className="mb-4">
        <Card.Body>
          <Form>
            <InputGroup className="mb-3">
              <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
              <Form.Control
                placeholder={t('common.search')}
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

      <div className="table-responsive">
        {renderDocumentTable()}
      </div>
      <CreateCopticContent
        show={showModal}
        onHide={() => setShowModal(false)}
        onDocumentCreated={() => {
          // Add refresh logic here if needed
          console.log('New Coptic content created');
        }}
      />
    </div>
  );
};

export default CopticList;
