import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Alert, Form, InputGroup, Button, Badge, Dropdown, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { firestoreService } from '../../services/services';
import { COLLECTIONS } from '../../services/api';
import CreateHymns from './CreateHymns';
import { AGE_LEVEL_MAP, truncateText } from '../../utils/constants';
import { Document, Paragraph, TextRun, Table as DocxTable, TableRow, TableCell, WidthType, Packer, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

const HymnsList = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [editDocument, setEditDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');

  // Extract unique yearNumbers from data
  const availableYears = React.useMemo(() => {
    const years = new Set();
    documents.forEach(doc => {
      if (doc.yearNumber !== undefined && doc.yearNumber !== null) {
        years.add(doc.yearNumber);
      }
    });
    return Array.from(years).sort((a, b) => a - b);
  }, [documents]);

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
    let result = documents;

    // 1. Text Search
    if (searchTerm.trim() !== '') {
      result = result.filter(doc => {
        return Object.values(doc).some(value =>
          value && typeof value === 'string' &&
          value.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // 2. Level Filter
    if (selectedLevels.length > 0) {
      result = result.filter(doc =>
        doc.ageLevel && Array.isArray(doc.ageLevel) &&
        doc.ageLevel.some(level => selectedLevels.includes(level))
      );
    }

    // 3. Year Filter
    if (selectedYear !== '') {
      result = result.filter(doc =>
        doc.yearNumber !== undefined && doc.yearNumber === Number(selectedYear)
      );
    }

    setFilteredDocuments(result);
  }, [searchTerm, documents, selectedLevels, selectedYear]);

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

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0 },
    bottom: { style: BorderStyle.NONE, size: 0 },
    left: { style: BorderStyle.NONE, size: 0 },
    right: { style: BorderStyle.NONE, size: 0 },
  };

  const exportFilteredToWord = async () => {
    if (filteredDocuments.length === 0) {
      alert(t('common.noResults'));
      return;
    }

    const children = [
      new Paragraph({
        children: [
          new TextRun({
            text: 'Hymns Collection',
            bold: true,
            size: 32,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: '' }),
    ];

    filteredDocuments.forEach(hymn => {
      // Hymn title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: hymn.title || 'Untitled',
              bold: true,
              size: 28,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 300 },
        })
      );

      // Split content by lines
      const arabicLines = (hymn.arabicContent || '').split('\n');
      const copticLines = (hymn.copticContent || '').split('\n');
      const copticArabicLines = (hymn.copticArabicContent || '').split('\n');
      const maxLines = Math.max(arabicLines.length, copticLines.length, copticArabicLines.length);

      const tableRows = [];

      // Header row
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'CopticArabic', bold: true })], alignment: AlignmentType.CENTER })],
              width: { size: 33, type: WidthType.PERCENTAGE },
              borders: noBorder,
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Coptic', bold: true })], alignment: AlignmentType.CENTER })],
              width: { size: 34, type: WidthType.PERCENTAGE },
              borders: noBorder,
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'Arabic', bold: true })], alignment: AlignmentType.CENTER })],
              width: { size: 33, type: WidthType.PERCENTAGE },
              borders: noBorder,
            }),
          ],
        })
      );

      // Content rows
      for (let i = 0; i < maxLines; i++) {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: copticArabicLines[i] || '', size: 22 })],
                  alignment: AlignmentType.CENTER,
                })],
                borders: noBorder,
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: copticLines[i] || '', size: 22 })],
                  alignment: AlignmentType.CENTER,
                })],
                borders: noBorder,
              }),
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: arabicLines[i] || '', size: 22 })],
                  alignment: AlignmentType.RIGHT,
                  bidirectional: true,
                })],
                borders: noBorder,
              }),
            ],
          })
        );
      }

      children.push(
        new DocxTable({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      children.push(new Paragraph({ text: '' }));
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });

    let filename = 'Hymns_Collection';
    if (selectedYear) filename += `_Year_${selectedYear}`;
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
            <Row className="g-3">
              <Col md={4}>
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
              </Col>
              <Col md={4}>
                <Dropdown autoClose="outside" className="w-100">
                  <Dropdown.Toggle variant="outline-secondary" className="w-100 text-start d-flex justify-content-between align-items-center">
                    <span>{selectedLevels.length > 0 ? `${selectedLevels.length} ${t('common.students')}` : t('common.filterByLevel')}</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100 p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <div className="px-2 pb-2">
                      <Form.Check
                        type="checkbox"
                        id="selectAllLevelsHymns"
                        label={t('common.selectAll')}
                        checked={selectedLevels.length === Object.keys(AGE_LEVEL_MAP).length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedLevels(Object.keys(AGE_LEVEL_MAP).map(Number));
                          else setSelectedLevels([]);
                        }}
                      />
                    </div>
                    <Dropdown.Divider />
                    {Object.entries(AGE_LEVEL_MAP).map(([val, label]) => (
                      <div key={val} className="px-2 py-1">
                        <Form.Check
                          type="checkbox"
                          id={`hymns-level-${val}`}
                          label={label}
                          checked={selectedLevels.includes(Number(val))}
                          onChange={(e) => {
                            const num = Number(val);
                            if (e.target.checked) setSelectedLevels([...selectedLevels, num]);
                            else setSelectedLevels(selectedLevels.filter(l => l !== num));
                          }}
                        />
                      </div>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
              <Col md={4}>
                <Form.Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">{t('firestore.allYears')}</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </Form>

          <div className="d-flex align-items-center mt-3">
            <Button
              variant="success"
              onClick={exportFilteredToWord}
              disabled={filteredDocuments.length === 0}
            >
              <i className="bi bi-file-word me-2"></i>
              Export to Word
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
