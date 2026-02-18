import { useState, useEffect, useCallback } from 'react';
import { Card, Table, Alert, Form, InputGroup, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { firestoreService } from '../../services/services';
import { COLLECTIONS } from '../../services/api';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { saveAs } from 'file-saver';
import CreateTaks from './CreateTaks';

const TaksList = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editDocument, setEditDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [selectedAgeLevel] = useState(null);

  useEffect(() => {
    document.title = `${t('firestore.taksTitle')} | Firebase Portal`;
  }, [t]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await firestoreService.getCollection(COLLECTIONS.TAKS);
      setDocuments(data);
      setFilteredDocuments(data);
      setLoading(false);
    } catch (err) {
      setError(t('common.noResults'));
      setLoading(false);
      console.error('Error fetching documents:', err);
    }
  }, [t]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(doc => {
        return Object.values(doc).some(value => {
          if (value === null || value === undefined) return false;
          if (typeof value === 'object') {
            return JSON.stringify(value).includes(searchTerm);
          }
          return String(value).includes(searchTerm);
        });
      });
      setFilteredDocuments(filtered);
    }
  }, [searchTerm, documents]);

  const handleEdit = (doc) => {
    setEditDocument(doc);
    setShowModal(true);
  };

  const handleDelete = async (doc) => {
    if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      try {
        await firestoreService.deleteDocument(COLLECTIONS.TAKS, doc.id);
        fetchDocuments();
      } catch (err) {
        console.error('Error deleting document:', err);
        alert('Error deleting document. Please try again.');
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditDocument(null);
  };

  const exportFilteredToWord = async () => {
    let docsToExport = filteredDocuments;
    if (selectedAgeLevel) {
      docsToExport = filteredDocuments.filter(doc => doc.ageLevel === selectedAgeLevel);
    }

    if (docsToExport.length === 0) {
      alert(t('common.noResults'));
      return;
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: selectedAgeLevel
                  ? `Taks Documents for Age Level: ${selectedAgeLevel}`
                  : 'All Filtered Taks Documents',
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({ text: "Filter: " + (searchTerm || 'None') }),
          new Paragraph({ text: "" }),
          ...docsToExport.flatMap(doc => [
            new Paragraph({
              children: [
                new TextRun({
                  text: doc.title || 'Untitled',
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: doc.content || 'No content',
                  size: 22,
                }),
              ],
            }),
            new Paragraph({ text: "" }),
          ])
        ],
      }],
    });

    let filename = 'Taks_Documents';
    if (selectedAgeLevel) filename += `_AgeLevel_${selectedAgeLevel}`;
    if (searchTerm) filename += `_Search_${searchTerm.substring(0, 10)}`;
    filename += '.docx';

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, filename);
    });
  };

  if (loading) {
    return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger mt-3">{error}</div>;
  }

  const renderDocumentTable = () => {
    if (filteredDocuments.length === 0) {
      return <Alert variant="info">{t('common.noResults')}</Alert>;
    }

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
            {keys.map(key => key !== 'images' && (
              <th key={key}>{key}</th>
            ))}
            <th>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredDocuments.map(doc => (
            <tr key={doc.id}>
              {keys.map(key => key !== 'images' && (
                <td key={`${doc.id}-${key}`}>
                  {renderCellValue(doc[key])}
                </td>
              ))}
              <td>
                <div className="d-flex gap-1">
                  <Button
                    variant="outline-warning"
                    size="sm"
                    onClick={() => handleEdit(doc)}
                    title={t('common.edit')}
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(doc)}
                    title={t('common.delete')}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

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
    <div className="taks-list">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">{t('firestore.taksTitle')}</h1>
        <Button
          variant="primary"
          onClick={() => { setEditDocument(null); setShowModal(true); }}
        >
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

          <div className="d-flex align-items-center mt-3">
            <Button
              variant="success"
              onClick={exportFilteredToWord}
              disabled={filteredDocuments.length === 0}
            >
              <i className="bi bi-file-word me-2"></i>
              Export Visible Rows to Word
            </Button>
          </div>
        </Card.Body>
      </Card>

      <div className="table-responsive">
        {renderDocumentTable()}
      </div>
      <CreateTaks
        show={showModal}
        onHide={handleModalClose}
        editDocument={editDocument}
        onDocumentCreated={() => {
          fetchDocuments();
        }}
      />
    </div>
  );
};

export default TaksList;