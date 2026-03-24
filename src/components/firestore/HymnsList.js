import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Alert, Form, InputGroup, Button, Badge } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { firestoreService } from '../../services/services';
import { COLLECTIONS } from '../../services/api';
import { Document, Paragraph, TextRun, Packer, Table as DocxTable, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import CreateHymns from './CreateHymns';
import { AGE_LEVEL_MAP, truncateText } from '../../utils/constants';

const HymnsList = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editDocument, setEditDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgeLevel, setSelectedAgeLevel] = useState('');
  const [selectedYearNumber, setSelectedYearNumber] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);

  useEffect(() => {
    document.title = `${t('firestore.hymnsTitle')} | Firebase Portal`;
  }, [t]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await firestoreService.getCollection(COLLECTIONS.HYMNS);
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
    let filtered = [...documents];

    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(doc => {
        return Object.values(doc).some(value =>
          value && typeof value === 'string' &&
          value.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    if (selectedAgeLevel !== '') {
      filtered = filtered.filter(doc => {
        if (!doc.ageLevel) return false;
        return Array.isArray(doc.ageLevel) 
          ? doc.ageLevel.includes(Number(selectedAgeLevel))
          : doc.ageLevel === Number(selectedAgeLevel);
      });
    }

    if (selectedYearNumber !== '') {
      filtered = filtered.filter(doc => doc.yearNumber === Number(selectedYearNumber));
    }

    setFilteredDocuments(filtered);
  }, [searchTerm, selectedAgeLevel, selectedYearNumber, documents]);

  const handleEdit = (doc) => {
    setEditDocument(doc);
    setShowModal(true);
  };

  const handleDelete = async (doc) => {
    if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      try {
        await firestoreService.deleteDocument(COLLECTIONS.HYMNS, doc.id);
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
    if (filteredDocuments.length === 0) {
      alert(t('common.noResults'));
      return;
    }

    const children = [];

    // Title Paragraph
    children.push(new Paragraph({
      children: [
        new TextRun({
          text: 'Filtered Hymns',
          bold: true,
          size: 28,
        }),
      ],
      spacing: { after: 400 },
      alignment: AlignmentType.CENTER
    }));

    filteredDocuments.forEach(doc => {
      // Hymn Title
      children.push(new Paragraph({
        children: [
          new TextRun({
            text: doc.title || 'Untitled',
            bold: true,
            size: 24,
          }),
        ],
        spacing: { before: 200, after: 200 },
        alignment: AlignmentType.CENTER
      }));

      // Content Table
      children.push(new DocxTable({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    text: doc.copticArabicContent || '',
                    alignment: AlignmentType.LEFT
                  })
                ],
              }),
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    text: doc.copticContent || '',
                    alignment: AlignmentType.CENTER
                  })
                ],
              }),
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    text: doc.arabicContent || '',
                    alignment: AlignmentType.RIGHT
                  })
                ],
              }),
            ],
          }),
        ],
      }));

      children.push(new Paragraph({ spacing: { after: 400 } }));
    });

    const wordDoc = new Document({
      sections: [{
        properties: {},
        children: children,
      }],
    });

    let filename = 'Hymns';
    if (selectedAgeLevel) filename += `_Level_${selectedAgeLevel}`;
    if (selectedYearNumber) filename += `_Year_${selectedYearNumber}`;
    filename += '.docx';

    Packer.toBlob(wordDoc).then(blob => {
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
            {keys.map(key => key !== 'audio' && (
              <th key={key}>{key}</th>
            ))}
            <th>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredDocuments.map(doc => (
            <tr key={doc.id}>
              {keys.map(key => key !== 'audio' && (
                <td className={key} key={`${doc.id}-${key}`}>
                  {renderCellValue(doc[key], key)}
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

  const renderCellValue = (value, key) => {
    if (value === undefined || value === null) {
      return 'N/A';
    }

    if (key === 'ageLevel' && Array.isArray(value)) {
      return (
        <div className="d-flex flex-wrap gap-1">
          {value.map(level => (
            <Badge key={level} bg="info" size="sm">
              {AGE_LEVEL_MAP[level] || level}
            </Badge>
          ))}
        </div>
      );
    }

    if (typeof value === 'string' && value.length > 50) {
      return (
        <span title={value}>
          {truncateText(value, 50)}
        </span>
      );
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    } else {
      return String(value);
    }
  };

  return (
    <div className="hymns-list">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">{t('firestore.hymnsTitle')}</h1>
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
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <InputGroup>
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
              </div>
              <div className="col-md-4">
                <Form.Select
                  value={selectedAgeLevel}
                  onChange={(e) => setSelectedAgeLevel(e.target.value)}
                >
                  <option value="">{t('common.filterByLevel', 'All Levels')}</option>
                  {Object.entries(AGE_LEVEL_MAP).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-md-4">
                <Form.Control
                  type="number"
                  placeholder="Filter by Year Number"
                  value={selectedYearNumber}
                  onChange={(e) => setSelectedYearNumber(e.target.value)}
                />
              </div>
            </div>
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

      <CreateHymns
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

export default HymnsList;
